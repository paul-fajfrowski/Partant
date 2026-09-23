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
  out = "/private/tmp/partant-availability-31";
fs.mkdirSync(out, { recursive: true });
let checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
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
      await p.goto(process.env.PARTANT_QA_URL + "/?data=preview");
      await p
        .getByRole("button", {
          name: width < 1080 ? "Configurer" : "Disponibilités",
          exact: true,
        })
        .click();
      await p.getByText("Semaine habituelle", { exact: true }).waitFor();
      ok(
        (await p
          .getByRole("textbox", { name: "Début de plage", exact: true })
          .count()) === 0,
        "Week does not expose fields",
      );
      ok(
        (await p
          .getByRole("button", {
            name: /^Configurer (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/,
          })
          .count()) === 7,
        "Seven clear day summaries",
      );
      await p.screenshot({ path: out + `/week-${width}.png` });
      await p
        .getByRole("button", { name: "Configurer lundi", exact: true })
        .click();
      await p
        .getByRole("button", {
          name: "Modifier la plage 09:00–11:00",
          exact: true,
        })
        .waitFor();
      ok(
        (await p.getByRole("textbox").count()) === 0,
        "Day contains summaries, not six forms",
      );
      ok(
        (await p
          .getByRole("button", { name: "Copier ce jour", exact: true })
          .count()) === 1,
        "Copy accessible as secondary action",
      );
      await p.screenshot({ path: out + `/day-${width}.png` });
      const open = () =>
        p
          .getByRole("button", {
            name: "Modifier la plage 09:00–11:00",
            exact: true,
          })
          .click();
      await open();
      const start = p.getByRole("textbox", {
          name: "Début de plage",
          exact: true,
        }),
        end = p.getByRole("textbox", { name: "Fin de plage", exact: true });
      ok(
        (await start.inputValue()) === "09:00" &&
          (await end.inputValue()) === "11:00",
        "Selected times retained",
      );
      await start.fill("07:45");
      await p
        .getByText("Cette plage chevauche 07:30–08:15. Ajustez vos horaires.", {
          exact: true,
        })
        .waitFor();
      ok(
        await p
          .getByRole("button", { name: "Appliquer à la journée", exact: true })
          .isDisabled(),
        "Overlapping interval cannot be applied",
      );
      await start.fill("12:00");
      await p
        .getByText("La fin doit être après le début.", { exact: true })
        .waitFor();
      checks++;
      await p
        .getByRole("button", { name: "Fermer", exact: true })
        .last()
        .click();
      await p
        .getByRole("button", { name: "Continuer à modifier", exact: true })
        .waitFor();
      checks++;
      await p
        .getByRole("button", {
          name: "Abandonner ces changements",
          exact: true,
        })
        .click();
      await open();
      ok(
        (await start.inputValue()) === "09:00",
        "Abandoned edit did not change range",
      );
      await p
        .getByRole("button", { name: "Dupliquer cette plage", exact: true })
        .click();
      ok(
        (await start.inputValue()) === "" && (await end.inputValue()) === "",
        "Duplicate has no imposed times",
      );
      await start.fill("11:00");
      await end.fill("12:00");
      await p.getByRole("button", { name: /Séances proposées/ }).click();
      ok(
        await p
          .getByRole("switch", {
            name: "Proposer Renforcement personnalisé",
            exact: true,
          })
          .isChecked(),
        "Duplicated offer retained",
      );
      ok(
        await p
          .getByRole("switch", { name: "Proposer Bouger à deux", exact: true })
          .isChecked(),
        "Second offer retained",
      );
      await p
        .getByRole("button", { name: "Revenir aux horaires", exact: true })
        .click();
      await p.waitForTimeout(400);
      await p.screenshot({ path: out + `/edit-${width}.png` });
      await p
        .getByRole("button", { name: "Appliquer à la journée", exact: true })
        .click();
      await p
        .getByRole("button", {
          name: "Modifier la plage 11:00–12:00",
          exact: true,
        })
        .waitFor();
      checks++;
      const rows = await p
        .getByRole("button", { name: /^Modifier la plage/ })
        .allTextContents();
      ok(rows[2].startsWith("11:00–12:00"), "Added duplicate sorted by time");
      const notSaved = await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings["0"].week,
      );
      ok(notSaved[0].length === 6, "Apply remains a draft until explicit save");
      await p
        .getByRole("button", { name: "Copier ce jour", exact: true })
        .click();
      await p.getByRole("button", { name: "Mardi", exact: true }).click();
      await p
        .getByRole("button", { name: "Continuer la copie", exact: true })
        .click();
      await p.getByText("Remplacer ces journées ?", { exact: true }).waitFor();
      checks++;
      await p
        .getByRole("button", { name: "Confirmer la copie", exact: true })
        .click();
      await p
        .getByRole("button", {
          name: "Enregistrer les modifications",
          exact: true,
        })
        .click();
      await p.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings["0"].week[0].length === 7,
      );
      const saved = await p.evaluate(() =>
        JSON.parse(localStorage.getItem("partant-native-preview-v1")),
      );
      ok(
        saved.settings["0"].week[1].length === 7,
        "Confirmed copy saved to Tuesday",
      );
      assert.deepEqual(
        saved.settings["0"].week[0][2].slice(2),
        seed.settings["0"].week[0][1].slice(2),
      );
      checks++;
      ok(
        saved.bookings.length === seed.bookings.length &&
          saved.bookings.every((b) =>
            seed.bookings.some((old) => old.id === b.id && old.time === b.time),
          ),
        "Existing bookings preserved",
      );
      // Existing interval removal is confirmed; cancellation leaves it intact.
      await p
        .getByRole("button", {
          name: "Modifier la plage 11:00–12:00",
          exact: true,
        })
        .click();
      await p
        .getByRole("button", { name: "Retirer cette plage", exact: true })
        .click();
      await p
        .getByRole("button", { name: "Confirmer le retrait", exact: true })
        .waitFor();
      checks++;
      await p
        .getByRole("button", { name: "Fermer", exact: true })
        .last()
        .click();
      await p
        .getByRole("button", {
          name: "Modifier la plage 11:00–12:00",
          exact: true,
        })
        .waitFor();
      checks++;
      await p
        .getByRole("button", {
          name: "Modifier la plage 11:00–12:00",
          exact: true,
        })
        .click();
      await p
        .getByRole("button", { name: "Retirer cette plage", exact: true })
        .click();
      await p
        .getByRole("button", { name: "Confirmer le retrait", exact: true })
        .click();
      await p
        .getByRole("button", {
          name: "Modifier la plage 11:00–12:00",
          exact: true,
        })
        .waitFor({ state: "hidden" });
      await p
        .getByRole("button", {
          name: "Enregistrer les modifications",
          exact: true,
        })
        .click();
      await p.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings["0"].week[0].length === 6,
      );
      checks++;
      if (width < 1360)
        await p
          .getByRole("button", { name: "Retour à la semaine", exact: true })
          .click();
      await p
        .getByRole("button", { name: "Configurer dimanche", exact: true })
        .click();
      await p
        .getByText("Aucune disponibilité. Ajoutez votre première plage.", {
          exact: true,
        })
        .waitFor();
      checks++;
      await p
        .getByRole("button", { name: "Ajouter une plage", exact: true })
        .click();
      ok(
        (await start.inputValue()) === "" && (await end.inputValue()) === "",
        "New day opens empty times",
      );
      await p
        .getByRole("button", { name: "Fermer", exact: true })
        .last()
        .click();
      ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "No horizontal overflow",
      );
      ok(!errors.length, errors.join("\n"));
      await ctx.close();
    }
    console.log(
      `PASS ${checks} availability editor checks; screenshots ${out}`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
