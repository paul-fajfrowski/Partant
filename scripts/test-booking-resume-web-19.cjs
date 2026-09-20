const path = require("node:path");
process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
process.env.PARTANT_QA_FETCH_MODULE = path.resolve(
  __dirname,
  "fixtures/auth-connected-19.cjs",
);
const H = require("./native-web-harness.cjs");
const { w, d, wait, click, input, ok } = H;
(async () => {
  await click("Explorer sans compte");
  await click("Demain");
  await wait();
  const slot = [...d.querySelectorAll('[role="button"]')].find((e) =>
    /^\d\d:\d\d$/.test(e.textContent.trim()),
  );
  ok(slot, "Public discovery exposes bookable coach times");
  const chosen = slot.textContent.trim();
  slot.click();
  await wait();
  ok(
    d.body.textContent.includes("Un moment pour vous."),
    "Guest can configure a real session before auth",
  );
  input(
    "Votre objectif pour cette séance (facultatif)",
    "Préparer mon premier 10 km",
  );
  await click("Continuer");
  ok(
    d.body.textContent.includes("Heureux de vous revoir."),
    "Booking requires an account",
  );
  const stored = JSON.parse(w.localStorage.getItem("partant-auth-journey-v1"));
  ok(
    stored.draft.time === chosen &&
      stored.draft.goal === "Préparer mon premier 10 km",
    "Booking context persisted before auth",
  );
  input("Adresse e-mail", "alex@example.test");
  await click("Continuer avec mon e-mail");
  input("Code reçu par e-mail", "123456");
  await click("Me connecter");
  for (
    let i = 0;
    i < 40 && !d.body.textContent.includes("Un moment pour vous.");
    i++
  )
    await wait();
  ok(
    d.body.textContent.includes("Un moment pour vous.") &&
      d.body.textContent.includes(chosen),
    "Authenticated client returns to the selected session",
  );
  ok(
    d.querySelector(
      'textarea[aria-label="Votre objectif pour cette séance (facultatif)"]',
    ).value === "Préparer mon premier 10 km",
    "User objective preserved",
  );
  ok(
    !w.localStorage.getItem("partant-auth-journey-v1"),
    "Saved intent consumed after successful auth",
  );
  H.finish("booking resume");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
