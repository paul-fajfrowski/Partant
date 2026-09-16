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
  D = require("../apps/mobile/src/product/connectedDomain.ts"),
  C = require("../apps/mobile/src/product/commands.ts"),
  A = require("../apps/mobile/src/product/agendaTools.ts");
M.setDemoClock((Date.parse("2026-09-16T06:00:00Z") - Date.now()) / 3600000);
let count = 0;
const ok = (v, msg) => {
    assert.ok(v, msg);
    count++;
  },
  fail = (fn, re) => {
    assert.throws(fn, re);
    count++;
  };
const coach = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "coach@example.test",
  },
  alice = {
    id: "22222222-2222-4222-8222-222222222222",
    email: "alice@example.test",
  },
  bob = {
    id: "33333333-3333-4333-8333-333333333333",
    email: "bob@example.test",
  },
  team = {
    id: "44444444-4444-4444-8444-444444444444",
    email: "team@example.test",
    staff: true,
  };
let s = D.emptyConnected();
for (const [actor, role] of [
  [coach, "coach"],
  [alice, "client"],
  [bob, "client"],
  [team, "client"],
])
  s = D.register(s, actor, role, role);
const command = (actor, name, ...args) =>
  (s = D.applyCommand(s, actor, { name, args }));
ok(M.allCoaches(s).length === 1, "No fictional coaches in connected state");
ok(
  M.configFor(s, coach.id).week.every((x) => !x.length),
  "Coach starts closed",
);
fail(
  () => command(alice, "saveCoach", coach.id, { name: "hack" }),
  /inaccessible/,
);
command(coach, "saveCoach", coach.id, {
  name: "Coach Test",
  bio: "Accompagnement personnalisé",
  cert: "BPJEPS test",
  sport: "Musculation",
  tags: ["Running"],
  years: 5,
  area: "Paris 11e",
});
const locations = {
  gym: {
    type: "Salle de musculation",
    name: "Salle A",
    address: "10 rue de Paris, Paris",
    instructions: "Accueil",
  },
  track: {
    type: "Piste d’athlétisme",
    name: "Piste B",
    address: "20 avenue de Paris, Paris",
    instructions: "Entrée nord",
  },
};
let cfg = {
  ...M.configFor(s, coach.id),
  locations,
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [
    ["09:10", "12:10", null, ["gym"]],
    ["17:15", "21:15", null, ["track"]],
  ]),
  payoutReady: true,
  dossier: {
    ...M.configFor(s, coach.id).dossier,
    status: "pending",
    documents: ["id", "diploma", "card", "insurance"],
    expires: "2027-09-16",
  },
};
command(coach, "saveSettings", coach.id, cfg);
ok(M.allCoaches(s)[0].formats.includes("gym"), "Venue index derived on server");
const solo = {
    id: "solo",
    coach: coach.id,
    name: "Renforcement",
    kind: "Individuel",
    duration: 60,
    price: 50,
    capacity: 1,
    active: true,
    formats: ["gym", "track"],
  },
  group = {
    ...solo,
    id: "group",
    name: "Petit groupe",
    kind: "Groupe",
    capacity: 3,
    price: 20,
  };
command(coach, "saveOffer", solo);
command(coach, "saveOffer", group);
fail(
  () =>
    command(coach, "saveSettings", coach.id, {
      ...M.configFor(s, coach.id),
      dossier: { ...cfg.dossier, status: "approved" },
    }),
  /équipe/,
);
fail(
  () => command(coach, "reviewDossier", coach.id, "approved", "ok"),
  /équipe/,
);
command(team, "reviewDossier", coach.id, "approved", "Dossier de test revu.");
command(coach, "publish", coach.id);
let pub = D.project(s),
  c = M.allCoaches(pub)[0];
