// Run from any directory: node apps/mobile/src/product/web-agenda/agendaView.test.cjs
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const { initialStore, configFor } = require("../model.ts");
const { agendaDay, weekStart } = require("./agendaView.ts");
const day = "2026-09-22";
const store = structuredClone(initialStore);
const offer = {
  id: "desktop-group",
  coach: "0",
  name: "Mobilité",
  kind: "Groupe",
  duration: 47,
  capacity: 6,
  active: true,
  price: 20,
};
store.groups = [
  { id: "desktop-course", offer, day, time: "10:13", address: "Studio" },
];
const booking = {
  id: "desktop-booking",
  coach: "0",
  day,
  time: "14:07",
  duration: 43,
  clientId: "test-client",
  clientName: "Alex",
  serviceName: "Séance",
  kind: "Individuel",
  offerId: "private",
  format: "Studio",
  address: "Studio",
  seats: 1,
  price: 30,
  goal: "",
  status: "confirmed",
};
store.bookings = [
  booking,
  {
    ...booking,
    id: "group-booking",
    offerId: offer.id,
    time: "10:13",
    kind: "Groupe",
    seats: 2,
  },
  { ...booking, id: "completed", time: "08:11", status: "completed" },
  { ...booking, id: "cancelled", status: "cancelled" },
  { ...booking, id: "other-coach", coach: "1" },
];
store.settings = {
  0: {
    ...configFor(store, "0"),
    exceptions: { [day]: [["07:13", "19:47"]] },
    blocks: [],
  },
};
store.externalSessions = [
  { ...booking, id: "direct", name: "Sam", time: "16:23" },
];
store.calendarBusy = { 0: [{ day, time: "12:04", duration: 29 }] };
store.closed = [`0|${day}|18:17`];
const before = JSON.stringify(store);
const view = agendaDay(store, "0", day);
assert.equal(
  view.appointments,
  4,
  "A group is one appointment, not one per participant",
);
assert.equal(
  view.items.find((item) => item.kind === "group").detail,
  "2 / 6 places",
);
assert.ok(
  !view.items.some((item) =>
    ["cancelled", "other-coach", "group-booking"].includes(item.id),
  ),
);
assert.equal(
  view.items.find((item) => item.id === "completed").completed,
  true,
);
assert.deepEqual(
  view.ranges,
  [["07:13", "19:47"]],
  "Coach's precise interval is preserved",
);
assert.equal(view.exception, true);
assert.deepEqual(
  view.items.map((item) => item.time),
  ["08:11", "10:13", "12:04", "14:07", "16:23", "18:17"],
);
assert.equal(
  view.items.find((item) => item.kind === "closed").duration,
  0,
  "A legacy closed departure has no invented duration",
);
assert.equal(JSON.stringify(store), before, "Presentation never changes Store");
store.settings["0"].exceptions[day] = [];
assert.equal(
  agendaDay(store, "0", day).appointments,
  4,
  "Closing a date never hides existing appointments",
);
assert.deepEqual(agendaDay(store, "0", day).ranges, []);
assert.equal(
  weekStart("2027-01-03"),
  "2026-12-28",
  "Sunday and year boundaries use Monday weeks",
);
assert.equal(
  weekStart("2026-10-25"),
  "2026-10-19",
  "DST transition retains calendar dates",
);
console.log("Desktop agenda: 13 presentation checks passed.");
