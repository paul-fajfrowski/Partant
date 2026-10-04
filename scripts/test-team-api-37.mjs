import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { elevateQaTeam } from "./fixtures/team-mfa-37.mjs";
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json", "utf8"),
);
assert(
  users.every(
    (u) =>
      u.email.startsWith("partant-qa-") &&
      u.email.endsWith("@example.invalid") &&
      /^[0-9a-f-]{36}$/.test(u.id),
  ),
);
const [coach, second, , team] = users;
const env = Object.fromEntries(
  fs
    .readFileSync("apps/mobile/.env", "utf8")
    .split("\n")
    .filter((x) => x.includes("="))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let checks = 0;
function ok(v, m) {
  assert.ok(v, m);
  checks++;
}
function sql(query) {
  const file = "/private/tmp/partant-team37.sql";
  fs.writeFileSync(file, query, { mode: 0o600 });
  const r = spawnSync(
    "/opt/homebrew/bin/supabase",
    [
      "db",
      "query",
      "--linked",
      "--project-ref",
      "jhhsysjdeyqsuztjtgea",
      "--file",
      file,
      "--output",
      "json",
    ],
    { encoding: "utf8", timeout: 30000 },
  );
  if (r.status) throw Error("QA SQL failed");
  return JSON.parse(r.stdout);
}
async function login(u) {
  const r = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  assert(r.ok);
  u.token = (await r.json()).access_token;
}
async function api(u, body = {}) {
  const r = await fetch(base + "/functions/v1/product-api", {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/json",
      Authorization: "Bearer " + u.token,
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, ...(await r.json()) };
}
const headers = (u) => ({
  apikey,
  Authorization: "Bearer " + u.token,
  "Content-Type": "application/json",
});
const object = coach.id + "/qa-mfa-" + randomUUID() + ".pdf";
let uploaded = false;
const extra =
  users.length > 4
    ? users.slice(4)
    : Array.from({ length: 11 }, (_, i) => ({
        id: randomUUID(),
        email: `partant-qa-page-${randomUUID()}@example.invalid`,
        name: "page" + i,
      }));
try {
  await login(team);
  const aal1 = { ...team };
  let r = await api(aal1);
  ok(
    !r.store.staff &&
      r.store.teamAccess.role === "admin" &&
      !r.store.teamAccess.unlocked,
    "Membership alone remains locked",
  );
  ok(
    (await api(aal1, { team: { action: "list" } })).status === 403,
    "AAL1 queue denied",
  );
  ok(
    (
      await api(aal1, {
        commands: [
          {
            name: "reviewDossier",
            args: [coach.id, "approved", "Unauthorized"],
          },
        ],
        requestId: randomUUID(),
      })
    ).status === 403,
    "AAL1 decision denied",
  );
  team.token = await elevateQaTeam(team, base, apikey);
  r = await api(team);
  ok(
    r.store.staff && r.store.teamAccess.unlocked,
    "Verified Auth factor unlocks team",
  );
  const cfg = r.store.settings[coach.id];
  ok(
    !cfg?.dossier?.documents?.some(Boolean),
    "Ordinary projection excludes private proofs",
  );
  r = await api(team, { team: { action: "detail", coach: coach.id } });
  ok(
    r.status === 200 && !!r.store.settings[coach.id].dossier,
    "Dossier fetched explicitly",
  );
  const templateCoach = r.store.extraCoaches.find((c) => c.id === coach.id),
    templateSettings = r.store.settings[coach.id];
  await login(coach);
  let upload = await fetch(
    base + "/storage/v1/object/coach-documents/" + object,
    {
      method: "POST",
      headers: { ...headers(coach), "Content-Type": "application/pdf" },
      body: Buffer.from("%PDF-1.4\nQA MFA"),
    },
  );
  assert(upload.ok);
  uploaded = true;
  async function signed(u) {
    const result = await fetch(
      base + "/storage/v1/object/sign/coach-documents/" + object,
      {
        method: "POST",
        headers: headers(u),
        body: JSON.stringify({ expiresIn: 60 }),
      },
    );
    return result.ok;
  }
  ok(!(await signed(aal1)), "Storage denies AAL1 staff");
  ok(await signed(team), "Storage allows MFA reviewer/admin");
  // Large queue fixtures extend only the QA IDs and are removed by the targeted cleanup.
  const entries = extra.map((u, i) => ({
    ...templateCoach,
    id: u.id,
    name: "QA Pagination " + String(i).padStart(2, "0"),
    area: "Paris",
    disciplines: ["Running"],
  }));
  const settings = Object.fromEntries(
    extra.map((u) => [
      u.id,
      {
        ...templateSettings,
        published: false,
        dossier: {
          ...templateSettings.dossier,
          status: "pending",
          verification: undefined,
        },
      },
    ]),
  );
  fs.writeFileSync(
    "/private/tmp/partant-connected-qa.json",
    JSON.stringify([...users.slice(0, 4), ...extra]),
    { mode: 0o600 },
  );
  sql(
    `begin;select version from private.product_revision where id=true for update; update private.product_documents set body=(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(body) x where not (x->>'id'=any(array[${extra.map((u) => "'" + u.id + "'").join(",")}]::text[])))||'${JSON.stringify(entries).replaceAll("'", "''")}'::jsonb where key='extraCoaches'; update private.product_documents set body=body||'${JSON.stringify(settings).replaceAll("'", "''")}'::jsonb where key='settings';update private.product_revision set version=version+1;commit;`,
  );
  const first = await api(team, {
      team: {
        action: "list",
        query: "QA Pagination",
        filter: "pending",
        page: 0,
      },
    }),
    last = await api(team, {
      team: {
        action: "list",
        query: "QA Pagination",
        filter: "pending",
        page: 1,
      },
    });
  ok(
    first.status === 200 &&
      first.total === 11 &&
      first.items.length === 10 &&
      last.items.length === 1,
    "SQL pagination returns ten of eleven matching dossiers",
  );
  ok(
    !first.items.some((a) => last.items.some((b) => a.id === b.id)),
    "Pages do not overlap",
  );
  ok(
    !JSON.stringify(first).includes("documents") &&
      !JSON.stringify(first).includes("verification"),
    "Queue summaries contain no proof paths",
  );
  sql(
    `insert into private.product_staff(id,role) values('${second.id}','reviewer') on conflict(id) do update set role=excluded.role;`,
  );
  await login(second);
  second.token = await elevateQaTeam(second, base, apikey);
  await api(team, { team: { action: "release", coach: extra[0].id } });
  const claims = await Promise.all([
    api(team, { team: { action: "claim", coach: extra[0].id } }),
    api(second, { team: { action: "claim", coach: extra[0].id } }),
  ]);
  ok(
    claims.filter((c) => c.changed === true).length === 1,
    "Concurrent claim has exactly one owner",
  );
  const loser = claims[0].changed ? second : team;
  const fail = await api(loser, {
    commands: [
      {
        name: "reviewDossier",
        args: [extra[0].id, "correction", "QA unowned decision must fail"],
      },
    ],
    requestId: randomUUID(),
  });
  ok(
    fail.status === 403,
    "Unassigned examiner cannot commit " + fail.status + " " + fail.error,
  );
  await api(team, { team: { action: "release", coach: extra[0].id } });
  sql(`update private.product_staff set role='support' where id='${team.id}';`);
  ok(
    (await api(team, { team: { action: "detail", coach: coach.id } }))
      .status === 403,
    "Support cannot inspect coach dossier",
  );
  ok(!(await signed(team)), "Support cannot sign proof URL");
  ok(
    (
      await api(team, {
        commands: [
          { name: "liftSuspension", args: [coach.id, "QA forbidden"] },
        ],
        requestId: randomUUID(),
      })
    ).status === 403,
    "Support cannot lift suspension",
  );
  sql(`update private.product_staff set role='admin' where id='${team.id}';`);
  ok(
    (await api(team, { team: { action: "list" } })).status === 200,
    "Admin access restored for QA",
  );
  // A signed AAL2 token is insufficient once its server session is revoked.
  const session = JSON.parse(
    Buffer.from(team.token.split(".")[1], "base64url").toString(),
  ).session_id;
  sql(
    `delete from auth.sessions where id='${session}' and user_id='${team.id}';`,
  );
  ok(
    (await api(team, { team: { action: "list" } })).status === 403,
    "Revoked session denies old AAL2 JWT",
  );
  ok(!(await signed(team)), "Storage also denies old revoked AAL2 session");
  console.log(
    `PASS ${checks} deployed team MFA, roles, pagination, claims, Storage and session revocation checks`,
  );
} finally {
  if (uploaded)
    await fetch(base + "/storage/v1/object/coach-documents", {
      method: "DELETE",
      headers: headers(coach),
      body: JSON.stringify({ prefixes: [object] }),
    });
  sql(
    `delete from private.product_staff where id='${second.id}';update private.product_staff set role='admin' where id='${team.id}';`,
  );
}
