const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  ts = require("../apps/mobile/node_modules/typescript");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const S = require("../apps/mobile/src/product/sectors.ts");
assert(S.localSectors("75011").some((s) => s.value === "Paris 11e"));
assert(
  S.localSectors("saint denis", "93").some(
    (s) => s.value === "Saint-Denis · 93",
  ),
);
assert(S.localSectors("evry").length > 0);
assert.equal(S.sectorFromAddress("Paris", "75116"), "Paris 16e");
assert.equal(S.sectorFromAddress("Versailles", "78000"), "Versailles · 78");
assert.equal(S.sectorFromAddress("Lyon", "69001"), null);
assert.equal(S.sectorFromAddress("Paris", "75011"), "Paris 11e");
for (const d of Object.keys(S.departments))
  assert(S.localSectors("", d).length > 0);
const M = require("../apps/mobile/src/product/model.ts"),
  D = require("../apps/mobile/src/product/connectedDomain.ts");
const coach = {
  id: "99999999-9999-4999-8999-999999999999",
  email: "coach@example.test",
  staff: true,
};
let store = D.register(D.emptyConnected(), coach, "Coach", "coach");
assert.throws(
  () =>
    D.applyCommand(store, coach, {
      name: "reviewDossier",
      args: [coach.id, "approved", "Test"],
    }),
  /autre membre/,
);
console.log(
  "PASS 16 sector resolution, department coverage and self-review guard checks.",
);
