const path = require("node:path");
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/privacy-25.cjs",
);
const H = require("./native-web-harness.cjs");
const { d, w, click, input, wait, ok } = H;
const { control } = require("./fixtures/privacy-25.cjs");
const coach = process.env.PARTANT_QA_ROLE === "coach";
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
  throw Error("Expected state not reached: " + d.body.textContent.slice(-1600));
}
(async () => {
  if (coach) {
    await until(() => has("Je suis coach"));
    [...d.querySelectorAll('[role="button"],[role="radio"]')]
      .find((e) => e.textContent.startsWith("Je suis coach"))
      .click();
    await wait();
  }
  await click("Créer mon compte");
  ok(
    button("Confidentialité") && button("Conditions d’utilisation"),
    "Both documents accessible before authentication",
  );
  ok(!d.querySelector('[role="checkbox"]'), "No blanket GDPR checkbox");
  input("Votre prénom et nom", "Essai Confidentialité");
  input("Adresse e-mail", coach ? "thomas@example.test" : "alex@example.test");
  await click("Confidentialité");
  ok(has("Notice de la version de test"), "Draft legal status explicit");
  await click("Qui peut voir quoi ?");
  ok(
    has(
      coach
        ? "Vos justificatifs sont réservés"
        : "Le coach reçoit les informations",
    ),
    "Role-specific notice",
  );
  const accordion = button("Qui peut voir quoi ?");
  ok(
    accordion.getAttribute("aria-expanded") === "true",
    "Accessible accordion state: " + accordion.outerHTML.slice(0, 600),
  );
  await click("Retour");
  ok(
    d.querySelector('[aria-label="Votre prénom et nom"]').value ===
      "Essai Confidentialité",
    "Returning preserves signup name",
  );
  ok(
    d
      .querySelector('[aria-label="Adresse e-mail"]')
      .value.includes("@example.test"),
    "Returning preserves email",
  );
  await click("Conditions d’utilisation");
  ok(has("aucun paiement n’est encaissé"), "Development terms truthful");
  await click("Retour");
  await click("Continuer avec mon e-mail");
  await click("Mon e-mail contient un code");
  input("Code reçu par e-mail", "123456");
  await click("Me connecter");
  await until(
    () =>
      button(coach ? "Réglages" : "Mon espace") ||
      button("Passer pour le moment"),
  );
  if (button("Passer pour le moment")) await click("Passer pour le moment");
  await until(() => button(coach ? "Réglages" : "Mon espace"));
  await click(coach ? "Réglages" : "Mon espace");
  await click("Confidentialité");
  ok(
    has("Vos données.") && button("Exporter mes données"),
    "Privacy center accessible for role",
  );
  ok(
    has("ne comprend pas tous les journaux techniques"),
    "Export scope disclosed",
  );
  ok(
    !!button("Gérer mes agendas connectés") === coach,
    "Calendar controls only for coach",
  );
  let exportedBlob;
  w.URL.createObjectURL = (blob) => {
    exportedBlob = blob;
    return "blob:partant-privacy-test";
  };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  await click("Exporter mes données");
  await until(() => !!exportedBlob);
  const json = await new Promise((resolve, reject) => {
    const reader = new w.FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result));
    reader.onerror = reject;
    reader.readAsText(exportedBlob);
  });
  ok(
    json.account.role === (coach ? "coach" : "client"),
    "Export belongs to active account",
  );
  ok(
    json.scope.includes("hors journaux") && json.noticeVersion,
    "Export carries its actual scope and notice version",
  );
  await click("Faire une demande sur mes données");
  input(
    "Précisions (facultatif)",
    "Je souhaite recevoir les informations conservées sur mon compte.",
  );
  control.fail = true;
  control.delay = 800;
  await click("Envoyer ma demande");
  ok(has("Envoi en cours…"), "Request remains pending before acknowledgement");
  ok(!has("Votre demande est enregistrée"), "No premature success");
  await until(() => has("Échec de test"));
  ok(
    d
      .querySelector('[aria-label="Précisions (facultatif)"]')
      .value.startsWith("Je souhaite"),
    "Failed request preserves content",
  );
  control.fail = false;
  control.delay = 500;
  await click("Envoyer ma demande");
  await until(() => has("Votre demande est enregistrée"));
  ok(button("Suivre ma demande"), "Successful request has follow-up");
  await click("Suivre ma demande");
  ok(
    has("Données personnelles · Accès à mes données"),
    "Rights request visible in private support",
  );
  ok(has("Je souhaite recevoir les informations"), "Sent content retained");
  await click("Retour");
  await click("Retour");
  await click("Supprimer mon compte");
  ok(has("historiqu") && has("en partie anonymisé"), "Deletion scope honest");
  ok(
    button("Faire une demande sur mes données"),
    "Rights request accessible even if self-service deletion blocked",
  );
  await click("Supprimer définitivement mon compte");
  ok(button("Confirmer la suppression"), "Destructive action has confirmation");
  await click("Conserver mon compte");
  ok(!button("Confirmer la suppression"), "Can abandon deletion");
  await click("Supprimer définitivement mon compte");
  control.fail = true;
  control.delay = 600;
  await click("Confirmer la suppression");
  ok(has("Suppression en cours…"), "Deletion waits for server");
  await until(() => has("suppression non enregistrée"));
  ok(
    button("Confirmer la suppression"),
    "Failed deletion leaves account and confirmation usable",
  );
  control.fail = false;
  await click("Confirmer la suppression");
  await until(() => has("Bienvenue chez Partant."));
  ok(!has("Vos données."), "Successful deletion leaves private space");
  H.finish(
    `privacy ${coach ? "coach" : "client"}, information, back navigation and rights request failure/retry`,
  );
})().catch((e) => {
  console.error(e);
  H.close();
  process.exitCode = 1;
});
