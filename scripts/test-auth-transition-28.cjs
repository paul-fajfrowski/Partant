const path = require("node:path");
const email = process.env.PARTANT_QA_METHOD === "email";
process.env.PARTANT_QA_URL =
  "http://127.0.0.1:8081/?data=connected" + (email ? "" : "&code=fixture28");
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/auth-transition-28.cjs",
);
process.env.PARTANT_QA_STORAGE = JSON.stringify({
  "sb-jhhsysjdeyqsuztjtgea-auth-token-code-verifier": "fixture-verifier",
});
const H = require("./native-web-harness.cjs");
const { control } = require("./fixtures/auth-transition-28.cjs");
control.fail = process.env.PARTANT_QA_FAILURE === "1";
const { d, click, input, wait, ok } = H;
const has = (t) => d.body.textContent.includes(t);
async function until(f, ms = 2500) {
  const end = Date.now() + ms;
  while (!f() && Date.now() < end) await wait();
  ok(
    f(),
    "Expected state before polling interval: " + d.body.textContent.slice(-700),
  );
}
(async () => {
  if (email) {
    await click("Me connecter");
    input("Adresse e-mail", "alex@example.test");
    await click("Continuer avec mon e-mail");
    await click("Mon e-mail contient un code");
    input("Code reçu par e-mail", "123456");
    await click("Me connecter");
  }
  await until(() => control.authAt > 0);
  await until(
    () =>
      has("Votre espace arrive.") ||
      has("Faisons connaissance.") ||
      (email && has("Connexion en cours.")),
  );
  ok(
    !d.querySelector('input[aria-label="Adresse e-mail"]'),
    "Login form is replaced while authenticated profile loads",
  );
  if (control.fail) {
    await until(() => has("Reprenons la connexion."));
    ok(
      !d.querySelector('input[aria-label="Adresse e-mail"]'),
      "Profile failure does not masquerade as signed out",
    );
    control.fail = false;
    await click("Réessayer");
  }
  if (process.env.PARTANT_QA_NEW === "1") {
    await until(() => has("Faisons connaissance."));
    input("Votre prénom et nom", "Camille Test");
    if (process.env.PARTANT_QA_ROLE === "coach") await click("Je suis coach");
    await click("Créer mon espace");
    ok(
      has("Votre espace arrive."),
      "Registration acknowledgement has explicit transition",
    );
  }
  const target =
    process.env.PARTANT_QA_ROLE === "coach"
      ? process.env.PARTANT_QA_NEW === "1"
        ? "Votre dossier coach."
        : "Réglages"
      : process.env.PARTANT_QA_NEW === "1"
        ? "VOS ENVIES"
        : "Explorer";
  await until(
    () =>
      has(target) &&
      !has("Votre espace arrive.") &&
      !has("Faisons connaissance."),
  );
  if (email)
    ok(
      control.guestPending > 0,
      "Guest request remains in flight during login",
    );
  ok(
    Date.now() - control.authAt < 3000,
    "Profile opens without waiting for 5-second poll or guest response",
  );
  if (email)
    ok(
      control.registrations === 1 && control.privateReads === 0,
      "Email verification uses a single profile write, no redundant read",
    );
  control.release?.();
  await wait();
  await wait();
  ok(
    has(target) && !has("Heureux de vous revoir."),
    "Stale guest response cannot overwrite the authenticated screen",
  );
  H.finish(
    "auth transition: " +
      (email ? "email" : "OAuth callback") +
      " " +
      (process.env.PARTANT_QA_ROLE || "client") +
      " " +
      (process.env.PARTANT_QA_WIDTH || 390),
  );
})().catch((e) => {
  console.error(e);
  H.close();
  process.exitCode = 1;
});
