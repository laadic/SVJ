// Export klientské sekce jako Saltcorn pack (JSON) – stejný formát jako Nastavení → Moduly → Vytvořit pack
const sc = require("./sc");
const fs = require("fs");
const pack = sc.r("@saltcorn/admin-models/models/pack");
const out = process.argv[2] || require("path").join(__dirname, "../svj-klientska-sekce.json");
(async () => {
  await sc.init();
  const { Table, View, Page, Trigger, Role } = sc;
  const tabulky = ["oznameni", "dokumenty", "dokumenty_vyboru", "jednotky", "vlastnici", "vlastnictvi", "faktury", "schvaleni", "nastaveni_portalu"];
  const p = { tables: [], views: [], plugins: [], pages: [], page_groups: [], roles: [], library: [], triggers: [], tags: [], models: [], model_instances: [], event_logs: [] };
  for (const t of tabulky) p.tables.push(await pack.table_pack(t));
  // z tabulky uživatelů jen vlastní pole "jmeno" (vestavěná pole se nemění)
  const users = await pack.table_pack("users");
  p.tables.push({ name: "users", fields: users.fields.filter((f) => f.name === "jmeno"), triggers: [], constraints: [] });
  for (const r of ["vybor", "spravce", "vlastnik", "najemnik"]) p.roles.push(await pack.role_pack(r));
  for (const v of await View.find({}, { orderBy: "id" })) p.views.push(await pack.view_pack(v.name));
  for (const pg of await Page.find({}, { orderBy: "id" })) p.pages.push(await pack.page_pack(pg.name));
  for (const tr of await Trigger.find({}, { orderBy: "id" })) p.triggers.push(await pack.trigger_pack(tr.name));
  fs.writeFileSync(out, JSON.stringify(p, null, 2));
  console.log(`PACK: ${p.tables.length} tabulek, ${p.views.length} pohledů, ${p.pages.length} stránek, ${p.triggers.length} triggerů, ${p.roles.length} role → ${out}`);
  process.exit(0);
})().catch((e) => { console.error("CHYBA:", e); process.exit(1); });
