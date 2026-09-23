// Visual and interactive acceptance of the incomplete dossier, using fictitious files only.
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
const out =
  process.env.PARTANT_QA_SCREENSHOTS || "/private/tmp/partant-documents-28";
fs.mkdirSync(out, { recursive: true });
const base = W.loginDemo(
  M.newPreviewStore(),
  "documents28@example.test",
  "Camille Test",
  "coach",
  true,
);
const id = M.coachAccountId(base);
base.coachOverrides = {
  [id]: { sport: "Sports de combat", disciplines: ["Sports de combat"] },
};
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PARTANT_QA_CHROME,
    headless: true,
  });
  let count = 0;
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 950 },
      });
      await context.addInitScript(
        (seed) =>
          localStorage.setItem(
            "partant-native-preview-v1",
            JSON.stringify(seed),
          ),
        base,
      );
      const p = await context.newPage();
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(
        (process.env.PARTANT_QA_URL || "http://127.0.0.1:8093") +
          "/?data=preview",
      );
      await p
        .getByRole(width >= 1080 ? "button" : "tab", {
          name: "Réglages",
          exact: true,
        })
        .click();
      await p
        .getByRole("button", {
          name:
            width >= 1080
              ? "Documents & vérifications"
              : "Documents & vérification",
          exact: true,
        })
        .click();
      await p.getByText("Votre dossier coach.", { exact: true }).waitFor();
      assert(await p.getByText("0 sur 2 ajoutées.", { exact: false }).count());
      count++;
      assert(
        await p
          .getByText("2 pièces spécifiques à ajouter", { exact: false })
          .count(),
      );
      count++;
      assert.equal(
        await p
          .getByText("4 justificatifs à compléter", { exact: false })
          .count(),
        0,
      );
      count++;
      await p.screenshot({ path: out + `/documents-${width}.png` });
      await p
        .getByRole("button", { name: "Compléter · Identité", exact: true })
        .click();
      await p
        .getByLabel("Référence du fichier fictif", { exact: true })
        .fill("identite-fictive.pdf");
      assert(
        await p
          .getByLabel("Référence du fichier fictif", { exact: true })
          .isVisible(),
      );
      count++;
      await p.waitForTimeout(400); // Let the modal fade finish before visual inspection.
      await p.screenshot({ path: out + `/document-editor-${width}.png` });
      await p
        .getByRole("button", { name: "Enregistrer le document", exact: true })
        .click();
      await p
        .getByRole("button", {
          name: "Compléter · Assurance professionnelle",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await p
          .getByLabel("Référence du fichier fictif", { exact: true })
          .count(),
        0,
      );
      count++;
      assert(await p.getByText("1 sur 2 ajoutées.", { exact: false }).count());
      count++;
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert(!overflow);
      count++;
      assert.equal(errors.length, 0, errors.join("\n"));
      count++;
      await context.close();
    }
    console.log(`PASS ${count} dossier browser checks; screenshots ${out}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
