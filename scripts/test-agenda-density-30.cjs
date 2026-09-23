// Isolated coach week. No server writes or email sends.
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
const M = require("../apps/mobile/src/product/model.ts");
const {
  coachAgendaPreview,
} = require("../apps/mobile/src/product/coachAgendaPreview.ts");
const {
  availabilityRangeView,
} = require("../apps/mobile/src/product/rangeDetailsModel.ts");
const {
  agendaDay,
} = require("../apps/mobile/src/product/web-agenda/agendaView.ts");
const seed = coachAgendaPreview(),
  day = M.today();
let checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
// Dense fixture even on weekends; gives the same repeatable interaction every day.
seed.settings["0"].week = Array.from(
  { length: 7 },
  () => seed.settings["0"].week[1],
);
const range = seed.settings["0"].week[1][1];
const duplicate = "place:legacy";
seed.coachOverrides["0"].formats.push(duplicate);
seed.settings["0"].locations[duplicate] = {
  ...seed.settings["0"].locations["place:atelier"],
  type: "Autre lieu",
};
for (const o of seed.offers.filter((o) => range[2].includes(o.id)))
  o.formats.push(duplicate);
range[3].push(duplicate);
const selection = { coach: "0", day, range };
let view = availabilityRangeView(seed, selection);
ok(
  view.offers.every((o) => o.locations.length === 1),
  "Legacy aliases of same venue merged",
);
seed.settings["0"].locations[duplicate].instructions = "Entrée distincte";
view = availabilityRangeView(seed, selection);
ok(
  view.offers.every((o) => o.locations.length === 2),
  "Different access instructions not discarded",
);
seed.settings["0"].locations[duplicate].instructions =
  seed.settings["0"].locations["place:atelier"].instructions;
ok(
  agendaDay(seed, "0", day).items.every(
    (item, i, a) => !i || a[i - 1].time <= item.time,
  ),
  "All kinds sorted chronologically",
);
ok(
  availabilityRangeView(seed, { coach: "0", day }) === null,
  "Day selection is not a fabricated range",
);
const { chromium } = require(process.env.PARTANT_QA_PLAYWRIGHT);
const out = "/private/tmp/partant-agenda-30";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PARTANT_QA_CHROME,
  });
  try {
    for (const width of [390, 768, 1440]) {
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
      const all = p.getByRole("button", {
        name: `Voir les 6 plages du ${M.dayLabel(day)}`,
        exact: true,
      });
      await all.waitFor();
      ok(
        (await p
          .getByRole("button", {
            name: `Voir la plage du ${M.dayLabel(day)} de 18:30 à 20:30`,
            exact: true,
          })
          .count()) === 0,
        "Excess ranges collapsed",
      );
      const first = p.getByRole("button", {
        name: `Voir la plage du ${M.dayLabel(day)} de 07:30 à 08:15`,
        exact: true,
      });
      ok(
        await first.evaluate(
          (e) => getComputedStyle(e).borderTopWidth === "0px",
        ),
        "Range is a plain row",
      );
      if (width >= 1080) {
        const tops = await p
          .getByText("MES RENDEZ-VOUS", { exact: true })
          .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().top));
        ok(
          tops.length === 7 && Math.max(...tops) - Math.min(...tops) < 1,
          "Seven appointment sections aligned",
        );
      }
      if (width === 390) {
        ok(
          (await p
            .getByText("Voir les créneaux de", { exact: true })
            .count()) === 0,
          "Secondary departure tools collapsed",
        );
        await p
          .getByRole("button", { name: /Gérer les départs réservables/ })
          .click();
        await p.getByText("Voir les créneaux de", { exact: true }).waitFor();
        checks++;
        await p
          .getByRole("button", { name: /Gérer les départs réservables/ })
          .click();
      }
      await p.screenshot({ path: out + `/agenda-${width}.png` });
      const before = await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings,
      );
      await all.click();
      await p.getByText("Disponibilités du jour", { exact: true }).waitFor();
      const late = p.getByRole("button", {
        name: `Voir la plage du ${M.dayLabel(day)} de 18:30 à 20:30`,
        exact: true,
      });
      await late.waitFor();
      checks++;
      await late.click();
      await p
        .getByText("Détail de la disponibilité", { exact: true })
        .waitFor();
      ok(
        (await p
          .getByText("Détail de la disponibilité", { exact: true })
          .locator("../..")
          .getByText("Atelier Voltaire · lieu de démonstration", {
            exact: true,
          })
          .count()) === 1,
        "Shared location displayed once for both offers",
      );
      const individual = p.getByRole("button", {
        name: "Détails de Renforcement personnalisé",
        exact: true,
      });
      const duo = p.getByRole("button", {
        name: "Détails de Bouger à deux",
        exact: true,
      });
      await individual.click();
      await individual
        .locator('xpath=self::*[@aria-expanded="true"]')
        .waitFor();
      ok(
        (await individual.getAttribute("aria-expanded")) === "true",
        "Offer expands",
      );
      await duo.click();
      await duo.locator('xpath=self::*[@aria-expanded="true"]').waitFor();
      ok(
        (await duo.getAttribute("aria-expanded")) === "true" &&
          (await individual.getAttribute("aria-expanded")) === "false",
        "Only one offer expanded",
      );
      await p.waitForTimeout(400);
      await p.screenshot({ path: out + `/details-${width}.png` });
      await p
        .getByRole("button", { name: "Toutes les plages du jour", exact: true })
        .click();
      await p.getByText("Disponibilités du jour", { exact: true }).waitFor();
      checks++;
      await p.getByRole("button", { name: "Fermer", exact: true }).click();
      const after = await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("partant-native-preview-v1"))
            .settings,
      );
      assert.deepEqual(after, before);
      checks++;
      ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "No horizontal page overflow",
      );
      ok(!errors.length, errors.join("\n"));
      await ctx.close();
    }
    // Explicit preview stays isolated from the normal demo and real account.
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const p = await ctx.newPage();
    await p.goto(
      process.env.PARTANT_QA_URL + "/?data=preview&recette=coach-realiste-30",
    );
    await p.getByText("Mes disponibilités", { exact: true }).waitFor();
    const saved = await p.evaluate(() => ({
      preview: JSON.parse(
        localStorage.getItem("partant-native-recette-coach-realiste-30"),
      ),
      normal: localStorage.getItem("partant-native-preview-v1"),
    }));
    ok(
      saved.preview?.account?.role === "coach" && !saved.normal,
      "Realistic scenario has separate local storage",
    );
    ok(
      saved.preview.groups.length > 0 &&
        saved.preview.externalSessions.length > 0,
      "Realistic coach has mixed appointment types",
    );
    await ctx.close();
    console.log(
      `PASS ${checks} density, detail and realistic-coach checks. Screenshots ${out}`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
