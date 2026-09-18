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
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json"),
);
async function call(body, token, headers = {}) {
  const r = await fetch(base + "/functions/v1/google-calendar", {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}
let n = 0;
const check = (a, b) => {
  assert.equal(a, b);
  n++;
};
check((await call({ action: "status" })).status, 401);
check(
  (
    await call({ action: "scheduled", coach: users[0].id }, null, {
      "x-calendar-job": "forged",
    })
  ).status,
  401,
);
check(
  (await fetch(base + "/functions/v1/google-calendar/callback?state=invalid"))
    .status,
  400,
);
const publicStatus = await call({ action: "status-public" });
check(publicStatus.status, 200);
check(typeof publicStatus.data.googleCalendar, "boolean");
for (const u of users.slice(0, 2)) {
  const r = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  const s = await r.json();
  assert.ok(s.access_token);
  const response = await call({ action: "status" }, s.access_token);
  check(response.status, u.name === "coach" ? 200 : 403);
  if (u.name === "coach") {
    check("tokens" in response.data, false);
    check("client_secret" in response.data, false);
    check(response.data.connected, false);
    if (!publicStatus.data.googleCalendar)
      check(
        (
          await call(
            {
              action: "connect",
              redirect: "http://127.0.0.1:8081/?data=connected",
            },
            s.access_token,
          )
        ).status,
        503,
      );
  }
  const forbidden = await fetch(base + "/rest/v1/rpc/calendar_store", {
    method: "POST",
    headers: {
      apikey,
      Authorization: "Bearer " + s.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_action: "get", p_actor: users[0].id }),
  });
  check(forbidden.ok, false);
}
console.log(
  `PASS ${n} deployed Google endpoint authorization and configuration checks. OAuth consent not simulated as activated.`,
);
