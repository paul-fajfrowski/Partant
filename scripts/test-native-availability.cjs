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
  W = require("../apps/mobile/src/product/workflows.ts");
let count = 0;
const ok = (v, msg) => {
    assert.ok(v, msg);
    count++;
  },
  fail = (f, re) => {
    assert.throws(f, re);
    count++;
  };
M.setDemoClock((Date.parse("2026-09-16T06:00:00Z") - Date.now()) / 3600000);
let s = W.loginDemo(
  structuredClone(M.initialStore),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
const long = s.offers.find((o) => o.id === "0:solo");
const short = {
  ...long,
  id: "short",
  name: "Renforcement express",
  price: 30,
  duration: 30,
};
s = W.saveOffer(s, short);
const group = {
  ...long,
  id: "group",
  name: "Pilates collectif",
  kind: "Groupe",
  capacity: 6,
  price: 18,
};
s = W.saveOffer(s, group);
let cfg = {
  ...M.configFor(s, "0"),
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [
    ["09:00", "12:00", [long.id]],
    ["14:00", "17:00", [short.id]],
    ["18:00", "19:00", [group.id]],
    ["20:00", "21:00", null],
  ]),
};
s = W.saveSettings(s, "0", cfg);
ok(M.configFor(s, "0").week[0].length === 4, "Four distinct ranges are saved");
const day = "2026-09-18",
  c = M.seedCoaches[0];
ok(
  M.slotsFor(c, day, s, long).includes("09:00") &&
    M.slotsFor(c, day, s, long).includes("11:00"),
  "One morning range supports multiple hour sessions",
);
ok(
  !M.slotsFor(c, day, s, long).includes("11:30"),
  "Full duration must fit before range ends",
);
ok(
  !M.slotsFor(c, day, s, long).includes("14:00"),
  "Long offer excluded from short-only afternoon",
);
ok(
  M.slotsFor(c, day, s, short).includes("16:30"),
  "Short duration fits final half-hour",
);
ok(
  !M.slotsFor(c, day, s, short).includes("09:00"),
  "Short offer excluded from long-only morning",
);
ok(
  M.slotsFor(c, day, s, long).includes("20:00") &&
    M.slotsFor(c, day, s, short).includes("20:30"),
  "All-offer range honors each duration",
);
ok(
  M.slotsFor(c, day, s, group).length === 0,
  "Group availability requires a dated class",
);
fail(
  () =>
    M.openGroup(s, {
      id: "wrong",
      offer: group,
      day,
      time: "14:00",
      address: "Parc",
    }),
  /horaires/,
);
s = M.openGroup(s, {
  id: "right",
  offer: group,
  day,
  time: "18:00",
  address: "Parc",
});
ok(
  M.slotsFor(c, day, s, group).includes("18:00"),
  "Dated group opens in its authorised range",
);
const ex = { ...cfg, exceptions: { [day]: [["10:00", "12:00", [short.id]]] } };
let exception = W.saveSettings(s, "0", ex);
ok(
  M.slotsFor(c, day, exception, long).length === 0,
  "Exception overrides weekly offer assignments",
);
ok(
  M.slotsFor(c, day, exception, short).includes("11:30"),
  "Exception uses assigned offer duration",
);
fail(
  () =>
    W.saveSettings(s, "0", {
      ...cfg,
      week: Array.from({ length: 7 }, () => [["09:00", "12:00", []]]),
    }),
  /Choisissez/,
);
fail(
  () =>
    W.saveSettings(s, "0", {
      ...cfg,
      week: Array.from({ length: 7 }, () => [["09:00", "12:00", ["1:solo"]]]),
    }),
  /appartient/,
);
fail(
  () =>
    M.validateIntervals([
      ["09:00", "12:00", [short.id]],
      ["11:00", "13:00", [long.id]],
    ]),
  /chevaucher/,
);
const legacy = {
  ...cfg,
  week: Array.from({ length: 7 }, () => [["09:00", "12:00"]]),
};
ok(
  M.generatedTimes(legacy, day, 60, long.id).includes("10:00") &&
    M.generatedTimes(legacy, day, 30, short.id).includes("11:30"),
  "Legacy ranges keep all offers",
);
ok(
  M.generatedTimes(JSON.parse(JSON.stringify(cfg)), day, 30, short.id).includes(
    "20:30",
  ),
  "Assignments survive JSON persistence including null",
);
const extra = { ...short, id: "extra" };
let added = W.saveOffer(s, extra);
ok(
  M.slotsFor(c, day, added, extra).includes("20:00") &&
    !M.slotsFor(c, day, added, extra).includes("14:00"),
  "New offers join all-offer ranges only",
);
const alex = W.identities(s).find((a) => a.name === "Alex");
s = M.switchAccount(s, alex);
const draft = {
  id: "short-booking",
  coach: "0",
  clientId: alex.id,
  clientName: "Alex",
  day,
  time: "14:00",
  duration: 60,
  offerId: short.id,
  serviceName: short.name,
  kind: "Individuel",
  format: "Parc",
  seats: 1,
  price: 999,
  goal: "Bouger",
  address: "Parc",
  status: "confirmed",
};
s = M.reserve(s, draft);
ok(
  s.bookings[0].price === 30 && s.bookings[0].duration === 30,
  "Booking uses offer duration and price, not draft values",
);
fail(
  () => M.reserve(s, { ...draft, id: "forbidden", offerId: long.id }),
  /disponible/,
);
// Three successive bookings in one range; arbitrary range counts do not limit clients.
let morning = M.switchAccount(added, alex);
for (const [i, time] of ["09:00", "10:00", "11:00"].entries())
  morning = M.reserve(morning, {
    ...draft,
    id: "morning" + i,
    offerId: long.id,
    time,
    price: long.price,
    duration: 60,
  });
