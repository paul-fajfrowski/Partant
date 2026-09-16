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
  W = require("../apps/mobile/src/product/workflows.ts");
let count = 0;
const check = (v, label) => {
  assert.ok(v, label);
  count++;
};
const throws = (f, re) => {
  assert.throws(f, re);
  count++;
};
M.setDemoClock((Date.parse("2026-09-16T06:00:00Z") - Date.now()) / 3600000);
const alex = W.identities(M.initialStore).find((a) => a.name === "Alex"),
  nina = W.identities(M.initialStore).find((a) => a.name === "Nina"),
  thomas = W.identities(M.initialStore).find((a) => a.id === "coach-0");
const base = () => ({
  ...structuredClone(M.initialStore),
  account: thomas,
  testMode: true,
});
let s = base(),
  cfg = M.configFor(s, "0");
cfg = {
  ...cfg,
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [
    ["09:00", "12:00"],
    ["14:00", "21:00"],
  ]),
};
s = W.saveSettings(s, "0", cfg);
check(
  !M.slotsFor(M.seedCoaches[0], "2026-09-18", s, s.offers[0]).includes("12:00"),
  "Lunch break blocks public slots",
);
check(
  M.slotsFor(M.seedCoaches[0], "2026-09-18", s, s.offers[0]).includes("14:00"),
  "Second interval available",
);
throws(
  () =>
    M.validateIntervals([
      ["09:00", "12:00"],
      ["11:00", "13:00"],
    ]),
  /chevaucher/,
);
throws(() => M.validateIntervals([["22:00", "21:00"]]), /horaires/);
throws(() => M.validateIntervals([["xx", "18:00"]]), /horaires/);
s = W.saveSettings(s, "0", { ...cfg, exceptions: { "2026-09-18": [] } });
check(
  M.slotsFor(M.seedCoaches[0], "2026-09-18", s, s.offers[0]).length === 0,
  "Dated closed exception overrides week",
);
s = W.saveSettings(s, "0", cfg);
s = W.saveSettings(s, "0", {
  ...cfg,
  blocks: [
    {
      id: "private",
      day: "2026-09-18",
      start: "15:00",
      end: "16:00",
      title: "PRIVATE",
    },
  ],
});
check(
  !M.slotsFor(M.seedCoaches[0], "2026-09-18", s, s.offers[0]).includes("14:30"),
  "Private occupied event blocks overlapping start",
);
s = W.saveSettings(s, "0", cfg);
const offer = {
  id: "g",
  coach: "0",
  name: "Collectif",
  kind: "Groupe",
  duration: 60,
  price: 20,
  capacity: 6,
  active: true,
};
s = W.saveOffer(s, offer);
s = M.openGroup(s, {
  id: "g1",
  offer,
  day: "2026-09-18",
  time: "18:00",
  address: "Parc A",
});
s = W.saveOffer(s, { ...offer, price: 30 });
s = M.openGroup(s, {
  id: "g2",
  offer,
  day: "2026-09-21",
  time: "18:00",
  address: "Parc B",
});
check(
  s.groups[0].offer.price === 20 && s.groups[1].offer.price === 30,
  "Dated class snapshots survive offer price change",
);
check(
  !M.slotsFor(M.seedCoaches[0], "2026-09-18", s, s.offers[0]).includes("17:30"),
  "Empty group class blocks overlapping individual session",
);
s = M.switchAccount(s, alex);
const draft = {
  id: "b",
  coach: "0",
  clientId: alex.id,
  clientName: alex.name,
  day: "2026-09-18",
  time: "18:00",
  duration: 60,
  offerId: "g",
  serviceName: "Collectif",
  kind: "Groupe",
  format: "Parc",
  seats: 3,
  price: 60,
  goal: "Bouger",
  address: "Parc A",
  status: "confirmed",
};
s = W.beginPayment(s, draft, "Apple Pay");
let p = s.attempts.at(-1);
check(s.bookings.length === 0, "Pending payment holds no inventory");
s = W.paymentResult(s, p.id, "refused");
check(
  s.bookings.length === 0 && s.attempts.at(-1).status === "refused",
  "Refusal keeps booking unconfirmed",
);
throws(() => W.paymentResult(s, p.id, "success"), /nouvelle tentative/);
s = W.beginPayment(s, draft, "Carte");
p = s.attempts.at(-1);
s = W.paymentResult(s, p.id, "success");
check(s.bookings[0].price === 60, "Historical group price honored");
check(
  W.paymentResult(s, p.id, "success") === s,
  "Duplicate success idempotent",
);
check(
  M.remaining(offer, draft.day, draft.time, s) === 3,
  "Three seats consumed",
);
s = W.partialCancel(s, "b", 2);
let b = s.bookings[0];
check(
  b.seats === 2 && b.refunded === 20 && W.net(b) === 40,
  "Partial cancellation financial ledger",
);
check(
  s.refunds[0].amount === 20 && s.refunds[0].status === "pending",
  "Refund starts pending",
);
const before = W.fingerprint(b);
throws(() => W.transfer(s, "b", "g2", before, 99), /changé/);
check(
  s.bookings[0].day === "2026-09-18",
  "Rejected transfer leaves source unchanged",
);
s = W.transfer(s, "b", "g2", before, 30);
b = s.bookings[0];
check(
  b.id === "b" && b.day === "2026-09-21" && b.address === "Parc B",
  "Transfer preserves ID and updates location",
);
check(
  b.paid === 80 && b.refunded === 20 && W.net(b) === 60,
  "Transfer charges only supplement",
);
check(
  M.remaining(offer, "2026-09-18", "18:00", s) === 6,
  "Source capacity restored",
);
check(
  M.remaining(offer, "2026-09-21", "18:00", s) === 4,
  "Destination capacity consumed",
);
throws(() => W.transfer(s, "b", "g1", before, 20), /réservation a changé/i);
s = W.cancelSession(s, "b", "Imprévu");
check(
  W.net(s.bookings[0]) === 0 && s.bookings[0].refunded === 80,
  "Full cancellation refunds only remaining net",
);
check(W.cancelSession(s, "b", "Again") === s, "Cancel idempotent");
check(
  M.remaining(offer, "2026-09-21", "18:00", s) === 6,
  "Cancellation releases seats",
);
s = M.switchAccount(s, nina);
throws(() => W.owned(s, "b"), /accessible/);
check(!W.accountExport(s).bookings.length, "Export excludes another customer");
throws(() => W.saveSettings(s, "0", cfg), /coach/);
// Late partial cancellation releases seats but does not refund.
let late = M.switchAccount(base(), alex);
const lb = {
  ...draft,
  id: "late",
  day: "2026-09-16",
  time: "18:00",
  price: 60,
  paid: 60,
  refunded: 0,
  cancelHours: 24,
};
late = { ...late, bookings: [lb] };
late = W.partialCancel(late, "late", 2);
check(
  late.bookings[0].refunded === 0 &&
    late.bookings[0].price === 40 &&
    W.net(late.bookings[0]) === 60,
  "Late removed seats remain due",
);
throws(
  () => W.transfer(late, "late", "g2", W.fingerprint(late.bookings[0]), 30),
  /dépassée/,
);
// Proposals keep the original until accepted and recheck target capacity.
let solo = W.saveSettings(base(), "0", cfg);
solo = M.switchAccount(solo, alex);
const sd = {
  ...draft,
  id: "solo",
  offerId: solo.offers[0].id,
  kind: "Individuel",
  seats: 1,
  day: "2026-09-18",
  time: "09:00",
  price: 50,
};
solo = M.reserve(solo, sd);
solo = M.switchAccount(solo, thomas);
solo = W.addProposal(
  solo,
  "solo",
  { day: "2026-09-19", time: "10:00", address: "Nouveau parc" },
  "Déplacement",
);
let pr = solo.proposals.at(-1);
check(
  solo.bookings[0].day === "2026-09-18",
  "Proposal does not move initial booking",
);
solo = M.switchAccount(solo, alex);
solo = W.answerProposal(solo, pr.id, "declined");
check(solo.bookings[0].day === "2026-09-18", "Decline preserves original");
solo = M.switchAccount(solo, thomas);
solo = W.addProposal(
  solo,
  "solo",
  { day: "2026-09-19", time: "10:00", address: "Nouveau parc" },
  "Autre proposition",
);
pr = solo.proposals.at(-1);
solo = M.switchAccount(solo, alex);
solo = W.answerProposal(solo, pr.id, "accepted");
check(
  solo.bookings[0].day === "2026-09-19" &&
    solo.bookings[0].address === "Nouveau parc",
  "Accepted proposal updates both ends",
);
check(solo.bookings[0].price === 50, "Proposal cannot impose surcharge");
throws(() => W.saveReview(solo, "solo", 5, "Bien"), /terminée/);
solo = {
  ...solo,
  bookings: solo.bookings.map((b) => ({ ...b, status: "completed" })),
};
solo = W.saveReview(solo, "solo", 5, "Très bonne séance");
throws(() => W.saveReview(solo, "solo", 4, "Second"), /existe/);
solo = M.switchAccount(solo, thomas);
solo = W.replyReview(solo, solo.reviews[0].id, "Merci Alex");
check(solo.reviews[0].reply === "Merci Alex", "Coach reply retained");
solo = M.switchAccount(solo, alex);
solo = W.report(solo, {
  kind: "Signaler un avis",
  review: solo.reviews[0].id,
  body: "Demande de modération",
});
solo = W.resolveTicket(
  solo,
  solo.tickets[0].id,
  "Avis masqué dans le test",
  "Masquer l’avis",
);
check(
  solo.reviews[0].hidden && solo.tickets[0].status === "resolved",
  "Moderation hides review with recorded decision",
);
throws(
  () =>
    W.resolveTicket(
      { ...solo, testMode: false },
      solo.tickets[0].id,
      "x",
      "Répondre",
    ),
  /Test/,
);
// Document changes unpublish; approval does not silently republish.
let docs = base();
docs = W.saveCoach(docs, "0", { name: "Thomas Nouveau" });
check(
  !M.configFor(docs, "0").published &&
    M.configFor(docs, "0").dossier.status === "draft",
  "Identity change invalidates dossier",
);
cfg = M.configFor(docs, "0");
docs = W.saveSettings(docs, "0", {
  ...cfg,
  dossier: { ...cfg.dossier, status: "pending" },
});
docs = W.reviewDossier(docs, "0", "approved", "Pièces fictives vérifiées");
check(
  !M.configFor(docs, "0").published,
  "Team approval requires explicit coach publication",
);
docs = W.publish(docs, "0");
check(M.configFor(docs, "0").published, "Valid approved profile publishes");
// Expiration, reminders, alert deduplication.
let reminders = {
  ...solo,
  bookings: [{ ...sd, day: "2026-09-16", time: "18:00", status: "confirmed" }],
  notices: [],
  attempts: [],
  reviews: [],
};
reminders = W.maintain(reminders);
check(reminders.notices.length === 2, "Upcoming reminder to both parties");
const old = reminders;
reminders = W.maintain(reminders);
check(reminders === old, "Maintenance does not duplicate reminders or state");
let muted = {
  ...reminders,
  notices: [],
  accountInfo: { [alex.id]: { phone: "", reminders: false, alerts: false } },
};
muted = W.maintain(muted);
check(
  muted.notices.length === 1 && muted.notices[0].recipient === "coach-0",
  "Reminder preference honored",
);
let exp = M.switchAccount(base(), alex);
exp = W.beginPayment(exp, sd, "Apple Pay");
exp.attempts[0].created -= 600001;
exp = W.maintain(exp);
check(
  exp.attempts[0].status === "expired",
  "Payment expires after ten minutes",
);
throws(() => W.paymentResult(exp, exp.attempts[0].id, "success"), /expiré/);
let deleted = {
  ...solo,
  account: alex,
  messages: { solo: [{ who: alex.id, text: "Private" }] },
};
const exported = W.accountExport(deleted);
check(
  exported.messages.solo[0].text === "Private",
  "Own export includes accessible messages",
);
deleted = W.deleteAccount(deleted);
check(
  !W.identities(deleted).some((a) => a.id === alex.id),
  "Deleted seed identity cannot log back in",
);
check(
  deleted.messages.solo[0].text === "Message supprimé",
  "Deletion anonymizes sent messages",
);
throws(
  () => W.loginDemo(deleted, alex.email, "Alex", "client", false),
  /existe pas/,
);
let signup = W.loginDemo(
  base(),
  "new@example.test",
  "Nouveau coach",
  "coach",
  true,
);
check(
  signup.account.coachId && signup.extraCoaches.length === 1,
  "Coach signup creates separate profile",
);
check(
  !M.configFor(signup, signup.account.coachId).published,
  "New coach starts unpublished",
);
throws(
  () => W.loginDemo(signup, "new@example.test", "Again", "coach", true),
  /existe déjà/,
);
const ics = W.sessionICS(sd, "Thomas");
check(
  ics.includes("DTSTART:20260918T070000Z") && ics.includes("BEGIN:VCALENDAR"),
  "ICS contains UTC Paris time",
);