ok(c.id === coach.id, "Published discovery");
ok(!pub.settings[coach.id].dossier.documents.length, "Documents stay private");
ok(!pub.identities.length, "No public accounts");
ok(
  M.formatsAt(s, c, solo, "2026-09-18", "09:10").join() === "gym",
  "Morning gym only",
);
ok(
  M.formatsAt(s, c, solo, "2026-09-18", "17:15").join() === "track",
  "Evening track only",
);
ok(
  A.copyDay(cfg.week, 0, [1])[1][0][3].join() === "gym",
  "Day duplication preserves venues",
);
const draft = {
  id: "booking1",
  coach: coach.id,
  offerId: "solo",
  day: "2026-09-18",
  time: "09:10",
  format: "gym",
  seats: 1,
  price: 50,
  goal: "secret goal",
  address: "forged address",
};
fail(() => command(alice, "reserve", { ...draft, format: "track" }), /lieu/);
fail(() => command(alice, "reserve", { ...draft, price: 1 }), /tarif/);
fail(() => command(alice, "reserve", { ...draft, seats: 2 }), /places/);
command(alice, "reserve", draft);
ok(s.bookings[0].address === locations.gym.address, "Server venue snapshot");
ok(s.bookings[0].clientId === alice.id, "Authenticated booking owner");
ok(D.project(s, coach).notices.length > 0, "Coach notification");
ok(
  D.project(s, bob).bookings.length === 0,
  "Other customer cannot read booking",
);
ok(
  !JSON.stringify(D.project(s, bob)).includes("secret goal"),
  "No confidential goal in projection",
);
ok(
  !M.slotsFor(c, "2026-09-18", D.project(s, bob), solo).includes("09:10"),
  "Anonymous occupancy still blocks slot",
);
fail(() => command(bob, "reserve", { ...draft, id: "booking2" }), /disponible/);
fail(() => command(bob, "cancelSession", "booking1", "hack"), /accessible/);
command(alice, "message", "booking1", "Bonjour coach");
ok(
  D.project(s, coach).messages.booking1[0].text === "Bonjour coach",
  "Shared messaging",
);
ok(!D.project(s, bob).messages.booking1, "Private messaging");
command(coach, "readMessages", "booking1");
ok(
  D.project(s, alice).messages.booking1[0].readBy.includes(coach.id),
  "Read receipt shared",
);
fail(
  () => command(alice, "reschedule", "booking1", "2026-09-19", "17:15"),
  /lieu/,
);
command(
  coach,
  "addProposal",
  "booking1",
  { day: "2026-09-19", time: "10:10", address: locations.gym.address },
  "Adaptation",
);
const proposal = s.proposals.at(-1);
command(alice, "answerProposal", proposal.id, "accepted");
ok(s.bookings[0].day === "2026-09-19", "Proposal accepted atomically");
ok(
  D.project(s, coach).notices.some((n) => n.body.includes("acceptée")),
  "Proposal coach notification",
);
command(coach, "openGroup", {
  id: "g1",
  offer: group,
  day: "2026-09-20",
  time: "17:15",
  format: "track",
  address: "ignored",
});
ok(s.groups[0].address === locations.track.address, "Group venue canonical");
fail(
  () =>
    command(coach, "openGroup", {
      id: "wrong",
      offer: group,
      day: "2026-09-21",
      time: "17:15",
      format: "gym",
      address: "x",
    }),
  /horaires/,
);
const gd = {
  ...draft,
  id: "group-booking",
  offerId: "group",
  day: "2026-09-20",
  time: "17:15",
  format: "track",
  seats: 2,
  price: 40,
};
command(alice, "reserve", gd);
ok(
  M.remaining(group, gd.day, gd.time, D.project(s, bob)) === 1,
  "Capacity without identities",
);
fail(() => command(bob, "reserve", { ...gd, id: "too-many" }), /places/);
command(alice, "partialCancel", gd.id, 1);
ok(
  M.remaining(group, gd.day, gd.time, D.project(s, bob)) === 2,
  "Partial cancellation frees places",
);
command(
  coach,
  "repeatGroup",
  s.groups[0],
  ["2026-09-21", "2026-09-22"],
  "17:15",
);
ok(s.groups.length === 3, "Group repetition");
command(
  alice,
  "transfer",
  gd.id,
  s.groups[1].id,
  W.fingerprint(s.bookings.find((b) => b.id === gd.id)),
  20,
);
ok(
  s.bookings.find((b) => b.id === gd.id).day === "2026-09-21",
  "Group transfer",
);
command(coach, "addExternalSession", {
  name: "Private Client",
  offerId: "solo",
  day: "2026-09-23",
  time: "09:10",
  format: "gym",
  address: locations.gym.address,
});
ok(
  !JSON.stringify(D.project(s, bob)).includes("Private Client"),
  "External client private",
);
ok(
  !M.slotsFor(c, "2026-09-23", D.project(s, bob), solo).includes("09:10"),
  "Direct session blocks discovery",
);
command(coach, "drafts", {
  [coach.id + ":profile"]: { cfg: {}, profile: { bio: "Private draft" } },
});
ok(
  !JSON.stringify(D.project(s, bob)).includes("Private draft"),
  "Draft private",
);
ok(
  D.project(s, coach).coachDrafts[coach.id + ":profile"],
  "Draft shared to owner",
);
command(alice, "favorites", [coach.id]);
command(alice, "preferences", { ...M.initialPreferences, sport: "Running" });
ok(D.project(s, alice).favorites[0] === coach.id, "Favorite persisted");
ok(!D.project(s, bob).favorites.length, "Favorites isolated");
command(alice, "report", {
  body: "Besoin d’aide",
  booking: "booking1",
  owner: bob.id,
  status: "resolved",
});
ok(
  s.tickets.at(-1).owner === alice.id && s.tickets.at(-1).status === "open",
  "Support owner and status authoritative",
);
fail(
  () => command(alice, "resolveTicket", s.tickets[0].id, "x", "Répondre"),
  /équipe/,
);
command(
  team,
  "resolveTicket",
  s.tickets[0].id,
  "Nous regardons votre demande.",
  "Répondre",
);
ok(
  D.project(s, alice).tickets[0].status === "resolved",
  "Support response shared",
);
let projected = D.project(s, coach);
const updated = W.saveSettings(projected, coach.id, {
  ...M.configFor(projected, coach.id),
  notice: 3,
});
ok(
  C.commandsFrom(projected, updated)[0].name === "saveSettings",
  "Transport sends command, not arbitrary store",
);
fail(
  () => command(alice, "saveReview", "booking1", 5, "Excellent"),
  /terminée/,
);
M.setDemoClock((Date.parse("2026-09-25T06:00:00Z") - Date.now()) / 3600000);
s = W.maintain(s);
command(alice, "saveReview", "booking1", 5, "Excellent");
command(coach, "replyReview", s.reviews[0].id, "Merci");
ok(
  D.project(s, bob).reviews[0].reply === "Merci",
  "Verified review and reply public",
);
ok(!D.project(s, bob).reviews[0].owner, "Review account ID private");
command(alice, "deleteAccount");
ok(!s.identities.some((a) => a.id === alice.id), "Account removed");
ok(s.deletedAccounts.includes(alice.id), "Old auth identity blocked");
console.log(
  `PASS ${count} connected command, venue, authorization and privacy checks.`,
);
