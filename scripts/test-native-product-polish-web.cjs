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
const H = require("./native-web-harness.cjs"),
  { w, d, wait, click, input, ok } = H;
let seed = W.loginDemo(
  M.newPreviewStore(),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
seed = W.saveSettings(seed, "0", {
  ...M.configFor(seed, "0"),
  weeklyConfigured: true,
  horizon: 90,
  week: Array.from({ length: 7 }, () => [["09:10", "22:00", null]]),
});
seed = W.saveOffer(seed, {
  ...seed.offers.find((o) => o.id === "0:solo"),
  id: "polish-group",
  kind: "Groupe",
  name: "Running ensemble",
  price: 18,
  capacity: 6,
});
seed = M.openGroup(seed, {
  id: "polish-class",
  offer: seed.offers.find((o) => o.id === "polish-group"),
  day: M.addDays(M.today(), 3),
  time: "18:10",
  address: M.seedCoaches[0].address,
});
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const stored = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
async function field(k, v) {
  input(k, v);
  await wait();
}
async function match(text) {
  const el = [...d.querySelectorAll('[role="button"]')].find((e) =>
    e.textContent.includes(text),
  );
  assert.ok(el, `Missing ${text}: ${d.body.textContent.slice(-1200)}`);
  el.click();
  await wait();
}
async function toggle(label) {
  const el =
    d.querySelector(`[role="switch"][aria-label="${label}"]`) ??
    d.querySelector(`input[aria-label="${label}"]`);
  assert.ok(el);
  el.click();
  await wait();
}
(async () => {
  await wait();
  await wait();
  await click("Réglages");
  ok(
    d.body.textContent.includes("MON OFFRE") &&
      d.body.textContent.includes("MON ORGANISATION") &&
      d.body.textContent.includes("MON COMPTE PROFESSIONNEL"),
    "Coach settings have three groups",
  );
  await click("Disponibilités");
  await field("Début de plage 1", "09:25");
  ok(stored().coachDrafts["0:schedule"].cfg.week[0][0][0]==="09:25", "Draft persisted in device storage");
  await click("Gérer mes séances et leurs tarifs");
  ok(
    d.body.textContent.includes("Créer une séance"),
    "Schedule navigates to offers",
  );
  await click("Retour");
  ok(
    d.body.textContent.includes("À votre rythme."),
    "Back restores correct settings section",
  );
  ok(
    d.querySelector('input[aria-label="Début de plage 1"]').value === "09:25",
    "Draft survives cross-section navigation",
  );
  ok(
    stored().settings["0"].week[0][0][0] === "09:10",
    "Draft not applied to public hours",
  );
  await click("Vers mardi");
  await click("Copier vers ces jours");
  await click("Confirmer la copie");
  await click("Enregistrer les réglages");
  ok(
    stored().settings["0"].week[1][0][0] === "09:25",
    "Copy and sticky save apply selected day",
  );
  await toggle("Fermer cette journée");
  await click("Ajouter une exception");
  const exceptionDay = Object.keys(stored().settings["0"].exceptions)[0];
  await click(exceptionDay);
  ok(
    stored().settings["0"].exceptions[exceptionDay].length === 0,
    "Opening exception does not delete it",
  );
  await click("Supprimer cette exception");
  await click("Conserver l’exception");
  ok(
    stored().settings["0"].exceptions[exceptionDay] !== undefined,
    "Cancel delete preserves exception",
  );
  await click("Supprimer cette exception");
  await click("Confirmer la suppression");
  ok(
    stored().settings["0"].exceptions[exceptionDay] === undefined,
    "Explicit deletion removes exception",
  );
  await click("Retour");
  await click("Séances & tarifs");
  await click("Modifier Coaching individuel");
  await toggle("Domicile");
  await toggle("Studio");
  await click("Enregistrer l’offre");
  ok(
    stored()
      .offers.find((o) => o.id === "0:solo")
      .formats.join() === "Parc",
    "Offer places saved",
  );
  await click("Retour");
  await click("Agenda");
  await click("+ Rendez-vous pris directement");
  await field("Nom du client", "Camille");
  await field("Heure du rendez-vous", "09:10");
  await click("Enregistrer le rendez-vous");
  ok(stored().externalSessions.length === 1, "Direct appointment persisted");
  await click("Retour");
  await click("Pourquoi une heure n’est-elle pas disponible ?");
  await field("Heure à vérifier", "09:10");
  await click("Vérifier ce créneau");
  ok(
    d.body.textContent.includes("rendez-vous hors Partant"),
    "Availability diagnosis explains blocked slot",
  );
  await click("Retour");
  await click("Mes cours en groupe");
  await match("Running ensemble");
  await click("Dupliquer ou répéter ce cours");
  await click("Ajouter cette date");
  await click("Vérifier les dates");
  await click("Confirmer les nouveaux cours");
  ok(stored().groups.length === 2, "Group duplication creates new dated class");
  await match("Running ensemble");
  ok(
    d.body.textContent.includes("0 / 6 places réservées"),
    "New class shows zero participants",
  );
  await click("Retour");
  await click("Retour");
  await click("Réglages");
  await click("Ma checklist de mise en ligne");
  ok(
    d.body.textContent.includes("/ 6 étapes terminées") &&
      d.body.textContent.includes("Prévisualiser mon profil avant publication"),
    "Setup progress and preview available",
  );
  H.finish("product polish");
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-2500));
  console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