// Legacy pauses no longer prevent adjacent sessions.
let buffered = W.saveSettings(base(), "0", {
  ...M.configFor(base(), "0"),
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [["09:00", "21:00"]]),
  buffer: 30,
});
buffered = W.saveOffer(buffered, offer);
buffered = M.openGroup(buffered, {
  id: "buffered",
  offer,
  day: "2026-09-18",
  time: "18:00",
  address: "Parc",
});
check(
  M.slotsFor(
    M.seedCoaches[0],
    "2026-09-18",
    buffered,
    buffered.offers[0],
  ).includes("17:00"),
  "Adjacent slot before group remains available",
);
check(
  M.slotsFor(
    M.seedCoaches[0],
    "2026-09-18",
    buffered,
    buffered.offers[0],
  ).includes("19:00"),
  "Adjacent slot after group remains available",
);
check(
  M.openGroup(buffered, {
    id: "adjacent",
    offer,
    day: "2026-09-18",
    time: "19:00",
    address: "Parc",
  }).groups.some((g) => g.id === "adjacent"),
  "Coach can schedule a group directly after another",
);
let proposed = M.switchAccount(
  { ...solo, bookings: [{ ...sd, status: "confirmed" }] },
  thomas,
);
throws(
  () =>
    W.addProposal(
      proposed,
      "solo",
      { day: "2026-09-18", time: "23:30", address: "Parc" },
      "Test",
    ),
  /disponible/,
);
// Re-registering a deleted address cannot regain the deleted account's records.
let fresh = W.loginDemo(deleted, alex.email, "Alex nouveau", "client", true);
check(
  fresh.account.id !== alex.id &&
    W.identities(fresh).some((a) => a.id === fresh.account.id),
  "New identity after deleted address is independent",
);
check(
  W.accountExport(fresh).bookings.length === 0,
  "Re-registration exposes no deleted history",
);
// Alert appearance, disappearance and newly released places.
let alerts = W.saveSettings(base(), "0", {
  ...M.configFor(base(), "0"),
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [["09:00", "21:00"]]),
});
alerts = {
  ...alerts,
  alerts: [
    {
      id: "watch",
      owner: alex.id,
      coach: "0",
      sport: "Tout",
      day: "2026-09-18",
      from: "10:00",
      to: "10:00",
      budget: 300,
      seats: 1,
      groupOnly: false,
      format: "Tous",
      active: true,
      seen: [],
    },
  ],
};
alerts = W.maintain(alerts);
check(
  alerts.notices.filter((n) => n.id.startsWith("alert:")).length === 1,
  "First availability sends alert",
);
const unchanged = W.maintain(alerts);
check(unchanged === alerts, "Unchanged availability sends no duplicate");
alerts = W.maintain({ ...alerts, closed: ["0|2026-09-18|10:00"] });
check(
  alerts.alerts[0].seen.length === 0,
  "Unavailable slot removed from alert memory",
);
alerts = W.maintain({ ...alerts, closed: [] });
check(
  alerts.notices.filter((n) => n.id.startsWith("alert:")).length === 2,
  "Freed slot generates a new alert",
);
let expired = base(),
  ec = M.configFor(expired, "0");
expired = {
  ...expired,
  settings: { 0: { ...ec, dossier: { ...ec.dossier, expires: "2026-09-15" } } },
};
expired = W.maintain(expired);
check(
  M.configFor(expired, "0").dossier.status === "expired" &&
    !M.configFor(expired, "0").published,
  "Expired dossier closes publication",
);
M.setDemoClock(0);
console.log(`PASS ${count} complete native workflow assertions.`);
