import fs from "node:fs";
import assert from "node:assert/strict";
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../apps/mobile/.env", import.meta.url), "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
const headers = { apikey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
const base = env.EXPO_PUBLIC_SUPABASE_URL;
for (const table of ["coaches", "offers", "slots"]) {
  const r = await fetch(`${base}/rest/v1/${table}?select=*`, { headers });
  assert.equal(
    r.ok,
    true,
    `${table}: ${r.status} ${r.ok ? "" : await r.text()}`,
  );
  assert.ok(Array.isArray(await r.json()));
  console.log(`${table}: lecture publique OK`);
}
for (const table of [
  "profiles",
  "bookings",
  "notifications",
  "calendar_connections",
]) {
  const r = await fetch(`${base}/rest/v1/${table}?select=*`, { headers });
  assert.ok(
    [401, 403].includes(r.status),
    `${table} unexpectedly exposed: ${r.status}`,
  );
  console.log(`${table}: accès anonyme refusé`);
}
const inventory = await fetch(`${base}/rest/v1/rpc/slot_inventory`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ p_slots: [] }),
});
assert.equal(inventory.ok, true);
assert.deepEqual(await inventory.json(), []);
console.log("inventory: RPC public OK");
const reserve = await fetch(`${base}/rest/v1/rpc/reserve_slot`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    p_slot: "00000000-0000-0000-0000-000000000000",
    p_seats: 1,
    p_request: "00000000-0000-0000-0000-000000000000",
  }),
});
assert.ok([401, 403].includes(reserve.status));
console.log("reserve: authentification obligatoire");
const auth = await fetch(`${base}/auth/v1/settings`, { headers });
assert.equal(auth.ok, true);
const data = await auth.json();
console.log(
  "Auth disponible; Google actif:",
  data.external?.google,
  "Apple actif:",
  data.external?.apple,
);
