const fs = require("node:fs"),
  assert = require("node:assert/strict");
const create = require("./fixtures/coach-volume.cjs");
const N = require("../apps/mobile/src/product/notifications.ts"),
  G = require("../apps/mobile/src/product/messaging.ts");
const { store, meta } = create();
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=preview&recette=volume-automated";
const H = require("./native-web-harness.cjs");
const key = "partant-native-recette-volume-automated";
const sentinel = "volume-test-preserve-original";
H.w.localStorage.setItem("partant-native-preview-v1", sentinel);
H.w.localStorage.setItem(key, JSON.stringify(store));
const chapter = (id) =>
  H.d.querySelector(`[data-testid="notification-chapter-${id}"]`);
const rows = () =>
  [...H.d.querySelectorAll('[data-testid^="notification-"]')].filter(
    (e) => !e.dataset.testid.startsWith("notification-chapter-"),
  );
const report = {
  meta,
  chapters: N.notificationChapters(store).map((c) => ({
    id: c.id,
    title: c.title,
    total: c.rows.length,
    unread: c.unread,
    actions: c.actions,
  })),
  observations: {},
  limits:
    "DOM fonctionnel ; aucune mesure de rendu, de défilement en pixels ou de fluidité sur téléphone.",
};
(async () => {
  try {
    await H.wait();
    await H.wait();
    await H.click("Notifications");
    H.ok(rows().length === 0, "Collapsed initial view has no event rows");
    H.ok(
      N.notificationRows(store).length === 446,
      "446 notifications scoped to coach",
    );
    H.ok(
      !H.d.body.textContent.includes("Confidentiel autre coach"),
      "Other coach excluded",
    );
    H.ok(
      chapter("calendar").textContent.includes("1 à traiter") &&
        chapter("dossier").textContent.includes("1 à traiter"),
      "Old read actions still counted",
    );
    await H.click("Nouvelles réservations");
    report.observations.bookingRowsMounted = rows().length;
    H.ok(rows().length === 10, "Only ten recent bookings mounted initially");
    report.observations.rowsBeforeCancelledHeader = rows().filter(
      (r) =>
        !!(
          r.compareDocumentPosition(chapter("cancelled")) &
          H.w.Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ).length;
    H.ok(
      report.observations.rowsBeforeCancelledHeader === 10,
      "Next chapter follows only ten booking rows",
    );
    await H.click("Voir les précédents");
    H.ok(rows().length === 20, "Ten older events appended");
    const target = rows()[15],
      targetId = target.dataset.testid;
    target.click();
    await H.wait();
    H.ok(
      H.d.body.textContent.includes("Événements de la séance"),
      "Middle booking opens correctly",
    );
    await H.click("Retour");
    H.ok(rows().length === 20, "Expanded page survives return");
    H.ok(
      H.d
        .querySelector(`[data-testid="${targetId}"]`)
        .getAttribute("aria-label")
        .startsWith("Non lue.") === false,
      "Opened event marked read",
    );
    await H.click("Séances annulées");
    H.ok(rows().length === 10, "Cancellation history also paged");
    H.ok(!chapter("messages"), "No message chapter");
    report.observations.generalNotifications =
      N.notificationInboxNotices(store).length;
    report.observations.distinctConversations = G.conversations(store).length;
    H.ok(
      report.observations.generalNotifications === 230,
      "216 message events excluded from general inbox",
    );
    await H.click("Retour");
    const nav = (label) =>
      [...H.d.querySelectorAll('[role="button"]')].find(
        (e) => e.getAttribute("aria-label") === label,
      );
    H.ok(
      nav("Notifications").textContent.includes("20"),
      "General badge excludes 216 unread messages",
    );
    H.ok(
      nav("Messages").textContent.includes("99+") &&
        G.conversations(JSON.parse(H.w.localStorage.getItem(key))).reduce(
          (n, c) => n + c.unread,
          0,
        ) === 216,
      "Dedicated message badge keeps unread messages",
    );
    await H.click("Messages");
    H.ok(
      H.d.querySelectorAll('[data-testid^="conversation-"]').length === 36,
      "36 person conversations remain available",
    );
    await H.click("Camille Martin");
    await H.wait();
    H.ok(
      H.d.querySelectorAll('[data-testid^="message-"]').length === 6,
      "All messages remain in conversation",
    );
    await H.click("Retour");
    await H.click("Retour");
    H.ok(
      nav("Messages").textContent.includes("99+") &&
        G.conversations(JSON.parse(H.w.localStorage.getItem(key))).reduce(
          (n, c) => n + c.unread,
          0,
        ) === 210,
      "Reading six messages updates only messaging badge",
    );
    H.ok(
      nav("Notifications").textContent.includes("20"),
      "General badge unaffected by reading chat",
    );
    await H.click("Notifications");
    await H.click("Agenda");
    H.d.querySelector('[data-testid="notification-volume-calendar"]').click();
    await H.wait();
    H.ok(
      H.d.body.textContent.includes("Google Calendar"),
      "Old incident opens calendar settings",
    );
    await H.click("Retour");
    H.ok(
      chapter("calendar").textContent.includes("1 à traiter"),
      "Viewing does not resolve incident",
    );
    H.ok(
      H.w.localStorage.getItem("partant-native-preview-v1") === sentinel,
      "Normal demo unchanged",
    );
    fs.writeFileSync(
      "docs/coach-volume-paged-results.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    H.finish("coach volume");
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    H.close();
    throw e;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
