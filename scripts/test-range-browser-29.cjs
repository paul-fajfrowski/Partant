// Shared agenda interaction in Chromium at mobile and desktop widths; fictitious data only.
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
const { chromium } = require(process.env.PARTANT_QA_PLAYWRIGHT);
const out = "/private/tmp/partant-agenda-29";
fs.mkdirSync(out, { recursive: true });
const s = W.loginDemo(
    M.newPreviewStore(),
    "thomas@example.test",
    "",
    "coach",
    false,
  ),
  day = M.today();
s.bookings = [];
s.externalSessions = [];
s.groups = [];
s.closed = [];
s.busyTimes = [];
const a = {
  id: "qa-range-29",
  coach: "0",
  name: "Renforcement individuel",
  kind: "Individuel",
  duration: 30,
  price: 55,
  active: true,
  capacity: 1,
  formats: ["Studio"],
};
s.offers = [a];
s.coachOverrides = { 0: { formats: ["Studio"] } };
s.settings = {
  0: {
    ...M.configFor(s, "0"),
    published: true,
    weeklyConfigured: true,
    notice: 0,
    blocks: [],
    exceptions: {},
    week: Array.from({ length: 7 }, () => [
      ["12:07", "13:07", [a.id], ["Studio"]],
    ]),
    locations: {
      Studio: {
        type: "Salle de musculation",
        name: "Salle Test",
        address: "12 rue de la Roquette, Paris 11e",
        instructions: "",
      },
    },
  },
};
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PARTANT_QA_CHROME,
  });
  let checks = 0;
  const ok = (v, m) => {
    assert.ok(v, m);
    checks++;
  };
  try {
    for (const width of [390, 1440]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 960 },
      });
      await ctx.addInitScript(
        (seed) =>
          localStorage.setItem(
            "partant-native-preview-v1",
            JSON.stringify(seed),
          ),
        s,
      );
      const p = await ctx.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(
        (process.env.PARTANT_QA_URL || "http://127.0.0.1:8094") +
          "/?data=preview",
      );
      const range = p.getByRole("button", {
        name: `Voir la plage du ${M.dayLabel(day)} de 12:07 à 13:07`,
        exact: true,
      });
      await range.waitFor();
      ok(
        (await p
          .getByText("Aucune réservation pour le moment.", { exact: true })
          .count()) > 0,
        "Empty state refers to reservations",
      );
      ok(
        (await p
          .getByText("Aucune séance prévue.", { exact: true })
          .count()) === 0,
        "Ambiguous wording removed",
      );
      const before = await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings["0"].week,
      );
      await p.screenshot({ path: out + `/agenda-${width}.png` });
      await range.click();
      await p
        .getByText("Détail de la disponibilité", { exact: true })
        .waitFor();
      ok(
        (await p
          .getByText("Individuel · 30 min · 55 € / séance", { exact: true })
          .count()) === 1,
        "Correct offer duration and price",
      );
      ok(
        (await p.getByText("Salle Test", { exact: true }).count()) === 1,
        "Correct associated venue",
      );
      ok(
        (await p
          .getByText("12 rue de la Roquette, Paris 11e", { exact: true })
          .count()) === 1,
        "Venue address visible",
      );
      await p.waitForTimeout(350);
      await p.screenshot({ path: out + `/range-${width}.png` });
      await p.getByRole("button", { name: "Fermer", exact: true }).click();
      await p
        .getByText("Détail de la disponibilité", { exact: true })
        .waitFor({ state: "hidden" });
      const after = await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings["0"].week,
      );
      assert.deepEqual(after, before);
      checks++;
      await range.click();
      await p
        .getByText("Détail de la disponibilité", { exact: true })
        .waitFor();
      // The card has its own explicit action for the selected date.
      await p
        .getByRole("button", {
          name: "Modifier les horaires de cette date",
          exact: true,
        })
        .click();
      await p.getByRole("button", { name: /^Date à modifier/ }).waitFor();
      ok(
        !(await p
          .getByText("Détail de la disponibilité", { exact: true })
          .count()),
        "Opening date editor dismisses card",
      );
      const label = await p
        .getByRole("button", { name: /^Date à modifier/ })
        .innerText();
      ok(
        label.includes(day) || label.includes(String(Number(day.slice(-2)))),
        "Editor opens the selected date",
      );
      ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "No horizontal page overflow",
      );
      ok(!errors.length, errors.join("\n"));
      await ctx.close();
    }
    console.log(`PASS ${checks} range-card browser checks; screenshots ${out}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
