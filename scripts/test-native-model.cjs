const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const ts = require("../apps/mobile/node_modules/typescript");
require.extensions[".ts"] = (m, file) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const {
  initialStore,
  seedCoaches,
  seedOffers,
  slotsFor,
  remaining,
  reserve,
  openGroup,
  switchAccount,
  cancel,
  today,
  addDays,
  instant,
  changeSport,
  setDemoClock,
} = require("../apps/mobile/src/product/model.ts");
// Freeze the weekday: the fixture opens a Saturday, never a closed Sunday.
setDemoClock((Date.parse("2026-09-16T06:00:00Z") - Date.now()) / 3600000);
let count = 0;
const check = (v, label) => {
  assert.ok(v, label);
  count++;
};
const fails = (fn, re) => {
  assert.throws(fn, re);
  count++;
};
const coach = {
    id: "coach-0",
    name: "Thomas",
    email: "thomas@example.test",
    role: "coach",
  },
  client = {
    id: "alex@example.test",
    name: "Alex",
    email: "alex@example.test",
    role: "client",
  };
const offer = {
  id: "group-test",
  coach: "0",
  name: "Renforcement collectif",
  kind: "Groupe",
  duration: 60,
  price: 20,
  capacity: 3,
  active: true,
};
let store = {
  ...structuredClone(initialStore),
  account: coach,
  offers: [...seedOffers, offer],
};
const day = addDays(today(), 3),
  time = "18:00";
check(
  slotsFor(seedCoaches[0], day, store, offer).length === 0,
  "Creating a group offer must not create slots",
);
store = openGroup(store, {
  id: "class",
  offer,
  day,
  time,
  address: "Parc de Belleville",
});
check(
  slotsFor(seedCoaches[0], day, store, offer).includes(time),
  "Dated class can be booked",
);
fails(
  () =>
    openGroup(store, {
      id: "overlap",
      offer,
      day,
      time: "18:30",
      address: "Paris",
    }),
  /occupé/,
);
fails(
  () =>
    openGroup(
      { ...store, account: client },
      { id: "wrong", offer, day: addDays(day, 1), time, address: "Paris" },
    ),
  /Connectez/,
);
check(
  !slotsFor(seedCoaches[0], day, store, seedOffers[0]).includes(time),
  "Unfilled class blocks solo agenda",
);
store = switchAccount(store, client);
const draft = {
  id: "b1",
  coach: "0",
  clientId: "forged",
  clientName: "fake",
  day,
  time,
  duration: 10,
  offerId: offer.id,
  serviceName: "wrong",
  kind: "Groupe",
  format: "Parc",
  seats: 2,
  price: 1,
  goal: "Bouger",
  address: "wrong",
  status: "confirmed",
};
store = reserve(store, draft);
const b = store.bookings[0];
check(
  b.clientId === client.id &&
    b.price === 40 &&
    b.duration === 60 &&
    b.address === "Parc de Belleville",
  "Reservation uses authoritative owner, price, duration and venue",
);
check(remaining(offer, day, time, store) === 1, "Capacity reduced by seats");
check(reserve(store, draft) === store, "Retry does not duplicate booking");
store = switchAccount(store, { ...client, id: "second" });
fails(() => reserve(store, { ...draft, id: "b2" }), /places/);
store = reserve(store, { ...draft, id: "b2", seats: 1 });
check(
  !slotsFor(seedCoaches[0], day, store, offer).includes(time),
  "Full class removed from available slots",
);
fails(() => cancel(store, "b1"), /appartient/);
store = switchAccount(store, client);
store = cancel(store, "b1");
check(
  remaining(offer, day, time, store) === 2,
  "Cancellation releases exactly booked seats",
);
check(
  store.notices.some(
    (n) => n.recipient === "coach-0" && n.id === "b1:cancel:coach",
  ),
  "Coach cancellation notification",
);
store = {
  ...store,
  favorites: ["0"],
  preferences: { ...store.preferences, sport: "Running" },
};
store = switchAccount(store, coach);
check(!store.favorites.length, "Favorites are isolated by account");
store = switchAccount(store, client);
check(
  store.favorites[0] === "0" && store.preferences.sport === "Running",
  "Preferences restored on return",
);
check(
  instant("2026-07-01", "18:00") === Date.parse("2026-07-01T16:00:00Z"),
  "Paris summer offset",
);
check(
  instant("2026-12-01", "18:00") === Date.parse("2026-12-01T17:00:00Z"),
  "Paris winter offset",
);
check(
  changeSport({ ...store.preferences, goal: "Apprendre à nager" }, "Running")
    .goal !== "Apprendre à nager",
  "Objective changes with sport",
);
console.log(`PASS ${count} native domain assertions.`);
