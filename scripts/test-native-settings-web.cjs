const fs = require("node:fs"),
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
const M = require("../apps/mobile/src/product/model.ts"),
  W = require("../apps/mobile/src/product/workflows.ts");
const H = require("./native-web-harness.cjs");
const { w, d, wait, click, input, ok } = H;
let seed = W.loginDemo(
  M.newPreviewStore(),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
seed.testMode = true;
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const stored = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
async function toggle(label) {
  const e =
    d.querySelector(`[aria-label="${label}"][role="switch"]`) ??
    d.querySelector(`input[aria-label="${label}"]`);
  assert.ok(e, "Missing switch " + label);
  e.click();
  await wait();
}
async function match(text) {
  const e = [...d.querySelectorAll('[role="button"]')].find((e) =>
    e.textContent.includes(text),
  );
  assert.ok(e, "Missing clickable " + text);
  e.click();
  await wait();
}
(async () => {
  await wait();
  await wait();
  await click("Réglages");
  await click("Votre profil");
  input(
    "Votre phrase d’introduction",
    "Avançons ensemble, séance après séance.",
  );
  await click("Choisir le portrait 4");
  await click("Enregistrer");
  ok(
    stored().coachOverrides["0"].quote ===
      "Avançons ensemble, séance après séance.",
    "Coach profile text saved",
  );
  ok(stored().coachOverrides["0"].photo === 3, "Portrait selection saved");
  await click("Retour");
  await click("Séances & tarifs");
  await click("Modifier Coaching individuel");
  input("Prix de la séance (€)", "65");
  await wait();
  await click("Enregistrer l’offre");
  ok(
    stored().offers.find((o) => o.id === "0:solo").price === 65,
    "Offer edit replaces price without creating duplicate",
  );
  await click("Retour");
  await click("Lieux & déplacements");
  await click("Chez le client");
  input("Supplément déplacement à domicile (€)", "5");
  await wait();
  await click("Enregistrer les lieux");
  ok(stored().settings["0"].travelFee === 5, "Travel fee persists");
  await click("Retour");
  await click("Disponibilités");
  await click("Enregistrer la semaine");
  ok(stored().settings["0"].weeklyConfigured, "Weekly schedule saved");
  await click("Modifier une seule date");
  await toggle("Fermer cette journée");
  await click("Enregistrer cette date");
  ok(
    Object.values(stored().settings["0"].exceptions).some(
      (v) => v.length === 0,
    ),
    "Dated closure saved",
  );
  await click("Retour");
  await click("Retour");
  await click("Préparer vos clients");
  input("À apporter", "Une serviette et une bouteille d’eau.");
  await wait();
  await click("Enregistrer les consignes");
  ok(
    stored().settings["0"].preparation.bring ===
      "Une serviette et une bouteille d’eau.",
    "Preparation instructions saved",
  );
  await click("Retour");
  await click("Documents & vérification");
  await click("Soumettre le dossier fictif");
  ok(stored().settings["0"].dossier.status === "pending", "Dossier submitted");
  ok(
    stored().settings["0"].published === false,
    "Submission closes publication",
  );
  await click("Retour");
  await click("À propos de la simulation");
  await click("Ouvrir l’espace équipe");
  await click("Thomas Martin");
  input(
    "Motif de la décision",
    "Quatre références fictives présentes et cohérentes.",
  );
  await wait();
  await click("Enregistrer la décision");
  ok(
    stored().settings["0"].dossier.status === "approved",
    "Team decision recorded",
  );
  ok(
    stored().settings["0"].published === false,
    "Approval does not auto-publish",
  );
  await click("Retour");
  await click("Choisir un compte fictif");
  await click("Alex");
  await click("Séances");
  await click("Passées");
  await match("Sarah Dubois");
  await click("Laisser un avis");
  input(
    "Votre expérience",
    "Une séance adaptée, des explications très claires.",
  );
  await wait();
  await click("Publier mon avis");
  ok(
    stored().reviews.some((r) => r.coach === "1" && r.rating === 5),
    "Completed-session review published",
  );
  ok(
    d.body.textContent.includes("Historique") ||
      d.body.textContent.includes("Votre objectif"),
    "Returned to session detail",
  );
  H.finish();
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-3500));
  console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
