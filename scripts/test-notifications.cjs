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
  N = require("../apps/mobile/src/product/notifications.ts");
let count = 0;
const ok = (v, label) => {
  assert.ok(v, label);
  count++;
};
const at = Date.parse("2026-09-18T10:00:00Z");
M.setDemoClock((at - Date.now()) / 3600000);
let s = W.loginDemo(
  structuredClone(M.initialStore),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
s = W.saveSettings(s, "0", {
  ...M.configFor(s, "0"),
  weeklyConfigured: true,
  week: Array.from({ length: 7 }, () => [["09:00", "21:00"]]),
});
const coach = s.account;
s = W.loginDemo(s, "alex@example.test", "Alex", "client", false);
const client = s.account;
const offer = s.offers.find((o) => o.id === "0:solo");
const draft = {
  id: "notice-booking",
  coach: "0",
  clientId: client.id,
  clientName: client.name,
  day: "2026-09-22",
  time: "09:00",
  duration: offer.duration,
  offerId: offer.id,
  serviceName: offer.name,
  kind: offer.kind,
  format: "Parc",
  seats: 1,
  price: offer.price,
  goal: "Bouger",
  address: M.seedCoaches[0].address,
  status: "confirmed",
};
s = M.reserve(s, draft);
let rows = N.notificationRows(s);
ok(
  rows.length === 1 && rows[0].title === "Séance confirmée",
  "Client receives booking event",
);
ok(
  !rows[0].actionable && rows[0].notice.createdAt >= at,
  "Booking is timestamped information, not a pending action",
);
ok(
  rows[0].person === M.seedCoaches[0].name && rows[0].session.includes("09:00"),
  "Client sees coach and appointment",
);
ok(
  N.notificationRows({ ...s, account: coach })[0].person === client.name,
  "Coach sees client",
);
ok(
  N.notificationRows({ ...s, account: { ...client, id: "stranger" } })
    .length === 0,
  "Recipient isolation",
);
const received = rows[0].notice.createdAt;
s = W.reschedule(s, draft.id, "2026-09-23", "10:00", draft.address);
rows = N.notificationRows(s);
let changed = rows.find((r) => r.notice.event === "rescheduled");
ok(
  changed.detail[0].includes("09:00") && changed.detail[1].includes("10:00"),
  "Change shows before and after",
);
ok(
  rows.find((r) => r.notice.event === "booking").session.includes("09:00"),
  "Original snapshot remains unchanged",
);
ok(
  rows.find((r) => r.notice.event === "booking").notice.createdAt === received,
  "Original receipt date immutable",
);
s = M.switchAccount(s, coach);
s = W.addProposal(
  s,
  draft.id,
  { day: "2026-09-24", time: "11:00", address: draft.address },
  "Adaptation",
);
const first = s.proposals.at(-1);
s = M.switchAccount(s, client);
rows = N.notificationRows(s);
let action = rows.find((r) => r.actionable);
ok(
  action.target.focus === first.id && action.target.booking === draft.id,
  "Action deep links exact proposal and booking",
);
const closeBooking = { ...s.bookings[0], day: M.today(), time: "13:00" };
const closeProposal = { ...first, before: W.fingerprint(closeBooking) };
ok(
  W.effectiveProposalStatus(
    { ...s, bookings: [closeBooking] },
    closeProposal,
  ) === "expired",
  "Proposal cannot remain actionable after modification deadline",
);
s = {
  ...s,
  notices: s.notices.map((n) =>
    n.id === action.notice.id ? { ...n, read: true } : n,
  ),
};
ok(
  N.notificationRows(s).find((r) => r.notice.id === action.notice.id)
    .actionable,
  "Reading does not resolve action",
);
s = M.switchAccount(s, coach);
s = W.addProposal(
  s,
  draft.id,
  { day: "2026-09-25", time: "12:00", address: draft.address },
  "Autre proposition",
);
const second = s.proposals.at(-1);
s = M.switchAccount(s, client);
rows = N.notificationRows(s);
ok(
  rows.filter((r) => r.actionable).length === 1,
  "Superseded proposal removed from action filter",
);
ok(
  rows.find((r) => r.notice.proposalId === first.id).outcome ===
    "Proposition retirée",
  "Old proposal retains its own outcome",
);
const legacy = { ...s, notices: s.notices.map(({ proposalId, ...n }) => n) };
const recovered = W.maintain(legacy);
ok(
  N.notificationRows(recovered).filter((r) => r.actionable).length === 1,
  "Ambiguous legacy notices recover exactly one current action",
);
ok(
  W.maintain(recovered).notices.length === recovered.notices.length,
  "Legacy recovery idempotent",
);
s = W.answerProposal(s, second.id, "accepted");
rows = N.notificationRows(s);
ok(
  !rows.some((r) => r.actionable),
  "Accepted proposal no longer requires action",
);
ok(
  rows
    .filter((r) => r.notice.proposalId === second.id)
    .every((r) => r.outcome === "Proposition acceptée"),
  "Original and result link retain actual outcome",
);
s = M.switchAccount(s, coach);
s = W.addProposal(
  s,
  draft.id,
  { day: "2026-09-26", time: "13:00", address: draft.address },
  "Autre",
);
const third = s.proposals.at(-1);
s = M.switchAccount(s, client);
s = W.reschedule(s, draft.id, "2026-09-27", "14:00", draft.address);
ok(
  !N.notificationRows(s).some((r) => r.actionable),
  "Independent booking change invalidates proposal immediately",
);
assert.throws(() => W.answerProposal(s, third.id, "accepted"), /plus ouverte/);
count++;
s = W.cancelSession(s, draft.id, "Annuler cette proposition après notre message");
rows = N.notificationRows(s);
ok(rows.some(r=>r.notice.event==='cancelled'&&r.title==='Séance annulée'),'Free-text cancellation reason cannot change event category');
ok(
  rows.find((r) => r.notice.event === "booking").outcome ===
    "Séance annulée depuis",
  "Old booking clearly states subsequent cancellation",
);
const n = {
  id: "legacy",
  recipient: client.id,
  body: "Ancienne information",
  read: false,
  booking: draft.id,
};
ok(
  N.notificationGroup(n, at) === "Historique",
  "No invented date for legacy event",
);
ok(
  N.notificationTime(n).includes("non renseignée"),
  "Legacy receipt date honest",
);
for (const [date, label] of [
  ["2026-09-18T08:00:00Z", "Aujourd’hui"],
  ["2026-09-17T08:00:00Z", "Hier"],
  ["2026-09-15T08:00:00Z", "Cette semaine"],
  ["2026-09-13T08:00:00Z", "13 septembre 2026"],
])
  ok(
    N.notificationGroup({ ...n, createdAt: Date.parse(date) }, at) === label,
    "Timeline " + label,
  );
ok(
  N.notificationGroup(
    { ...n, createdAt: Date.parse("2026-09-17T22:30:00Z") },
    at,
  ) === "Aujourd’hui",
  "Paris midnight boundary",
);
ok(
  N.notificationGroup(
    { ...n, createdAt: Date.parse("2026-10-25T01:30:00Z") },
    Date.parse("2026-10-25T12:00:00Z"),
  ) === "Aujourd’hui",
  "DST boundary",
);
s = { ...s, notices: [n, ...s.notices] };
ok(
  N.notificationRows(s).at(-1).notice.id === "legacy",
  "Unknown dates stay last",
);
s = M.switchAccount(s, coach);
s = {
  ...s,
  calendarStatus: {
    0: { connected: true, updatedAt: at, error: "private provider error" },
  },
};
s = W.maintain(s);
ok(
  N.notificationRows(s).some(
    (r) =>
      r.notice.event === "calendar" &&
      r.actionable &&
      r.target.config === "calendars",
  ),
  "Calendar failure routes to useful configuration",
);
ok(
  !JSON.stringify(
    N.notificationRows(s)
      .filter((r) => r.notice.event === "calendar")
      .map((r) => r.detail),
  ).includes("private provider error"),
  "Provider diagnostics not leaked into UI",
);
let number = s.notices.length;
s = W.maintain(s);
ok(number === s.notices.length, "Repeated maintenance does not spam");
s = W.maintain({
  ...s,
  calendarStatus: { 0: { connected: true, updatedAt: at } },
});
ok(
  !N.notificationRows(s).some(
    (r) => r.notice.event === "calendar" && r.actionable,
  ),
  "Recovered calendar action cleared",
);
ok(
  N.notificationRows(s).find((r) => r.notice.event === "calendar").outcome ===
    "Incident clôturé",
  "Recovered incident retained in history",
);
s = W.maintain({
  ...s,
  calendarStatus: {
    0: { connected: true, updatedAt: at, conflicts: ["booking"] },
  },
});
ok(
  N.notificationRows(s).filter(
    (r) => r.notice.event === "calendar" && r.actionable,
  ).length === 1,
  "New incident distinct from resolved history",
);
const cfg = M.configFor(s, "0");
s = {
  ...s,
  settings: {
    ...s.settings,
    0: { ...cfg, dossier: { ...cfg.dossier, status: "correction" } },
  },
};
s = W.notify(
  s,
  coach.id,
  "Votre dossier est à compléter.",
  "",
  "dossier-test",
  { event: "dossier" },
);
ok(
  N.notificationRows(s).find((r) => r.notice.id === "dossier-test").actionable,
  "Dossier correction is actionable",
);
s = {
  ...s,
  settings: {
    ...s.settings,
    0: {
      ...M.configFor(s, "0"),
      dossier: { ...cfg.dossier, status: "approved" },
    },
  },
};
ok(
  !N.notificationRows(s).find((r) => r.notice.id === "dossier-test").actionable,
  "Dossier approval clears action",
);
s = W.notify(
  s,
  coach.id,
  "Votre demande a reçu une réponse.",
  "",
  "ticket-test",
  { event: "support", ticketId: "t1" },
);
ok(
  N.notificationRows(s).find((r) => r.notice.id === "ticket-test").target
    .focus === "t1",
  "Support deep link scoped to ticket",
);
console.log(`PASS ${count} notification domain checks.`);
