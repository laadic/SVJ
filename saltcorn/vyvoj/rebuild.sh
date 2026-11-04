#!/bin/bash
# Přestaví lokální testovací instanci: schéma, aplikace, nastavení, testovací data a server na portu 3000.
# Potřebuje PostgreSQL a proměnnou DATABASE_URL (viz README.md v této složce).
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
: "${DATABASE_URL:?Nastavte DATABASE_URL, např. postgres://saltcorn:saltcorn@localhost/saltcorn}"
export SALTCORN_SESSION_SECRET=${SALTCORN_SESSION_SECRET:-mistni-testovaci-tajemstvi}
export SALTCORN_FILE_STORE=${SALTCORN_FILE_STORE:-$DIR/files}
export PATH=$DIR/node_modules/.bin:$PATH
mkdir -p "$SALTCORN_FILE_STORE"
pkill -f "saltcorn serve -p 3000" || true
cd "$DIR"
saltcorn reset-schema -f >/dev/null 2>&1
rm -rf "${SALTCORN_FILE_STORE:?}"/*
saltcorn create-user -a -e admin@svj.test -p 'Admin-Heslo-2026!' >/dev/null 2>&1
node build.js 2>&1 | grep -E "HOTOVO|CHYBA"
saltcorn run-trigger pocatecni_nastaveni >/dev/null 2>&1
# e-maily jdou na testovací SMTP server (npm run smtp)
saltcorn set-cfg smtp_host localhost >/dev/null 2>&1
saltcorn set-cfg smtp_port 2525 >/dev/null 2>&1
saltcorn set-cfg smtp_secure false >/dev/null 2>&1
saltcorn set-cfg email_from portal@svj.test >/dev/null 2>&1
node seed.js 2>&1 | grep -E "SEED|CHYBA"
(nohup saltcorn serve -p 3000 > "$DIR/serve.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 1; done
echo "server: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"
