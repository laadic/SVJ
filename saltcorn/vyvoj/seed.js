// Testovací data jen pro lokální ověření – do packu se nedostanou. Hesla a 2FA klíče jsou testovací.
const sc = require("./sc");
const { Table, User } = sc;
const HESLO = "Test-Heslo-2026!";
(async () => {
  await sc.init();
  const users = [
    ["predseda@svj.test", 20, "Jan Novák"], ["mistopredseda@svj.test", 20, "Marie Svobodová"], ["clen@svj.test", 20, "Petr Dvořák"],
    ["spravce@svj.test", 30, "Správa domů s.r.o."], ["vlastnik1@svj.test", 60, "Eva Malá"], ["vlastnik2@svj.test", 60, "Karel Velký"],
    ["najemnik@svj.test", 70, "Tomáš Nájemný"], ["novy@svj.test", 80, "Nový Uživatel"],
  ];
  const id = {};
  for (const [email, role_id, jmeno] of users) {
    const u = await User.create({ email, password: HESLO, role_id, jmeno });
    if (u.error) throw new Error(u.error);
    id[email] = u.id;
  }
  // 2FA (TOTP) pro testy: předseda a místopředsedkyně ho mají zapnuté, člen výboru ne
  for (const [email, key] of [["predseda@svj.test", "klic-predseda-0001"], ["mistopredseda@svj.test", "klic-mistopred-002"]]) {
    const u = await User.findOne({ email });
    await u.update({ _attributes: { ...(u._attributes || {}), totp_enabled: true, totp_key: key } });
  }
  const admin = await User.findOne({ email: "admin@svj.test" });
  await admin.update({ jmeno: "Admin Portálu" });
  const J = Table.findOne("jednotky"), V = Table.findOne("vlastnici"), VL = Table.findOne("vlastnictvi");
  const j1 = await J.insertRow({ cislo: "1001/1", typ: "Byt", podlazi: "1. NP", plocha: 54.3, podil: "5430/100000", pocet_osob: 2, poznamka: "Interní poznámka správce" });
  const j2 = await J.insertRow({ cislo: "1001/2", typ: "Byt", podlazi: "2. NP", plocha: 71.8, podil: "7180/100000", pocet_osob: 3 });
  const j3 = await J.insertRow({ cislo: "1001/3", typ: "Garáž / garážové stání", podlazi: "1. PP", plocha: 14, podil: "1400/100000", pocet_osob: 0 });
  const eva = await V.insertRow({ jmeno: "Eva Malá", email: "eva@example.cz", telefon: "+420 601 000 001", adresa: "Lipová 1", uzivatel: id["vlastnik1@svj.test"] });
  const karel = await V.insertRow({ jmeno: "Karel Velký", email: "karel@example.cz", telefon: "+420 601 000 002", adresa: "Lipová 2", uzivatel: id["vlastnik2@svj.test"] });
  const jiri = await V.insertRow({ jmeno: "Jiří Bez Účtu", telefon: "+420 601 000 003" });
  await VL.insertRow({ jednotka: j1, vlastnik: eva, podil_na_jednotce: "1/1", od: new Date("2019-05-01") });
  await VL.insertRow({ jednotka: j2, vlastnik: karel, podil_na_jednotce: "1/2", od: new Date("2015-01-10") });
  await VL.insertRow({ jednotka: j2, vlastnik: jiri, podil_na_jednotce: "1/2", od: new Date("2015-01-10") });
  await VL.insertRow({ jednotka: j3, vlastnik: karel, podil_na_jednotce: "1/1", od: new Date("2016-03-01") });
  await Table.findOne("oznameni").insertRow({ nadpis: "Odečty vodoměrů 12. 11.", datum: new Date(), text: "Ve středu 12. 11. od 16 do 19 h proběhnou odečty.\nZajistěte prosím přístup." });
  await Table.findOne("nastaveni_portalu").insertRow({ email_faktury: "ucetni@svj.test", pocet_schvaleni: 2 });
  console.log("SEED OK", JSON.stringify(id));
  process.exit(0);
})().catch((e) => { console.error("CHYBA:", e); process.exit(1); });
