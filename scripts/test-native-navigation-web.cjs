const fs = require("node:fs");
const ts = require("../apps/mobile/node_modules/typescript");
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
const M = require("../apps/mobile/src/product/model.ts");
const W = require("../apps/mobile/src/product/workflows.ts");
const H = require("./native-web-harness.cjs");
const { w, d, wait, click, input, ok } = H;
let seed = W.loginDemo(
  M.newPreviewStore(),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
const alex = W.identities(seed).find((a) => a.name === "Alex");
const b = {
  ...seed.bookings[0],
  id: "coach-thread",
  coach: "0",
  clientId: alex.id,
  clientName: "Alex",
  offerId: "0:solo",
  serviceName: "Coaching individuel",
};
seed.bookings.push(b);
seed.messages[b.id] = [
  { who: alex.id, text: "Merci Thomas pour cette séance.", readBy: [alex.id] },
];
seed.notices = [
  {
    id: "coach-notice",
    recipient: "coach-0",
    body: "Alex a modifié sa séance.",
    booking: b.id,
    read: false,
    category: "changes",
  },
  {
    id: "other-notice",
    recipient: "coach-1",
    body: "Message privé de Sarah",
    booking: "",
    read: false,
  },
];
w.localStorage.setItem("partant-native-preview-v1", JSON.stringify(seed));
const stored = () =>
  JSON.parse(w.localStorage.getItem("partant-native-preview-v1"));
const button = (label) =>
  [...d.querySelectorAll('[role="button"],[role="radio"]')].find(
    (e) =>
      e.getAttribute("aria-label") === label || e.textContent.trim() === label,
  );
const selected = (label) =>
  ["aria-pressed", "aria-selected", "aria-checked"].some(
    (attr) => button(label)?.getAttribute(attr) === "true",
  );
(async () => {
  await wait();
  await wait();
  for (const tab of ["Agenda", "Clients", "Activité", "Réglages"]) {
    await click(tab);
    ok(
      button("Messages") && button("Notifications"),
      `Permanent inbox access on ${tab}`,
    );
  }
  ok(
    button("Messages").textContent.includes("1"),
    "Coach unread-message badge",
  );
  ok(
    button("Notifications").textContent.includes("1"),
    "Coach unread-notification badge",
  );
  ok(
    !d.body.textContent.includes("nouvelle notification"),
    "Settings does not repeat the agenda banner",
  );
  await click("Messages");
  ok(
    d.body.textContent.includes("Nouveau message"),
    "Conversation list marks unread message",
  );
  await click("Alex");
  ok(
    d.body.textContent.includes("Merci Thomas pour cette séance."),
    "Coach can read the client conversation",
  );
  await click("Agenda");
  ok(
    button("Messages").textContent.trim() === "Messages",
    "Reading clears badge but preserves Messages access",
  );
  await click("Notifications");
  ok(
    !d.body.textContent.includes("Message privé de Sarah"),
    "Other coach notifications are isolated",
  );
  await click("Alex a modifié sa séance.");
  ok(
    stored().notices.find((n) => n.id === "coach-notice").read,
    "Notification marked read",
  );
  await click("Retour");
  await click("Agenda");
  ok(
    button("Notifications").textContent.trim() === "Notifications",
    "Notifications remains reachable at zero unread",
  );
  await click("Réglages");
  await click("Me déconnecter");
  [...d.querySelectorAll('[role="radio"]')]
    .find((e) => e.textContent.startsWith("Je veux bouger"))
    .click();
  await wait();
  await click("Créer mon compte");
  input("Votre prénom et nom", "Camille Test");
  input("Adresse e-mail de démonstration", "camille-navigation@example.test");
  await wait();
  await click("Continuer avec mon e-mail");
  input("Code de démonstration", "123456");
  await wait();
  await click("Me connecter");
  await click("Votre pratique : Tout");
  await click("Running");
  await click("Votre objectif : Me remettre en forme");
  await click("Courir plus longtemps");
  await click("Continuer");
  await click("Votre budget maximum par séance : Jusqu’à 80 €");
  await click("Jusqu’à 40 €");
  await click("Distance maximale : 10 km");
  await click("1 km");
  await click("Continuer");
  await click("Le lieu qui vous convient : Je suis flexible");
  await click("En extérieur");
  await click("Votre prochain moment : Libre");
  await click("Demain");
  await click("Découvrir mes coachs");
  ok(
    d.body.textContent.includes("On bouge quand ?"),
    "Signup onboarding reaches Explorer",
  );
  ok(
    !d.body.textContent.includes("Jusqu’à 40 € ×") &&
      !d.body.textContent.includes("1 km max. ×") &&
      !d.body.textContent.includes("Parc ×"),
    "Onboarding does not leave active budget/distance/format filters",
  );
  ok(
    selected("Tout") && selected("Aujourd’hui"),
    "Sport and date start neutral after onboarding",
  );
  const prefs = stored().preferences;
  ok(
    prefs.sport === "Running" &&
      prefs.budget === 40 &&
      prefs.distance === 1 &&
      prefs.format === "Parc" &&
      prefs.moment === "Demain",
    "Personal preferences retained independently of search",
  );
  await click("Trier");
  ok(
    selected("Pour vous"),
    "Personalised order remains available without hard filtering",
  );
  await click("Fermer");
  await click("Demain");
  ok(
    !!button("Voir le profil de Thomas Martin"),
    "Other disciplines and prices remain discoverable",
  );
  await click("Filtres");
  await click("Lieu de la séance : Tous");
  await click("Studio");
  await click("Voir les coachs");
  ok(
    d.body.textContent.includes("Studio ×"),
    "Explicit user search filters still work",
  );
  await click("Mon espace");
  ok(
    ["MES ÉCHANGES", "MES PRÉFÉRENCES", "AIDE & CONFIANCE"].every((t) =>
      d.body.textContent.includes(t),
    ),
    "Client account is grouped by purpose",
  );
  ok(
    !button("Mes séances") &&
      !button("Mes coachs favoris") &&
      !button("Mes demandes"),
    "Duplicate navigation destinations removed",
  );
  await click("Compte & notifications");
  ok(
    d.body.textContent.includes("Rappels avant mes séances"),
    "Account settings and reminders retained",
  );
  await click("Retour");
  await click("Aide & mes demandes");
  ok(
    d.body.textContent.includes("votre demande."),
    "Unified support route available",
  );
  await click("Retour");
  await click("Ajuster mes préférences");
  await click("Passer pour le moment");
  ok(
    !d.body.textContent.includes("Studio ×"),
    "Skipping onboarding also clears stale search filters",
  );
  await click("Mon espace");
  await click("Mes messages");
  ok(
    d.body.textContent.includes("La conversation commence ici."),
    "New customer sees empty inbox despite other accounts bookings",
  );
  ok(
    !d.body.textContent.includes("Merci Thomas"),
    "Previous account conversation is not exposed",
  );
  H.finish("native navigation");
})().catch((e) => {
  console.error(e);
  console.error(d.body.textContent.slice(-5000));
  console.error(H.errors);
  H.close();
  process.exitCode = 1;
});
