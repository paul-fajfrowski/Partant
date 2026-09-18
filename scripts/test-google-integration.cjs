const fs = require("fs"),
  assert = require("node:assert/strict"),
  vm = require("vm"),
  path = require("path"),
  ts = require("../apps/mobile/node_modules/typescript");
const root = path.resolve(__dirname, "..");
(async () => {
  const domain = await import("../supabase/functions/product-api/domain.js");
  const providers = await import("../services/calendar/providers.mjs");
  const env = {
    CALENDAR_TOKEN_KEY: Buffer.alloc(32, 7).toString("base64"),
    GOOGLE_CALENDAR_CLIENT_ID: "test-client",
    GOOGLE_CALENDAR_CLIENT_SECRET: "test-secret",
    SUPABASE_URL: "https://test.invalid",
  };
  let failure = false,
    posts = 0,
    patches = 0,
    deletes = 0,
    remote = new Map();
  const fetcher = async (url, init = {}) => {
    url = String(url);
    if (failure) return new Response("{}", { status: 401 });
    if (url.includes("oauth2.googleapis.com/token"))
      return Response.json({ access_token: "new-token", expires_in: 3600 });
    if (url.includes("/events")) {
      const method = init.method ?? "GET";
      if (method === "POST") {
        posts++;
        const b = JSON.parse(init.body);
        if (remote.has(b.id)) return new Response("{}", { status: 409 });
        remote.set(b.id, b);
        return Response.json(b);
      }
      if (method === "PATCH") {
        patches++;
        const id = url.split("/").pop();
        remote.set(id, JSON.parse(init.body));
        return Response.json({ id });
      }
      if (method === "DELETE") {
        deletes++;
        remote.delete(url.split("/").pop());
        return new Response(null, { status: 204 });
      }
      return Response.json({
        timeZone: "Europe/Paris",
        items: [
          {
            id: "private-event",
            summary: "Secret client",
            start: { dateTime: "2026-09-20T08:10:00Z" },
            end: { dateTime: "2026-09-20T09:10:00Z" },
          },
          ...[...remote].map(([id, b]) => ({ id, ...b })),
        ],
      });
    }
    throw Error("Unexpected URL " + url);
  };
  const modules = {};
  function load(file) {
    if (modules[file]) return modules[file];
    if (file.endsWith("domain.js")) return domain;
    if (file.endsWith("calendarProviders.js"))
      return {
        ...providers,
        pullGoogle: (options) => providers.pullGoogle({ ...options, fetcher }),
      };
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const module = { exports: {} };
    modules[file] = module.exports;
    vm.runInNewContext(source, {
      module,
      exports: module.exports,
      require: (p) => load(path.resolve(path.dirname(file), p)),
      Deno: { env: { get: (k) => env[k] } },
      fetch: fetcher,
      crypto: globalThis.crypto,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      Date,
      Intl,
      Map,
      Set,
      Error,
      JSON,
      Response,
      AbortSignal,
      URLSearchParams,
      btoa,
      atob,
      console,
    });
    return module.exports;
  }
  const google = load(path.join(root, "supabase/functions/_shared/google.ts")),
    sync = load(path.join(root, "supabase/functions/_shared/calendarSync.ts"));
  let count = 0;
  const check = (v, msg) => {
    assert.ok(v, msg);
    count++;
  };
  const sealed = await google.seal({ refresh_token: "hidden" }, "coach");
  check(!sealed.includes("hidden"), "ciphertext");
  check(
    (await google.open(sealed, "coach")).refresh_token === "hidden",
    "decrypt",
  );
  await assert.rejects(() => google.open(sealed, "other"));
  count++;
  const split = sync.toBusy([
    { starts_at: "2026-10-24T22:00:00Z", ends_at: "2026-10-25T23:00:00Z" },
  ]);
  check(
    split.length === 1 && split[0].duration === 1440,
    "DST all day is whole local day",
  );
  const coach = "11111111-1111-4111-8111-111111111111",
    day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let state = {
      ...domain.emptyConnected(),
      groups: [
        {
          id: "g",
          offer: { coach, duration: 60 },
          day,
          time: "12:00",
          address: "Public park",
        },
      ],
      bookings: [
        {
          id: "solo",
          coach,
          day,
          time: "15:00",
          duration: 60,
          status: "confirmed",
          kind: "Individuel",
          address: "Studio",
        },
        {
          id: "member1",
          coach,
          day,
          time: "12:00",
          duration: 60,
          status: "confirmed",
          kind: "Groupe",
        },
        {
          id: "member2",
          coach,
          day,
          time: "12:00",
          duration: 60,
          status: "confirmed",
          kind: "Groupe",
        },
      ],
    },
    version = 0;
  let link = {
      tokens: await google.seal(
        {
          access_token: "token",
          refresh_token: "refresh",
          expires_at: Date.now() + 3600000,
        },
        coach,
      ),
      read: ["primary"],
      write: "primary",
    },
    locked = false;
  const admin = {
    rpc: async (name, args) => {
      if (name === "product_load")
        return { data: { version, documents: state } };
      if (name === "product_commit") {
        if (args.p_version !== version) return { data: false };
        state = args.p_documents;
        version++;
        return { data: true };
      }
      if (name === "calendar_store") {
        const a = args.p_action;
        if (a === "get") return { data: link };
        if (a === "lock") {
          if (locked) return { data: null };
          locked = true;
          return { data: { ...link, _lease: args.p_data.id } };
        }
        if (a === "lease") return { data: locked };
        if (a === "save") {
          link = { ...args.p_data };
          return { data: link };
        }
        if (a === "unlock") {
          locked = false;
          return { data: null };
        }
      }
      throw Error("Unexpected RPC " + name);
    },
  };
  await sync.syncGoogle(admin, coach);
  check(remote.size === 2, "one event per group, not per participant");
  check(posts === 2, "two creates");
  check(state.calendarBusy[coach].length === 1, "own events excluded");
  check(
    !JSON.stringify(state.calendarBusy).includes("Secret"),
    "titles private",
  );
  check(state.calendarStatus[coach].connected, "connected status");
  await sync.syncGoogle(admin, coach);
  check(posts === 2 && patches === 0, "repeat sync no duplicate writes");
  state.bookings[0].time = "16:00";
  await sync.syncGoogle(admin, coach);
  check(remote.size === 2 && patches === 1, "reschedule updates stable event");
  state.bookings[0].status = "cancelled";
  await sync.syncGoogle(admin, coach);
  check(remote.size === 1 && deletes === 1, "cancellation removes event");
  failure = true;
  await assert.rejects(() => sync.syncGoogle(admin, coach));
  count++;
  check(state.calendarBusy[coach].length === 1, "failure retains occupancy");
  check(!!state.calendarStatus[coach].error, "failure marks stale connection");
  check(!locked, "lease released after failure");
  console.log(
    `PASS ${count} Google encryption, timezone and reconciliation checks (provider responses simulated).`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
