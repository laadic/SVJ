// Sestaví klientskou sekci SVJ v (prázdné) instanci Saltcornu.
// Výsledek se pak exportuje jako pack (export-pack.js).
const sc = require("./sc");
const { Table, Field, View, Page, Trigger, Role, TableConstraint } = sc;

// ---------- Role ----------
// Nižší číslo = vyšší oprávnění. 1 admin, 40 staff (nepoužito), 80 user = účet bez role, 100 veřejnost
const ROLE = { admin: 1, vybor: 20, spravce: 30, vlastnik: 60, najemnik: 70, user: 80, public: 100 };
const CEKA = "Čeká na schválení";
const DEN = "D. M. YYYY", CAS = "D. M. YYYY H:mm";
const KC = { locale: "cs-CZ", style: "currency", currency: "CZK" };

// ---------- Pomocné funkce pro rozložení ----------
const lbl = (text, extra = {}) => ({ type: "blank", block: false, contents: text, textStyle: "", isFormula: {}, ...extra });
const fEl = (field_name, fieldview, extra = {}) => ({ type: "field", block: false, fieldview, textStyle: "", field_name, configuration: {}, ...extra });
const jEl = (join_field, fieldview = "as_text") => ({ type: "join_field", block: false, textStyle: "", join_field, fieldview, configuration: {} });
const radek = (label, el, labelFor) => ({
  widths: [3, 9], aligns: ["end", "start"], breakpoints: ["md", "md"], mobileAligns: ["start"],
  style: { "margin-bottom": "1rem" },
  besides: [{ above: [null, lbl(label, { textStyle: "fw-bold", ...(labelFor ? { labelFor } : {}) })] }, { above: [null, el] }],
});
const ulozit = (label = "Uložit") => ({
  widths: [3, 9], aligns: ["end", "start"], breakpoints: ["md", "md"], style: { "margin-bottom": "1rem" },
  besides: [null, { type: "action", block: false, minRole: 100, action_name: "Save", action_label: label, action_style: "btn-primary", configuration: {} }],
});

// Edit pohled: items = [{f, label, fv}]
const editCfg = (items, opts = {}) => ({
  columns: items.map((i) => ({ type: "Field", field_name: i.f, fieldview: i.fv, configuration: {} })),
  layout: { above: [...(opts.intro ? [lbl(opts.intro, { textStyle: "" })] : []), ...items.map((i) => radek(i.label, fEl(i.f, i.fv), i.f)), ulozit(opts.saveLabel)] },
  fixed: opts.fixed || {},
  destination_type: !opts.dest ? "Back to referer" : opts.dest.startsWith("page:") ? "Page" : "View",
  ...(opts.dest && opts.dest.startsWith("page:") ? { page_when_done: opts.dest.slice(5) } : { view_when_done: opts.dest }),
  auto_save: false,
  split_paste: false,
});

// Show pohled: rows = [{f|j, label, fv}], extra = další prvky pod údaji
const showRadek = (r) => radek(r.label, r.f ? fEl(r.f, r.fv || "as_text", { configuration: r.cfg || {} }) : jEl(r.j));
const showCfg = (rows, extra = [], podminene = [], extraColumns = []) => ({
  columns: [...[...rows, ...podminene.flatMap((p) => p.rows)].map((r) => (r.f ? { type: "Field", field_name: r.f, fieldview: r.fv || "as_text", configuration: r.cfg || {}, ...(r.cfg || {}) } : { type: "JoinField", join_field: r.j, fieldview: "as_text", configuration: {} })), ...extraColumns],
  layout: { above: [
    ...rows.map(showRadek),
    // skupiny řádků zobrazené jen při splnění podmínky (např. jen u rozhodnuté faktury)
    ...podminene.map((p) => ({ type: "container", showIfFormula: p.kdy, contents: { above: p.rows.map(showRadek) } })),
    ...extra,
  ] },
});

// List pohled (sloupce)
const colF = (field_name, header_label, fieldview = "as_text", extra = {}) => ({ type: "Field", field_name, fieldview, header_label, configuration: {}, ...extra });
const colJ = (join_field, header_label) => ({ type: "JoinField", join_field, header_label, fieldview: "as_text", configuration: {} });
const colView = (view, view_label, extra = {}) => ({ type: "ViewLink", view: `Own:${view}`, view_label, link_style: "btn btn-sm btn-outline-primary", header_label: "\u00a0", ...extra });
const colDel = (extra = {}) => ({ type: "Action", action_name: "Delete", action_label: "Smazat", action_style: "btn-outline-danger", action_size: "btn-sm", confirm: true, header_label: "\u00a0", ...extra });
const listCfg = (columns, opts = {}) => ({
  columns,
  ...(opts.create ? { view_to_create: opts.create, create_view_display: "Link", create_view_label: opts.createLabel || "Přidat", create_link_style: "btn btn-primary", create_view_location: "Top left" } : {}),
  default_state: { _order_field: opts.order || "id", _descending: !!opts.desc, _rows_per_page: 50, ...(opts.filter || {}) },
});


// Karty (Feed) – dobře čitelné na mobilu
const kartaRadek = (label, el) => ({ widths: [5, 7], aligns: ["start", "start"], breakpoints: ["", ""], style: { "margin-bottom": ".35rem" },
  besides: [{ above: [null, lbl(label, { textStyle: "text-muted" })] }, { above: [null, el] }] });
const kartaCfg = (titul, rows, extra = []) => ({
  columns: [titul, ...rows].filter(Boolean).map((r) => (r.f ? { type: "Field", field_name: r.f, fieldview: r.fv || "as_text", configuration: r.cfg || {}, ...(r.cfg || {}) } : { type: "JoinField", join_field: r.j, fieldview: r.fv || "as_text", configuration: {} })),
  layout: { above: [
    ...(titul ? [titul.f ? fEl(titul.f, titul.fv || "as_text", { textStyle: "h5", configuration: titul.cfg || {} }) : { ...jEl(titul.j), textStyle: "h5" }] : []),
    ...rows.map((r) => kartaRadek(r.label, r.f ? fEl(r.f, r.fv || "as_text", { configuration: r.cfg || {} }) : jEl(r.j, r.fv || "as_text"))),
    ...extra,
  ] },
});
const feedCfg = (show_view, opts = {}) => ({
  show_view, order_field: opts.order || "id", descending: !!opts.desc, view_decoration: "None", in_card: true,
  cols_sm: 1, cols_md: opts.md || 1, cols_lg: opts.lg || opts.md || 1, cols_xl: opts.xl || opts.lg || opts.md || 1,
  rows_per_page: 50, masonry_columns: false,
});

