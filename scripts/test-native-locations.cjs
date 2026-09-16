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
  L = require("../apps/mobile/src/product/locations.ts");
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
    M.initialStore,
    "thomas@example.test",
    "Thomas",
    "coach",
    false,
  ),
  c = M.allCoaches(s)[0];
ok(
  Object.keys(M.coachLocations(s, c)).join() === c.formats.join(),
  "Legacy places migrate without changing IDs",
);
ok(
  L.suggestedPlaces("Musculation").includes("Salle de musculation"),
  "Relevant gym suggestion",
);
ok(
  L.suggestedPlaces("Running").includes("Piste d’athlétisme"),
  "Relevant track suggestion",
);
const locations = {
  "place:a": {
    type: "Salle de musculation",
    name: "Salle République",
    address: "10 avenue de la République, Paris",
    instructions: "Abonnement nécessaire.",
  },
  "place:b": {
    type: "Salle de musculation",
    name: "Salle Bastille",
    address: "12 rue de la Roquette, Paris",
    instructions: "Retrouvez-moi à l’accueil.",
  },
  Domicile: {
    type: "Domicile",
    name: "Chez vous",
    address: "",
    sector: "Paris 11e",
    radius: 8,
    travelFee: 7,
    instructions: "Prévoir deux mètres libres.",
  },
  Visio: {
    type: "Visio",
    name: "Coaching en visio",
    address: "",
    instructions: "Prévoir un tapis.",
  },
};
L.validateLocations(locations);
count++;
fail(
  () =>
    L.validateLocations({
      ...locations,
      "place:a": { ...locations["place:a"], address: "" },
    }),
  /adresse/,
);
fail(
  () =>
    L.validateLocations({
      ...locations,
      Domicile: { ...locations.Domicile, sector: "" },
    }),
  /secteur/,
);
fail(
  () =>
    L.validateLocations({
      ...locations,
      Domicile: { ...locations.Domicile, radius: NaN },
    }),
  /rayon/,
);
s = W.saveSettings(s, "0", {
  ...M.configFor(s, "0"),
  locations,
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [["09:00", "21:00"]]),
});
s = { ...s, coachOverrides: { 0: { formats: Object.keys(locations) } } };
c = M.allCoaches(s)[0];
let offer = { ...s.offers[0], formats: ["place:b", "Domicile"] };
s = W.saveOffer(s, offer);
ok(
  M.offerAddress(s, c, "place:b") === locations["place:b"].address,
  "Each gym has its own address",
);
ok(
  M.locationLabel(s, c, "place:a") === "Salle République",
  "Stable IDs show human names",
);
ok(
  M.matchesLocation(s, c, offer, "Salle de musculation"),
  "Discovery matches category across named places",
);
ok(!M.matchesLocation(s, c, offer, "Piscine"), "Other category excluded");
ok(M.locationsReady(s, c), "Only configured places needed for publication");
const b = {
  id: "loc-booking",
  coach: "0",
  clientId: "alex@example.test",
  clientName: "Alex",
  day: "2026-09-18",
  time: "09:00",
  duration: 60,
  offerId: offer.id,
  serviceName: offer.name,
  kind: "Individuel",
  format: "place:b",
  seats: 1,
  price: offer.price,
  goal: "",
  address: "incorrect",
  status: "confirmed",
};
s = W.loginDemo(s, "alex@example.test", "Alex", "client", false);
s = M.reserve(s, b);
let booked = s.bookings.find((x) => x.id === b.id);
ok(
  booked.address === locations["place:b"].address,
  "Reservation uses authoritative selected venue",
);
ok(
  booked.locationName === "Salle Bastille" &&
    booked.locationInstructions.includes("accueil"),
  "Reservation snapshots name and access",
);
fail(
  () => M.reserve(s, { ...b, id: "wrong", time: "11:00", format: "place:a" }),
  /lieu/,
);
ok(
  M.quotePrice(s, { ...b, format: "Domicile" }, offer) === offer.price + 7,
  "Home surcharge included",
);
s = W.loginDemo(s, "thomas@example.test", "Thomas", "coach", false);
s = W.saveSettings(s, "0", {
  ...M.configFor(s, "0"),
  locations: {
    ...locations,
    "place:b": { ...locations["place:b"], address: "Nouvelle adresse" },
  },
});
ok(
  s.bookings.find((x) => x.id === b.id).address ===
    locations["place:b"].address,
  "Later venue edits preserve existing bookings",
);
const homeCoach = { ...c, formats: ["Domicile"] };
ok(
  M.locationsReady(s, homeCoach),
  "Home-only coach needs service sector, not public private address",
);
console.log(`PASS ${count} location domain checks.`);
