// Presentation rules: deterministic Paris dates, no remote calls.
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
const M = require("../apps/mobile/src/product/model.ts"),
  E = require("../apps/mobile/src/product/experience.ts");
let checks = 0;
const ok = (v, label) => {
  assert.ok(v, label);
  checks++;
};
for (const day of ["2026-10-02", "2026-10-25", "2027-03-28"]) {
  const b = { day, time: "19:00", cancelHours: 24 },
    limit = M.instant(day, b.time) - 86400000;
  ok(
    E.cancellationSummary(b, limit - 1).startsWith(
      "Annulation gratuite jusqu’au",
    ),
    "Before deadline",
  );
  ok(
    E.cancellationSummary(b, limit).startsWith("Annulation gratuite jusqu’au"),
    "Deadline inclusive, like cancellation domain",
  );
  ok(
    E.cancellationSummary(b, limit + 1).includes("séance reste due"),
    "After deadline",
  );
}
ok(
  E.cancellationSummary(
    { day: "2026-10-02", time: "19:00", cancelHours: 48 },
    M.instant("2026-09-29", "10:00"),
  ).includes("30 septembre"),
  "Booking snapshot (48 h)",
);
ok(
  E.cancellationSummary({ day: "", time: "", cancelHours: 24 }).startsWith(
    "Choisissez",
  ),
  "No fabricated date",
);
const offer = M.newPreviewStore().offers.find((o) => o.kind === "Individuel");
ok(Object.keys(E.offerErrors(offer)).length === 0, "Valid offer");
for (const [key, value] of [
  ["name", " "],
  ["duration", 14],
  ["duration", 240.5],
  ["price", NaN],
  ["price", -1],
  ["capacity", 0],
])
  ok(!!E.offerErrors({ ...offer, [key]: value })[key], `Invalid ${key}`);
ok(
  !!E.offerErrors({ ...offer, kind: "Groupe", capacity: 1 }).capacity,
  "Group minimum",
);
ok(
  Object.keys(
    E.offerErrors({ ...offer, duration: 240, price: 0, capacity: 20 }),
  ).length === 0,
  "Allowed boundary values",
);
console.log(`PASS ${checks} presentation-policy and field-validation checks.`);
