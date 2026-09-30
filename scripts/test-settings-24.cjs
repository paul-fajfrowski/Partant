const path = require("node:path");
process.env.PARTANT_QA_ROLE = "coach";
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/settings-24.cjs",
);
const H = require("./native-web-harness.cjs");
const { d, w, click, input, wait, ok } = H;
const { control } = require("./fixtures/settings-24.cjs");
const has = (t) => d.body.textContent.includes(t);
const button = (t) =>
  [...d.querySelectorAll('[role="button"],[role="tab"]')].find(
    (e) => e.textContent.trim() === t || e.getAttribute("aria-label") === t,
  );
async function until(fn) {
  for (let i = 0; i < 70; i++) {
    if (fn()) return;
    await wait();
  }
  throw Error(
    "Expected state not reached: " +
      JSON.stringify(control) +
      d.body.textContent.slice(-1400),
  );
}
// jsdom has no CSS animation clock. Finish only a modal already fading out.
function offerEditorClosed() {
  let node = d.querySelector('[aria-label="Nom de la séance"]');
  while (node) {
    const css = w.getComputedStyle(node);
    if (css.opacity === "0" && css.pointerEvents === "none") {
      for (const type of [
        "animationend",
        "webkitAnimationEnd",
        "oAnimationEnd",
      ])
        node.dispatchEvent(new w.Event(type, { bubbles: true }));
      break;
    }
    node = node.parentElement;
  }
  return !d.querySelector('[aria-label="Nom de la séance"]');
}
(async () => {
  await click("Me connecter");
  input("Adresse e-mail", "thomas@example.test");
  await click("Continuer avec mon e-mail");
  await click("Mon e-mail contient un code");
  input("Code reçu par e-mail", "123456");
  await click("Me connecter");
  await until(() => button("Réglages"));
  await click("Réglages");
  await click("Votre profil");
  ok(
    !has("Vos modifications restent en brouillon"),
    "No repetitive draft banner",
  );
  input("Votre phrase d’introduction", "Nouvelle approche en attente");
  await new Promise((r) => setTimeout(r, 750));
  await wait();
  control.delay = 900;
  await click("Enregistrer");
  ok(has("Enregistrement…"), "Saving state stays in pressed button");
  ok(!has("Enregistrement sur Partant"), "No shifting global saving banner");
  ok(!has("Enregistré"), "No success before server acknowledgement");
  await until(() => has("Enregistré"));
  ok(has("Enregistré"), "Acknowledged save confirmed");
  await new Promise((r) => setTimeout(r, 2300));
  input("Votre phrase d’introduction", "Modification à réessayer");
  await new Promise((r) => setTimeout(r, 750));
  control.fail = true;
  await click("Enregistrer");
  await until(() => has("Échec de test"));
  ok(!has("Enregistré"), "Failed save never marked successful");
  ok(
    d.querySelector('[aria-label="Votre phrase d’introduction"]').value ===
      "Modification à réessayer",
    "Form retained on error",
  );
  control.fail = false;
  control.delay = 0;
  await new Promise((r) => setTimeout(r, 650));
  await click("Enregistrer");
  await until(() => has("Enregistré"));
  await click("Retour");
  await click("Séances & tarifs");
  ok(!has("Créez une offre par formule"), "Offer explanatory wall removed");
  await click("Nouvelle offre");
  input("Nom de la séance", "Séance test UX 34");
  control.delay = 900;
  await click("Enregistrer l’offre");
  ok(
    !!d.querySelector('[aria-label="Nom de la séance"]'),
    "Offer editor stays open while server saves",
  );
  ok(
    !has("Offre enregistrée."),
    "Offer does not announce success before acknowledgement",
  );
  await until(offerEditorClosed);
  ok(
    !!button("Séance test UX 34"),
    "Offer editor closes after acknowledged save",
  );
  // A second creation exercises refusal/retry without the legacy fixture’s distinct coach/account IDs.
  await click("Nouvelle offre");
  input("Nom de la séance", "Séance à réessayer UX 34");
  control.fail = true;
  await click("Enregistrer l’offre");
  await until(() => has("Échec de test"));
  ok(
    d.querySelector('[aria-label="Nom de la séance"]')?.value ===
      "Séance à réessayer UX 34",
    "Offer failure retains editor and draft",
  );
  control.fail = false;
  control.delay = 0;
  await click("Enregistrer l’offre");
  await until(offerEditorClosed);
  ok(
    !!button("Séance à réessayer UX 34"),
    "Offer retry closes only on acknowledgement",
  );
  await click("Retour");
  await click("Préférences de notification");
  await until(() => has("Vos échanges"));
  ok(
    d.querySelectorAll('[aria-label="Rappels de séance"]').length === 1,
    "One reminder control",
  );
  ok(!button("Enregistrer"), "Preferences do not need a second save");
  await click("Retour");
  control.logoutDelay = process.env.PARTANT_QA_OFFLINE ? 120000 : 1800;
  const logout = button("Me déconnecter");
  ok(logout, "Logout available");
  logout.click();
  await wait();
  ok(has("Un coach."), "Private workspace leaves before remote logout ends");
  ok(!has("Mon compte professionnel"), "No private settings after logout");
  await new Promise((r) =>
    setTimeout(r, process.env.PARTANT_QA_OFFLINE ? 3300 : 2300),
  );
  const sessions = Object.keys(w.localStorage).filter(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
  );
  ok(
    sessions.every((k) => !w.localStorage.getItem(k)),
    "Persisted Auth session removed",
  );
  H.finish(
    "coach settings, acknowledgements, failure recovery and delayed logout",
  );
})().catch((e) => {
  console.error(e);
  H.close();
  process.exitCode = 1;
});
