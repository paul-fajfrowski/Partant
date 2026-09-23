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
const {
  coachAgendaPreview,
} = require("../apps/mobile/src/product/coachAgendaPreview.ts");
const { chromium } = require(process.env.PARTANT_QA_PLAYWRIGHT);
const seed = coachAgendaPreview(),
  out = "/private/tmp/partant-navigation-32";
fs.mkdirSync(out, { recursive: true });
let checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
// The stack models route-independent layers; exactly one is consumed per back.
const { createBackStack } = require("../apps/mobile/src/product/backStack.ts");
const stack = createBackStack(),
  seen = [];
ok(!stack.consume(), "Empty stack falls through to route history");
const dayOff = stack.register(() => seen.push("day"));
const modalOff = stack.register(() => seen.push("modal"), 100);
const nestedOff = stack.register(() => seen.push("nested"), 101);
stack.consume();
ok(seen.join() === "nested", "Nested modal alone receives back");
nestedOff();
stack.consume();
ok(seen.join() === "nested,modal", "Parent modal restored");
modalOff();
stack.consume();
ok(seen.at(-1) === "day", "Day precedes route");
dayOff();
ok(!stack.has() && !stack.consume(), "Unmount removes stale handlers");
const a = stack.register(() => seen.push("a"));
const b = stack.register(() => seen.push("b"));
stack.consume();
ok(seen.at(-1) === "b", "Latest equal priority wins");
b();
a();
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PARTANT_QA_CHROME,
  });
  try {
    for (const width of [390, 1280, 1440]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 960 },
      });
      await ctx.addInitScript(
        (s) =>
          localStorage.setItem("partant-native-preview-v1", JSON.stringify(s)),
        seed,
      );
      const p = await ctx.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.setDefaultTimeout(8000);
      await p.goto(process.env.PARTANT_QA_URL + "/?data=preview");
      const btn = (name) => p.getByRole("button", { name, exact: true });
      const waitText = async (text) => {
        await p.getByText(text, { exact: true }).waitFor();
        checks++;
      };
      await btn(width < 1080 ? "Configurer" : "Disponibilités").click();
      await btn("Configurer lundi").click();
      await btn("Modifier la plage 09:00–11:00").waitFor();
      if (width < 1360) {
        await btn("Retour").click();
        await btn("Configurer lundi").waitFor();
        checks++;
        ok(
          (await btn("Modifier la plage 09:00–11:00").count()) === 0,
          "Top back restores week, not settings",
        );
        await btn("Configurer lundi").click();
      }
      const open = () => btn("Modifier la plage 09:00–11:00").click();
      const back = () => btn("Retour dans la fenêtre").last().click();
      await open();
      await p.getByRole("button", { name: /Séances proposées/ }).click();
      await back();
      await p
        .getByRole("textbox", { name: "Début de plage", exact: true })
        .waitFor();
      checks++;
      await p.getByRole("button", { name: /Lieu de la plage/ }).click();
      await p.waitForTimeout(400);
      await p.keyboard.press("Escape");
      await p
        .getByRole("textbox", { name: "Début de plage", exact: true })
        .waitFor();
      checks++;
      // Escape consumed once: day editor is still behind the open modal.
      await p
        .getByRole("textbox", { name: "Début de plage", exact: true })
        .fill("09:15");
      await p.waitForTimeout(400);
      await p.keyboard.press("Escape");
      await waitText("Quitter cette modification ?");
      await back();
      ok(
        (await p
          .getByRole("textbox", { name: "Début de plage", exact: true })
          .inputValue()) === "09:15",
        "Back from discard keeps draft",
      );
      await p.screenshot({ path: out + `/edit-${width}.png` });
      await p.waitForTimeout(400);
      await p.keyboard.press("Escape");
      await btn("Abandonner ces changements").click();
      await open();
      ok(
        (await p
          .getByRole("textbox", { name: "Début de plage", exact: true })
          .inputValue()) === "09:00",
        "Explicit discard restores saved value",
      );
      await btn("Retirer cette plage").click();
      await btn("Confirmer le retrait").waitFor();
      await back();
      await p
        .getByRole("textbox", { name: "Début de plage", exact: true })
        .waitFor();
      checks++;
      await back();
      await btn("Copier ce jour").click();
      await btn("Mardi").click();
      await btn("Continuer la copie").click();
      await waitText("Remplacer ces journées ?");
      await back();
      await btn("Continuer la copie").waitFor();
      checks++;
      await p.waitForTimeout(400);
      await p.keyboard.press("Escape");
      await btn("Copier ce jour").waitFor();
      ok(
        (await btn("Confirmer la copie").count()) === 0,
        "Copy back does not replace days",
      );
      const saved = await p.evaluate(() =>
        JSON.parse(localStorage.getItem("partant-native-preview-v1")),
      );
      assert.deepEqual(saved.settings["0"].week, seed.settings["0"].week);
      checks++;
      if (width < 1360) await btn("Retour").click();
      await btn("Retour").click();
      await btn(width < 1080 ? "Configurer" : "Disponibilités").waitFor();
      checks++;
      // Re-enter after unmount: no stale modal/day handlers intercept the route.
      await btn(width < 1080 ? "Configurer" : "Disponibilités").click();
      await btn("Retour").click();
      await btn(width < 1080 ? "Configurer" : "Disponibilités").waitFor();
      checks++;
      // An applied day edit remains recoverable while traversing week and settings.
      await btn(width < 1080 ? "Configurer" : "Disponibilités").click();
      await btn("Configurer lundi").click();
      await open();
      await p
        .getByRole("textbox", { name: "Début de plage", exact: true })
        .fill("09:15");
      await btn("Appliquer à la journée").click();
      if (width < 1360) await btn("Retour").click();
      await btn("Retour").click();
      await btn(width < 1080 ? "Configurer" : "Disponibilités").click();
      await btn("Configurer lundi").click();
      await btn("Modifier la plage 09:15–11:00").waitFor();
      checks++;
      if (width < 1360) await btn("Retour").click();
      await btn("Retour").click();
      // Drill down from the bounded agenda list, then return through its two levels.
      await p
        .getByRole("button", { name: /^Voir les 6 plages du/ })
        .first()
        .click();
      await waitText("Disponibilités du jour");
      await p
        .getByRole("button", { name: /^Voir la plage du/ })
        .last()
        .click();
      await waitText("Détail de la disponibilité");
      await back();
      await waitText("Disponibilités du jour");
      await back();
      await p
        .getByText("Disponibilités du jour", { exact: true })
        .waitFor({ state: "hidden" });
      checks++;
      await p
        .getByRole("button", { name: /^Voir la plage du/ })
        .first()
        .click();
      await waitText("Détail de la disponibilité");
      await back();
      await p
        .getByText("Détail de la disponibilité", { exact: true })
        .waitFor({ state: "hidden" });
      checks++;
      if (width === 390) {
        await p.getByRole("tab", { name: "Réglages", exact: true }).click();
        const sections =
          require("../apps/mobile/src/reference/prototype.json").coachSections;
        for (const [id, , title] of sections) {
          await btn(
            id === "notifications" ? "Préférences de notification" : title,
          ).click();
          await btn("Retour").waitFor();
          if (id === "schedule") {
            await btn("Configurer lundi").click();
            await btn("Retour").click();
            await btn("Configurer lundi").waitFor();
            checks++;
          }
          await btn("Retour").click();
          await btn("Ma checklist de mise en ligne").waitFor();
          checks++;
        }
        for (const title of [
          "Préparer vos clients",
          "Mon compte",
          "Ma checklist de mise en ligne",
        ]) {
          await btn(title).click();
          await btn("Retour").click();
          await btn("Ma checklist de mise en ligne").waitFor();
          checks++;
        }
        await btn("Confidentialité").click();
        await btn("Supprimer mon compte").click();
        await btn("Supprimer définitivement mon compte").click();
        await btn("Confirmer la suppression").waitFor();
        await btn("Retour").click();
        await btn("Supprimer définitivement mon compte").waitFor();
        checks++;
        ok(
          (await btn("Confirmer la suppression").count()) === 0,
          "Back cancels deletion confirmation",
        );
        await btn("Retour").click();
        await btn("Supprimer mon compte").waitFor();
        checks++;
        await btn("Retour").click();
        await btn("Ma checklist de mise en ligne").waitFor();
        checks++;
        await p.getByRole("tab", { name: "Agenda", exact: true }).click();
        const M = require("../apps/mobile/src/product/model.ts");
        const future = seed.bookings.find(
          (b) => b.day > M.today() && b.time === "18:30",
        );
        await btn(M.dayLabel(future.day)).click();
        await p.getByRole("button", { name: /^18:30 ·/ }).click();
        await btn("Annuler la séance côté coach").click();
        await btn("Confirmer l’annulation").waitFor();
        await btn("Retour").click();
        await btn("Annuler la séance côté coach").waitFor();
        ok(
          (await btn("Confirmer l’annulation").count()) === 0,
          "Back cancels coach cancellation prompt",
        );
        await btn("Retour").click();
        await btn("Configurer").waitFor();
        checks++;
        const after = await p.evaluate(() =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1")),
        );
        ok(
          after.account.id === seed.account.id,
          "Account survives back from deletion",
        );
        assert.deepEqual(
          after.bookings.filter((b) => b.day > M.today()),
          seed.bookings.filter((b) => b.day > M.today()),
        );
        checks++;
        ok(
          after.bookings.length === seed.bookings.length,
          "Back preserves all bookings",
        );
      }
      ok(!errors.length, errors.join("\n"));
      await ctx.close();
    }
    // Client nested filters: Escape closes only the foremost selector.
    const M = require("../apps/mobile/src/product/model.ts"),
      W = require("../apps/mobile/src/product/workflows.ts");
    const client = W.loginDemo(
      M.newPreviewStore(),
      "alex@example.test",
      "",
      "client",
      false,
    );
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 960 },
    });
    await ctx.addInitScript(
      (s) =>
        localStorage.setItem("partant-native-preview-v1", JSON.stringify(s)),
      client,
    );
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    await p.goto(process.env.PARTANT_QA_URL + "/?data=preview");
    const btn = (name) => p.getByRole("button", { name, exact: true });
    await btn("Filtres").click();
    await btn("Lieu de la séance : Tous").click();
    await p.waitForTimeout(400);
    await p.keyboard.press("Escape");
    await btn("Voir les coachs").waitFor();
    checks++;
    ok(
      await btn("Lieu de la séance : Tous").isVisible(),
      "Nested selector back preserves filters",
    );
    await p.waitForTimeout(400);
    await p.keyboard.press("Escape");
    await btn("Voir les coachs").waitFor({ state: "hidden" });
    checks++;
    await p.getByRole("tab", { name: "Mon espace", exact: true }).click();
    for (const label of [
      "Mes messages",
      "Mes notifications",
      "Compte & notifications",
      "Aide & mes demandes",
      "Confidentialité",
    ]) {
      await btn(label).click();
      await btn("Retour").click();
      await btn("Compte & notifications").waitFor();
      checks++;
    }
    await ctx.close();
    console.log(`PASS ${checks} navigation layer checks; screenshots ${out}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
