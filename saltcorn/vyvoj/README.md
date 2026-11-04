# Klientská sekce – vývoj a testy

Tato složka obsahuje zdroj klientské sekce. Skript sestaví aplikaci v prázdném Saltcornu,
z ní se pak vyexportuje balíček `../svj-klientska-sekce.json`.

| Soubor | Co dělá |
|---|---|
| `build.js` | Vytvoří role, tabulky (včetně práv k polím), ochranné triggery, pohledy, stránky a trigger `pocatecni_nastaveni`. |
| `seed.js` | Testovací uživatelé všech rolí, jednotky, vlastníci, oznámení, nastavení. Do balíčku se nedostanou. |
| `export-pack.js` | Vyexportuje balíček (stejný formát jako „Vytvořit balíček“ v administraci). |
| `rebuild.sh` | Smaže lokální databázi a vše sestaví znovu, pak spustí server na portu 3000. |
| `smtp.js` | Testovací SMTP server na portu 2525. Zprávy včetně příloh ukládá do `mail-out/`. |
| `test.cjs` | 79 automatických kontrol: přístupy rolí, pokusy o obejití přes API, ochrana souborů, celé schvalování faktur včetně e-mailu. |

## Postup

Potřebujete Node.js 22 a PostgreSQL s prázdnou databází.

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
export DATABASE_URL=postgres://saltcorn:saltcorn@localhost/saltcorn
```

V jiném terminálu spusťte testovací SMTP server:

```bash
npm run smtp
```

Sestavte instanci a spusťte testy:

```bash
./rebuild.sh
```

```bash
npm test
```

Po úpravě `build.js` vyexportujte nový balíček:

```bash
npm run export
```

Import balíčku do jiné instance si můžete ověřit takto: do druhé prázdné databáze ho
nainstalujte příkazem `npx saltcorn install-pack -f ../svj-klientska-sekce.json`, spusťte
`npx saltcorn run-trigger pocatecni_nastaveni`, `node seed.js`, server na jiném portu a pak
`BASE=http://localhost:3001 npm test`.

## Jak je zajištěná bezpečnost

- **Role**: v Saltcornu platí, že nižší číslo má vyšší práva. Role jsou admin 1, výbor 20,
  správce 30, vlastník 60, nájemník 70, účet bez role 80 a veřejnost 100. Každá tabulka má
  `min_role_read` a `min_role_write`.
- **Pole, která mění jen systém** (stav faktury, kdo a kdy rozhodl, odeslání): mají `min_role_write: 1`.
  Saltcorn tak zápis odmítne i přes API.
- **Rozhodnutí o faktuře**: tabulka `schvaleni` má vlastníka záznamu `clen`. Člen výboru proto
  může vložit rozhodnutí jen svým jménem. Unikátní omezení (faktura, člen) zabrání dvojímu
  rozhodnutí. Trigger `schvaleni_kontrola` hlídá roli výboru, dvoufaktorové ověřování a stav faktury.
  Trigger `schvaleni_vyhodnoceni` po každém rozhodnutí spočítá schválení různých členů výboru.
- **Evidence pro vlastníky jen ke čtení**: vlastnictví záznamu v Saltcornu dává i právo zápisu
  a mazání. Proto mají tabulky `vlastnici` a `vlastnictvi` zákaz zápisu do polí, která vlastník
  měnit nesmí, a trigger, který zablokuje mazání. Trigger při mazání běží ještě před smazáním,
  takže chyba smazání zastaví.
- **Soubory**: pole typu soubor mají `min_role_read`. Faktury a interní dokumenty smí stáhnout
  jen výbor, dokumenty SVJ jen vlastníci a výš.
