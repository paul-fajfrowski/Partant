// Shared UI on mobile-sized and desktop browsers. Isolated fixtures, no live accounts.
const fs = require("node:fs"),
  path = require("node:path"),
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
const { chromium } = require(
    process.env.PARTANT_QA_PLAYWRIGHT || "../tools/qa/node_modules/playwright",
  ),
  M = require("../apps/mobile/src/product/model.ts"),
  W = require("../apps/mobile/src/product/workflows.ts"),
  {
    coachAgendaPreview,
  } = require("../apps/mobile/src/product/coachAgendaPreview.ts");
const out = process.env.PARTANT_QA_SCREENSHOTS || path.resolve("work/qa-results/ux34");
fs.mkdirSync(out, { recursive: true });
let checks = 0;
const ok = (v, label) => {
  assert.ok(v, label);
  checks++;
};
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.PARTANT_QA_CHROME,
  });
  try {
    async function page(width, seed) {
      const p = await b.newPage({ viewport: { width, height: 844 } });
      p.setDefaultTimeout(8000);
      await p.addInitScript(
        (s) =>
          localStorage.setItem("partant-native-preview-v1", JSON.stringify(s)),
        seed,
      );
      await p.goto(
        (process.env.PARTANT_QA_URL || "http://127.0.0.1:8081") +
          "/?data=preview&surface=web",
      );
      return p;
    }
    async function snap(p, name) {
      await p.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
      );
      await p.addScriptTag({ path: process.env.PARTANT_QA_AXE || path.resolve("tools/qa/node_modules/axe-core/axe.min.js") });
      const accessibility = await p.evaluate(async () => {
        const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
        return result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.html) }));
      });
      fs.writeFileSync(path.join(out, name + "-axe.json"), JSON.stringify(accessibility, null, 2));
      ok(accessibility.length === 0, name + " axe checks");
      await p.screenshot({ path: path.join(out, name + ".png") });
      ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        name + " no overflow",
      );
    }
    for (const width of [390, 1440]) {
      const client = W.loginDemo(
          M.newPreviewStore(),
          "alex@example.test",
          "",
          "client",
          false,
        ),
        targetHour = M.slotsFor(
          M.allCoaches(client).find((c) => c.id === "0"),
          M.addDays(M.today(), 1),
          client,
          client.offers.find((o) => o.id === "0:solo"),
        ).at(-1);
      const p = await page(width, client),
        btn = (n) => p.getByRole("button", { name: n, exact: true });
      await btn("Demain").click();
      const query = p.getByPlaceholder("Un sport, un coach, un quartier");
      await query.fill("introuvablexyz");
      await btn("Effacer le texte recherché").waitFor();
      ok(
        (await p.locator("body").innerText()).includes("Aucun résultat pour"),
        "Contextual no-result",
      );
      await btn("Effacer le texte recherché").click();
      ok((await query.inputValue()) === "", "Only query cleared");
      await btn("Date & heure").click();
      await p.getByRole("button", { name: /^À quelle heure/ }).click();
      await p.getByRole("radio", { name: targetHour, exact: true }).click();
      await btn("Voir les disponibilités").click();
      await p
        .getByRole("button", { name: /Voir le profil de Thomas/ })
        .first()
        .click();
      await p.getByRole("button", { name: /Votre prochain créneau/ }).waitFor();
      ok(
        (
          await p
            .getByRole("button", { name: /Votre prochain créneau/ })
            .innerText()
        ).includes(targetHour),
        "Exact hour preserved",
      );
      await snap(p, "profile-" + width);
      await p.getByRole("button", { name: /Votre prochain créneau/ }).click();
      ok(
        (await p.locator("body").innerText())
          .toLowerCase()
          .includes(M.dayLabel(M.addDays(M.today(), 1)).toLowerCase()),
        "Tomorrow preserved in setup",
      );
      await btn("Continuer").click();
      await p.getByRole("button", { name: /^Réserver ·/ }).waitFor();
      ok(
        (await p.locator("body").innerText()).includes(
          "Annulation gratuite jusqu’au",
        ) || (await p.locator("body").innerText()).includes("séance reste due"),
        "Explicit cancellation at confirmation",
      );
      await snap(p, "checkout-" + width);
      await p.getByRole("button", { name: /^Réserver ·/ }).click();
      await btn("Valider le paiement simulé").click();
      await snap(p, "confirmation-" + width);
      await p.close();
    }
    for (const width of [390, 1440]) {
      const dense = coachAgendaPreview();
      const model = dense.offers.find((o) => o.coach === "0");
      for (let i = 0; i < 20; i++)
        dense.offers.push({
          ...model,
          id: "ux34-offer-" + i,
          name: "Formule " + i,
        });
      const p = await page(width, dense),
        btn = (n) => p.getByRole("button", { name: n, exact: true });
      await btn(width < 1080 ? "Configurer" : "Disponibilités").waitFor();
      await snap(p, "coach-agenda-" + width);
      if (width < 1080)
        await p.getByRole("tab", { name: "Réglages", exact: true }).click();
      else await p.getByTestId("desktop-nav-settings").click();
      await btn("Séances & tarifs").click();
      await btn("Nouvelle offre").waitFor();
      await btn("Nouvelle offre").click();
      await btn("Enregistrer l’offre").click();
      const name = p.getByLabel("Nom de la séance", { exact: true });
      await p.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Nom de la séance",
      );
      ok(
        (await name.getAttribute("aria-invalid")) === "true",
        "Error focuses the field",
      );
      ok(
        await p
          .getByText("Donnez un nom à cette séance.", { exact: true })
          .isVisible(),
        "Persistent field error",
      );
      ok(
        (await name.boundingBox()).y < 400,
        "Offer editor starts in viewport with twenty offers",
      );
      await name.fill("Brouillon UX 34");
      await btn("Configurer mes lieux").click();
      if (width < 1080) {
        await btn("Retour").click();
      } else {
        await p.getByTestId("desktop-setting-offers").click();
      }
      await name.waitFor();
      ok(
        (await name.inputValue()) === "Brouillon UX 34",
        "Offer draft retained across places",
      );
      await snap(p, "offer-editor-" + width);
      await btn("Enregistrer l’offre").click();
      await name.waitFor({ state: "hidden" });
      ok(
        await btn("Brouillon UX 34").isVisible(),
        "Saved offer appears in list",
      );
      if (width < 1080) {
        await btn("Retour").click();
        await btn("Disponibilités").click();
      } else await p.getByTestId("desktop-setting-schedule").click();
      const save = btn("Enregistrer les modifications");
      ok(await save.isDisabled(), "Clean weekly schedule cannot resubmit");
      await btn("Configurer lundi").click();
      await btn("Modifier la plage 09:00–11:00").click();
      await p.getByLabel("Fin de plage", { exact: true }).fill("11:15");
      await btn("Valider cette plage").click();
      await p.waitForFunction(
        () =>
          [...document.querySelectorAll('[role="button"]')]
            .find((e) => e.textContent === "Enregistrer les modifications")
            ?.getAttribute("aria-disabled") !== "true",
      );
      ok(
        await save.isEnabled(),
        "Local interval change enables one save action",
      );
      await save.click();
      await p.waitForFunction(
        () =>
          [...document.querySelectorAll('[role="button"]')]
            .find((e) => e.textContent === "Enregistrer les modifications")
            ?.getAttribute("aria-disabled") === "true",
      );
      if (width === 1440) {
        await p.setViewportSize({ width: 1080, height: 844 });
        await p
          .getByRole("button", { name: /Rubrique des réglages/ })
          .waitFor();
        await snap(p, "settings-1080");
      }
      await p.close();
    }
    console.log(
      `PASS ${checks} UX34 booking, empty search, offer editor, draft, validation and save-state checks.`,
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
