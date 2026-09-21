import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const root = new URL("../", import.meta.url);
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json", "utf8"),
);
if (
  !users.every(
    (u) =>
      u.email.startsWith("partant-qa-") && u.email.endsWith("@example.invalid"),
  )
)
  throw Error("QA accounts required");
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("apps/mobile/.env", root), "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
for (const u of users.slice(0, 2)) {
  const response = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  if (!response.ok) throw Error("QA login failed");
  u.token = (await response.json()).access_token;
}
let checks = 0;
const ok = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
async function api(name, body, u) {
  const r = await fetch(base + "/functions/v1/" + name, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(u ? { Authorization: "Bearer " + u.token } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}
const [a, b] = users;
ok(
  (await api("push-devices", { action: "status" })).status === 401,
  "anonymous denied",
);
ok((await api("push-devices", null, a)).status === 400, "invalid input");
ok(
  (await api("push-devices", { payload: "x".repeat(9000) }, a)).status === 413,
  "bounded body",
);
ok(
  (await api("push-dispatch", {}, a)).status === 401,
  "worker not user-callable",
);
const device = randomUUID();
try {
  let result = await api(
    "push-devices",
    {
      action: "register",
      device,
      token: "0".repeat(64),
      environment: "sandbox",
      actor: b.id,
    },
    a,
  );
  ok(
    result.status === 200 && result.data.registered,
    "device bound to authenticated user",
  );
  ok(
    !("token" in result.data) && !("session_id" in result.data),
    "private identifiers absent",
  );
  result = await api("push-devices", { action: "status", device }, b);
  ok(!result.data.registered, "other account cannot inspect binding");
  await api("push-devices", { action: "remove", device }, b);
  result = await api("push-devices", { action: "status", device }, a);
  ok(result.data.registered, "other account cannot revoke device");
  result = await api(
    "push-devices",
    { action: "preferences", device, categories: { messages: false } },
    a,
  );
  ok(result.data.categories.messages === false, "preference persisted");
  result = await api(
    "push-devices",
    { action: "preferences", device, categories: { unknown: true } },
    a,
  );
  ok(result.status === 400, "unknown preference rejected");
  result = await api(
    "push-devices",
    { action: "register", device, token: "bad", environment: "sandbox" },
    a,
  );
  ok(result.status === 400, "bad token rejected");
} finally {
  await api("push-devices", { action: "remove", device }, a);
}
const full = await api("product-api", {}, a);
ok(
  full.status === 200 && full.data.store.account.id === a.id,
  "full actor projection",
);
const poll = await api(
  "product-api",
  {
    ifVersion: full.data.version,
    ifStaff: !!full.data.store.staff,
    scope: a.id,
  },
  a,
);
ok(
  poll.status === 200 && poll.data.unchanged && !poll.data.store,
  "unchanged poll without snapshot",
);
const wrong = await api(
  "product-api",
  { ifVersion: full.data.version, ifStaff: false, scope: b.id },
  a,
);
ok(wrong.data.store?.account.id === a.id, "scope mismatch cannot reuse cache");
for (const name of [
  "product_checkpoint",
  "product_push_claim",
  "product_push_device",
]) {
  const r = await fetch(base + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + a.token,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  ok([401, 403, 404].includes(r.status), "private RPC " + name);
}
console.log(
  `PASS ${checks} deployed push/privacy/polling checks. No push event created.`,
);
