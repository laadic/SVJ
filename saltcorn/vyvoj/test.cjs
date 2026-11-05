// Kompletní test klientské sekce: přístupy rolí, pokusy o obejití přes API, soubory, schvalování faktur.
// Spuštění: npm run smtp (v jiném terminálu), ./rebuild.sh, npm test   (BASE=http://... pro jinou instanci)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const notp = require(require.resolve("notp", { paths: [path.join(__dirname, "node_modules/@saltcorn/cli")] })).totp;

const BASE = process.env.BASE || "http://localhost:3000";
const PW = "Test-Heslo-2026!";
const KEYS = { "predseda@svj.test": "klic-predseda-0001", "mistopredseda@svj.test": "klic-mistopred-002" };
const MAIL_DIR = path.join(__dirname, "mail-out");
const PDF = path.join(__dirname, "../../public/dokumenty/stanovy.pdf");
const TXT = path.join(require("os").tmpdir(), "neni-pdf.txt");
fs.writeFileSync(TXT, "toto není PDF");
const SHOTS = process.env.SHOTS || "";

let pass = 0, fail = 0;
const check = (area, name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "OK  " : "FAIL"} [${area}] ${name}${detail ? " — " + String(detail).slice(0, 160) : ""}`);
};

async function session(b, email, heslo = PW) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  if (email) {
    await page.goto(BASE + "/auth/login");
    await page.fill("input[name=email]", email);
    await page.fill("input[name=password]", heslo);
    await Promise.all([page.waitForNavigation(), page.click("form button[type=submit]")]);
    if (page.url().includes("/twofa/login/totp")) {
      await page.fill("input[name=code]", notp.gen(KEYS[email], { time: 30 }));
      await Promise.all([page.waitForNavigation(), page.click("form button[type=submit]")]);
    }
  }
  return { ctx, page, email };
}
async function token(page) {
  await page.goto(BASE + "/");
  return page.evaluate(() => window._sc_globalCsrf);
}
async function api(s, method, p, data) {
  const t = await token(s.page);
  const r = await s.page.request.fetch(BASE + p, { method, data, headers: { "CSRF-Token": t, "Content-Type": "application/json" } });
  let body = await r.text();
  try { body = JSON.parse(body); } catch {}
  return { status: r.status(), body };
}
const denied = (r) => r.status >= 400 || (r.body && (r.body.error || (Array.isArray(r.body.success) && r.body.success.length === 0)));
async function canView(s, name) {
  const r = await s.page.goto(BASE + "/view/" + name);
  return r.status() === 200 && new URL(s.page.url()).pathname === "/view/" + name;
}
const text = async (page) => (await page.textContent("body")).replace(/\s+/g, " ");
async function submit(page, label) {
  await Promise.all([page.waitForLoadState("networkidle"), page.click(`button:has-text("${label}")`)]);
}
const lastMail = () => {
  const f = fs.readdirSync(MAIL_DIR).sort().pop();
  return f ? JSON.parse(fs.readFileSync(path.join(MAIL_DIR, f))) : null;
};

(async () => {
  fs.mkdirSync(MAIL_DIR, { recursive: true });
  for (const f of fs.readdirSync(MAIL_DIR)) fs.unlinkSync(path.join(MAIL_DIR, f));
  const b = await chromium.launch();
  const S = {};
  for (const e of ["predseda", "mistopredseda", "clen", "spravce", "vlastnik1", "vlastnik2", "najemnik", "novy"])
    S[e] = await session(b, e + "@svj.test");
  S.public = await session(b, null);
  S.admin = await session(b, "admin@svj.test", "Admin-Heslo-2026!");

  // ---------- 1. Přístup k pohledům podle rolí ----------
  const views = {
    oznameni_prehled: ["predseda", "spravce", "vlastnik1", "najemnik"],
    dokumenty_seznam: ["predseda", "spravce", "vlastnik1"],
    moje_jednotky: ["predseda", "spravce", "vlastnik1"],
    muj_kontakt: ["predseda", "spravce", "vlastnik1"],
    jednotky_seznam: ["predseda", "spravce"],
    vlastnici_seznam: ["predseda", "spravce"],
    dokumenty_sprava: ["predseda", "spravce"],
    oznameni_sprava: ["predseda"],
    dokumenty_vyboru_seznam: ["predseda"],
    faktury_ke_schvaleni: ["predseda"],
    faktura_nahrat: ["predseda"],
    faktury_schvalene: ["predseda"],
    nastaveni_seznam: ["predseda"],
    web_prispevky_seznam: ["predseda"],
    web_prispevek_upravit: ["predseda"],
  };
  const who = ["predseda", "spravce", "vlastnik1", "najemnik", "novy", "public"];
  for (const [v, allowed] of Object.entries(views)) {
    const got = [];
    for (const w of who) if (await canView(S[w], v)) got.push(w);
    check("role", `pohled ${v}`, JSON.stringify(got) === JSON.stringify(allowed), `smí: ${got.join(", ") || "nikdo"}`);
  }
  // domovské stránky
  for (const [w, exp] of [["vlastnik1", "Oznámení"], ["najemnik", "Oznámení"], ["novy", "nepřidělil roli"], ["public", "Přihlásit se"]]) {
    await S[w].page.goto(BASE + "/");
    check("role", `domovská stránka: ${w}`, (await text(S[w].page)).includes(exp));
  }
  await S.najemnik.page.goto(BASE + "/");
  const najText = await text(S.najemnik.page);
  check("role", "nájemník nevidí odkaz na dokumenty ani jednotku", !najText.includes("Moje jednotka") && !najText.includes("Dokumenty SVJ"));

  // menu podle role
  const menuText = async (w) => { await S[w].page.goto(BASE + "/"); return (await S[w].page.textContent("#accordionSidebar, nav, .navbar, body")).replace(/\s+/g, " "); };
  let mt = await menuText("vlastnik1");
  check("menu", "vlastník: Dokumenty SVJ a Moje jednotka, bez Výboru a Evidence", mt.includes("Moje jednotka") && mt.includes("Dokumenty SVJ") && !mt.includes("Faktury ke schválení") && !mt.includes("Evidence"));
  mt = await menuText("spravce");
  check("menu", "správce: Evidence, bez faktur", mt.includes("Evidence") && !mt.includes("Faktury ke schválení"));
  mt = await menuText("predseda");
  check("menu", "výbor: Faktury ke schválení", mt.includes("Faktury ke schválení") && mt.includes("Evidence"));
  mt = await menuText("vlastnik1");
  check("menu", "vlastník má nastavení účtu a odhlášení", /Nastavení uživatele|User settings/.test(mt) && /Odhlásit|Logout/.test(mt));
  check("menu", "vlastník nevidí administraci", !/Uživatelé a zabezpečení|Users and security/.test(mt));
  mt = await menuText("admin");
  check("menu", "admin vidí administraci (uživatelé, tabulky)", /Uživatelé a zabezpečení|Users and security/.test(mt) && /Tabulky|Tables/.test(mt));
  mt = await menuText("public");
  check("menu", "nepřihlášený má v menu přihlášení", /Přihlásit|Login/.test(mt) && !mt.includes("Faktury"));
  // české datum
  await S.vlastnik1.page.goto(BASE + "/page/uvod");
  const dnes = new Date(); const cz = `${dnes.getDate()}. ${dnes.getMonth() + 1}. ${dnes.getFullYear()}`;
  check("format", "datum oznámení česky", (await text(S.vlastnik1.page)).includes(cz), cz);

  // ---------- 2. Vlastník vidí jen své ----------
  await S.vlastnik1.page.goto(BASE + "/view/moje_jednotky");
  let t = await text(S.vlastnik1.page);
  check("evidence", "vlastník 1 vidí jen svou jednotku 1001/1", t.includes("1001/1") && !t.includes("1001/2") && !t.includes("1001/3"));
  check("evidence", "vlastník vidí údaje z jednotky (plocha, podíl)", t.includes("5430/100000") && t.includes("54"));
  check("evidence", "vlastník nevidí interní poznámku jednotky", !t.includes("Interní poznámka"));
  await S.vlastnik2.page.goto(BASE + "/view/moje_jednotky");
  t = await text(S.vlastnik2.page);
  check("evidence", "vlastník 2 vidí 1001/2 a 1001/3", t.includes("1001/2") && t.includes("1001/3") && !t.includes("1001/1"));
  await S.vlastnik1.page.goto(BASE + "/view/muj_kontakt");
  t = await text(S.vlastnik1.page);
  check("evidence", "vlastník vidí jen svůj kontakt", t.includes("Eva Malá") && !t.includes("Karel") && !t.includes("Jiří"));

  // úprava vlastního kontaktu přes formulář
  await S.vlastnik1.page.click("text=Upravit kontakt");
  await S.vlastnik1.page.fill("input[name=telefon]", "+420 777 111 222");
  await submit(S.vlastnik1.page, "Uložit");
  t = await text(S.vlastnik1.page);
  check("evidence", "vlastník si upraví telefon", t.includes("+420 777 111 222"));

  // ---------- 3. Pokusy o obejití přes API (vlastník) ----------
  const v1 = S.vlastnik1;
  let r = await api(v1, "GET", "/api/jednotky");
  check("api", "vlastník: GET /api/jednotky zakázáno", denied(r), r.status);
  r = await api(v1, "GET", "/api/vlastnici");
  const mojeV = r.body?.success || [];
  check("api", "vlastník: GET /api/vlastnici vrátí jen jeho záznam", mojeV.length === 1 && mojeV[0].jmeno === "Eva Malá", JSON.stringify(mojeV.map((x) => x.jmeno)));
  const evaId = mojeV[0]?.id;
  r = await api(v1, "GET", "/api/vlastnictvi");
  const mojeVl = r.body?.success || [];
  check("api", "vlastník: GET /api/vlastnictvi jen jeho vlastnictví", mojeVl.length === 1, JSON.stringify(mojeVl));
  r = await api(v1, "POST", `/api/vlastnici/${evaId}`, { jmeno: "Podvržené jméno" });
  check("api", "vlastník nezmění své jméno v evidenci", denied(r), JSON.stringify(r.body));
  r = await api(v1, "POST", `/api/vlastnici/${evaId}`, { uzivatel: 7 });
  check("api", "vlastník nepřepíše vazbu na účet", denied(r), JSON.stringify(r.body));
  r = await api(v1, "POST", `/api/vlastnici/${evaId + 1}`, { telefon: "666" });
  check("api", "vlastník nezmění cizí kontakt", denied(r), JSON.stringify(r.body));
  r = await api(v1, "POST", "/api/vlastnictvi", { jednotka: 2, vlastnik: evaId, podil_na_jednotce: "1/1" });
  check("api", "vlastník si nepřipíše cizí jednotku", denied(r), JSON.stringify(r.body));
  r = await api(v1, "POST", `/api/vlastnictvi/${mojeVl[0]?.id}`, { jednotka: 2 });
  check("api", "vlastník nepřepíše své vlastnictví na jinou jednotku", denied(r), JSON.stringify(r.body));
  r = await api(v1, "DELETE", `/api/vlastnictvi/${mojeVl[0]?.id}`);
  check("api", "vlastník nesmaže své vlastnictví", denied(r), JSON.stringify(r.body));
  r = await api(v1, "DELETE", `/api/vlastnici/${evaId}`);
  check("api", "vlastník nesmaže svůj záznam vlastníka", denied(r), JSON.stringify(r.body));
  r = await api(v1, "POST", "/api/vlastnici", { jmeno: "Falešný", uzivatel: 6 });
  check("api", "vlastník nezaloží nového vlastníka", denied(r), JSON.stringify(r.body));
  r = await api(v1, "GET", "/api/faktury");
  check("api", "vlastník: GET /api/faktury zakázáno", denied(r), r.status);
  r = await api(S.spravce, "GET", "/api/faktury");
  check("api", "správce: GET /api/faktury zakázáno", denied(r), r.status);
  r = await api(S.spravce, "GET", "/api/dokumenty_vyboru");
  check("api", "správce: interní dokumenty výboru zakázány", denied(r), r.status);

  // ---------- 4. Dokumenty: správce nahraje, vlastník stáhne, nájemník ne ----------
  const sp = S.spravce.page;
  await sp.goto(BASE + "/view/dokumenty_upravit");
  await sp.fill("input[name=nazev]", "Vyúčtování služeb 2025");
  await sp.selectOption("select[name=kategorie]", "Hospodaření a vyúčtování");
  await sp.setInputFiles("input[name=soubor]", PDF);
  await submit(sp, "Uložit");
  await S.vlastnik1.page.goto(BASE + "/view/dokumenty_seznam");
  t = await text(S.vlastnik1.page);
  check("dokumenty", "vlastník vidí nahraný dokument", t.includes("Vyúčtování služeb 2025"));
  const dokHref = await S.vlastnik1.page.getAttribute("a[href*='/files/serve/']", "href").catch(() => null);
  check("dokumenty", "odkaz na soubor existuje", !!dokHref, dokHref);
  if (dokHref) {
    const rv = await S.vlastnik1.page.request.get(BASE + dokHref);
    check("dokumenty", "vlastník soubor stáhne", rv.status() === 200 && (await rv.body()).slice(0, 4).toString() === "%PDF", rv.status());
    const rn = await S.najemnik.page.request.get(BASE + dokHref);
    check("dokumenty", "nájemník soubor nestáhne", rn.status() !== 200 || (await rn.body()).slice(0, 4).toString() !== "%PDF", rn.status());
    const rp = await S.public.page.request.get(BASE + dokHref);
    check("dokumenty", "nepřihlášený soubor nestáhne", rp.status() !== 200 || (await rp.body()).slice(0, 4).toString() !== "%PDF", rp.status());
  }

  // ---------- 5. Faktury ----------
  const pr = S.predseda.page, mp = S.mistopredseda.page, cl = S.clen.page;
  // 5a ne-PDF se odmítne
  await pr.goto(BASE + "/view/faktura_nahrat");
  await pr.fill("input[name=dodavatel]", "Špatný soubor s.r.o.");
  await pr.setInputFiles("input[name=soubor]", TXT);
  await submit(pr, "Nahrát ke schválení");
  t = await text(pr);
  check("faktury", "soubor, který není PDF, se odmítne", t.includes("PDF"), t.match(/.{0,60}PDF.{0,60}/)?.[0]);
  // 5b nahrání PDF
  await pr.goto(BASE + "/view/faktura_nahrat");
  await pr.fill("input[name=dodavatel]", "Výtahy Praha s.r.o.");
  await pr.fill("input[name=cislo]", "2026-0815");
  await pr.fill("input[name=castka]", "12500");
  await pr.fill("[name=popis]", "Servis výtahu – listopad");
  await pr.setInputFiles("input[name=soubor]", PDF);
  await submit(pr, "Nahrát ke schválení");
  t = await text(pr);
  check("faktury", "faktura je mezi čekajícími", pr.url().includes("/page/faktury") && t.includes("Výtahy Praha"), pr.url());
  check("faktury", "částka v korunách", t.includes("12 500,00 Kč") || t.includes("12\u00a0500,00\u00a0Kč"), t.match(/.{0,20}500.{0,20}/)?.[0]);
  if (SHOTS) await pr.screenshot({ path: SHOTS + "/faktury-cekajici.png", fullPage: true });
  r = await api(S.predseda, "GET", "/api/faktury");
  const f1 = (r.body?.success || []).find((x) => x.dodavatel === "Výtahy Praha s.r.o.");
  check("faktury", "nová faktura má stav Čeká na schválení a nahrál ji předseda", f1?.stav === "Čeká na schválení" && f1?.nahral === 2, JSON.stringify(f1 && { stav: f1.stav, nahral: f1.nahral }));
  // 5c pokusy o podvod přes API
  r = await api(S.predseda, "POST", `/api/faktury/${f1.id}`, { stav: "Schváleno" });
  check("faktury", "člen výboru nenastaví stav Schváleno přímo", denied(r), JSON.stringify(r.body));
  r = await api(S.predseda, "POST", "/api/schvaleni", { faktura: f1.id, clen: 3, rozhodnuti: "Schvaluji" });
  check("faktury", "předseda neschválí za místopředsedkyni (podvržený člen)", denied(r), JSON.stringify(r.body));
  r = await api(S.vlastnik1, "POST", "/api/schvaleni", { faktura: f1.id, clen: 6, rozhodnuti: "Schvaluji" });
  check("faktury", "vlastník nemůže schvalovat", denied(r), JSON.stringify(r.body));
  r = await api(S.predseda, "POST", "/api/faktury", { dodavatel: "Podvod", soubor: "faktury/x.pdf", stav: "Schváleno" });
  check("faktury", "nelze založit rovnou schválenou fakturu", denied(r), JSON.stringify(r.body));
  // 5d člen výboru bez 2FA nesmí rozhodnout
  await cl.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  await cl.check("input[name=rozhodnuti][value=Schvaluji]");
  await submit(cl, "Odeslat rozhodnutí");
  t = await text(cl);
  check("faktury", "člen výboru bez 2FA nemůže rozhodnout", t.includes("dvoufaktorov"), t.match(/.{0,40}dvoufaktorov.{0,60}/)?.[0]);
  // 5e první schválení (předseda, formulář)
  await pr.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  if (SHOTS) await pr.screenshot({ path: SHOTS + "/faktura-detail.png", fullPage: true });
  await pr.check("input[name=rozhodnuti][value=Schvaluji]");
  await submit(pr, "Odeslat rozhodnutí");
  r = await api(S.predseda, "GET", `/api/faktury?id=${f1.id}`);
  check("faktury", "po 1. schválení faktura stále čeká", r.body?.success?.[0]?.stav === "Čeká na schválení", r.body?.success?.[0]?.stav);
  check("faktury", "po 1. schválení se nic neodeslalo", fs.readdirSync(MAIL_DIR).length === 0);
  // 5f stejný člen podruhé
  await pr.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  await pr.check("input[name=rozhodnuti][value=Schvaluji]");
  await submit(pr, "Odeslat rozhodnutí");
  t = await text(pr);
  check("faktury", "stejný člen nemůže schválit podruhé", t.includes("už rozhodl"), t.match(/.{0,30}rozhodl.{0,60}/)?.[0]);
  r = await api(S.predseda, "GET", `/api/schvaleni?faktura=${f1.id}`);
  check("faktury", "v evidenci je jen 1 rozhodnutí předsedy", (r.body?.success || []).length === 1, (r.body?.success || []).length);
  const roz1 = r.body?.success?.[0];
  r = await api(S.predseda, "POST", `/api/schvaleni/${roz1?.id}`, { rozhodnuti: "Zamítám" });
  check("faktury", "rozhodnutí nelze dodatečně změnit", denied(r), JSON.stringify(r.body));
  r = await api(S.predseda, "DELETE", `/api/schvaleni/${roz1?.id}`);
  check("faktury", "rozhodnutí nelze smazat", denied(r), JSON.stringify(r.body));
  r = await api(S.predseda, "POST", `/api/faktury/${f1.id}`, { castka: 99999 });
  check("faktury", "po prvním schválení nelze fakturu měnit", denied(r), JSON.stringify(r.body));
  // 5g druhé schválení (místopředsedkyně) → schváleno + e-mail
  await mp.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  await mp.check("input[name=rozhodnuti][value=Schvaluji]");
  await submit(mp, "Odeslat rozhodnutí");
  await new Promise((res) => setTimeout(res, 1500));
  r = await api(S.predseda, "GET", `/api/faktury?id=${f1.id}`);
  const f1b = r.body?.success?.[0] || {};
  check("faktury", "po 2. schválení je faktura Schváleno", f1b.stav === "Schváleno", f1b.stav);
  check("faktury", "u faktury je kdo schválil", (f1b.rozhodli || "").includes("Jan Novák") && (f1b.rozhodli || "").includes("Marie Svobodová"), f1b.rozhodli);
  const mail = lastMail();
  check("e-mail", "e-mail odeslán na určenou adresu", mail?.to === "ucetni@svj.test", mail?.to);
  check("e-mail", "předmět obsahuje dodavatele", (mail?.subject || "").includes("Výtahy Praha"), mail?.subject);
  check("e-mail", "příloha je PDF faktury", mail?.attachments?.length === 1 && mail.attachments[0].head.startsWith("%PDF"), JSON.stringify(mail?.attachments));
  check("e-mail", "text e-mailu obsahuje údaje faktury", (mail?.html || mail?.text || "").includes("12") && (mail?.html || "").includes("2026-0815"));
  check("e-mail", "odeslání je zaznamenáno u faktury", !!f1b.odeslano && f1b.odeslat_na === "ucetni@svj.test", f1b.odeslano);
  check("e-mail", "odesláno právě jednou", fs.readdirSync(MAIL_DIR).length === 1, fs.readdirSync(MAIL_DIR).length);
  await pr.goto(BASE + "/view/faktury_schvalene");
  t = await text(pr);
  check("faktury", "faktura je v archivu schválených", t.includes("Výtahy Praha"));
  if (SHOTS) await pr.screenshot({ path: SHOTS + "/faktury-schvalene.png", fullPage: true });
  r = await api(S.predseda, "DELETE", `/api/faktury/${f1.id}`);
  check("faktury", "schválenou fakturu nelze smazat", denied(r), JSON.stringify(r.body));
  // opětovné odeslání tlačítkem
  await pr.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  pr.once("dialog", (d) => d.accept());
  await pr.click('button:has-text("Odeslat e-mail znovu"), a:has-text("Odeslat e-mail znovu")');
  await new Promise((res) => setTimeout(res, 2000));
  check("e-mail", "tlačítko Odeslat e-mail znovu pošle fakturu znovu", fs.readdirSync(MAIL_DIR).length === 2, fs.readdirSync(MAIL_DIR).length);
  await cl.goto(BASE + `/view/faktura_detail?id=${f1.id}`);
  check("e-mail", "tlačítko vidí i člen výboru, vlastník ne", (await text(cl)).includes("Odeslat e-mail znovu") && !(await canView(S.vlastnik1, "faktura_detail")));
  // 5h zamítnutí
  await pr.goto(BASE + "/view/faktura_nahrat");
  await pr.fill("input[name=dodavatel]", "Předražené opravy a.s.");
  await pr.fill("input[name=castka]", "250000");
  await pr.setInputFiles("input[name=soubor]", PDF);
  await submit(pr, "Nahrát ke schválení");
  r = await api(S.predseda, "GET", "/api/faktury");
  const f2 = (r.body?.success || []).find((x) => x.dodavatel === "Předražené opravy a.s.");
  await mp.goto(BASE + `/view/faktura_detail?id=${f2.id}`);
  await mp.check("input[name=rozhodnuti][value=Zamítám]");
  await submit(mp, "Odeslat rozhodnutí");
  t = await text(mp);
  check("faktury", "zamítnutí bez důvodu se odmítne", t.includes("důvod"));
  await mp.goto(BASE + `/view/faktura_detail?id=${f2.id}`);
  await mp.check("input[name=rozhodnuti][value=Zamítám]");
  await mp.fill("input[name=komentar]", "Cena neodpovídá nabídce.");
  await submit(mp, "Odeslat rozhodnutí");
  r = await api(S.predseda, "GET", `/api/faktury?id=${f2.id}`);
  check("faktury", "zamítnutá faktura má stav Zamítnuto", r.body?.success?.[0]?.stav === "Zamítnuto", r.body?.success?.[0]?.rozhodli);
  check("e-mail", "zamítnutá faktura se neodeslala", fs.readdirSync(MAIL_DIR).length === 2);
  await pr.goto(BASE + `/view/faktura_detail?id=${f2.id}`);
  t = await text(pr);
  check("faktury", "u rozhodnuté faktury už není formulář", !t.includes("Odeslat rozhodnutí"));

  // ---------- 6. Příspěvky a události pro veřejný web ----------
  await pr.goto(BASE + "/view/web_prispevek_upravit");
  await pr.check("input[name=typ][value=Aktualita]");
  await pr.fill("input[name=nadpis]", "Odečty vodoměrů");
  await pr.fill("[name=perex]", "Ve středu proběhnou odečty vodoměrů.");
  await pr.fill("[name=text]", "Prosíme o zpřístupnění vodoměrů.\n\nVíce na https://example.cz");
  await submit(pr, "Uložit");
  check("web", "výbor uloží aktualitu", pr.url().includes("/page/prispevky_na_web") && (await text(pr)).includes("Odečty vodoměrů"), pr.url());
  await pr.goto(BASE + "/view/web_prispevek_upravit");
  await pr.check("input[name=typ][value=Událost]");
  await pr.fill("input[name=nadpis]", "Shromáždění vlastníků");
  await submit(pr, "Uložit");
  check("web", "událost bez začátku se odmítne", (await text(pr)).includes("vyplňte začátek"));
  // událost přes formulář: datum z kalendáře, čas zapsaný s tečkou se uloží jako 18:00
  const zaTyden = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  await pr.goto(BASE + "/view/web_prispevek_upravit");
  await pr.check("input[name=typ][value=Událost]");
  await pr.fill("input[name=nadpis]", "Shromáždění vlastníků");
  await pr.fill("input[name=zacatek]", zaTyden);
  await pr.fill("input[name=cas]", "18.00");
  await pr.fill("input[name=misto]", "Společenská místnost");
  await pr.fill("[name=perex]", "Výroční shromáždění.");
  await submit(pr, "Uložit");
  check("web", "výbor založí událost s datem a časem", pr.url().includes("/page/prispevky_na_web") && (await text(pr)).includes("Shromáždění vlastníků"), pr.url());
  await pr.click('tr:has-text("Shromáždění vlastníků") >> text=Upravit');
  check("web", "při úpravě se datum a čas předvyplní", (await pr.inputValue("input[name=zacatek]")) === zaTyden && (await pr.inputValue("input[name=cas]")) === "18:00" && !!(await pr.inputValue("input[name=datum]")),
    `${await pr.inputValue("input[name=zacatek]")} ${await pr.inputValue("input[name=cas]")} ${await pr.inputValue("input[name=datum]")}`);
  r = await api(S.predseda, "POST", "/api/web_prispevky", { typ: "Událost", nadpis: "Špatný čas", zacatek: zaTyden, cas: "25:99" });
  check("web", "nesmyslný čas se odmítne", denied(r), JSON.stringify(r.body));
  r = await api(S.predseda, "POST", "/api/web_prispevky", { typ: "Aktualita", nadpis: "Tajný koncept", koncept: true });
  check("web", "výbor uloží koncept", !denied(r), JSON.stringify(r.body));
  const pub = await S.public.page.request.get(BASE + "/api/action/verejne_prispevky", { headers: { Origin: "https://laadic.github.io" } });
  const pj = await pub.json().catch(() => ({}));
  const data = pj.data || [];
  check("web", "veřejné API vrací zveřejněnou aktualitu i událost", pj.success && data.some((x) => x.nadpis === "Odečty vodoměrů" && x.datum) && data.some((x) => x.typ === "Událost" && String(x.zacatek).slice(0, 10) === zaTyden && x.cas === "18:00"), JSON.stringify(data.map((x) => [x.nadpis, x.zacatek, x.cas])));
  check("web", "veřejné API nevrací koncept", !data.some((x) => x.nadpis === "Tajný koncept"));
  check("web", "veřejné API nevrací interní pole", data.length > 0 && data.every((x) => !("koncept" in x)));
  check("web", "CORS pro veřejný web", pub.headers()["access-control-allow-origin"] === "*", pub.headers()["access-control-allow-origin"]);
  const rt = await S.public.page.request.get(BASE + "/api/web_prispevky");
  check("web", "tabulka s koncepty není veřejná", rt.status() === 401, rt.status());
  r = await api(S.vlastnik1, "GET", "/api/web_prispevky");
  check("web", "vlastník nečte tabulku příspěvků", denied(r), r.status);
  r = await api(S.vlastnik1, "POST", "/api/web_prispevky", { typ: "Aktualita", nadpis: "Podvržená zpráva" });
  check("web", "vlastník nezaloží příspěvek", denied(r), JSON.stringify(r.body));
  r = await api(S.spravce, "POST", "/api/web_prispevky", { typ: "Aktualita", nadpis: "Zpráva správce" });
  check("web", "správce nezaloží příspěvek (jen výbor)", denied(r), JSON.stringify(r.body));

  console.log(`\nVÝSLEDEK: ${pass} OK, ${fail} FAIL`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("CHYBA TESTU:", e); process.exit(2); });
