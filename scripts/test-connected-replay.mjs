import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json", "utf8"),
);
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
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  u = users[1];
const session = await (
  await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  })
).json();
assert.ok(session.access_token);
async function call(body = {}) {
  const r = await fetch(`${base}/functions/v1/product-api`, {
    method: "POST",
    headers: {
      apikey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  assert.equal(r.status, 200, JSON.stringify(json));
  return json;
}
const initial = await call(),
  b = initial.store.bookings[0],
  before = initial.store.messages[b.id]?.length ?? 0;
const body = {
  version: initial.version,
  requestId: randomUUID(),
  commands: [{ name: "message", args: [b.id, "Replay concurrent QA"] }],
};
const [a, c] = await Promise.all([call(body), call(body)]);
assert.deepEqual(a.store.messages[b.id], c.store.messages[b.id]);
assert.deepEqual(
  a.store.notices.map((n) => n.id),
  c.store.notices.map((n) => n.id),
);
assert.equal((await call()).store.messages[b.id].length, before + 1);
console.log(
  "PASS 3 deployed concurrent replay checks: one message, canonical response IDs.",
);
