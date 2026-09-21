const path = require("node:path");
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/auth-connected-19.cjs",
);
const H = require("./native-web-harness.cjs");
const { w, d, wait, click, input, ok } = H;
const button = (label) =>
  H.findButton
    ? H.findButton(label)
    : [...d.querySelectorAll('[role="button"],[role="tab"]')].find(
        (e) =>
          e.getAttribute("aria-label") === label ||
          e.textContent.trim() === label,
      );
(async () => {
  await click("Explorer sans compte");
  await click("Mon espace");
  ok(
    d.body.textContent.includes("Un compte pour passer à l’action."),
    "Guest has invitation, no pretend profile",
  );
  ok(
    !d.body.textContent.includes("Bonjour, Invité") &&
      !d.body.textContent.includes("Compte & notifications"),
    "Guest has no account settings",
  );
  await click("Continuer à explorer");
  await click("Favoris");
  ok(
    d.body.textContent.includes("Gardez vos coachs favoris."),
    "Guest favorites explain sign-in",
  );
  await click("Me connecter");
  ok(
    !d.body.textContent.includes("configuré dans Supabase"),
    "No implementation copy in login",
  );
  input("Adresse e-mail", "alex@example.test");
  await click("Continuer avec mon e-mail");
  await click("Mon e-mail contient un code");
  input("Code reçu par e-mail", "123456");
  await click("Me connecter");
  for (
    let i = 0;
    i < 40 &&
    !d.body.textContent.includes(
      process.env.PARTANT_QA_ROLE === "coach"
        ? "Votre agenda"
        : "Les bons liens",
    );
    i++
  )
    await wait();
  if (process.env.PARTANT_QA_ROLE === "coach") {
    ok(
      !button("Passer côté client"),
      "Coach cannot switch into consumer screens",
    );
    ok(
      button("Mon compte professionnel"),
      "Coach has professional account entry",
    );
    await click("Mon compte professionnel");
    ok(
      d.body.textContent.includes("E-mail de connexion"),
      "Coach account settings remain accessible",
    );
  } else {
    ok(
      d.body.textContent.includes("Les bons liens"),
      "Existing client resumes guest destination after email auth",
    );
    await click("Mon espace");
    ok(
      !button("Passer côté coach") && button("Devenir coach"),
      "Client sees application, no role switch",
    );
    await click("Devenir coach");
    input(
      "Votre projet de coaching",
      "Coach de running à Paris avec cinq années d’expérience.",
    );
    await click("Envoyer ma demande");
    await wait();
    ok(
      d.body.textContent.includes("Candidature coach :"),
      "Professional application visible in own support history",
    );
    ok(
      require("./fixtures/auth-connected-19.cjs").snapshot().account.role ===
        "client",
      "Application never grants coach privileges",
    );
  }
  H.finish("connected auth journey");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
