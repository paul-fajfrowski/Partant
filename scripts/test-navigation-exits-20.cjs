const path = require("node:path");
const connected = process.env.PARTANT_QA_SCENARIO !== "booking";
if (connected) {
  process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
  process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
    __dirname,
    "fixtures/auth-connected-19.cjs",
  );
}
const H = require("./native-web-harness.cjs");
const { d, w, wait, click, input, ok } = H;
const findButton = (label) =>
  [...d.querySelectorAll('[role="button"],[role="tab"]')].find(
    (e) =>
      e.getAttribute("aria-label") === label || e.textContent.trim() === label,
  );
const has = (text) => d.body.textContent.includes(text);
async function exits(label = "Revenir à l’exploration") {
  ok(findButton("Retour"), "Secondary page has a back button");
  ok(findButton(label), "Secondary page has a route to its role-specific home");
}
async function login() {
  input(
    connected ? "Adresse e-mail" : "Adresse e-mail de démonstration",
    "alex@example.test",
  );
  await click(
    findButton("Saisir le code déjà reçu")
      ? "Saisir le code déjà reçu"
      : "Continuer avec mon e-mail",
  );
  input(connected ? "Code reçu par e-mail" : "Code de démonstration", "123456");
  await click("Me connecter");
  await wait();
  await wait();
}
(async () => {
  await click("Explorer sans compte");
  await click("Mon espace");
  if (connected) {
    await click("Me connecter");
    await exits();
    await click("Retour");
    ok(
      has("Un compte pour passer à l’action."),
      "Guest auth back restores the invitation",
    );
    await click("Me connecter");
    await click("Revenir à l’exploration");
    ok(has("On bouge quand ?"), "Guest can abandon login to explore");
    await click("Demain");
    const slot = [...d.querySelectorAll('[role="button"]')].find((e) =>
      /^\d\d:\d\d$/.test(e.textContent.trim()),
    );
    slot.click();
    await wait();
    input(
      "Votre objectif pour cette séance (facultatif)",
      "Préparer mon premier 10 km",
    );
    await click("Continuer");
    input("Adresse e-mail", "alex@example.test");
    await click("Continuer avec mon e-mail");
    await exits();
    await click("Retour");
    ok(
      has("Heureux de vous revoir."),
      "Code back edits email instead of leaving the journey",
    );
    ok(
      JSON.parse(w.localStorage.getItem("partant-auth-journey-v1")).draft
        .goal === "Préparer mon premier 10 km",
      "Email correction preserves booking intent",
    );
    if (process.env.PARTANT_QA_SCENARIO === "incomplete") {
      await login();
      ok(
        has("Faisons connaissance."),
        "New authenticated account opens completion",
      );
      await exits();
      await click("Retour");
      ok(
        has("Continuer sans terminer l’inscription ?"),
        "Abandonment is explicit before signing out",
      );
      await click("Terminer mon inscription");
      ok(
        has("Faisons connaissance."),
        "Can dismiss exit confirmation and keep editing",
      );
      await click("Revenir à l’exploration");
      await click("Quitter et explorer");
      await wait();
      await wait();
      ok(
        has("On bouge quand ?"),
        "Incomplete account can return to public exploration",
      );
      await click("Mon espace");
      ok(
        has("Un compte pour passer à l’action."),
        "Abandonment leaves no half-authenticated account interface",
      );
    } else {
      await login();
      const coach = process.env.PARTANT_QA_ROLE === "coach";
      if (coach) {
        await click("Réglages");
        await click("Mon compte professionnel");
        await exits("Revenir à mon agenda");
        await click("Revenir à mon agenda");
        ok(has("Votre agenda"), "Coach exit returns to Agenda");
        ok(!findButton("Explorer"), "Coach home never switches roles");
        for (const label of ["Messages", "Notifications"]) {
          await click(label);
          await exits("Revenir à mon agenda");
          await click("Retour");
          ok(has("Votre agenda"), `${label} restores coach origin`);
        }
      } else {
        ok(has("Un moment pour vous."), "Client auth resumes the booking");
        await click("Revenir à l’exploration");
        ok(
          has("On bouge quand ?"),
          "Resumed journey with empty history has an exit",
        );
        await click("Mon espace");
        await click("Devenir coach");
        await exits();
        input(
          "Votre projet de coaching",
          "Un projet de coaching running à Paris.",
        );
        await click("Retour");
        ok(
          has("Bonjour, Alex"),
          "Coach application goes back to client account",
        );
        await click("Devenir coach");
        ok(
          d
            .querySelector(
              'input[aria-label="Votre projet de coaching"],textarea[aria-label="Votre projet de coaching"]',
            )
            .value.includes("running"),
          "Application text retained after return",
        );
        await click("Revenir à l’exploration");
        for (const label of [
          "Mes messages",
          "Mes notifications",
          "Compte & notifications",
          "Aide & mes demandes",
        ]) {
          await click("Mon espace");
          await click(label);
          await exits();
          await click("Retour");
          ok(has("Bonjour, Alex"), `${label} restores account`);
        }
        await click("Ajuster mes préférences");
        await click("Continuer");
        await click("Retour");
        ok(has("1 / 3"), "Onboarding back goes to the previous step");
        await click("Retour");
        ok(has("Bonjour, Alex"), "First onboarding step returns to its origin");
      }
    }
  } else {
    // Exercise finalization with the local payment simulator, without real requests.
    await click("Explorer");
    await click("Demain");
    await click("Voir le profil de Thomas Martin");
    await exits();
    await click("Choisir mon créneau");
    await click("Continuer");
    await login();
    const pay = [...d.querySelectorAll('[role="button"]')].find((e) =>
      e.textContent.includes("Réserver ·"),
    );
    ok(pay, "Booking summary reached");
    pay.click();
    await wait();
    await click("Valider le paiement simulé");
    ok(has("Vous êtes partant."), "Booking confirmed");
    await exits();
    await click("Voir ma séance");
    await click("Retour");
    ok(
      has("Vos rendez-vous") && !findButton("Retour"),
      "Detail returns to sessions, never to checkout or confirmation",
    );
    ok(
      !has("Valider le paiement simulé"),
      "Confirmed payment cannot be repeated by going back",
    );
  }
  H.finish(
    `navigation exits ${process.env.PARTANT_QA_SCENARIO || process.env.PARTANT_QA_ROLE || "client"}`,
  );
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-2500));
  H.close();
  process.exitCode = 1;
});
