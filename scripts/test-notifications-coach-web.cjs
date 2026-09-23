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
const H = require("./native-web-harness.cjs"),
  { w, d, click, wait, ok } = H;
let s = W.loginDemo(
  M.newPreviewStore(),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
const cfg = M.configFor(s, "0");
s = {
  ...s,
  settings: {
    ...s.settings,
    0: { ...cfg, dossier: { ...cfg.dossier, status: "correction" } },
  },
  calendarStatus: {
    0: { connected: true, updatedAt: Date.now(), error: "token expired" },
  },
};
s = W.notify(
  s,
  s.account.id,
  "Votre dossier est à compléter.",
  "",
  "dossier-test",
  { event: "dossier" },
);
s = W.maintain(s);
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(s));
const row = (id) => d.querySelector(`[data-testid="notification-${id}"]`);
(async () => {
  try {
    await wait();
    await wait();
    await click("Notifications");
    const calendar = s.notices.find((n) => n.event === "calendar");
    ok(
      !row("dossier-test") && !row(calendar.id),
      "Coach chapters start collapsed",
    );
    await click("Agenda");
    ok(!!row(calendar.id), "Calendar chapter reveals relevant action");
    row(calendar.id).click();
    await wait();
    ok(
      d.body.textContent.includes("Google Calendar"),
      "Calendar action opens calendar configuration",
    );
    await click("Retour");
    ok(!!row(calendar.id), "Reading incident does not resolve it");
    await click("Dossier coach");
    ok(!row(calendar.id), "Only current chapter is expanded");
    row("dossier-test").click();
    await wait();
    ok(
      d.body.textContent.includes("À corriger"),
      "Dossier action opens actual correction",
    );
    ok(
      d.body.textContent.includes("Votre dossier coach."),
      "Correct document editor reached",
    );
    await click("Retour");
    ok(
      !row("dossier-test").getAttribute("aria-label").startsWith("Non lue."),
      "Read action stays visible without unread dot",
    );
    H.finish("notification coach actions");
  } catch (e) {
    H.close();
    throw e;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
