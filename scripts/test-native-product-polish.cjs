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
  W = require("../apps/mobile/src/product/workflows.ts"),
  A = require("../apps/mobile/src/product/agendaTools.ts");
let n = 0;
const ok = (v, msg) => {
    assert.ok(v, msg);
    n++;
  },
  fail = (fn, re) => {
    assert.throws(fn, re);
    n++;
  };
M.setDemoClock((Date.parse("2026-09-16T06:00:00Z") - Date.now()) / 3600000);
let s = W.loginDemo(
  structuredClone(M.initialStore),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
let cfg = {
  ...M.configFor(s, "0"),
  weeklyConfigured: true,
  buffer: 15,
  horizon: 90,
  week: Array.from({ length: 7 }, () => [["09:10", "22:00", null]]),
};
s = W.saveSettings(s, "0", cfg);
const c = M.allCoaches(s)[0],
  solo = s.offers.find((o) => o.id === "0:solo");
let copied = A.copyDay(
  [[["09:10", "12:00", ["0:solo"]]], [], [], [], [], [], []],
  0,
  [1, 3],
);
ok(
  copied[1][0][0] === "09:10" && copied[3][0][2][0] === "0:solo",
  "Copy preserves coach exact time and offer assignment",
);
copied[1][0][2].push("other");
ok(copied[0][0][2].length === 1, "Copies are independent");
fail(() => A.copyDay(cfg.week, 0, []), /Choisissez/);
const restricted = { ...solo, formats: ["Parc"] };
s = W.saveOffer(s, restricted);
ok(
  M.offerFormats(c, restricted).join() === "Parc",
  "Explicit offer location restrictions",
);
fail(() => W.saveOffer(s, { ...solo, formats: [] }), /lieu/);
fail(() => W.saveOffer(s, { ...solo, formats: ["Mars"] }), /lieu/);
const ext = {
  name: "Camille",
  offerId: solo.id,
  day: "2026-09-18",
  time: "09:10",
  format: "Parc",
  address: c.address,
};
s = A.addExternalSession(s, ext);
const extId = s.externalSessions[0].id;
ok(
  !M.slotsFor(c, ext.day, s, solo).includes("09:10"),
  "Direct booking blocks public availability",
);
ok(
  M.slotsFor(c, ext.day, s, solo).includes("10:25"),
  "Availability resumes after configured pause",
);
ok(
  s.bookings.length === 0 && !s.refunds?.length,
  "Direct booking creates no payment or marketplace booking",
);
fail(() => A.addExternalSession(s, { ...ext, time: "10:10" }), /occupé/);
fail(() => A.addExternalSession(s, { ...ext, time: "25:10" }), /HH:mm/);
fail(() => A.addExternalSession(s, { ...ext, format: "Visio" }), /lieu/);
ok(
  A.availabilityReasons(s, c, solo, ext.day, ext.time).some((x) =>
    x.includes("hors Partant"),
  ),
  "Diagnostic explains direct appointment conflict",
);
ok(
  A.availabilityReasons(s, c, solo, ext.day, "10:25").length === 0,
  "Diagnostic detects open hour",
);
s = A.cancelExternalSession(s, extId);
ok(
  M.slotsFor(c, ext.day, s, solo).includes("09:10"),
  "Cancellation releases slot",
);
const client = W.loginDemo(s, "alex@example.test", "Alex", "client", false);
fail(() => A.addExternalSession(client, ext), /Choisissez/);
fail(() => A.cancelExternalSession(client, extId), /inaccessible/);
const draft = {
  id: "restricted",
  coach: "0",
  clientId: "alex@example.test",
  clientName: "Alex",
  day: ext.day,
  time: ext.time,
  duration: 60,
  offerId: solo.id,
  serviceName: solo.name,
  kind: "Individuel",
  format: "Visio",
  seats: 1,
  price: 50,
  goal: "",
  address: "visio",
  status: "confirmed",
};
fail(() => M.reserve(client, draft), /lieu/);
ok(
  M.reserve(client, { ...draft, format: "Parc", address: c.address }).bookings
    .length === 1,
  "Allowed location can be booked",
);
const group = {
  ...solo,
  id: "group-polish",
  name: "Running ensemble",
  kind: "Groupe",
  capacity: 6,
  price: 18,
  formats: ["Parc"],
};
s = W.saveOffer(s, group);
s = M.openGroup(s, {
  id: "original",
  offer: group,
  day: "2026-09-19",
  time: "18:10",
  address: c.address,
  format: "Parc",
});
const g = s.groups[0];
let repeated = A.repeatGroup(s, g, ["2026-09-26", "2026-10-03"], "18:10");
ok(repeated.groups.length === 3, "Several dates created");
ok(
  repeated.groups.every(
    (g) =>
      g.time === "18:10" && g.offer.capacity === 6 && g.address === c.address,
  ),
  "Series keeps chosen time capacity and location",
);
fail(
  () => A.repeatGroup(s, g, ["2026-09-26", "2026-09-19"], "18:10"),
  /Aucune date ajoutée/,
);
ok(
  s.groups.length === 1,
  "Atomic duplicate rejects entire series with conflict",
);
fail(
  () => A.repeatGroup(s, g, ["2026-09-26", "2026-09-26"], "18:10"),
  /distinctes/,
);
fail(() => A.repeatGroup(s, g, ["2026-09-26"], "08:00"), /horaires/);
fail(
  () => A.addExternalSession(s, { ...ext, day: g.day, time: g.time }),
  /occupé/,
);
const nextOffer = { ...group, price: 22, capacity: 8 };
s = W.saveOffer(s, nextOffer);
repeated = A.repeatGroup(s, g, ["2026-09-26"], "18:10");
ok(
  repeated.groups[0].offer.price === 18 &&
    repeated.groups[1].offer.price === 22,
  "Original snapshot preserved; new group gets current price",
);
let customer = W.loginDemo(s, "alex@example.test", "Alex", "client", false);
customer = M.reserve(customer, {
  ...draft,
  id: "gp",
  kind: "Groupe",
  offerId: group.id,
  day: g.day,
  time: g.time,
  seats: 3,
  format: "Parc",
  participantNames: ["Alex", "Jules", "Lina"],
});
ok(
  M.remaining(group, g.day, g.time, customer) === 3,
  "Group capacity decreases by number of participants",
);
customer = W.partialCancel(customer, "gp", 2);
ok(
  customer.bookings[0].participantNames.join() === "Alex,Jules",
  "Partial cancellation preserves names for retained seats",
);
ok(
  M.remaining(group, g.day, g.time, customer) === 4,
  "Partial cancellation releases seats",
);
customer = W.cancelSession(customer, "gp", "Empêchement");
ok(
  M.remaining(group, g.day, g.time, customer) === 6,
  "Full cancellation releases remaining seats",
);
ok(
  A.setupSteps(s, "0").length === 6 &&
    A.setupSteps(s, "0").every((x) => typeof x.done === "boolean"),
  "Progress based on actual configuration",
);
console.log(`PASS ${n} product-polish domain checks.`);
