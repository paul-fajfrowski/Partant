const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const {
  JSDOM,
  VirtualConsole,
} = require("../work/qa-runtime/node_modules/jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "apps/mobile/dist/index.html"),
  "utf8",
);
const scripts = [
  ...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g),
].map((m) =>
  fs.readFileSync(path.join(root, "apps/mobile/dist", m[1]), "utf8"),
);
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  if (!e.message.includes("Not implemented")) errors.push(e.message);
});
vc.on("error", (...a) => errors.push(a.join(" ")));
const dom = new JSDOM(
  html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/g, ""),
  {
    url: "http://127.0.0.1:8081/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      Object.defineProperty(w, "innerWidth", { value: 390 });
      Object.defineProperty(w, "innerHeight", { value: 844 });

      w.matchMedia = (q) => ({
        matches: false,
        media: q,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      });
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.fetch = fetch;
      w.Headers = Headers;
      w.Request = Request;
      w.Response = Response;
      w.AbortController = AbortController;
      w.FontFace = class {
        constructor(name) {
          this.family = name;
          this.status = "loaded";
        }
        load() {
          return Promise.resolve(this);
        }
      };
      Object.defineProperty(w.document, "fonts", {
        value: {
          ready: Promise.resolve(),
          check: () => true,
          add() {},
          load: () => Promise.resolve([{}]),
        },
      });
      w.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      w.HTMLElement.prototype.scrollTo = function () {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
    },
  },
);
const w = dom.window,
  d = w.document;