ok(
  morning.bookings.length === 3,
  "Three clients/sessions fit one 3-hour range",
);
let shared = M.switchAccount(added, alex);
shared = M.reserve(shared, { ...draft, id: "shared", time: "20:00" });
ok(
  !M.slotsFor(c, day, shared, long).includes("20:00"),
  "Reservation blocks competing offer on same coach",
);
ok(
  M.slotsFor(c, day, shared, short).includes("20:30"),
  "Next non-overlapping short session remains available",
);
let coachAgain = M.switchAccount(
  s,
  W.identities(s).find((a) => a.id === "coach-0"),
);
coachAgain = W.saveSettings(coachAgain, "0", {
  ...cfg,
  week: Array.from({ length: 7 }, () => []),
});
ok(
  coachAgain.bookings[0].status === "confirmed" &&
    coachAgain.bookings[0].price === 30,
  "Schedule edits preserve confirmed snapshots",
);
let six = M.switchAccount(added, alex);
for (const [i, time] of [
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
].entries())
  six = M.reserve(six, { ...draft, id: "six" + i, time });
ok(six.bookings.length === 6, "More than three appointments in a single range");
ok(
  M.generatedTimes(
    {
      ...cfg,
      week: Array.from({ length: 7 }, () => [
        ["14:00", "15:00"],
        ["09:00", "10:00"],
      ]),
    },
    day,
    60,
    long.id,
  ).join(",") === "09:00,14:00",
  "User-entered ranges display slots chronologically",
);
const controlled = {
  ...cfg,
  buffer: 15,
  departureStep: null,
  week: Array.from({ length: 7 }, () => [["09:10", "13:10", [long.id]]]),
};
ok(
  M.generatedTimes(controlled, day, 60, long.id).join(",") ===
    "09:10,10:25,11:40",
  "Coach start time and pause determine departures",
);
ok(
  M.generatedTimes({ ...controlled, departureStep: 20 }, day, 60, long.id)
    .slice(0, 3)
    .join(",") === "09:10,09:30,09:50",
  "Coach can choose departure spacing without snapping to a grid",
);
ok(
  M.generatedTimes({ ...controlled, departureStep: 0 }, day, 60, long.id)
    .length === 0,
  "Invalid stored cadence cannot freeze generation",
);
ok(
  M.generatedTimes(
    { ...controlled, week: Array.from({ length: 7 }, () => [["", ""]]) },
    day,
    60,
    long.id,
  ).length === 0,
  "Blank hours do not create bookable times",
);
let timingOwner = M.switchAccount(
  added,
  W.identities(added).find((a) => a.id === "coach-0"),
);
fail(
  () => W.saveSettings(timingOwner, "0", { ...controlled, departureStep: 0 }),
  /délais/,
);
fail(
  () => W.saveSettings(timingOwner, "0", { ...controlled, departureStep: NaN }),
  /délais/,
);
fail(
  () => W.saveSettings(timingOwner, "0", { ...controlled, buffer: NaN }),
  /délais/,
);
let timingSaved = W.saveSettings(timingOwner, "0", controlled);
timingSaved = M.switchAccount(timingSaved, alex);
timingSaved = M.reserve(timingSaved, {
  ...draft,
  id: "timing",
  offerId: long.id,
  time: "09:10",
});
ok(
  !M.slotsFor(c, day, timingSaved, long).includes("09:10") &&
    M.slotsFor(c, day, timingSaved, long).includes("10:25"),
  "Availability keeps exact starts after a booking and respects the pause",
);
const newcomer = W.loginDemo(
    M.initialStore,
    "independent@example.test",
    "Coach autonome",
    "coach",
    true,
  ),
  nc = M.configFor(newcomer, newcomer.account.coachId);
ok(
  nc.week.every((r) => r.length === 0) && nc.weeklyConfigured,
  "New coaches choose their hours before any availability exists",
);
M.setDemoClock(0);
console.log(`PASS ${count} offer-specific availability assertions.`);
