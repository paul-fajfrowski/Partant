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
seed = W.saveOffer(seed, {
  ...seed.offers.find((o) => o.id === "0:solo"),
  id: "short",
  name: "Renforcement express",
  price: 30,
  duration: 30,
});
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const stored = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
async function toggle(label) {
  const e =
    d.querySelector(`[aria-label="${label}"][role="switch"]`) ??
    d.querySelector(`input[aria-label="${label}"]`);
  assert.ok(e, `Missing switch ${label}`);
  e.click();
  await wait();
}
async function field(label, value) {
  input(label, value);
  await wait();
}
(async () => {
  await wait();
  await wait();
  await click("Réglages");
  await click("Disponibilités");
  ok(
    d.body.textContent.includes("pas un rendez-vous"),
    "Explains range versus appointment",
  );
  await field("Début de plage 1", "09:00");
  await field("Fin de plage 1", "12:00");
  await click("Séances de la plage 1");
  await toggle("Toutes mes séances");
  await toggle("Proposer Coaching duo");
  await toggle("Proposer Renforcement express");
  await click("Appliquer à cette plage");
  ok(
    d.body.textContent.includes("Coaching individuel · 60 min · 50 €"),
    "Assigned offer price visible in schedule",
  );
  await click("Ajouter une plage");
  await field("Début de plage 2", "14:00");
  await field("Fin de plage 2", "17:00");
  await click("Séances de la plage 2");
  await toggle("Toutes mes séances");
  await toggle("Proposer Coaching individuel");
  await toggle("Proposer Coaching duo");
  await click("Appliquer à cette plage");
  // Editing the hours must preserve the selected offers.
  await field("Fin de plage 2", "17:30");
  await field("Fin de plage 2", "17:00");
  await click("Ajouter une plage");
  await click("Ajouter une plage");
  await click("Enregistrer la semaine");
  const monday = stored().settings["0"].week[0];
  ok(monday.length === 4, "Coach can save a fourth range");
  ok(
    monday[0][2].join() === "0:solo" && monday[1][2].join() === "short",
    "Offer assignments persist after editing hours",
  );
  await click("Retour");
  await click("Agenda");
  await click("Voir les créneaux de : Coaching individuel · 60 min · 50 €");
  await click("Renforcement express · 30 min · 30 €");
  ok(
    d.body.textContent.includes("30 min · 30 €/séance"),
    "Agenda uses selected offer price/duration",
  );
  await click("Réglages");
  await click("Me déconnecter");
  [...d.querySelectorAll('[role="radio"]')]
    .find((e) => e.textContent.startsWith("Je veux bouger"))
    .click();
  await wait();
  await click("Me connecter");
  await click("Continuer avec mon e-mail");
  await field("Code de démonstration", "123456");
  await click("Me connecter");
  let mondayDate = M.today();
  for (let i = 0; i < 7; i++) {
    const day = M.addDays(M.today(), i);
    if (new Date(day + "T12:00:00Z").getUTCDay() === 1) {
      mondayDate = day;
      break;
    }
  }
  await click("Date & heure");
  await click(M.dayLabel(mondayDate));
  await click("À quelle heure ? : Toutes les heures");
  await click("14:00");
  await click("Voir les disponibilités");
  ok(
    d.body.textContent.includes("Thomas Martin") &&
      d.body.textContent.includes("Renforcement express"),
    "Discovery finds coach using the offer available at requested time",
  );
  await click("Voir la carte");
  ok(
    [...d.querySelectorAll('[role="button"]')].some(
      (e) => e.textContent.trim() === "30 €",
    ),
    "Map shows the available offer price",
  );
  await click("Voir la liste");
  await click("Voir le profil de Thomas Martin");
  await click("Renforcement express · 30 €");
  await click("14:00");
  ok(
    d.body.textContent.includes("30 min") &&
      d.body.textContent.includes("30 €"),
    "Customer sees selected duration and price",
  );
  await click("Continuer");
  await click("Réserver · 30 €");
  await click("Valider le paiement simulé");
  const booking = stored().bookings.find(
    (b) => b.offerId === "short" && b.day === mondayDate,
  );
  ok(
    booking &&
      booking.price === 30 &&
      booking.duration === 30 &&
      booking.time === "14:00",
    "End-to-end booking uses allowed offer and tariff",
  );
  H.finish("native offer scheduling");
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-5000));
  console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
