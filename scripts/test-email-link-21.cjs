const path = require("node:path");
const callback = process.argv[2] === "callback";
process.env.PARTANT_QA_URL =
  "http://127.0.0.1:8081/?data=connected" +
  (callback ? "&code=email-callback-fixture" : "");
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/auth-connected-19.cjs",
);
const H = require("./native-web-harness.cjs");
const { d, w, wait, click, input, ok } = H;
// The link completes a request initiated on this device, with its PKCE verifier.
if (callback) w.localStorage.setItem('sb-jhhsysjdeyqsuztjtgea-auth-token-code-verifier', JSON.stringify('fixture-only-pkce-verifier'));
const has = (text) => d.body.textContent.includes(text);
(async () => {
  if (callback) {
    for (let i = 0; i < 60 && !has("On bouge quand ?"); i++) await wait();
    ok(
      has("On bouge quand ?"),
      "Email PKCE callback opens authenticated discovery",
    );
    ok(
      !new URL(w.location.href).searchParams.has("code"),
      "Callback code removed from browser URL",
    );
    await click("Mon espace");
    ok(has("Bonjour, Alex"), "Callback loaded actual customer account");
  } else {
    await click("Créer mon compte");
    input("Votre prénom et nom", "Camille Lien");
    input("Adresse e-mail", "camille@example.test");
    await click("Continuer avec mon e-mail");
    ok(
      has("Votre lien vous attend."),
      "Default path matches delivered magic link",
    );
    ok(
      !d.querySelector('input[aria-label="Code reçu par e-mail"]'),
      "No compulsory OTP field",
    );
    ok(has("ce même appareil"), "Same-device PKCE requirement explained");
    const intent = JSON.parse(w.localStorage.getItem("partant-auth-intent"));
    ok(
      intent.name === "Camille Lien" && intent.role === "client",
      "Signup intent survives return from mail app",
    );
    const resend = [...d.querySelectorAll('[role="button"]')].find((e) =>
      e.textContent.includes("Renvoyer le lien dans"),
    );
    ok(
      resend?.getAttribute("aria-disabled") === "true",
      "Resend respects cooldown",
    );
    await click("Mon e-mail contient un code");
    ok(
      d.querySelector('input[aria-label="Code reçu par e-mail"]'),
      "OTP entry remains optional",
    );
    await click("Mon e-mail contient un lien");
    ok(
      has("Votre lien vous attend."),
      "Can return from optional code to link instructions",
    );
    await click("Modifier l’adresse e-mail");
    ok(has("Votre prochaine étape."), "Edit email returns to signup");
    await click("Reprendre ma connexion par e-mail");
    ok(
      has("Votre lien vous attend."),
      "Sent link path reopens without resending",
    );
  }
  H.finish("email link " + (callback ? "callback" : "instructions"));
})().catch((e) => {
  console.error(e); console.error(d.body.textContent.slice(-2000)); console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
