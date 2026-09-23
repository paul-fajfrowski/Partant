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
  W = require("../apps/mobile/src/product/workflows.ts"),
  V = require("../apps/mobile/src/product/verification.ts");
const H = require("./native-web-harness.cjs");
const { w, d, click, input, wait, ok } = H;
let seed = W.loginDemo(
  M.newPreviewStore(),
  "coach-documents26@example.test",
  "Camille",
  "coach",
  true,
);
const id = M.coachAccountId(seed);
seed.coachOverrides = { [id]: { sport: "Coaching sportif" } };
seed.testMode = true;
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const saved = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
const has = (t) => d.body.textContent.includes(t);
async function match(t) {
  const e = [...d.querySelectorAll('[role="button"]')].find((e) =>
    e.textContent.trim().startsWith(t),
  );
  if (!e) throw Error("Missing " + t);
  e.click();
  await wait();
}
async function fillFile(label, path, expiry = "") {
  await match(label);
  input("Référence du fichier fictif", path);
  if (expiry) input("Fin de validité (AAAA-MM-JJ)", expiry);
  await wait();
  await click("Enregistrer le document");
  await wait();
}
(async () => {
  await wait();
  await wait();
  await click("Réglages");
  await click("Documents & vérification");
  ok(!has("Compléter plus tard"), "No skipped dossier option");
  ok(
    has("Choisissez ce que vous souhaitez enseigner"),
    "Empty dossier starts with practices",
  );
  await click("Running");
  await click("Pilates");
  await click("Enregistrer mes pratiques");
  ok(
    has("1. Vos pièces communes") && has("2. Vos qualifications par pratique"),
    "Common dossier and scoped practices separated",
  );
  ok(!has("Complétez les quatre"), "No fixed four-document wall");
  const future = M.addDays(M.today(), 365);
  await fillFile("Identité", "identite-fictive.pdf");
  await fillFile("Assurance professionnelle", "assurance-fictive.pdf", future);
  await match("Running");
  await click("Ajouter · Diplôme ou certification");
  input("Référence du fichier fictif", "diplome-fictif.pdf");
  await wait();
  await click("Enregistrer le document");
  await click("Ajouter · Carte professionnelle");
  input("Référence du fichier fictif", "carte-fictive.pdf");
  input("Fin de validité (AAAA-MM-JJ)", future);
  await wait();
  await click("Enregistrer le document");
  await click("Soumettre Running");
  ok(
    V.practiceState(
      saved().settings[id].dossier.verification,
      "Running",
      M.today(),
    ) === "pending",
    "Complete practice submitted from screen",
  );
  await match("Pilates");
  ok(
    has("Utiliser « Diplôme ou certification » pour Pilates"),
    "Existing proof can be reused without upload",
  );
  await click("Utiliser « Diplôme ou certification » pour Pilates");
  await click("Utiliser « Carte professionnelle » pour Pilates");
  await click("Soumettre Pilates");
  ok(
    saved().settings[id].dossier.verification.files.length === 4,
    "Two disciplines use four total documents, not eight",
  );
  ok(
    V.practiceState(
      saved().settings[id].dossier.verification,
      "Running",
      M.today(),
    ) === "pending",
    "Reuse keeps existing submission intact",
  );
  ok(
    V.practiceState(
      saved().settings[id].dossier.verification,
      "Pilates",
      M.today(),
    ) === "pending",
    "Second discipline submitted separately",
  );
  await match("Vos pratiques et votre statut");
  await click("Votre situation professionnelle : Professionnel qualifié");
  await click("En cours de formation");
  await click("Enregistrer mes pratiques");
  if (!has("Attestation de stagiaire")) await match("Pilates");
  ok(has("Attestation de stagiaire"), "Trainee requirements adapt");
  ok(
    !has("Ajouter · Carte professionnelle"),
    "Trainee not forced to upload professional card",
  );
  await click("Voir l’historique des vérifications");
  ok(has("Pratique soumise"), "History uses readable scoped labels");
  await click("Retour");
  await click("Documents & vérification");
  ok(has("2") || has("Pilates"), "Returning to section retains dossier");
  H.finish("adaptive verification, reusable proofs and dossier-first UX");
})().catch((e) => {
  console.error(e);
  H.close();
  process.exitCode = 1;
});
