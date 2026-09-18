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
let count = 0;
const ok = (v, label) => {
    assert.ok(v, label);
    count++;
  },
  fails = (fn, re) => {
    assert.throws(fn, re);
    count++;
  };
let s = W.loginDemo(
  M.newPreviewStore(),
  "alex@example.test",
  "Alex",
  "client",
  false,
);
const client = s.account,
  coach = W.identities(s).find((x) => x.id === "coach-0"),
  other = W.identities(s).find((x) => x.name === "Nina");
const base = {
  ...s.bookings[0],
  id: "one",
  clientId: client.id,
  clientName: client.name,
  coach: "0",
  day: M.addDays(M.today(), 3),
  time: "10:00",
  status: "confirmed",
};
s = {
  ...s,
  messages: {},
  notices: [],
  bookings: [
    base,
    { ...base, id: "two", day: M.addDays(base.day, 1) },
    { ...base, id: "group-alex", kind: "Groupe", offerId: "shared-group" },
    {
      ...base,
      id: "group-nina",
      kind: "Groupe",
      offerId: "shared-group",
      clientId: other.id,
      clientName: other.name,
    },
  ],
};
s = G.sendMessage(s, "one", " Premier message ", "id-1");
s = G.sendMessage(s, "two", "Autre séance", "id-2");
let threads = G.conversations(s);
ok(
  threads.length === 1 && threads[0].bookings.length === 3,
  "One thread for repeated bookings with same coach",
);
ok(
  threads[0].messages.length === 2 &&
    threads[0].messages[0].booking.id === "one",
  "Messages preserve booking links",
);
ok(threads[0].latest.id === "id-2", "Most recent message preview");
ok(
  s.messages.one[0].text === "Premier message" &&
    s.messages.one[0].createdAt > 0,
  "Server normalizes text and stamps receipt",
);
ok(s.messages.one[0].context.day === base.day, "Session snapshot captured");
const old = s;
s = G.sendMessage(s, "one", "Premier message", "id-1");
ok(s === old, "Uncertain send retry returns same state");
fails(() => G.sendMessage(s, "one", "Different text", "id-1"), /autre message/);
fails(
  () => G.sendMessage(s, "two", "Premier message", "id-1"),
  /autre message/,
);
fails(() => G.sendMessage(s, "one", " ".repeat(4), "empty"), /Écrivez/);
fails(() => G.sendMessage(s, "one", "x".repeat(4001), "long"), /4 000/);
fails(
  () => G.sendMessage(s, "group-nina", "Private leak", "bad"),
  /accessible/,
);
ok(
  s.notices.filter((n) => n.messageId === "id-1").length === 1,
  "Exactly one notification for a message",
);
s = M.switchAccount(s, coach);
threads = G.conversations(s);
ok(
  threads.length === 2,
  "Coach keeps clients in distinct threads even in same group",
);
let t = threads.find((x) => x.clientId === client.id);
ok(t.unread === 2, "Unread count covers several bookings");
const seen = G.receipts(t);
s = M.switchAccount(s, client);
s = G.sendMessage(s, "group-alex", "Arrived after read snapshot", "id-3");
s = M.switchAccount(s, coach);
s = G.readConversation(s, "one", seen);
ok(
  s.messages.one[0].readBy.includes(coach.id) &&
    s.messages.two[0].readBy.includes(coach.id),
  "Reading thread marks loaded messages across sessions",
);
ok(
  !s.messages["group-alex"][0].readBy.includes(coach.id),
  "A concurrently arriving unseen message stays unread",
);
ok(
  s.notices.find((n) => n.messageId === "id-3").read === false,
  "Unseen notification preserved",
);
fails(
  () => G.readConversation(s, "one", [{ booking: "group-nina", keys: [] }]),
  /inaccessible/,
);
s = M.switchAccount(s, other);
ok(
  G.conversations(s).length === 1 && !G.conversations(s)[0].messages.length,
  "Group participant cannot see another participant messages",
);
fails(() => G.readConversation(s, "one", seen), /accessible/);
s = M.switchAccount(s, client);
s = {
  ...s,
  messages: {
    ...s.messages,
    one: [{ who: coach.id, text: "Legacy without date" }, ...s.messages.one],
  },
  bookings: s.bookings.map((b) =>
    b.id === "one" ? { ...b, day: M.addDays(base.day, 2) } : b,
  ),
};
t = G.conversations(s)[0];
ok(
  t.messages[0].createdAt === undefined &&
    t.messages[0].text === "Legacy without date",
  "Old messages remain undated",
);
ok(
  t.messages.find((m) => m.id === "id-1").context.day === base.day,
  "Booking changes do not rewrite message context",
);
s = G.readConversation(s, "one", G.receipts(t));
ok(
  s.messages.one[0].readBy.includes(client.id),
  "Legacy messages remain readable",
);
s = { ...s, deletedAccounts: [coach.id] };
fails(() => G.sendMessage(s, "one", "Hello", "deleted"), /plus disponible/);
s = {
  ...s,
  deletedAccounts: [],
  bookings: s.bookings.map((b) => ({ ...b, status: "completed" })),
};
s = W.deleteAccount(s);
ok(
  Object.values(s.messages)
    .flat()
    .every((m) => !m.context),
  "Account deletion removes historical personal context",
);
ok(
  s.notices.every((n) => !n.context && !n.previous),
  "Notification snapshots follow account anonymization",
);
console.log(`PASS ${count} messaging domain checks.`);
