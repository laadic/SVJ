// Společný zavaděč Saltcorn modelů pro vývojové skripty (build, seed, export)
const path = require("path");
const CLI = path.join(__dirname, "node_modules/@saltcorn/cli");
const r = (p) => require(require.resolve(p, { paths: [CLI] }));
const { init_some_tenants } = require(path.join(CLI, "src/common"));
module.exports = {
  r,
  init: async () => { await init_some_tenants(); },
  Table: r("@saltcorn/data/models/table"),
  Field: r("@saltcorn/data/models/field"),
  View: r("@saltcorn/data/models/view"),
  Page: r("@saltcorn/data/models/page"),
  Trigger: r("@saltcorn/data/models/trigger"),
  Role: r("@saltcorn/data/models/role"),
  User: r("@saltcorn/data/models/user"),
  TableConstraint: r("@saltcorn/data/models/table_constraints"),
  db: r("@saltcorn/data/db"),
  getState: () => r("@saltcorn/data/db/state").getState(),
};
