import fs from "node:fs";
import assert from "node:assert/strict";
const env = Object.fromEntries(
  fs
    .readFileSync("apps/mobile/.env", "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  u = JSON.parse(fs.readFileSync("/private/tmp/partant-connected-qa.json"))[0];
const r = await fetch(base + "/auth/v1/token?grant_type=password", {
  method: "POST",
  headers: { apikey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: u.email, password: u.password }),
});
const session = await r.json();
assert.ok(session.access_token);
const headers = {
  apikey,
  Authorization: "Bearer " + session.access_token,
  "Content-Type": "application/json",
};
const registered = await fetch(base + "/functions/v1/product-api", {
  method: "POST",
  headers,
  body: JSON.stringify({
    register: { name: "QA Google", role: "coach" },
    commands: [],
    requestId: crypto.randomUUID(),
  }),
});
assert.equal(registered.status, 200);
async function api(body) {
  const r = await fetch(base + "/functions/v1/google-calendar", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}
let count = 0;
const eq = (a, b) => {
  assert.equal(a, b);
  count++;
};
const bad = await api({
  action: "connect",
  redirect: "https://not-partant.example",
});
eq(bad.status, 400);
const start = await api({
  action: "connect",
  redirect: "http://127.0.0.1:8081/?data=connected",
});
eq(start.status, 200);
const consent = new URL(start.data.url);
eq(consent.origin, "https://accounts.google.com");
eq(consent.searchParams.get("code_challenge_method"), "S256");
eq(consent.searchParams.get("access_type"), "offline");
eq(consent.searchParams.has("client_secret"), false);
eq(
  consent.searchParams.get("redirect_uri"),
  base + "/functions/v1/google-calendar/callback",
);
const denied = await fetch(
  base +
    "/functions/v1/google-calendar/callback?error=access_denied&state=" +
    consent.searchParams.get("state"),
  { redirect: "manual" },
);
eq(denied.status, 303);
eq(
  new URL(denied.headers.get("location")).searchParams.get("calendar"),
  "cancelled",
);
const replay = await fetch(
  base +
    "/functions/v1/google-calendar/callback?error=access_denied&state=" +
    consent.searchParams.get("state"),
  { redirect: "manual" },
);
eq(replay.status, 400);
eq((await api({ action: "status" })).data.connected, false);
console.log(
  `PASS ${count} deployed OAuth initiation, redirect allowlist, PKCE, cancellation and replay checks. No Google account consent or events created.`,
);