Object.defineProperty(w.document.documentElement, "clientWidth", {
  get: () => 390,
});
Object.defineProperty(w.document.documentElement, "clientHeight", {
  get: () => 844,
});
for (const script of scripts) w.eval(script);
const wait = () => new Promise((r) => setTimeout(r, 150));
let count = 0;
function ok(value, msg) {
  assert.ok(value, msg);
  count++;
}
function button(text) {
  const el = [
    ...d.querySelectorAll('[role="button"],button,[role="tab"],[role="radio"]'),
  ].find(
    (el) =>
      el.textContent.trim() === text || el.getAttribute("aria-label") === text,
  );
  assert.ok(el, `Missing button ${text}\n${d.body.textContent.slice(-1000)}`);
  return el;
}
async function click(text) {
  button(text).click();
  await wait();
}
function input(label, value) {
  const el = d.querySelector(
    `input[aria-label="${label}"],textarea[aria-label="${label}"]`,
  );
  assert.ok(el, `Missing input ${label}`);
  Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA"
      ? w.HTMLTextAreaElement.prototype
      : w.HTMLInputElement.prototype,
    "value",
  ).set.call(el, value);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
}
(async () => {
  await wait();
  await wait();
  ok(
    d.body.textContent.replace(/\s+/g, " ").includes("Un coach. Votre rythme."),
    "Welcome headline matches the reference",
  );
  ok(
    !d.body.textContent.includes("À vous de jouer."),
    "Technical pilot is not the default interface",
  );
  await click("À propos de la simulation");await click("Test · comptes et incidents");await click("Retour");
  await click("Explorer d’abord");
  ok(d.body.textContent.includes("On bouge quand ?"), "Explore headline");
  await click("Demain");
  ok(d.body.textContent.includes("Thomas Martin"), "Seed coaches displayed");
  await click("Ajouter Thomas Martin aux favoris");
  ok(
    d.body.textContent.includes("On bouge quand ?"),
    "Favorite button does not open profile",
  );
  await click("Favoris");
  ok(d.body.textContent.includes("se gardent."), "Favorites headline");
  ok(
    d.body.textContent.includes("Thomas Martin"),
    "Favorite persisted in native state",
  );
  await click("Explorer");
  await click("Voir le profil de Thomas Martin");
  ok(d.body.textContent.includes("Faire connaissance"), "Native coach profile");
  await click("Retour");
  await click("Date & heure");
  ok(d.body.textContent.includes("Votre prochain moment"), "Native date modal");
  await click("Fermer");
  await click("Mon espace");
  await click("Ajuster mes préférences");
  ok(d.body.textContent.includes("VOS ENVIES"), "Onboarding");
  await click("Votre pratique : Tout");
  await click("Running");
  await click("Votre objectif : Me remettre en forme");
  ok(
    d.body.textContent.includes("Courir plus longtemps"),
    "Running-specific objectives",
  );
  ok(
    !d.body.textContent.includes("Apprendre à nager"),
    "No unrelated swimming goal",
  );
  await click("Courir plus longtemps");
  await click("Continuer");
  await click("Paris 11e");
  input("Commune ou code postal", "Versailles");
  await wait();
  ok(d.body.textContent.includes("Versailles"), "IDF sector search");
  await click("Fermer");
  await click("Retour");
  await click("Retour");
  await click("Explorer");
  await click("Demain");
  await click("Voir le profil de Thomas Martin");
  await click("Choisir mon créneau");
  ok(d.body.textContent.includes("Un moment pour vous."), "Session setup");
  await click("Continuer");
  ok(
    d.body.textContent.includes("Heureux de vous revoir."),
    "Guest checkout requires identity",
  );
  await click("Continuer avec mon e-mail");
  input("Code de démonstration", "123456");
  await wait();
  await click("Me connecter");
  ok(
    d.body.textContent.includes("Vous y êtes presque."),
    "Selection survives authentication",
  );
  ok(
    d.body.textContent.includes("Frais de réservation0 €"),
    "Reference fee wording",
  );
  const pay = [...d.querySelectorAll('[role="button"]')].find((e) =>
    e.textContent.includes("Réserver ·"),
  );
  assert.ok(pay);
  pay.click();
  await wait();
  await click("Tester un refus bancaire");
  ok(
    d.body.textContent.includes("Paiement refusé."),
    "Payment refusal does not confirm",
  );
  await click("Réessayer avec ma sélection");await click("Valider le paiement simulé");
  ok(
    d.body.textContent.includes("Vous êtes partant."),
    "Successful simulated booking",
  );
  await click("Voir ma séance");
  ok(d.body.textContent.includes("Modifier ma séance"), "Booking management");
  await click("Retour");
  await click("Retrouver mes séances");
  await click("Mon espace");
  await click("Passer côté coach");
  await click("Continuer avec mon e-mail");
  input("Code de démonstration", "123456");
  await wait();
  await click("Me connecter");
  ok(
    /nouvelles? notifications?/.test(d.body.textContent),
    "Coach sees booking notification",
  );
  await click("Mes cours en groupe");
  ok(
    d.body.textContent.includes("Une énergie collective."),
    "Dated group planning",
  );
  await click('Gérer mes offres');input('Nom de la séance','Renforcement collectif');await click('Format : Individuel');await click('Groupe');input('Prix par personne (€)','20');input('Nombre maximum de participants','6');await wait();await click('Enregistrer l’offre');
  ok(d.body.textContent.includes('Renforcement collectif'),'Coach creates a group offer');
  await click('Retour');await click('Mes cours en groupe');await click('Planifier un cours');await click('Ouvrir ce cours');
  ok(d.body.textContent.includes('6 places maximum'),'Dated class retains coach capacity');
  await click('Retour');await click('Réglages');await click('Me déconnecter');
  await click('Explorer d’abord');await click('Demain');await click('Voir le profil de Thomas Martin');await click('Renforcement collectif · 20 €');
  ok([...d.querySelectorAll('[role="button"]')].some(e=>e.textContent==='18:00'),'Group class available on customer profile');await click('18:00');
  ok(d.body.textContent.includes('Combien de participants ?'),'Customer can choose group seats');
  await click('Combien de participants ? : 1 personne');await click('3 personnes');await click('Continuer');
  await click('Continuer avec mon e-mail');input('Code de démonstration','123456');await wait();await click('Me connecter');
  const payGroup=[...d.querySelectorAll('[role="button"]')].find(e=>e.textContent.includes('Réserver · 60 €'));ok(payGroup,'Group checkout uses total for three seats');payGroup.click();await wait();await click('Valider le paiement simulé');await click('Voir ma séance');
  await click('Annuler certaines places');await click('Confirmer les places à garder');ok(d.body.textContent.includes('3 → 1 places'),'Partial cancellation updates history');
  await click('Signaler un imprévu');input('Votre message','Je voudrais une précision sur le lieu du cours.');await wait();await click('Envoyer ma demande');ok(d.body.textContent.includes('En cours de traitement'),'Support request visible to its owner');
  await click('Retour');await click('Retour');await click('Retour');
  // Persistence checks durable booking, support and payment data rather than transient React state.
  const stored=JSON.parse(w.localStorage.getItem('partant-native-preview-v1'));ok(stored.bookings.some(b=>b.kind==='Groupe'&&b.seats===1),'Group edit persisted');ok(stored.tickets.length===1,'Support ticket persisted');
  ok(stored.attempts.filter(p=>p.status==='success').length>=2,'Payment attempts persisted');
  ok(errors.length === 0, "No runtime errors: " + errors.join("\n"));
  console.log(
    `PASS ${count} native-web DOM checks. Not a pixel/visual browser validation.`,
  );
  dom.window.close();
})().catch((e) => {
  console.error(e);
  console.error("Runtime errors:", errors);
  console.error(d.body.textContent.slice(-4000));
  dom.window.close();
  process.exitCode = 1;
});
