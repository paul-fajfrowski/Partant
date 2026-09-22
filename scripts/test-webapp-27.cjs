// Real-browser acceptance of the shared WebApp. Uses isolated local demo data only.
// PARTANT_QA_URL=http://127.0.0.1:8092 PARTANT_QA_PLAYWRIGHT=/path/to/playwright node --no-experimental-strip-types scripts/test-webapp-27.cjs
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
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
const M = require("../apps/mobile/src/product/model.ts"),
  W = require("../apps/mobile/src/product/workflows.ts");
const { chromium } = require(process.env.PARTANT_QA_PLAYWRIGHT || "playwright");
const origin = process.env.PARTANT_QA_URL || "http://127.0.0.1:8081";
const out =
  process.env.PARTANT_QA_SCREENSHOTS || "/private/tmp/partant-webapp-27";
fs.mkdirSync(out, { recursive: true });
let checks = 0;
const ok = (value, label) => {
  assert.ok(value, label);
  checks++;
};
const base = M.newPreviewStore(),
  day = M.addDays(M.today(), 1),
  offer = base.offers.find((o) => o.coach === "0" && o.kind === "Individuel");
base.bookings.push({
  id: "qa-web27-booking",
  coach: "0",
  clientId: "alex@example.test",
  clientName: "Alex",
  day,
  time: "14:07",
  duration: 60,
  offerId: offer.id,
  serviceName: offer.name,
  kind: offer.kind,
  format: "Extérieur",
  seats: 1,
  price: offer.price,
  paid: offer.price,
  refunded: 0,
  goal: "Me remettre en forme",
  address: "Square Maurice Gardette, Paris 11e",
  status: "confirmed",
  cancelHours: 24,
});
base.messages = {
  "qa-web27-booking": [
    {
      id: "qa-web27-message",
      who: "coach-0",
      text: "Bonjour Alex, à très vite au square !",
      createdAt: Date.now() - 1800000,
    },
  ],
};
base.notices = [
  {
    id: "qa-web27-notice",
    recipient: "coach-0",
    booking: "qa-web27-booking",
    event: "booking",
    body: "Alex a réservé une séance.",
    read: false,
    createdAt: Date.now() - 3600000,
  },
];
base.externalSessions = [
  {
    id: "qa-direct",
    coach: "0",
    name: "Nina",
    day,
    time: "17:13",
    duration: 37,
    offerId: offer.id,
    serviceName: offer.name,
    format: "Extérieur",
    address: "Square",
    price: 50,
  },
];
base.favorites = ["0", "1"];
const seed = (role) => {
  const s = W.loginDemo(
    structuredClone(base),
    role === "coach" ? "thomas@example.test" : "alex@example.test",
    "",
    role,
    false,
  );
  s.testMode = true;
  return s;
};
const browserErrors = [];
let browser;
async function pageFor(role, width = 1440, custom) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => browserErrors.push(e.message));
  if (role)
    await page.addInitScript(
      (s) =>
        localStorage.setItem("partant-native-preview-v1", JSON.stringify(s)),
      custom || seed(role),
    );
  await page.goto(origin + "/?surface=web&data=preview");
  await page.getByTestId("desktop-shell").waitFor();
  return page;
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(out, name + ".png") });
}
async function noOverflow(page, label) {
  ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    label,
  );
}
(async () => {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PARTANT_QA_CHROME
      ? { executablePath: process.env.PARTANT_QA_CHROME }
      : {}),
  });
  const guest = await pageFor(null);
  await guest.getByText("Bienvenue chez Partant.", { exact: true }).waitFor();
  ok(
    (await guest.getByTestId("desktop-entry").count()) === 1,
    "Desktop entry retains role choices",
  );
  await guest.getByTestId("desktop-nav-favorites").click();
  await guest
    .getByText("Gardez vos coachs favoris.", { exact: true })
    .waitFor();
  await guest
    .getByRole("button", { name: "Me connecter", exact: true })
    .click();
  await guest.getByText("Heureux de vous revoir.", { exact: true }).waitFor();
  ok(true, "Guest favorite gate requests connection");
  await guest.close();
  const coach = await pageFor("coach");
  await coach.getByTestId("desktop-agenda").waitFor();
  ok(
    (await coach.getByRole("button", { name: /14:07.*Alex/ }).count()) === 1,
    "Actual booking appears once in weekly agenda",
  );
  await screenshot(coach, "coach-agenda");
  await noOverflow(coach, "Agenda fits desktop");
  await coach
    .getByRole("button", { name: `Voir le ${M.dayLabel(day)}`, exact: true })
    .click();
  const closing = coach
    .getByRole("button", { name: /^Fermer le départ de/ })
    .first();
  const label = await closing.getAttribute("aria-label");
  const time = label.split(" ").at(-1);
  await closing.click();
  await coach
    .getByRole("button", { name: "Rouvrir le départ de " + time, exact: true })
    .waitFor();
  ok(true, "Coach can close a proposed departure on desktop");
  await coach
    .getByRole("button", { name: "Rouvrir le départ de " + time, exact: true })
    .click();
  await coach
    .getByRole("button", { name: "Fermer le départ de " + time, exact: true })
    .waitFor();
  ok(true, "Coach can reopen the exact departure");
  await coach.getByRole("button", { name: "Aujourd’hui", exact: true }).click();

  await coach.getByRole("button", { name: /17:13.*Nina/ }).click();
  await coach.getByText("Nina", { exact: true }).waitFor();
  ok(
    (await coach
      .getByRole("button", { name: "Annuler ce rendez-vous", exact: true })
      .count()) === 1,
    "Direct appointment opens its own detail",
  );
  await coach.getByRole("button", { name: "Retour", exact: true }).click();
  await coach.getByTestId("desktop-agenda").waitFor();
  await coach
    .getByRole("button", { name: "Semaine suivante", exact: true })
    .click();
  await coach
    .getByRole("button", { name: "Modifier cette date", exact: true })
    .click();
  const chosenDate = await coach
    .getByRole("button", { name: /^Date à modifier/ })
    .getAttribute("aria-label");
  ok(
    chosenDate.startsWith("Date à modifier"),
    "Agenda opens explicit date editor",
  );
  const dateText = await coach
    .getByRole("button", { name: /^Date à modifier/ })
    .innerText();
  ok(
    dateText.includes(M.addDays(M.today(), 7)) ||
      dateText.includes(String(Number(M.addDays(M.today(), 7).slice(-2)))),
    "Date selection follows selected week",
  );
  await coach.getByTestId("desktop-setting-offers").click();
  ok(
    (await coach.getByTestId("desktop-settings-layout").count()) === 1,
    "Settings navigation shared across forms",
  );
  await coach.getByTestId("desktop-nav-settings").click();
  await coach.getByTestId("desktop-settings").waitFor();
  ok(
    (await coach
      .getByRole("button", { name: "Mettre mon profil en pause", exact: true })
      .count()) === 1,
    "Publication pause stays accessible",
  );
  await screenshot(coach, "coach-settings");
  for (const section of [
    "profile",
    "offers",
    "places",
    "schedule",
    "rules",
    "calendars",
    "preparation",
    "documents",
    "payout",
    "notifications",
  ]) {
    await coach.getByTestId("desktop-setting-" + section).click();
    await coach.getByTestId("desktop-settings-layout").waitFor();
    ok(
      !(await coach
        .getByText("Cet écran n’est plus disponible.", { exact: true })
        .count()),
      "Setting " + section + " resolves",
    );
  }
  await coach.getByTestId("desktop-setting-documents").click();
  await coach
    .getByText("Votre dossier professionnel", { exact: true })
    .waitFor();
  ok(
    !(await coach
      .getByRole("button", { name: "Compléter plus tard", exact: true })
      .count()),
    "Coach dossier is not skippable",
  );
  await screenshot(coach, "coach-documents");
  await coach.getByTestId("desktop-nav-messages").click();
  await coach.getByRole("button", { name: "Alex", exact: true }).click();
  await coach
    .getByLabel("Votre message", { exact: true })
    .fill("À demain, Alex !");
  await coach.getByRole("button", { name: "Envoyer", exact: true }).click();
  await coach.getByText("À demain, Alex !", { exact: true }).waitFor();
  ok(true, "Message can be sent from split conversation");
  await screenshot(coach, "coach-messages");
  await coach.getByTestId("desktop-nav-notifications").click();
  ok(
    !(await coach.getByTestId("desktop-messages").count()),
    "Notifications separate from messaging",
  );
  for (const section of ["clients", "activity"]) {
    await coach.getByTestId("desktop-nav-" + section).click();
    ok(
      !(await coach
        .getByText("Cet écran n’est plus disponible.", { exact: true })
        .count()),
      section + " accessible",
    );
  }
  await coach.getByTestId("desktop-nav-settings").click();
  await coach.setViewportSize({ width: 1080, height: 900 });
  await noOverflow(coach, "Small desktop fits settings");
  await coach.getByTestId("desktop-setting-documents").click();
  await screenshot(coach, "coach-documents-1080");
  await noOverflow(coach, "Documents fit small desktop");
  await coach.setViewportSize({ width: 390, height: 844 });
  await coach
    .getByText("Votre dossier professionnel", { exact: true })
    .waitFor();
  ok(
    !(await coach.getByTestId("desktop-shell").count()),
    "Native-width navigation replaces sidebar with same active form",
  );
  await noOverflow(coach, "Mobile width has no horizontal overflow");
  await screenshot(coach, "coach-mobile");
  await coach.setViewportSize({ width: 820, height: 1000 });
  await noOverflow(coach, "Tablet width has no horizontal overflow");
  await coach.close();
  const client = await pageFor("client");
  await client.getByRole("button", { name: "Demain", exact: true }).click();
  await client.getByTestId("desktop-coach-card").first().waitFor();
  ok(
    (await client.getByTestId("desktop-coach-card").count()) > 1,
    "Client result grid includes available coaches",
  );
  const boxes = await client
    .getByTestId("desktop-coach-card")
    .evaluateAll((nodes) =>
      nodes
        .slice(0, 2)
        .map((e) => ({
          x: e.getBoundingClientRect().x,
          y: e.getBoundingClientRect().y,
        })),
    );
  ok(
    boxes[0].y === boxes[1].y && boxes[0].x !== boxes[1].x,
    "Coach cards form desktop columns",
  );
  await screenshot(client, "client-explore");
  await client
    .getByTestId("desktop-coach-card")
    .first()
    .getByRole("button", { name: /Voir le profil/ })
    .first()
    .click();
  ok(
    (await client
      .getByRole("button", { name: "Retour", exact: true })
      .count()) > 0,
    "Profile has a way back",
  );
  await screenshot(client, "client-profile");
  await client.getByTestId("desktop-nav-favorites").click();
  ok(
    (await client.getByText("Les bons liens", { exact: false }).count()) > 0,
    "Favorite coaches preserved",
  );
  await client.getByTestId("desktop-nav-bookings").click();
  await client.getByText("Vos rendez-vous", { exact: false }).waitFor();
  await client.getByRole("button").filter({ hasText: "14:07" }).first().click();
  await client
    .getByRole("button", { name: "Contacter mon coach", exact: true })
    .waitFor();
  ok(true, "Client session opens booking details");
  await client
    .getByRole("button", { name: "Contacter mon coach", exact: true })
    .click();
  await client.getByLabel("Votre message", { exact: true }).waitFor();
  ok(true, "Booking opens the same person conversation");
  await client.getByTestId("desktop-nav-explore").click();
  await client.getByRole("button", { name: "Demain", exact: true }).click();
  await client
    .getByTestId("desktop-coach-card")
    .first()
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await client.getByRole("button", { name: "Continuer", exact: true }).click();
  await client.getByText("Vous y êtes presque.", { exact: true }).waitFor();
  ok(true, "Booking setup opens full price recap");
  await client.getByRole("button", { name: /^Réserver ·/ }).click();
  await client
    .getByRole("button", { name: "Valider le paiement simulé", exact: true })
    .click();
  await client
    .getByRole("heading", { name: "Séance confirmée", exact: true })
    .waitFor();
  ok(true, "Complete booking reaches confirmation");
  const persisted = await client.evaluate(() =>
    JSON.parse(localStorage.getItem("partant-native-preview-v1")),
  );
  ok(
    persisted.bookings.filter(
      (b) => b.clientId === "alex@example.test" && b.status === "confirmed",
    ).length === 2,
    "Confirmed reservation is persisted exactly once",
  );
  await screenshot(client, "client-confirmation");
  await client.close();
  const teamSeed = seed("client");
  teamSeed.staff = true;
  teamSeed.extraCoaches = [];
  teamSeed.settings = {};
  const model = M.allCoaches(teamSeed)[0];
  for (let i = 0; i < 23; i++) {
    const id = "qa-team-" + i,
      c = {
        ...model,
        id,
        name: "Coach " + String(i + 1).padStart(2, "0"),
        sport: "Running",
      };
    teamSeed.extraCoaches.push(c);
    const cfg = M.configFor(teamSeed, id);
    teamSeed.settings[id] = {
      ...cfg,
      dossier: { ...cfg.dossier, status: "pending", history: [] },
    };
  }
  const team = await pageFor("client", 1440, teamSeed);
  await team.getByTestId("desktop-nav-team").click();
  await team.getByTestId("web-team-review").waitFor();
  ok(
    (await team
      .getByRole("button", { name: /Examiner le dossier de/ })
      .count()) === 10,
    "Team queue limited to ten records",
  );
  await team.getByRole("button", { name: "Suivant", exact: true }).click();
  ok(
    (await team
      .getByRole("button", {
        name: "Examiner le dossier de Coach 11",
        exact: true,
      })
      .count()) === 1,
    "Team pagination advances",
  );
  await team
    .getByLabel("Rechercher un dossier", { exact: true })
    .fill("Coach 23");
  ok(
    (await team
      .getByRole("button", { name: /Examiner le dossier de/ })
      .count()) === 1,
    "Team search resets pagination",
  );
  await screenshot(team, "team-review");
  await team
    .getByRole("button", { name: "Demandes d’assistance", exact: true })
    .click();
  ok(
    (await team.getByText("Demandes d’assistance", { exact: true }).count()) ===
      1,
    "Team support stays accessible separately",
  );
  await team.close();
  ok(
    browserErrors.length === 0,
    "No browser runtime errors: " + browserErrors.join("; "),
  );
  console.log(`PASS WebApp: ${checks} checks; screenshots ${out}`);
})()
  .catch(async (e) => {
    for (const [i, p] of (
      browser?.contexts().flatMap((c) => c.pages()) || []
    ).entries())
      await screenshot(p, "failure-" + i);
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
