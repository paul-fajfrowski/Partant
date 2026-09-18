const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  ts = require("../apps/mobile/node_modules/typescript");
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
  W = require("../apps/mobile/src/product/workflows.ts"),
  G = require("../apps/mobile/src/product/messaging.ts");
let checks = 0,
  H;
const ok = (v, label) => {
  assert.ok(v, label);
  checks++;
};
let s = W.loginDemo(
  M.newPreviewStore(),
  "thomas@example.test",
  "Thomas",
  "coach",
  false,
);
const coach = s.account,
  alex = W.identities(s).find((x) => x.name === "Alex"),
  nina = W.identities(s).find((x) => x.name === "Nina");
const b = {
  ...s.bookings[0],
  id: "thread-one",
  coach: "0",
  clientId: alex.id,
  clientName: alex.name,
  day: M.addDays(M.today(), 3),
  time: "10:00",
  serviceName: "Coaching individuel",
  status: "confirmed",
};
s = {
  ...s,
  bookings: [
    b,
    { ...b, id: "thread-two", day: M.addDays(b.day, 1), time: "11:00" },
    { ...b, id: "thread-nina", clientId: nina.id, clientName: nina.name },
  ],
  messages: {},
  notices: [],
};
s = M.switchAccount(s, alex);
s = G.sendMessage(s, b.id, "Bonjour pour la première séance", "first");
s = G.sendMessage(
  s,
  "thread-two",
  "Une question sur la deuxième séance",
  "second",
);
s.messages[b.id].unshift({ who: alex.id, text: "Ancien échange sans date" });
s = M.switchAccount(s, nina);
s = G.sendMessage(s, "thread-nina", "Échange privé de Nina", "private");
s = M.switchAccount(s, coach);
async function load(storage) {
  if (H) {
    ok(!H.errors.length, "No runtime errors before reload");
    H.close();
    delete require.cache[require.resolve("./native-web-harness.cjs")];
  }
  H = require("./native-web-harness.cjs");
  for (const [k, v] of Object.entries(storage)) H.w.localStorage.setItem(k, v);
  await H.wait();
  await H.wait();
}
const saved = () =>
  JSON.parse(H.w.localStorage.getItem("partant-native-preview-v1"));
const allStorage = () =>
  Object.fromEntries(
    Object.keys(H.w.localStorage).map((k) => [k, H.w.localStorage.getItem(k)]),
  );
const text = () => H.d.body.textContent;
(async () => {
  try {
    await load({ "partant-native-preview-v1": JSON.stringify(s) });
    await H.click("Messages");
    ok(
      H.d.querySelectorAll('[data-testid^="conversation-"]').length === 2,
      "Repeated sessions grouped in one thread per person",
    );
    H.input("Rechercher une conversation", "nINa");
    await H.wait();
    ok(
      !text().includes("Alex") && text().includes("Nina"),
      "Name search is case insensitive",
    );
    H.input("Rechercher une conversation", "");
    await H.wait();
    await H.click("Alex");
    ok(
      text().includes("Bonjour pour la première séance") &&
        text().includes("Une question sur la deuxième séance"),
      "Messages from both sessions visible",
    );
    ok(!text().includes("Échange privé de Nina"), "Other client excluded");
    ok(
      text().includes("Historique · dates non renseignées") &&
        text().includes("Aujourd’hui"),
      "Legacy dates and new chronology honest",
    );
    ok(
      saved().messages["thread-one"].every((m) =>
        m.readBy.includes(coach.id),
      ) && saved().messages["thread-two"][0].readBy.includes(coach.id),
      "Whole loaded conversation marked read",
    );
    ok(
      !saved().messages["thread-nina"][0].readBy.includes(coach.id),
      "Another conversation remains unread",
    );
    H.input("Votre message", "Brouillon conservé pour Alex");
    await H.wait();
    await H.click("Retour");
    ok(
      text().includes("Brouillon · Brouillon conservé pour Alex"),
      "Inbox indicates saved draft",
    );
    const snapshot = allStorage();
    await load(snapshot);
    await H.click("Messages");
    await H.click("Alex");
    ok(
      H.d.querySelector('textarea[aria-label="Votre message"]').value ===
        "Brouillon conservé pour Alex",
      "Draft survives page reload",
    );
    ok(
      !text().includes("Séance liée au prochain message") &&
        !text().includes("À propos de"),
      "Conversation has no session selector or repeated bubble context",
    );
    await H.click("Voir nos séances");
    ok(
      text().includes("10:00") && text().includes("11:00"),
      "Optional booking access includes both sessions",
    );
    await H.click("Masquer nos séances");
    ok(
      H.d.querySelector('textarea[aria-label="Votre message"]').value ===
        "Brouillon conservé pour Alex",
      "Booking access preserves draft",
    );
    const send = [...H.d.querySelectorAll('[role="button"]')].find(
      (e) => e.textContent === "Envoyer",
    );
    send.click();
    send.click();
    await H.wait();
    await H.wait();
    ok(
      Object.values(saved().messages)
        .flat()
        .filter((m) => m.who === coach.id).length === 1,
      "Double tap sends once in person conversation",
    );
    const message = Object.values(saved().messages)
      .flat()
      .find((m) => m.who === coach.id);
    ok(
      !!message.id && !!message.createdAt,
      "Message has stable identifier and date",
    );
    ok(
      H.d.querySelector('textarea[aria-label="Votre message"]').value === "",
      "Acknowledged send clears composer",
    );
    const noticeCount = saved().notices.filter(
      (n) => n.messageId === message.id,
    ).length;
    ok(noticeCount === 1, "One message produces one notification");
    const clientStorage = allStorage(),
      clientStore = M.switchAccount(saved(), alex);
    clientStorage["partant-native-preview-v1"] = JSON.stringify(clientStore);
    await load(clientStorage);
    await H.click("Mon espace");
    await H.click("Mes messages");
    ok(
      H.d.querySelectorAll('[data-testid^="conversation-"]').length === 1,
      "Client also sees one coach conversation",
    );
    await H.click(M.seedCoaches[0].name);
    ok(
      text().includes("Brouillon conservé pour Alex"),
      "Other account receives sent text",
    );
    ok(
      H.d.querySelector('textarea[aria-label="Votre message"]').value === "",
      "Drafts isolated by account",
    );
    ok(
      Object.values(saved().messages)
        .flat()
        .find((m) => m.id === message.id)
        .readBy.includes(alex.id),
      "Recipient read receipt persists",
    );
    ok(!H.errors.length, "No runtime errors");
    console.log(
      `PASS ${checks} messaging DOM checks. No visual device validation.`,
    );
  } finally {
    H?.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
