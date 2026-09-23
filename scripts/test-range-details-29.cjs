const fs = require("node:fs"),
  assert = require("node:assert/strict");
const ts = require("../apps/mobile/node_modules/typescript");
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
  {
    availabilityRangeView: view,
  } = require("../apps/mobile/src/product/rangeDetailsModel.ts");
let n = 0;
const ok = (v, m) => {
  assert.ok(v, m);
  n++;
};
const s = M.newPreviewStore(),
  day = M.addDays(M.today(), 1);
s.bookings = [];
s.groups = [];
s.externalSessions = [];
s.closed = [];
s.busyTimes = [];
s.calendarBusy = {};
s.calendarStatus = {};
s.coachOverrides = { 0: { formats: ["Studio", "Domicile"] } };
const a = {
  id: "range-a",
  coach: "0",
  name: "Renforcement",
  kind: "Individuel",
  duration: 30,
  price: 55,
  active: true,
  capacity: 1,
  formats: ["Studio", "Domicile"],
};
const b = {
  ...a,
  id: "range-b",
  name: "Mobilité collective",
  kind: "Groupe",
  price: 18,
  capacity: 6,
};
const c = { ...a, id: "range-c", name: "Offre en pause", active: false };
s.offers = [a, b, c, { ...a, id: "other", coach: "1" }];
const range = ["12:07", "13:07", [a.id, b.id, c.id], ["Studio"]];
s.settings = {
  0: {
    ...M.configFor(s, "0"),
    published: true,
    weeklyConfigured: true,
    notice: 0,
    horizon: 60,
    blocks: [],
    week: Array.from({ length: 7 }, () => [range]),
    exceptions: {},
    locations: {
      Studio: {
        type: "Salle de musculation",
        name: "Salle Test",
        address: "Paris 11e",
        instructions: "",
      },
      Domicile: {
        type: "Domicile",
        name: "Chez le client",
        address: "",
        instructions: "",
        sector: "Paris",
        radius: 5,
        travelFee: 10,
      },
    },
  },
};
const selection = { coach: "0", day, range };
let v = view(s, selection);
ok(v.offers.length === 3, "Only configured offers of this coach are shown");
ok(
  v.offers[0].offer.price === 55 && v.offers[0].offer.duration === 30,
  "Actual offer price/duration preserved",
);
ok(
  v.offers[0].locations.length === 1 &&
    v.offers[0].locations[0].name === "Salle Test",
  "Range venue restrictions respected",
);
assert.deepEqual(v.offers[0].departures, ["12:07", "12:37"]);
n++;
ok(
  v.offers[1].status.includes("Cours à planifier"),
  "A group range is not a scheduled class",
);
ok(
  v.offers[2].status === "Offre désactivée" && !v.offers[2].departures.length,
  "Paused offer remains inspectable, never bookable",
);
s.bookings = [
  {
    id: "booked",
    coach: "0",
    day,
    time: "12:07",
    duration: 30,
    status: "confirmed",
    kind: "Individuel",
    offerId: a.id,
    seats: 1,
  },
];
v = view(s, selection);
assert.deepEqual(v.offers[0].departures, ["12:37"]);
n++;
s.settings["0"].published = false;
v = view(s, selection);
ok(
  v.offers[0].status === "Profil non publié" && !v.offers[0].departures.length,
  "Configured does not mean published",
);
s.settings["0"].published = true;
s.settings["0"].dossier = { ...s.settings["0"].dossier, status: "draft" };
v = view(s, selection);
ok(
  v.offers[0].status.includes("non autorisée"),
  "Unverified practice is distinguished from an empty agenda",
);
s.settings["0"].dossier.status = "approved";
s.groups = [
  {
    id: "group",
    offer: b,
    day,
    time: "12:37",
    format: "Studio",
    address: "Salle Test",
  },
];
v = view(s, selection);
ok(
  v.offers[1].groups[0].id === "group",
  "Scheduled group remains visible before any registration",
);
s.settings["0"].exceptions[day] = [["15:13", "16:13", [a.id], ["Domicile"]]];
ok(view(s, selection) === null, "Stale range cannot show an obsolete card");
v = view(s, { ...selection, range: s.settings["0"].exceptions[day][0] });
ok(
  v.specificDate &&
    v.offers.length === 1 &&
    v.offers[0].locations[0].travelFee === 10,
  "Date exception and home travel fee preserved",
);
console.log(`PASS ${n} availability range projection checks.`);
