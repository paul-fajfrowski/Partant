import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
const fixture = "/private/tmp/partant-connected-qa.json";
if (process.argv.includes("--prepare")) {
  const users = ["coach", "alice", "bob", "team"].map((name) => ({
    id: randomUUID(),
    email: `partant-qa-${name}-${randomUUID()}@example.invalid`,
    password: randomBytes(24).toString("hex"),
    name,
  }));
  fs.writeFileSync(fixture, JSON.stringify(users), { mode: 0o600 });
  const sql = users
    .map(
      (u) =>
        `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token) values('00000000-0000-0000-0000-000000000000','${u.id}','authenticated','authenticated','${u.email}',extensions.crypt('${u.password}',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');\ninsert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values(gen_random_uuid(),'${u.id}','${u.id}','{"sub":"${u.id}","email":"${u.email}"}','email',now(),now(),now());`,
    )
    .join("\n");
  fs.writeFileSync(
    "/private/tmp/partant-connected-qa-setup.sql",
    `begin;\n${sql}\ninsert into private.product_staff(id) values('${users[3].id}');\ncommit;`,
    { mode: 0o600 },
  );
  console.log(
    "Temporary isolated Auth fixtures prepared; no email will be sent.",
  );
  process.exit();
}
const users = JSON.parse(fs.readFileSync(fixture)),
  [coach, alice, bob, team] = users;
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../apps/mobile/.env", import.meta.url), "utf8")
    .split("\n")
    .filter((s) => s && !s.startsWith("#"))
    .map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i), s.slice(i + 1)];
    }),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
