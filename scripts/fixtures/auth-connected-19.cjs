// UI-only backend fixture. Never forwards a request to a real service.
const fs = require("node:fs"),
  ts = require("../../apps/mobile/node_modules/typescript");
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
const M = require("../../apps/mobile/src/product/model.ts"),
  W = require("../../apps/mobile/src/product/workflows.ts");
let base = W.loginDemo(
  M.newPreviewStore(),
  "alex@example.test",
  "Alex",
  "client",
  false,
);
const client = base.account,
  coach = W.identities(base).find((a) => a.role === "coach");
const all = M.allCoaches(base);
let logged = false,
  revision = 0;
base = {
  ...base,
  connected: true,
  extraCoaches: all,
  settings: Object.fromEntries(
    all.map((c) => [
      c.id,
      {
        ...M.configFor(base, c.id),
        published: true,
        week: Array.from({ length: 7 }, () => [["07:00", "23:00"]]),
      },
    ]),
  ),
};
const account = process.env.PARTANT_QA_ROLE === "coach" ? coach : client;
const user = {
  id: account.id,
  aud: "authenticated",
  role: "authenticated",
  email: account.email,
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  { alg: "HS256" },
  {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "authenticated",
  },
  "test",
]
  .map((x) =>
    Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString(
      "base64url",
    ),
  )
  .join(".");
function snapshot() {
  return {
    ...base,
    account: logged ? account : null,
    identities: logged ? [account] : [],
    bookings: logged ? base.bookings : [],
    notices: logged ? base.notices : [],
    messages: logged ? base.messages : {},
    favorites: logged ? base.favorites : [],
    testMode: false,
  };
}
const reply = (v, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(v), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
exports.fetch = (input, init = {}) => {
  const url = String(input.url ?? input);
  const body = JSON.parse(init.body || "{}");
  if (url.includes("/auth/v1/settings"))
    return reply({ external: { apple: true, google: true } });
  if (url.includes("/auth/v1/otp")) return reply({});
  if (url.includes("/auth/v1/verify") || url.includes("/auth/v1/token")) {
    logged = true;
    return reply({
      access_token: token,
      refresh_token: "fixture-refresh",
      token_type: "bearer",
      expires_in: 3600,
      user,
    });
  }
  if (url.includes("/auth/v1/user")) return reply(user);
  if (url.includes("/auth/v1/logout")) {
    logged = false;
    return reply({});
  }
  if (url.includes("/functions/v1/product-api")) {
    for (const command of body.commands ?? []) {
      if (command.name === "favorites") base.favorites = command.args[0];
      if (command.name === "report")
        base = W.report({ ...base, account }, command.args[0]);
    }
    return reply({ store: snapshot(), version: ++revision });
  }
  if (url.includes("geoplateforme") || url.includes("adresse.data.gouv"))
    return reply({ features: [] });
  return reply({ error: "Unexpected fixture request" }, 404);
};
exports.snapshot = snapshot;
