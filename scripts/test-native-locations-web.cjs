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
  week: Array.from({ length: 7 }, () => [["09:10", "21:00"]]),
});
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const stored = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
async function field(k, v) {
  input(k, v);
  await wait();
}
async function toggle(label) {
  const e =
    d.querySelector(`[role="switch"][aria-label="${label}"]`) ??
    d.querySelector(`input[aria-label="${label}"]`);
  assert.ok(e, "Switch " + label);
  e.click();
  await wait();
}
(async () => {
  await wait();
  await wait();
  ok(
    !d.body.textContent.includes("Pourquoi une heure"),
    "Diagnostic absent from daily agenda",
  );
  await click("Réglages");
  await click("Disponibilités");
  ok(
    !d.body.textContent.includes("À votre rythme.") &&
      !d.body.textContent.includes("Vous choisissez les jours"),
    "Redundant introduction removed",
  );
  await click("Aide : comprendre un créneau indisponible");
  ok(
    d.body.textContent.includes("Comprendre un créneau."),
    "Diagnostic still accessible as secondary help",
  );
  await click("Retour");
  await click("Retour");
  await click("Lieux & déplacements");
  ok(
    d.body.textContent.includes("+ Salle de musculation"),
    "Relevant suggestions for strength coach",
  );
  await click("+ Salle de musculation");
  await field("Nom du lieu", "Salle République");
  await field("Adresse du lieu", "10 avenue de la République, Paris");
  await field("Accès et consignes", "Abonnement nécessaire.");
  await click("Enregistrer les lieux");
  let loc = stored().settings["0"].locations,
    gymId = Object.keys(loc).find((k) => loc[k].name === "Salle République");
  ok(!!gymId, "Named gym persisted");
  await click("+ Salle de musculation");
  await field("Nom du lieu", "Salle Bastille");
  await field("Adresse du lieu", "12 rue de la Roquette, Paris");
  await click("Enregistrer les lieux");
  loc = stored().settings["0"].locations;
  ok(
    Object.values(loc).filter((p) => p.type === "Salle de musculation")
      .length === 2,
    "Multiple gyms supported independently",
  );
  await click("Chez le client");
  await field("Secteur de déplacement", "Paris 11e et 12e");
  await field("Rayon de déplacement à domicile (km)", "8");
  await field("Supplément déplacement à domicile (€)", "7");
  await click("Enregistrer les lieux");
  ok(
    stored().settings["0"].locations.Domicile.radius === 8 &&
      stored().settings["0"].locations.Domicile.travelFee === 7,
    "Home service has sector radius and surcharge",
  );
  await click("Associer mes lieux à mes séances");
  await click("Modifier Coaching individuel");
  loc = stored().settings["0"].locations;
  for (const [id, p] of Object.entries(loc)) {
    if (id !== gymId) await toggle(`${p.type} · ${p.name}`);
  }
  await click("Enregistrer l’offre");
  ok(
    stored()
      .offers.find((o) => o.id === "0:solo")
      .formats.join() === gymId,
    "Specific gym assigned to offer",
  );
  await click("Retour");
  await click("Retour");
  await click("Prévisualiser mon profil");
  ok(
    d.body.textContent.includes("Salle République") &&
      d.body.textContent.includes("Salle Bastille"),
    "Public profile lists named venues",
  );
  const next = [...d.querySelectorAll('[role="button"]')].find((e) =>
    e.textContent.includes("Prochain départ"),
  );
  assert.ok(next);
  next.click();
  await wait();
  ok(
    d.body.textContent.includes("Un moment pour vous."),
    "A future coach-selected slot opens booking",
  );
  ok(
    d.body.textContent.includes("Salle République") &&
      d.body.textContent.includes("10 avenue de la République"),
    "Booking shows selected gym name and address",
  );
  ok(
    d.body.textContent.includes("Abonnement nécessaire."),
    "Access requirements shown before checkout",
  );
  ok(
    !d.body.textContent.includes("Salle Bastille"),
    "Unassigned gym absent from booking choices",
  );
  H.finish("coach locations");
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-3000));
  console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