async function api(u, body = {}) {
  const r = await fetch(`${base}/functions/v1/product-api`, {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/json",
      ...(u?.token ? { Authorization: `Bearer ${u.token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { status: r.status, ...data };
}
async function read(u) {
  const r = await api(u);
  assert.equal(r.status, 200, JSON.stringify(r));
  return r;
}
async function command(u, name, ...args) {
  const current = await read(u),
    r = await api(u, {
      version: current.version,
      requestId: randomUUID(),
      commands: [{ name, args }],
    });
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.store;
}
for (const u of users) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  const data = await r.json();
  assert.equal(r.ok, true, JSON.stringify(data));
  u.token = data.access_token;
}
let pub = await read();
ok(
  !pub.store.account && !pub.store.extraCoaches.some((c) => c.id === "0"),
  "Anonymous discovery contains no demo profiles",
);
let r = await api(null, {
  requestId: randomUUID(),
  commands: [{ name: "publish", args: [coach.id] }],
});
ok(r.status === 401, "Unauthenticated command rejected");
for (const u of users) {
  r = await api(u, {
    register: { name: `QA ${u.name}`, role: u === coach ? "coach" : "client" },
    requestId: randomUUID(),
  });
  assert.equal(r.status, 200, JSON.stringify(r));
}
await command(coach, "saveCoach", coach.id, {
  name: "QA Coach temporaire",
  bio: "Profil uniquement destiné aux tests automatisés.",
  cert: "Qualification de test",
  sport: "Running",
  tags: ["Running"],
  years: 5,
  area: "Paris",
});
let state = (await read(coach)).store;
const venues = {
  gym: {
    type: "Salle de musculation",
    name: "Salle QA",
    address: "10 rue fictive Paris",
    instructions: "Test",
  },
  track: {
    type: "Piste d’athlétisme",
    name: "Piste QA",
    address: "20 rue fictive Paris",
    instructions: "Test",
  },
};
let cfg = {
  ...state.settings[coach.id],
  locations: venues,
  week: Array.from({ length: 7 }, () => [
    ["09:10", "12:10", null, ["gym"]],
    ["17:15", "21:15", null, ["track"]],
  ]),
  weeklyConfigured: true,
  payoutReady: true,
  dossier: {
    ...state.settings[coach.id].dossier,
    status: "pending",
    documents: ["qa-id", "qa-degree", "qa-card", "qa-insurance"],
    expires: "2028-01-01",
  },
};
await command(coach, "saveSettings", coach.id, cfg);
const solo = {
  id: randomUUID(),
  coach: coach.id,
  name: "Séance QA",
  kind: "Individuel",
  duration: 60,
  price: 50,
  capacity: 1,
  active: true,
  formats: ["gym", "track"],
};
const group = {
  ...solo,
  id: randomUUID(),
  name: "Collectif QA",
  kind: "Groupe",
  capacity: 2,
  price: 20,
};
await command(coach, "saveOffer", solo);
await command(coach, "saveOffer", group);
r = await api(coach, {
  requestId: randomUUID(),
  commands: [
    { name: "reviewDossier", args: [coach.id, "approved", "Self approval"] },
  ],
});
ok(r.status === 400, "Coach cannot self-approve");
await command(
  team,
  "reviewDossier",
  coach.id,
  "approved",
  "Dossier automatisé de test",
);
await command(coach, "publish", coach.id);
pub = await read();
ok(
  pub.store.extraCoaches.some((c) => c.id === coach.id),
  "Published coach visible",
);
ok(
  !JSON.stringify(pub.store).includes("qa-insurance"),
  "Documents not exposed",
);
const day = (n) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const draft = {
  id: randomUUID(),
  coach: coach.id,
  offerId: solo.id,
  day: day(4),
  time: "09:10",
  format: "gym",
  seats: 1,
  price: 50,
  goal: "Private QA goal",
  address: "Forged",
};
r = await api(alice, {
  requestId: randomUUID(),
  commands: [{ name: "reserve", args: [{ ...draft, format: "track" }] }],
});
ok(r.status === 400 && r.error.includes("lieu"), "Server rejects wrong venue");
r = await api(alice, {
  requestId: randomUUID(),
  commands: [{ name: "reserve", args: [{ ...draft, price: 1 }] }],
});
ok(
  r.status === 400 && r.error.includes("tarif"),
  "Server rejects forged price",
);
state = await command(alice, "reserve", draft);
ok(
  state.bookings.find((b) => b.id === draft.id).address === venues.gym.address,
  "Server authoritative address",
);
state = (await read(bob)).store;
ok(
  !state.bookings.some((b) => b.id === draft.id) &&
    !JSON.stringify(state).includes("Private QA goal"),
  "Private bookings isolated",
);
await command(alice, "message", draft.id, "Message QA privé");
state = (await read(coach)).store;
ok(
  state.messages[draft.id][0].text === "Message QA privé",
  "Coach receives message",
);
ok(
  state.notices.some((n) => n.booking === draft.id),
  "Coach receives notification",
);
ok(
  state.notices
    .filter((n) => n.booking === draft.id)
    .every((n) => Number.isFinite(n.createdAt) && n.context?.clientName),
  "Server records receipt date and booking snapshot",
);
ok(
  !(await read(bob)).store.notices.some((n) => n.booking === draft.id),
  "Private event context hidden from other customer",
);
await command(coach, "readMessages", draft.id);
const readCoach = (await read(coach)).store;
ok(
  readCoach.notices
    .filter((n) => n.booking === draft.id && n.event === "message")
    .every((n) => n.read),
  "Chat clears only relevant message notices",
);
ok(
  readCoach.notices.some(
    (n) => n.booking === draft.id && n.event === "booking" && !n.read,
  ),
  "Chat preserves unread booking notices",
);
state = (await read(alice)).store;
ok(
  state.messages[draft.id][0].readBy.includes(coach.id),
  "Read receipt persisted",
);
await command(
  coach,
  "addProposal",
  draft.id,
  { day: day(5), time: "10:10", address: venues.gym.address },
  "Modification QA",
);
state = (await read(alice)).store;
const prop = state.proposals.find((p) => p.booking === draft.id);
const proposalNotice = state.notices.find(
  (n) => n.proposalId === prop.id && n.event === "proposal",
);
ok(!!proposalNotice, "Proposal notification links exact proposal");
state = await command(alice, "readNotice", proposalNotice.id);
ok(
  state.proposals.find((p) => p.id === prop.id).status === "pending",
  "Reading notification leaves proposal pending",
);
await command(alice, "answerProposal", prop.id, "accepted");
ok(
  (await read(coach)).store.bookings.find((b) => b.id === draft.id).day ===
    day(5),
  "Reschedule shared",
);
state = (await read(alice)).store;
const changeNotice = state.notices.find(
  (n) => n.booking === draft.id && n.event === "rescheduled",
);
ok(
  changeNotice.previous.day === draft.day &&
    changeNotice.context.day === day(5),
  "Change stores before and after session snapshots",
);
ok(
  state.notices.find((n) => n.booking === draft.id && n.event === "booking")
    .context.day === draft.day,
  "Original booking event keeps historical session date",
);
const g = {
  id: randomUUID(),
  offer: group,
  day: day(6),
  time: "17:15",
  format: "track",
  address: "Ignored",
};
await command(coach, "openGroup", g);
const gd = {
  ...draft,
  id: randomUUID(),
  offerId: group.id,
  day: g.day,
  time: g.time,
  format: "track",
  seats: 2,
  price: 40,
};
const commonVersion = (await read(alice)).version;
const requests = [alice, bob].map((u, i) => ({
  u,
  body: {
    version: commonVersion,
    requestId: randomUUID(),
    commands: [
      { name: "reserve", args: [{ ...gd, id: i ? randomUUID() : gd.id }] },
    ],
  },
}));
const races = await Promise.all(requests.map((x) => api(x.u, x.body)));
ok(
  races.filter((x) => x.status === 200).length === 1,
  "Concurrent last places sold once",
);
ok(
  races.filter((x) => x.status === 409).length === 1,
  "Other transaction receives conflict",
);
const winnerIndex = races.findIndex((x) => x.status === 200),
  winner = requests[winnerIndex],
  loser = requests[1 - winnerIndex];
r = await api(winner.u, winner.body);
ok(r.status === 200, "Idempotent request replay");
r = await api(loser.u, {
  ...loser.body,
  version: (await read(loser.u)).version,
});
ok(
  r.status === 400 && /disponible|places/.test(r.error),
  "Full group cannot be oversold after refresh",
);
const gb = winner.body.commands[0].args[0].id;
await command(winner.u, "partialCancel", gb, 1);
ok(
  (await read(coach)).store.bookings.find((b) => b.id === gb).seats === 1,
  "Partial cancellation persisted",
);
await command(coach, "drafts", {
  [coach.id + ":profile"]: { cfg: {}, profile: { bio: "PRIVATE DRAFT QA" } },
});
ok(
  (await read(coach)).store.coachDrafts[coach.id + ":profile"],
  "Private draft persists",
);
ok(
  !JSON.stringify((await read(bob)).store).includes("PRIVATE DRAFT QA"),
  "Private draft hidden",
);
await command(alice, "favorites", [coach.id]);
ok((await read(alice)).store.favorites.includes(coach.id), "Favorites shared");
await command(alice, "report", { booking: draft.id, body: "Support QA" });
state = (await read(team)).store;
const ticket = state.tickets.find((t) => t.owner === alice.id);
await command(team, "resolveTicket", ticket.id, "Réponse QA", "Répondre");
ok(
  (await read(alice)).store.tickets.find((t) => t.id === ticket.id).status ===
    "resolved",
  "Support persisted",
);
for (const rpc of ["product_load", "product_commit"]) {
  const response = await fetch(`${base}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: {
      apikey,
      Authorization: `Bearer ${alice.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      rpc === "product_load" ? {} : { p_version: 0, p_documents: {} },
    ),
  });
  ok(
    [401, 403, 404].includes(response.status),
    `${rpc} unavailable to clients`,
  );
}
// Owner-only documents, team access, and anonymous denial through Storage.
const object = `${coach.id}/${randomUUID()}.pdf`;
const storageHeaders = (u) => ({ apikey, Authorization: `Bearer ${u.token}` });
r = await fetch(`${base}/storage/v1/object/coach-documents/${object}`, {
  method: "POST",
  headers: { ...storageHeaders(coach), "Content-Type": "application/pdf" },
  body: "%PDF-1.4\n% QA only",
});
ok(r.ok, "Private document uploaded");
for (const [u, allowed] of [
  [coach, true],
  [team, true],
  [alice, false],
]) {
  const response = await fetch(
    `${base}/storage/v1/object/sign/coach-documents/${object}`,
    {
      method: "POST",
      headers: { ...storageHeaders(u), "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 30 }),
    },
  );
  ok(response.ok === allowed, `Document access ${u.name}`);
}
await fetch(`${base}/storage/v1/object/coach-documents`, {
  method: "DELETE",
  headers: { ...storageHeaders(coach), "Content-Type": "application/json" },
  body: JSON.stringify({ prefixes: [object] }),
});
console.log(
  `PASS ${checks} deployed API, Auth, concurrency, privacy and Storage checks. No payments or emails.`,
);
