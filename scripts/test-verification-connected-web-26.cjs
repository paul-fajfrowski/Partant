const path = require("node:path");
process.env.PARTANT_QA_ROLE = "coach";
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/verification-26.cjs",
);
const H = require("./native-web-harness.cjs");
const { d, w, click, input, wait, ok } = H;
const { control } = require("./fixtures/verification-26.cjs");
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
  throw Error("Expected state not reached: " + JSON.stringify(control) + d.body.textContent.slice(-1400));
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
  await click("Documents & vérification");
  await click("Vos pratiques et votre statut");
  await click("Running");
  await new Promise(r=>setTimeout(r,750));
  control.delay=900; control.fail=true;
  await click("Enregistrer mes pratiques");
  ok(has("Enregistrement…"),"Dossier save indicates pending server acknowledgement");
  await until(()=>has("L’enregistrement n’a pas abouti"));
  ok(!has("Enregistré"),"Failed dossier save is never confirmed");
  ok(button("Running")?.getAttribute("aria-pressed")==="true","Selected discipline retained after failure");
  control.fail=false;control.delay=0;
  await new Promise(r=>setTimeout(r,750));
  await click("Enregistrer mes pratiques");
  await until(()=>!button("Enregistrer mes pratiques"));
  ok(has("Running"),"Successful retry saved new practice");
  await click("Retour");await click("Documents & vérification");
  ok(has("Running"),"Saved practice retained after navigation");
  H.finish(
    "connected dossier acknowledgement and failure recovery",
  );
})().catch((e) => {
  console.error(e);
  H.close();
  process.exitCode = 1;
});
