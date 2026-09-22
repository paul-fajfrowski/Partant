// Uses only temporary fixtures prepared by test-connected-api.mjs --prepare.
import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
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
const V = require("../apps/mobile/src/product/verification.ts");
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json", "utf8"),
);
assert(
  users.every(
    (u) =>
      u.email.startsWith("partant-qa-") && u.email.endsWith("@example.invalid"),
  ),
);
const [coach, client, , team] = users;
const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../apps/mobile/.env", import.meta.url), "utf8")
    .split("\n")
    .filter((s) => s.includes("="))
    .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1)]),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let checks = 0,
  uploaded = [];
const ok = (v, m) => {
  assert.ok(v, m);
  checks++;
};
const headers = (u) => ({
  apikey,
  "Content-Type": "application/json",
  ...(u?.token ? { Authorization: `Bearer ${u.token}` } : {}),
});
async function api(u, body = {}) {
  const r = await fetch(base + "/functions/v1/product-api", {
    method: "POST",
    headers: headers(u),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  return { status: r.status, ...(await r.json()) };
}
async function read(u) {
  const r = await api(u);
  assert.equal(r.status, 200, r.error);
  return r;
}
async function cmd(u, name, args, allowed = true) {
  const before = await read(u);
  const r = await api(u, {
    version: before.version,
    requestId: randomUUID(),
    commands: [{ name, args }],
  });
  if (allowed) assert.equal(r.status, 200, r.error);
  else ok(r.status >= 400, "Unauthorized or invalid mutation refused");
  return r.store;
}
try {
  for (const u of [coach, client, team]) {
    const r = await fetch(base + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email: u.email, password: u.password }),
    });
    const d = await r.json();
    assert(r.ok, "Temporary Auth login");
    u.token = d.access_token;
    const a = await api(u, {
      register: {
        name: "QA Dossier 26",
        role: u === coach ? "coach" : "client",
      },
      requestId: randomUUID(),
    });
    assert.equal(a.status, 200, a.error);
  }
  await cmd(coach, "saveCoach", [
    coach.id,
    {
      sport: "Running",
      bio: "Profil de recette uniquement.",
      cert: "Diplôme fictif",
    },
  ]);
  const future = new Date(Date.now() + 365 * 86400000)
    .toISOString()
    .slice(0, 10);
  const files = [];
  for (const kind of ["identity", "insurance", "qualification", "card"]) {
    const path = `${coach.id}/${randomUUID()}.pdf`;
    const r = await fetch(`${base}/storage/v1/object/coach-documents/${path}`, {
      method: "POST",
      headers: {
        apikey,
        Authorization: `Bearer ${coach.token}`,
        "Content-Type": "application/pdf",
      },
      body: "%PDF-1.4\n% Fichier QA fictif sans donnees personnelles\n%%EOF",
    });
    assert(r.ok, "Private QA upload");
    uploaded.push(path);
    files.push({
      id: kind,
      kind,
      title: "QA " + kind,
      path,
      expires: ["insurance", "card"].includes(kind) ? future : "",
      practices: ["Running"],
      reference: "",
    });
  }
  let v = {
    professionalStatus: "qualified",
    context: "",
    practices: ["Running"],
    files,
  };
  let state = await cmd(coach, "saveVerification", [coach.id, v, ["Running"]]);
  ok(
    state.settings[coach.id].dossier.verification.reviews.Running.status ===
      "pending",
    "Real API receives scoped dossier",
  );
  await cmd(
    coach,
    "reviewPractice",
    [
      coach.id,
      "Running",
      "approved",
      "Forged approval",
      V.proofFingerprint(
        state.settings[coach.id].dossier.verification,
        "Running",
      ),
    ],
    false,
  );
  let staff = await read(team);
  ok(staff.store.staff, "Isolated QA team account has access");
  const fingerprint = V.proofFingerprint(
    staff.store.settings[coach.id].dossier.verification,
    "Running",
  );
  await cmd(team, "reviewPractice", [
    coach.id,
    "Running",
    "approved",
    "Recette fictive : prérogatives vérifiées",
    fingerprint,
  ]);
  state = (await read(coach)).store;
  ok(
    state.settings[coach.id].dossier.verification.reviews.Running.status ===
      "approved",
    "Decision synchronized to coach",
  );
  ok(
    state.notices.some(
      (n) => n.event === "dossier" && n.body.includes("Running"),
    ),
    "Scoped decision notification delivered",
  );
  ok(
    state.settings[coach.id].dossier.history.at(-1).by === team.id,
    "Authenticated reviewer recorded",
  );
  v = {
    ...v,
    practices: ["Running", "Pilates"],
    files: files.map((f) => ({ ...f, practices: ["Running", "Pilates"] })),
  };
  state = await cmd(coach, "saveVerification", [coach.id, v, ["Pilates"]]);
  ok(
    state.settings[coach.id].dossier.verification.reviews.Running.status ===
      "approved",
    "Shared upload preserves approved practice",
  );
  ok(
    state.settings[coach.id].dossier.verification.reviews.Pilates.status ===
      "pending",
    "New practice needs separate decision",
  );
  await cmd(client, "saveVerification", [coach.id, v], false);
  const broken = {
    ...v,
    files: v.files.map((f, i) =>
      i === 0 ? { ...f, path: `${coach.id}/${randomUUID()}.pdf` } : f,
    ),
  };
  await cmd(coach, "saveVerification", [coach.id, broken], false);
  state = (await read(coach)).store;
  ok(
    state.settings[coach.id].dossier.verification.files[0].path ===
      files[0].path,
    "Missing Storage object leaves dossier unchanged",
  );
  const json = JSON.stringify((await read(client)).store);
  ok(
    !json.includes(files[0].path) && !json.includes("prérogatives vérifiées"),
    "Another account sees no private dossier content",
  );
  for (const u of [coach, team, client]) {
    const r = await fetch(
      `${base}/storage/v1/object/sign/coach-documents/${files[0].path}`,
      {
        method: "POST",
        headers: headers(u),
        body: JSON.stringify({ expiresIn: 30 }),
      },
    );
    ok(
      r.ok === (u !== client),
      "Private file visible only to coach and authorized team",
    );
  }
  console.log(`PASS ${checks} deployed verification API/Auth/Storage checks.`);
} finally {
  if (uploaded.length && coach.token) {
    const r = await fetch(base + "/storage/v1/object/coach-documents", {
      method: "DELETE",
      headers: headers(coach),
      body: JSON.stringify({ prefixes: uploaded }),
    });
    assert(r.ok, "QA files cleanup");
    console.log("Temporary proof files removed.");
  }
}
