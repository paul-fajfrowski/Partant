// Read-only check: no accounts, bookings or push notifications are created.
import fs from "node:fs";
import { performance } from "node:perf_hooks";
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
async function read(body) {
  const start = performance.now();
  const response = await fetch(
    env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1/product-api",
    {
      method: "POST",
      headers: {
        apikey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const raw = await response.text();
  if (!response.ok) throw Error("Backend returned " + response.status);
  return {
    data: JSON.parse(raw),
    bytes: Buffer.byteLength(raw),
    ms: Math.round(performance.now() - start),
  };
}
const first = await read({});
const polls = [];
for (let i = 0; i < 5; i++)
  polls.push(
    await read({ ifVersion: first.data.version, ifStaff: false, scope: null }),
  );
console.log(
  JSON.stringify(
    {
      sample: "5 sequential anonymous reads; not a load test",
      fullBytes: first.bytes,
      polls: polls.map((x) => ({
        bytes: x.bytes,
        ms: x.ms,
        unchanged: !!x.data.unchanged,
      })),
    },
    null,
    2,
  ),
);