const vytvorTabulku = async (name, opts, fields) => {
  const t = await Table.create(name, opts);
  for (const f of fields) await Field.create({ table: t, ...f });
  return Table.findOne({ name });
};

const kod = (s) => s.replace(/^\n/, "");

(async () => {
  await sc.init();

  // ---------- Role ----------
  for (const [role, id] of Object.entries({ vybor: 20, spravce: 30, vlastnik: 60, najemnik: 70 })) {
    if (!(await Role.findOne({ id }))) await Role.create({ id, role });
  }

  // ---------- Uživatelé: jméno ----------
  const users = Table.findOne({ name: "users" });
  if (!users.getFields().find((f) => f.name === "jmeno"))
    await Field.create({ table: users, name: "jmeno", label: "Jméno a příjmení", type: "String", required: false });

  // ---------- Oznámení ----------
  await vytvorTabulku("oznameni", { min_role_read: ROLE.najemnik, min_role_write: ROLE.vybor, description: "Oznámení pro přihlášené (nájemníci a výš)" }, [
    { name: "nadpis", label: "Nadpis", type: "String", required: true },
    { name: "datum", label: "Datum", type: "Date", required: true, attributes: { default_expression: "new Date()" } },
    { name: "text", label: "Text", type: "String", required: true },
  ]);

  // ---------- Dokumenty SVJ (vlastníci) ----------
  const kategorie = "Stanovy a předpisy,Shromáždění vlastníků,Hospodaření a vyúčtování,Smlouvy,Revize a technické zprávy,Ostatní";
  await vytvorTabulku("dokumenty", { min_role_read: ROLE.vlastnik, min_role_write: ROLE.spravce, description: "Neveřejné dokumenty SVJ pro vlastníky" }, [
    { name: "nazev", label: "Název", type: "String", required: true },
    { name: "kategorie", label: "Kategorie", type: "String", required: true, attributes: { options: kategorie } },
    { name: "datum", label: "Datum", type: "Date", required: false },
    { name: "popis", label: "Popis", type: "String", required: false },
    { name: "soubor", label: "Soubor", type: "File", required: true, attributes: { min_role_read: ROLE.vlastnik, folder: "dokumenty", also_delete_file: true } },
  ]);

  // ---------- Interní dokumenty výboru ----------
  await vytvorTabulku("dokumenty_vyboru", { min_role_read: ROLE.vybor, min_role_write: ROLE.vybor, description: "Interní dokumenty výboru" }, [
    { name: "nazev", label: "Název", type: "String", required: true },
    { name: "datum", label: "Datum", type: "Date", required: false },
    { name: "popis", label: "Popis", type: "String", required: false },
    { name: "soubor", label: "Soubor", type: "File", required: true, attributes: { min_role_read: ROLE.vybor, folder: "vybor", also_delete_file: true } },
  ]);

  // ---------- Evidence: jednotky, vlastníci, vlastnictví ----------
  const jednotky = await vytvorTabulku("jednotky", { min_role_read: ROLE.spravce, min_role_write: ROLE.spravce, description: "Evidence jednotek" }, [
    { name: "cislo", label: "Číslo jednotky", type: "String", required: true },
    { name: "typ", label: "Typ", type: "String", required: true, attributes: { options: "Byt,Nebytový prostor,Garáž / garážové stání,Jiné" } },
    { name: "podlazi", label: "Podlaží", type: "String", required: false },
    { name: "plocha", label: "Plocha (m²)", type: "Float", required: false, attributes: { decimal_places: 2 } },
    { name: "podil", label: "Podíl na společných částech", type: "String", required: false },
    { name: "pocet_osob", label: "Počet osob", type: "Integer", required: false },
    { name: "poznamka", label: "Poznámka", type: "String", required: false },
  ]);
  await TableConstraint.create({ table_id: jednotky.id, type: "Unique", configuration: { fields: ["cislo"], errormsg: "Jednotka s tímto číslem už v evidenci je." } });
  await jednotky.update({}); // refresh

  const vlastnici = await vytvorTabulku("vlastnici", { min_role_read: ROLE.spravce, min_role_write: ROLE.spravce, description: "Evidence vlastníků; vlastník vidí a upravuje jen svůj kontakt" }, [
    { name: "jmeno", label: "Jméno / název", type: "String", required: true, attributes: { min_role_write: ROLE.spravce } },
    { name: "email", label: "E-mail", type: "String", required: false },
    { name: "telefon", label: "Telefon", type: "String", required: false },
    { name: "adresa", label: "Doručovací adresa", type: "String", required: false },
    { name: "uzivatel", label: "Účet v portálu", type: "Key to users", required: false, attributes: { min_role_write: ROLE.spravce, summary_field: "email", on_delete: "Set null" } },
  ]);
  await vlastnici.update({ ownership_field_id: vlastnici.getFields().find((f) => f.name === "uzivatel").id });

  await vytvorTabulku("vlastnictvi", { min_role_read: ROLE.spravce, min_role_write: ROLE.spravce, description: "Kdo vlastní kterou jednotku; vlastník vidí jen svá vlastnictví (jen pro čtení)" }, [
    { name: "jednotka", label: "Jednotka", type: "Key to jednotky", required: true, attributes: { min_role_write: ROLE.spravce, summary_field: "cislo", on_delete: "Cascade" } },
    { name: "vlastnik", label: "Vlastník", type: "Key to vlastnici", required: true, attributes: { min_role_write: ROLE.spravce, summary_field: "jmeno", fkey_error_msg: "Vlastníka nelze smazat, dokud je u něj evidována jednotka." } },
    { name: "podil_na_jednotce", label: "Podíl na jednotce", type: "String", required: false, attributes: { min_role_write: ROLE.spravce } },
    { name: "od", label: "Vlastníkem od", type: "Date", required: false, attributes: { min_role_write: ROLE.spravce } },
  ]);
  const vlastnictvi = Table.findOne({ name: "vlastnictvi" });
  await vlastnictvi.update({ ownership_formula: "vlastnik?.uzivatel===user.id /* Inherit vlastnik */" });

  // ---------- Faktury a schvalování ----------
  const sys = { min_role_write: ROLE.admin }; // pole, která mění jen systém
  await vytvorTabulku("faktury", { min_role_read: ROLE.vybor, min_role_write: ROLE.vybor, description: "Faktury ke schválení výborem" }, [
    { name: "dodavatel", label: "Dodavatel", type: "String", required: true },
    { name: "cislo", label: "Číslo faktury / VS", type: "String", required: false },
    { name: "castka", label: "Částka (Kč)", type: "Float", required: false, attributes: { decimal_places: 2 } },
    { name: "splatnost", label: "Splatnost", type: "Date", required: false },
    { name: "popis", label: "Za co / poznámka", type: "String", required: false },
    { name: "soubor", label: "PDF faktury", type: "File", required: true, attributes: { min_role_read: ROLE.vybor, folder: "faktury", files_accept_filter: ".pdf,application/pdf" } },
    { name: "stav", label: "Stav", type: "String", required: false, attributes: { ...sys, options: `${CEKA},Schváleno,Zamítnuto` } },
    { name: "nahral", label: "Nahrál(a)", type: "Key to users", required: false, attributes: { ...sys, summary_field: "email", on_delete: "Set null" } },
    { name: "nahrano", label: "Nahráno", type: "Date", required: false, attributes: sys },
    { name: "datum_rozhodnuti", label: "Rozhodnuto", type: "Date", required: false, attributes: sys },
    { name: "rozhodli", label: "Rozhodnutí", type: "String", required: false, attributes: sys },
    { name: "odeslat_na", label: "Odesláno na", type: "String", required: false, attributes: sys },
    { name: "odeslano", label: "E-mail odeslán", type: "Date", required: false, attributes: sys },
  ]);

  const schvaleni = await vytvorTabulku("schvaleni", { min_role_read: ROLE.vybor, min_role_write: ROLE.admin, description: "Rozhodnutí členů výboru o fakturách (každý člen jen svým jménem)" }, [
    { name: "faktura", label: "Faktura", type: "Key to faktury", required: true, attributes: { summary_field: "dodavatel", fkey_error_msg: "Fakturu, o které už někdo rozhodl, nelze smazat." } },
    { name: "clen", label: "Člen výboru", type: "Key to users", required: true, attributes: { summary_field: "email" } },
    { name: "rozhodnuti", label: "Rozhodnutí", type: "String", required: true, attributes: { options: "Schvaluji,Zamítám" } },
    { name: "komentar", label: "Komentář", type: "String", required: false },
    { name: "datum", label: "Datum", type: "Date", required: false, attributes: sys },
  ]);
  await TableConstraint.create({ table_id: schvaleni.id, type: "Unique", configuration: { fields: ["faktura", "clen"], errormsg: "O této faktuře jste už rozhodl(a). Každý člen výboru rozhoduje jen jednou." } });
  await schvaleni.update({ ownership_field_id: schvaleni.getFields().find((f) => f.name === "clen").id });

  await vytvorTabulku("nastaveni_portalu", { min_role_read: ROLE.vybor, min_role_write: ROLE.admin, description: "Nastavení schvalování faktur (jeden záznam)" }, [
    { name: "email_faktury", label: "E-mail pro schválené faktury", type: "String", required: true },
    { name: "pocet_schvaleni", label: "Počet potřebných schválení", type: "Integer", required: true, attributes: { min: 2 } },
  ]);

  await sc.getState().refresh_tables();
  const T = (name) => Table.findOne({ name });

  // ---------- Triggery ----------
  const trig = async (name, when_trigger, tableName, code, description, action = "run_js_code", configuration) =>
    Trigger.create({
      name, when_trigger, description, action,
      table_id: tableName ? T(tableName).id : null,
      configuration: configuration || { code: kod(code), run_where: "Server" },
    });

  await trig("faktury_kontrola", "Validate", "faktury", `
// Kontrola faktur: nová faktura musí být PDF; o čem už se rozhodlo, nelze měnit.
const CEKA = "${CEKA}";
if (!user) return; // změny provedené systémem (vyhodnocení, e-mail)
const puvodni = typeof old_row === "undefined" ? null : old_row;
if (!puvodni) {
  const soubor = String(row.soubor || "").toLowerCase();
  if (!soubor.endsWith(".pdf")) return { error: "Nahrajte fakturu ve formátu PDF." };
  return { set_fields: { stav: CEKA, nahral: user.id, nahrano: new Date() } };
}
if (user.role_id === 1) return; // admin smí opravovat
if (puvodni.stav !== CEKA) return { error: "Fakturu, o které už bylo rozhodnuto, nelze měnit." };
const pocet = await Table.findOne({ name: "schvaleni" }).countRows({ faktura: puvodni.id });
if (pocet > 0) return { error: "K faktuře už existuje rozhodnutí člena výboru, nelze ji měnit. Pokud je chybná, zamítněte ji a nahrajte znovu." };
`, "Nová faktura: jen PDF, stav Čeká na schválení. Rozhodnutou fakturu nelze měnit.");

  await trig("faktury_ochrana_mazani", "Delete", "faktury", `
if (!user || user.role_id === 1) return;
if (row.stav !== "${CEKA}") throw new Error("Fakturu, o které už bylo rozhodnuto, nelze smazat.");
const pocet = await Table.findOne({ name: "schvaleni" }).countRows({ faktura: row.id });
if (pocet > 0) throw new Error("Fakturu, ke které už existuje rozhodnutí, nelze smazat.");
`, "Rozhodnuté faktury smí mazat jen admin.");

  await trig("schvaleni_kontrola", "Validate", "schvaleni", `
// Každý člen výboru rozhoduje jen sám za sebe, jen jednou a jen o čekající faktuře.
if (!user) return;
const puvodni = typeof old_row === "undefined" ? null : old_row;
if (puvodni) {
  if (user.role_id === 1) return;
  return { error: "Rozhodnutí o faktuře nelze dodatečně měnit." };
}
if (user.role_id > 20) return { error: "O fakturách rozhodují jen členové výboru." };
// Schvalování peněz jen s dvoufaktorovým ověřováním (Saltcorn ho jinak vyžádá jen při přihlášení)
const clen = await User.findOne({ id: user.id });
if (!clen || !clen._attributes || !clen._attributes.totp_enabled)
  return { error: "O fakturách lze rozhodovat jen se zapnutým dvoufaktorovým ověřováním. Zapněte si ho v menu Uživatel → Nastavení uživatele → Dvoufaktorové ověřování." };
const faktura = await Table.findOne({ name: "faktury" }).getRow({ id: row.faktura });
if (!faktura) return { error: "Faktura nenalezena." };
if (faktura.stav !== "${CEKA}") return { error: "O této faktuře už bylo rozhodnuto." };
if (row.rozhodnuti === "Zamítám" && !String(row.komentar || "").trim())
  return { error: "Při zamítnutí napište do komentáře důvod." };
return { set_fields: { clen: user.id, datum: new Date() } };
`, "Rozhodnutí smí vložit jen člen výboru, svým jménem, jednou, u čekající faktury.");

  await trig("schvaleni_ochrana_mazani", "Delete", "schvaleni", `
if (!user || user.role_id === 1) return;
throw new Error("Rozhodnutí o faktuře nelze smazat.");
`, "Rozhodnutí může smazat jen admin.");

  await trig("schvaleni_vyhodnoceni", "Insert", "schvaleni", `
// Po každém rozhodnutí: zamítnutí ukončí fakturu, dostatek schválení ji schválí.
const CEKA = "${CEKA}";
const F = Table.findOne({ name: "faktury" });
const faktura = await F.getRow({ id: row.faktura });
if (!faktura || faktura.stav !== CEKA) return;
const jmeno = (u) => (u && (u.jmeno || u.email)) || "?";
const kdy = (d) => new Date(d || Date.now()).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" });
if (row.rozhodnuti === "Zamítám") {
  const u = await User.findOne({ id: row.clen });
  await F.updateRow({ stav: "Zamítnuto", datum_rozhodnuti: new Date(),
    rozhodli: "Zamítl(a) " + jmeno(u) + " (" + kdy(row.datum) + "): " + (row.komentar || "") }, faktura.id);
  return;
}
const schvaleni = await Table.findOne({ name: "schvaleni" }).getRows({ faktura: faktura.id, rozhodnuti: "Schvaluji" }, { orderBy: "id" });
const clenove = [];
for (const s of schvaleni) {
  const u = await User.findOne({ id: s.clen });
  // počítají se jen různí uživatelé, kteří jsou členy výboru (nebo admin)
  if (u && u.role_id <= 20 && !clenove.some((c) => c.u.id === u.id)) clenove.push({ u, datum: s.datum });
}
const nastaveni = (await Table.findOne({ name: "nastaveni_portalu" }).getRows({}, { orderBy: "id", limit: 1 }))[0] || {};
const potreba = Math.max(2, Number(nastaveni.pocet_schvaleni) || 2);
if (clenove.length < potreba) return;
await F.updateRow({
  stav: "Schváleno",
  datum_rozhodnuti: new Date(),
  rozhodli: clenove.map((c) => jmeno(c.u) + " (" + kdy(c.datum) + ")").join(", "),
  odeslat_na: nastaveni.email_faktury || null,
}, faktura.id);
`, "Vyhodnotí rozhodnutí: zamítnutí → Zamítnuto, dost schválení různých členů → Schváleno (spustí odeslání e-mailu).");

  await trig("faktury_odeslani_emailem", "Update", "faktury", null,
    "Schválenou fakturu pošle e-mailem (s PDF v příloze) na adresu z Nastavení portálu.", "send_email", {
      body_type: "View",
      viewname: "faktura_email",
      to_email: "Field",
      to_email_field: "odeslat_na",
      subject: '"Schválená faktura: " + dodavatel + (cislo ? " (č. " + cislo + ")" : "")',
      subject_formula: true,
      attachment_path: "soubor",
      only_if: `stav === "Schváleno" && !!odeslat_na && !odeslano`,
      confirm_field: "odeslano",
      disable_notify: true,
    });

  for (const tbl of ["vlastnici", "vlastnictvi"])
    await trig(`${tbl}_ochrana_mazani`, "Delete", tbl, `
if (user && user.role_id > 30) throw new Error("Záznamy v evidenci smí mazat jen správce nebo výbor.");
`, "Vlastníci mají k evidenci přístup jen pro čtení – mazat smí správce a výbor.");

  await trig("nastaveni_kontrola", "Validate", "nastaveni_portalu", `
const puvodni = typeof old_row === "undefined" ? null : old_row;
if (!puvodni) {
  const n = await Table.findOne({ name: "nastaveni_portalu" }).countRows({});
  if (n > 0) return { error: "Nastavení už existuje – upravte stávající záznam." };
}
if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(String(row.email_faktury || "").trim())) return { error: "Zadejte platnou e-mailovou adresu." };
if (!(Number(row.pocet_schvaleni) >= 2)) return { error: "Fakturu musí schválit alespoň 2 členové výboru." };
`, "Jediný záznam nastavení, platný e-mail, aspoň 2 schválení.");

  // ---------- Pohledy ----------
  const view = async (name, table, viewtemplate, min_role, configuration, description) =>
    View.create({ name, table_id: table ? T(table).id : null, viewtemplate, min_role, configuration, description: description || "" });

  // Oznámení
  await view("oznameni_karta", "oznameni", "Show", ROLE.najemnik, {
    columns: [{ type: "Field", field_name: "datum", fieldview: "format", configuration: { format: DEN }, format: DEN }, { type: "Field", field_name: "nadpis", fieldview: "as_text", configuration: {} }, { type: "Field", field_name: "text", fieldview: "preFormatted", configuration: {} }],
    layout: { above: [fEl("datum", "format", { textStyle: "text-muted", configuration: { format: DEN } }), fEl("nadpis", "as_text", { textStyle: "h5" }), fEl("text", "preFormatted")] },
  });
  await view("oznameni_upravit", "oznameni", "Edit", ROLE.vybor, editCfg([
    { f: "nadpis", label: "Nadpis", fv: "edit" }, { f: "datum", label: "Datum", fv: "editDay" }, { f: "text", label: "Text", fv: "textarea" },
  ], { dest: "page:sprava_oznameni" }));
  await view("oznameni_prehled", "oznameni", "Feed", ROLE.najemnik, feedCfg("oznameni_karta", { order: "datum", desc: true }), "Oznámení pro přihlášené");
  await view("oznameni_sprava", "oznameni", "List", ROLE.vybor, listCfg([
    colF("datum", "Datum", "format", { format: DEN }), colF("nadpis", "Nadpis"), colView("oznameni_upravit", "Upravit"), colDel(),
  ], { order: "datum", desc: true, create: "oznameni_upravit", createLabel: "Nové oznámení" }));

  // Dokumenty SVJ
  const dokItems = [
    { f: "nazev", label: "Název", fv: "edit" }, { f: "kategorie", label: "Kategorie", fv: "edit" },
    { f: "datum", label: "Datum", fv: "editDay" }, { f: "popis", label: "Popis", fv: "edit" }, { f: "soubor", label: "Soubor", fv: "upload" },
  ];
  await view("dokumenty_upravit", "dokumenty", "Edit", ROLE.spravce, editCfg(dokItems, { dest: "page:sprava_dokumentu" }));
  await view("dokument_karta", "dokumenty", "Show", ROLE.vlastnik, kartaCfg({ f: "nazev" }, [
    { f: "kategorie", label: "Kategorie" }, { f: "datum", label: "Datum", fv: "format", cfg: { format: DEN } }, { f: "popis", label: "Popis" },
    { f: "soubor", label: "Soubor", fv: "Link (new tab)" },
  ]));
  await view("dokumenty_seznam", "dokumenty", "Feed", ROLE.vlastnik, feedCfg("dokument_karta", { order: "datum", desc: true, md: 2, lg: 3 }), "Dokumenty SVJ pro vlastníky");
  await view("dokumenty_sprava", "dokumenty", "List", ROLE.spravce, listCfg([
    colF("kategorie", "Kategorie"), colF("nazev", "Název"), colF("datum", "Datum", "format", { format: DEN }),
    colF("soubor", "Soubor", "Link (new tab)"), colView("dokumenty_upravit", "Upravit"), colDel(),
  ], { order: "datum", desc: true, create: "dokumenty_upravit", createLabel: "Nahrát dokument" }));

  // Interní dokumenty výboru
  await view("dokumenty_vyboru_upravit", "dokumenty_vyboru", "Edit", ROLE.vybor, editCfg(dokItems.filter((i) => i.f !== "kategorie"), { dest: "page:interni_dokumenty" }));
  await view("dokumenty_vyboru_seznam", "dokumenty_vyboru", "List", ROLE.vybor, listCfg([
    colF("nazev", "Název"), colF("datum", "Datum", "format", { format: DEN }), colF("popis", "Popis"),
    colF("soubor", "Soubor", "Link (new tab)"), colView("dokumenty_vyboru_upravit", "Upravit"), colDel(),
  ], { order: "datum", desc: true, create: "dokumenty_vyboru_upravit", createLabel: "Nahrát dokument" }));

  // Evidence – správce a výbor
  await view("jednotka_upravit", "jednotky", "Edit", ROLE.spravce, editCfg([
    { f: "cislo", label: "Číslo jednotky", fv: "edit" }, { f: "typ", label: "Typ", fv: "edit" }, { f: "podlazi", label: "Podlaží", fv: "edit" },
    { f: "plocha", label: "Plocha (m²)", fv: "edit" }, { f: "podil", label: "Podíl na společných částech", fv: "edit" },
    { f: "pocet_osob", label: "Počet osob", fv: "edit" }, { f: "poznamka", label: "Poznámka", fv: "textarea" },
  ], { dest: "page:evidence_jednotek" }));
  await view("vlastnictvi_upravit", "vlastnictvi", "Edit", ROLE.spravce, editCfg([
    { f: "jednotka", label: "Jednotka", fv: "select" }, { f: "vlastnik", label: "Vlastník", fv: "select" },
    { f: "podil_na_jednotce", label: "Podíl na jednotce (např. 1/1, 1/2, SJM)", fv: "edit" }, { f: "od", label: "Vlastníkem od", fv: "editDay" },
  ], { dest: "page:evidence_jednotek" }));
  await view("vlastnictvi_jednotky", "vlastnictvi", "List", ROLE.spravce, listCfg([
    colJ("vlastnik.jmeno", "Vlastník"), colF("podil_na_jednotce", "Podíl na jednotce"), colF("od", "Od", "format", { format: DEN }),
    colView("vlastnictvi_upravit", "Upravit"), colDel(),
  ], { order: "id", create: "vlastnictvi_upravit", createLabel: "Přidat vlastníka k jednotce" }));
  await view("jednotka_detail", "jednotky", "Show", ROLE.spravce, showCfg([
    { f: "cislo", label: "Číslo jednotky" }, { f: "typ", label: "Typ" }, { f: "podlazi", label: "Podlaží" },
    { f: "plocha", label: "Plocha (m²)", fv: "show" }, { f: "podil", label: "Podíl na společných částech" },
    { f: "pocet_osob", label: "Počet osob", fv: "show" }, { f: "poznamka", label: "Poznámka" },
  ], [
    lbl("<h4 class=\"mt-4\">Vlastníci jednotky</h4>"),
    { type: "view", view: "ChildList:vlastnictvi_jednotky.vlastnictvi.jednotka", name: "vlastnici_jednotky", state: "shared" },
  ]));
  await view("jednotky_seznam", "jednotky", "List", ROLE.spravce, listCfg([
    colF("cislo", "Číslo"), colF("typ", "Typ"), colF("podlazi", "Podlaží"), colF("plocha", "m²", "show"),
    colF("podil", "Podíl"), colF("pocet_osob", "Osob", "show"), colView("jednotka_detail", "Detail"), colView("jednotka_upravit", "Upravit"),
  ], { order: "cislo", create: "jednotka_upravit", createLabel: "Přidat jednotku" }), "Evidence jednotek");
  await view("vlastnik_upravit", "vlastnici", "Edit", ROLE.spravce, editCfg([
    { f: "jmeno", label: "Jméno / název", fv: "edit" }, { f: "email", label: "E-mail", fv: "edit" }, { f: "telefon", label: "Telefon", fv: "edit" },
    { f: "adresa", label: "Doručovací adresa", fv: "edit" }, { f: "uzivatel", label: "Účet v portálu", fv: "select" },
  ], { dest: "page:evidence_vlastniku" }));
  await view("vlastnici_seznam", "vlastnici", "List", ROLE.spravce, listCfg([
    colF("jmeno", "Jméno / název"), colF("email", "E-mail"), colF("telefon", "Telefon"), colF("adresa", "Doručovací adresa"),
    colJ("uzivatel.email", "Účet v portálu"), colView("vlastnik_upravit", "Upravit"), colDel(),
  ], { order: "jmeno", create: "vlastnik_upravit", createLabel: "Přidat vlastníka" }), "Evidence vlastníků");

  // Evidence – pohled vlastníka (jen jeho záznamy díky vlastnictví)
  await view("jednotka_karta", "vlastnictvi", "Show", ROLE.vlastnik, kartaCfg({ j: "jednotka.cislo" }, [
    { j: "jednotka.typ", label: "Typ" }, { j: "jednotka.podlazi", label: "Podlaží" }, { j: "jednotka.plocha", label: "Plocha (m²)", fv: "show" },
    { j: "jednotka.podil", label: "Podíl na společných částech" }, { f: "podil_na_jednotce", label: "Můj podíl na jednotce" },
    { f: "od", label: "Vlastníkem od", fv: "format", cfg: { format: DEN } },
  ]));
  await view("moje_jednotky", "vlastnictvi", "Feed", ROLE.vlastnik, feedCfg("jednotka_karta", { md: 2 }), "Jednotky přihlášeného vlastníka");
  await view("muj_kontakt_upravit", "vlastnici", "Edit", ROLE.vlastnik, editCfg([
    { f: "email", label: "E-mail", fv: "edit" }, { f: "telefon", label: "Telefon", fv: "edit" }, { f: "adresa", label: "Doručovací adresa", fv: "edit" },
  ], { dest: "page:moje_jednotka", intro: "Změny kontaktních údajů se ihned propíší do evidence SVJ." }));
  await view("kontakt_karta", "vlastnici", "Show", ROLE.vlastnik, kartaCfg({ f: "jmeno" }, [
    { f: "email", label: "E-mail" }, { f: "telefon", label: "Telefon" }, { f: "adresa", label: "Doručovací adresa" },
  ], [{ type: "view_link", view: "Own:muj_kontakt_upravit", view_label: "Upravit kontakt", link_style: "btn btn-sm btn-outline-primary mt-2", block: false, minRole: 100 }]));
  await view("muj_kontakt", "vlastnici", "Feed", ROLE.vlastnik, feedCfg("kontakt_karta", { md: 2 }), "Kontaktní údaje přihlášeného vlastníka");
  await view("faktura_nahrat", "faktury", "Edit", ROLE.vybor, editCfg([
    { f: "dodavatel", label: "Dodavatel", fv: "edit" }, { f: "cislo", label: "Číslo faktury / VS", fv: "edit" },
    { f: "castka", label: "Částka (Kč)", fv: "edit" }, { f: "splatnost", label: "Splatnost", fv: "editDay" },
    { f: "popis", label: "Za co / poznámka", fv: "textarea" }, { f: "soubor", label: "PDF faktury", fv: "upload" },
  ], { dest: "page:faktury", saveLabel: "Nahrát ke schválení" }));
  await view("rozhodnuti_faktury", "schvaleni", "List", ROLE.vybor, listCfg([
    colJ("clen.jmeno", "Člen výboru"), colJ("clen.email", "E-mail"), colF("rozhodnuti", "Rozhodnutí"), colF("komentar", "Komentář"), colF("datum", "Kdy", "format", { format: CAS }),
  ], { order: "id" }));
  await view("rozhodnuti_nove", "schvaleni", "Edit", ROLE.vybor, editCfg([
    { f: "rozhodnuti", label: "Moje rozhodnutí", fv: "radio_group" }, { f: "komentar", label: "Komentář (u zamítnutí povinný)", fv: "edit" },
  ], { fixed: { preset_clen: "LoggedIn" }, saveLabel: "Odeslat rozhodnutí" }));
  const fakturaUdaje = [
    { f: "dodavatel", label: "Dodavatel" }, { f: "cislo", label: "Číslo faktury / VS" }, { f: "castka", label: "Částka", fv: "to_locale_string", cfg: KC },
    { f: "splatnost", label: "Splatnost", fv: "format", cfg: { format: DEN } }, { f: "popis", label: "Za co / poznámka" },
  ];
  // Tlačítko pro opětovné odeslání schválené faktury (musí být i ve "columns", jinak ho Saltcorn nenajde)
  const akceOdeslatZnovu = {
      type: "action", block: false, minRole: ROLE.vybor, action_name: "run_js_code", action_label: "Odeslat e-mail znovu",
      action_style: "btn-outline-primary", confirm: true, rndid: "odeslat_znovu",
      configuration: { run_where: "Server", code: kod(`
if (row.stav !== "Schváleno") return { error: "Odeslat lze jen schválenou fakturu." };
const nastaveni = (await Table.findOne({ name: "nastaveni_portalu" }).getRows({}, { orderBy: "id", limit: 1 }))[0];
if (!nastaveni || !nastaveni.email_faktury) return { error: "Nejdřív vyplňte e-mail v Nastavení schvalování faktur." };
const F = Table.findOne({ name: "faktury" });
await F.updateRow({ odeslat_na: nastaveni.email_faktury, odeslano: null }, row.id); // spustí odeslání e-mailem
const f = await F.getRow({ id: row.id });
return f.odeslano ? { notify: "E-mail s fakturou byl odeslán na " + nastaveni.email_faktury + "." }
                  : { error: "E-mail se nepodařilo odeslat. Zkontrolujte nastavení e-mailu (SMTP) v administraci." };
`) },
    };
  await view("faktura_detail", "faktury", "Show", ROLE.vybor, showCfg([
    ...fakturaUdaje, { f: "soubor", label: "PDF faktury", fv: "Link (new tab)" }, { f: "stav", label: "Stav" },
    { j: "nahral.email", label: "Nahrál(a)" }, { f: "nahrano", label: "Nahráno", fv: "format", cfg: { format: CAS } },
  ], [
    lbl("<h4 class=\"mt-4\">Rozhodnutí členů výboru</h4>"),
    { type: "view", view: "ChildList:rozhodnuti_faktury.schvaleni.faktura", name: "rozhodnuti", state: "shared" },
    { type: "container", showIfFormulaInputs: false, showIfFormula: `stav === "${CEKA}"`, contents: { above: [
      lbl("<h4 class=\"mt-4\">Vaše rozhodnutí</h4><p>Faktura se schválí, jakmile ji schválí potřebný počet různých členů výboru (nejméně 2). Pak se automaticky odešle e-mailem.</p>"),
      { type: "view", view: "ChildList:rozhodnuti_nove.schvaleni.faktura", name: "nove_rozhodnuti", state: "shared" },
    ] } },
    // znovuodeslání schválené faktury (např. když e-mail napoprvé selhal)
    { type: "container", showIfFormula: `stav === "Schváleno"`, contents: { above: [akceOdeslatZnovu] } },
  ], [{ kdy: `stav !== "${CEKA}"`, rows: [
    { f: "datum_rozhodnuti", label: "Rozhodnuto", fv: "format", cfg: { format: CAS } }, { f: "rozhodli", label: "Rozhodnutí" },
    { f: "odeslano", label: "E-mail odeslán", fv: "format", cfg: { format: CAS } }, { f: "odeslat_na", label: "Odesláno na" },
  ] }], [{ ...akceOdeslatZnovu, type: "Action" }]));
  await view("faktura_email", "faktury", "Show", ROLE.vybor, showCfg([
    ...fakturaUdaje, { f: "rozhodli", label: "Schválili" }, { f: "datum_rozhodnuti", label: "Schváleno", fv: "format", cfg: { format: DEN } },
  ], [lbl("<p>Faktura je v příloze. Zpráva byla odeslána automaticky z klientské sekce SVJ po schválení výborem.</p>")]),
  "Tělo e-mailu se schválenou fakturou");
  const fakturyCols = [
    colF("dodavatel", "Dodavatel"), colF("cislo", "Číslo / VS"), colF("castka", "Částka", "to_locale_string", KC),
    colF("splatnost", "Splatnost", "format", { format: DEN }), colF("soubor", "PDF", "Link (new tab)"),
  ];
  await view("faktury_ke_schvaleni", "faktury", "List", ROLE.vybor, listCfg([
    colF("nahrano", "Nahráno", "format", { format: DEN }), ...fakturyCols,
    { type: "Aggregation", agg_relation: "schvaleni.faktura", agg_field: "id", stat: "Count", aggwhere: 'rozhodnuti == "Schvaluji"', header_label: "Schválení" },
    colView("faktura_detail", "Rozhodnout"),
  ], { order: "nahrano", filter: { stav: CEKA }, create: "faktura_nahrat", createLabel: "Nahrát fakturu" }), "Faktury čekající na schválení");
  await view("faktury_schvalene", "faktury", "List", ROLE.vybor, listCfg([
    colF("datum_rozhodnuti", "Schváleno", "format", { format: DEN }), ...fakturyCols, colF("rozhodli", "Schválili"),
    colF("odeslano", "E-mail odeslán", "format", { format: DEN }), colView("faktura_detail", "Detail"),
  ], { order: "datum_rozhodnuti", desc: true, filter: { stav: "Schváleno" } }), "Archiv schválených faktur");
  await view("faktury_zamitnute", "faktury", "List", ROLE.vybor, listCfg([
    colF("datum_rozhodnuti", "Zamítnuto", "format", { format: DEN }), ...fakturyCols, colF("rozhodli", "Důvod"), colView("faktura_detail", "Detail"),
  ], { order: "datum_rozhodnuti", desc: true, filter: { stav: "Zamítnuto" } }), "Zamítnuté faktury");

  // Nastavení schvalování (admin)
  await view("nastaveni_upravit", "nastaveni_portalu", "Edit", ROLE.admin, editCfg([
    { f: "email_faktury", label: "E-mail pro schválené faktury", fv: "edit" }, { f: "pocet_schvaleni", label: "Počet potřebných schválení (min. 2)", fv: "edit" },
  ], { dest: "page:nastaveni_schvalovani" }));
  await view("nastaveni_seznam", "nastaveni_portalu", "List", ROLE.vybor, listCfg([
    colF("email_faktury", "E-mail pro schválené faktury"), colF("pocet_schvaleni", "Potřebný počet schválení", "show"),
    colView("nastaveni_upravit", "Upravit", { showif: "user.role_id === 1" }),
  ], { order: "id", create: "nastaveni_upravit", createLabel: "Vyplnit nastavení" }), "Nastavení schvalování faktur");

  // ---------- Stránky ----------
  const viewEl = (v, name) => ({ type: "view", view: v, name, state: "shared", configuration: {} });
  const odkaz = (url, text, style = "btn btn-outline-primary me-2 mb-2") => ({ type: "link", url, text, link_style: style, block: false });
  const proRole = (maxRole) => Object.fromEntries(Object.values(ROLE).map((id) => [id, id <= maxRole]));
  const kontejner = (above, showForRole) => ({ type: "container", showForRole, contents: { above } });

  const stranka = (name, title, min_role, above) =>
    Page.create({ name, title, description: title, min_role, fixed_states: {}, layout: { above: [lbl(`<h2 class="mb-3">${title}</h2>`), ...above] } });
  const uvodText = (t) => lbl(`<p class="text-muted">${t}</p>`);
  await stranka("dokumenty_svj", "Dokumenty SVJ", ROLE.vlastnik, [uvodText("Neveřejné dokumenty společenství. Soubor otevřete kliknutím na jeho název."), viewEl("dokumenty_seznam", "d")]);
  await stranka("moje_jednotka", "Moje jednotka", ROLE.vlastnik, [viewEl("moje_jednotky", "j"),
    lbl("<h4 class=\"mt-4\">Kontaktní údaje v evidenci SVJ</h4>"), viewEl("muj_kontakt", "k"),
    uvodText("Nesedí údaje o jednotce nebo podílu? Napište výboru nebo správci.")]);
  await stranka("evidence_jednotek", "Evidence jednotek", ROLE.spravce, [viewEl("jednotky_seznam", "j")]);
  await stranka("evidence_vlastniku", "Evidence vlastníků", ROLE.spravce, [uvodText("Vlastníka propojíte s jeho účtem v portálu polem „Účet v portálu“. Teprve pak uvidí svou jednotku."), viewEl("vlastnici_seznam", "v")]);
  await stranka("sprava_dokumentu", "Správa dokumentů SVJ", ROLE.spravce, [uvodText("Dokumenty uvidí všichni vlastníci (ne nájemníci)."), viewEl("dokumenty_sprava", "d")]);
  await stranka("faktury", "Faktury ke schválení", ROLE.vybor, [uvodText("Fakturu schválí nejméně dva různí členové výboru. Po druhém schválení se sama přesune mezi schválené a odešle e-mailem s PDF v příloze."), viewEl("faktury_ke_schvaleni", "f")]);
  await stranka("schvalene_faktury", "Schválené faktury", ROLE.vybor, [viewEl("faktury_schvalene", "f")]);
  await stranka("zamitnute_faktury", "Zamítnuté faktury", ROLE.vybor, [viewEl("faktury_zamitnute", "f")]);
  await stranka("interni_dokumenty", "Interní dokumenty výboru", ROLE.vybor, [uvodText("Vidí je jen členové výboru."), viewEl("dokumenty_vyboru_seznam", "d")]);
  await stranka("sprava_oznameni", "Správa oznámení", ROLE.vybor, [uvodText("Oznámení vidí všichni přihlášení včetně nájemníků."), viewEl("oznameni_sprava", "o")]);
  await stranka("nastaveni_schvalovani", "Nastavení schvalování faktur", ROLE.vybor, [uvodText("Kam se posílají schválené faktury a kolik schválení je potřeba. Měnit smí jen admin."), viewEl("nastaveni_seznam", "n")]);

  await Page.create({
    name: "uvod", title: "Klientská sekce SVJ", description: "Úvod klientské sekce", min_role: ROLE.najemnik, fixed_states: {},
    layout: { above: [
      lbl("<h2>Klientská sekce SVJ</h2>"),
      kontejner([lbl("<h4 class=\"mt-3\">Rychlé odkazy</h4>"),
        { besides: [{ above: [
          odkaz("/page/dokumenty_svj", "Dokumenty SVJ"), odkaz("/page/moje_jednotka", "Moje jednotka a kontakt"),
        ] }], widths: [12] }], proRole(ROLE.vlastnik)),
      kontejner([{ besides: [{ above: [
        odkaz("/page/faktury", "Faktury ke schválení", "btn btn-primary me-2 mb-2"), odkaz("/view/faktura_nahrat", "Nahrát fakturu"),
        odkaz("/page/interni_dokumenty", "Interní dokumenty"),
      ] }], widths: [12] }], proRole(ROLE.vybor)),
      lbl("<h4 class=\"mt-4\">Oznámení</h4>"),
      viewEl("oznameni_prehled", "oznameni"),
    ] },
  });
  await Page.create({
    name: "vitejte", title: "Klientská sekce SVJ", description: "Úvod pro nepřihlášené", min_role: ROLE.public, fixed_states: {},
    layout: { above: [
      lbl("<h2>Klientská sekce SVJ</h2><p>Tato část webu je určena vlastníkům a uživatelům jednotek. Přístup vám zřídí výbor – pozvánku dostanete e-mailem.</p>"),
      odkaz("/auth/login", "Přihlásit se", "btn btn-primary"),
    ] },
  });
  await Page.create({
    name: "bez_pristupu", title: "Účet čeká na přidělení role", description: "Pro účty bez role", min_role: ROLE.user, fixed_states: {},
    layout: { above: [lbl("<h2>Účet zatím nemá přístup</h2><p>Váš účet existuje, ale výbor vám ještě nepřidělil roli (vlastník, nájemník…). Ozvěte se prosím výboru.</p>")] },
  });

  // ---------- Počáteční nastavení (spustí admin jednou po importu) ----------
  const menu = [
    { label: "Úvod", type: "Page", pagename: "uvod", min_role: ROLE.najemnik },
    { label: "Dokumenty SVJ", type: "Page", pagename: "dokumenty_svj", min_role: ROLE.vlastnik },
    { label: "Moje jednotka", type: "Page", pagename: "moje_jednotka", min_role: ROLE.vlastnik },
    { label: "Evidence", type: "Header", min_role: ROLE.spravce, subitems: [
      { label: "Jednotky", type: "Page", pagename: "evidence_jednotek", min_role: ROLE.spravce },
      { label: "Vlastníci", type: "Page", pagename: "evidence_vlastniku", min_role: ROLE.spravce },
      { label: "Správa dokumentů SVJ", type: "Page", pagename: "sprava_dokumentu", min_role: ROLE.spravce },
    ] },
    { label: "Výbor", type: "Header", min_role: ROLE.vybor, subitems: [
      { label: "Faktury ke schválení", type: "Page", pagename: "faktury", min_role: ROLE.vybor },
      { label: "Nahrát fakturu", type: "View", viewname: "faktura_nahrat", min_role: ROLE.vybor },
      { label: "Schválené faktury", type: "Page", pagename: "schvalene_faktury", min_role: ROLE.vybor },
      { label: "Zamítnuté faktury", type: "Page", pagename: "zamitnute_faktury", min_role: ROLE.vybor },
      { label: "Interní dokumenty", type: "Page", pagename: "interni_dokumenty", min_role: ROLE.vybor },
      { label: "Správa oznámení", type: "Page", pagename: "sprava_oznameni", min_role: ROLE.vybor },
      { label: "Nastavení schvalování", type: "Page", pagename: "nastaveni_schvalovani", min_role: ROLE.vybor },
    ] },
  ];
  await trig("pocatecni_nastaveni", "Never", null, `
// Spusťte jednou po importu (Nastavení → Události → Triggery → pocatecni_nastaveni → Test run).
await setConfig("menu_items", ${JSON.stringify(menu)});
await setConfig("unrolled_menu_items", ${JSON.stringify(menu)});
await setConfig("home_page_by_role", { "1": "uvod", "20": "uvod", "30": "uvod", "40": "uvod", "60": "uvod", "70": "uvod", "80": "bez_pristupu", "100": "vitejte" });
await setConfig("allow_signup", false);            // účty jen na pozvánku
await setConfig("twofa_policy_by_role", { "1": "Mandatory", "20": "Mandatory", "30": "Mandatory", "60": "Optional", "70": "Optional" });
await setConfig("default_locale", "cs");
await setConfig("site_name", "Klientská sekce SVJ");
await refreshSystemCache();
return { notify: "Hotovo: menu, domovské stránky, zákaz registrace, 2FA a čeština nastaveny." };
`, "Jednorázově nastaví menu, domovské stránky rolí, zakáže registraci, vyžádá dvoufaktorové ověřování pro admina, výbor a správce, nastaví češtinu.");

  console.log("HOTOVO");
  process.exit(0);
})().catch((e) => { console.error("CHYBA:", e); process.exit(1); });
