const create = require("./fixtures/coach-volume.cjs");
const { store } = create();
for (let i = 0; i < 15; i++)
  store.notices.push({
    id: "resolved-calendar-" + i,
    event: "calendar",
    recipient: store.account.id,
    booking: "",
    body: "Incident clôturé",
    createdAt: Date.now() - i * 60000,
    resolvedAt: Date.now(),
    read: true,
  });
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=preview&recette=paging-qa";
const H = require("./native-web-harness.cjs");
H.w.localStorage.setItem(
  "partant-native-recette-paging-qa",
  JSON.stringify(store),
);
const scrollCalls = [];
H.w.HTMLElement.prototype.scroll = function (options) {
  scrollCalls.push({ id: this.dataset.testid, ...options });
  this.scrollTop = options.top || 0;
  this.scrollLeft = options.left || 0;
};
const row = (id) => H.d.querySelector(`[data-testid="notification-${id}"]`);
const rows = () =>
  [...H.d.querySelectorAll('[data-testid^="notification-"]')].filter(
    (e) => !e.dataset.testid.startsWith("notification-chapter-"),
  );
(async () => {
  try {
    await H.click("Notifications");
    await H.click("Nouvelles réservations");
    H.ok(rows().length === 10, "First page bounded");
    await H.click("Voir les précédents");
    H.ok(rows().length === 20, "History grows only on request");
    const viewport = H.d.querySelector('[data-testid="product-scroll"]');
    viewport.scrollTop = 640;
    viewport.dispatchEvent(new H.w.Event("scroll"));
    await H.wait();
    await H.wait();
    const target = rows()[15].dataset.testid;
    H.d.querySelector(`[data-testid="${target}"]`).click();
    await H.wait();
    scrollCalls.length = 0;
    await H.click("Retour");
    await H.wait();
    H.ok(rows().length === 20, "Loaded history survives detail return");
    H.ok(
      scrollCalls.some((c) => c.id === "product-scroll" && c.top === 640),
      "Return requests saved scroll offset",
    );
    await H.click("Réduire l’historique");
    H.ok(rows().length === 10, "History can be collapsed");
    await H.click("Agenda");
    H.ok(!row("volume-calendar"), "Old incident outside first page");
    await H.click("2 actions à traiter");
    H.ok(
      !!row("volume-calendar"),
      "Old read incident accessible without paging",
    );
    H.ok(
      !row("resolved-calendar-0"),
      "Resolved incidents excluded from pending view",
    );
    row("volume-calendar").click();
    await H.wait();
    await H.click("Retour");
    H.ok(
      !!row("volume-calendar"),
      "Read unresolved incident stays in pending view",
    );
    await H.click("Toutes les notifications");
    H.ok(rows().length === 0, "Exit actions returns compact category view");
    await H.click("Agenda");
    await H.click("Voir les précédents");
    H.ok(
      rows().length === 16 && !!row("volume-calendar"),
      "Ordinary history still contains every incident",
    );
    H.ok(
      ![...H.d.querySelectorAll('[role="button"]')].some(
        (e) => e.textContent === "Voir les précédents",
      ),
      "No more button after final page",
    );
    H.finish("notification paging and scroll restoration");
  } catch (e) {
    H.close();
    throw e;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
