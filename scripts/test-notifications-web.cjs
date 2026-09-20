const fs = require("node:fs"),
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
const plusDay = (day, n) =>
  new Date(Date.parse(day + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
const H = require("./native-web-harness.cjs"),
  { w, d, click, wait, ok } = H;
let s = W.loginDemo(
  M.newPreviewStore(),
  "alex@example.test",
  "Alex",
  "client",
  false,
);
const me = s.account,
  coach = W.identities(s).find((x) => x.id === "coach-0");
const b = {
  ...s.bookings[0],
  id: "notification-flow",
  coach: "0",
  clientId: me.id,
  clientName: me.name,
  day: plusDay(M.today(), 5),
  time: "10:00",
  status: "confirmed",
  offerId: "0:solo",
  serviceName: "Coaching individuel",
};
s.bookings = [b];
s.notices = [];
const p = {
  id: "notification-proposal",
  booking: b.id,
  before: W.fingerprint(b),
  target: { day: plusDay(b.day, 1), time: "11:00", address: b.address },
  reason: "Une proposition pour votre séance.",
  status: "pending",
};
s.proposals = [p];
s = W.notify(
  s,
  me.id,
  "Votre coach propose un changement.",
  b.id,
  "proposal-notice",
  { event: "proposal", proposalId: p.id },
);
s = W.notify(s, me.id, "Votre séance est confirmée.", b.id, "booking-notice", {
  event: "booking",
});
s = W.notify(s, me.id, "Vous avez reçu un message.", b.id, "message-notice", {
  event: "message",
});
s.messages[b.id] = [
  { who: coach.id, text: "À bientôt pour votre séance !", readBy: [coach.id] },
];
s.notices.push({
  id: "private",
  recipient: "somebody-else",
  booking: b.id,
  body: "Private secret notice",
  read: false,
});
s.notices.push({
  id: "old",
  recipient: me.id,
  booking: b.id,
  body: "Ancienne information",
  read: false,
});
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(s));
const saved = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
const row = (id) => d.querySelector(`[data-testid="notification-${id}"]`);
(async () => {
  try {
    await wait();
    await wait();
    await click("Mon espace");
    await click("Mes notifications");
    ok(
      !row("booking-notice") && !row("proposal-notice"),
      "Chapters start collapsed",
    );
    ok(
      !d.body.textContent.includes("Private secret notice"),
      "No other account notifications",
    );
    await click("Nouvelles réservations");
    ok(d.body.textContent.includes("Aujourd’hui"), "Chronology inside chapter");
    ok(
      row("booking-notice").textContent.includes("Coaching individuel"),
      "Session context visible",
    );
    ok(
      row("booking-notice").getAttribute("aria-label").startsWith("Non lue."),
      "Opening chapter preserves unread state",
    );
    await click("Autres informations");
    ok(
      d.body.textContent.includes("Historique") && !row("booking-notice"),
      "Legacy chronology and one expanded chapter",
    );
    await click("Propositions de changement");
    ok(
      !!row("proposal-notice") && !row("old"),
      "Proposal chapter opens independently",
    );
    row("proposal-notice").click();
    await wait();
    ok(
      d.body.textContent.includes(p.reason) &&
        d.body.textContent.includes("11:00"),
      "Exact proposal opens",
    );
    ok(
      saved().notices.find((n) => n.id === "proposal-notice").read,
      "Opening marks read",
    );
    await click("Retour");
    ok(!!row("proposal-notice"), "Read proposal still needs response");
    await click("1 action à traiter");
    ok(
      !!row("proposal-notice"),
      "Read pending proposal reachable from shortcut",
    );
    row("proposal-notice").click();
    await wait();
    await click("Garder ma séance initiale");
    ok(saved().proposals[0].status === "declined", "Response persisted");
    await click("Retour");
    ok(
      d.body.textContent.includes("Tout est traité."),
      "Resolved last action leaves a clear empty state",
    );
    await click("Toutes les notifications");
    await click("Propositions de changement");
    ok(
      !d
        .querySelector('[data-testid="notification-chapter-proposals"]')
        .textContent.includes("à traiter"),
      "Resolved action clears chapter action count",
    );
    ok(
      row("proposal-notice").textContent.includes("Séance initiale conservée"),
      "Result remains in timeline",
    );
    row("proposal-notice").click();
    await wait();
    ok(
      ![...d.querySelectorAll('[role="button"]')].some(
        (e) => e.textContent === "Accepter le changement",
      ),
      "Resolved proposal cannot be answered again",
    );
    await click("Retour");
    ok(
      !d.querySelector('[data-testid="notification-chapter-messages"]') &&
        !row("message-notice"),
      "No duplicate messaging chapter",
    );
    ok(
      !saved().notices.find((n) => n.id === "message-notice").read,
      "Browsing notifications does not consume messages",
    );
    await click("Nouvelles réservations");
    row("booking-notice").click();
    await wait();
    ok(
      d.body.textContent.includes("Événements de la séance"),
      "Booking has event history",
    );
    H.finish("notification client journey");
  } catch (e) {
    H.close();
    throw e;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
