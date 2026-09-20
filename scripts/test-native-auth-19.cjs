const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const ts = require("../apps/mobile/node_modules/typescript");
let count = 0;
const ok = (v, m) => {
  assert.ok(v, m);
  count++;
};
const storage = new Map();
let os = "ios",
  nativeCalls = 0,
  exchangeCalls = 0,
  oauthCalls = 0,
  failExchange = false,
  cancel = false,
  missingToken = false,
  received;
const supabase = {
  auth: {
    signInWithIdToken: async (args) => {
      received = args;
      return { error: null };
    },
    exchangeCodeForSession: async () => {
      exchangeCalls++;
      await new Promise((r) => setTimeout(r, 5));
      return { error: failExchange ? Error("expired") : null };
    },
    signInWithOAuth: async () => {
      oauthCalls++;
      return { data: { url: "https://identity.example.test" }, error: null };
    },
    getSession: async () => ({
      data: { session: { user: { id: "fixture" } } },
    }),
  },
};
const mocks = {
  "@react-native-async-storage/async-storage": {
    setItem: async (k, v) => storage.set(k, v),
    getItem: async (k) => storage.get(k) ?? null,
    removeItem: async (k) => storage.delete(k),
  },
  "react-native": {
    Platform: {
      get OS() {
        return os;
      },
    },
  },
  "expo-web-browser": {
    maybeCompleteAuthSession() {},
    openAuthSessionAsync: async () => ({ type: "cancel" }),
  },
  "expo-apple-authentication": {
    isAvailableAsync: async () => true,
    formatFullName: (n) => n.givenName + " " + n.familyName,
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    signInAsync: async (args) => {
      nativeCalls++;
      mocks.lastNonce = args.nonce;
      if (cancel) throw { code: "ERR_REQUEST_CANCELED" };
      return {
        identityToken: missingToken ? null : "fixture-token",
        fullName: { givenName: "Camille", familyName: "Test" },
      };
    },
  },
  "expo-crypto": {
    randomUUID: crypto.randomUUID,
    CryptoDigestAlgorithm: { SHA256: "sha256" },
    digestStringAsync: async (_, v) =>
      crypto.createHash("sha256").update(v).digest("hex"),
  },
  "expo-auth-session": { makeRedirectUri: () => "partant://auth/callback" },
  "./supabase": { supabase },
};
function load(file) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (!(name in mocks)) throw Error(name);
        return mocks[name];
      },
      URL,
      URLSearchParams,
      setTimeout,
      clearTimeout,
      process: { env: {} },
      Date,
      fetch: async () => ({
        ok: true,
        json: async () => ({ external: { apple: true, google: true } }),
      }),
      window: {
        location: { origin: "https://partant.example.test", pathname: "/" },
        history: { replaceState() {} },
      },
    },
  );
  return exports;
}
(async () => {
  const a = load("apps/mobile/src/lib/auth.ts");
  await a.signInSocial("apple", { name: "", role: "client" });
  ok(
    nativeCalls === 1 && oauthCalls === 0,
    "Apple iOS uses native sheet, no OAuth browser",
  );
  ok(
    received.provider === "apple" && received.token === "fixture-token",
    "Apple identity exchanged with Supabase",
  );
  ok(
    mocks.lastNonce ===
      crypto.createHash("sha256").update(received.nonce).digest("hex"),
    "Hashed Apple nonce matches raw server nonce",
  );
  ok(
    JSON.parse(storage.get("partant-auth-intent")).name === "Camille Test",
    "First consent name preserved before session event",
  );
  cancel = true;
  await a.signInSocial("apple");
  ok(nativeCalls === 2, "Native cancellation returns normally");
  cancel = false;
  missingToken = true;
  await assert.rejects(a.signInSocial("apple"), /confirmation/);
  count++;
  missingToken = false;
  await a.signInSocial("apple");
  ok(nativeCalls === 4, "Can retry after failure");
  await Promise.all([
    a.completeAuth("partant://auth/callback?code=one"),
    a.completeAuth("partant://auth/callback?code=one"),
  ]);
  ok(exchangeCalls === 1, "Duplicate native callback exchanged once");
  await a.completeAuth("partant://calendar/callback?code=wrong");
  ok(exchangeCalls === 1, "Calendar callback ignored by auth");
  failExchange = true;
  await assert.rejects(a.completeAuth("partant://auth/callback?code=retry"));
  count++;
  failExchange = false;
  await a.completeAuth("partant://auth/callback?code=retry");
  ok(exchangeCalls === 3, "Failed exchange may retry");
  await assert.rejects(
    a.completeAuth("partant://auth/callback#error=access_denied"),
    /annulée/,
  );
  count++;
  await assert.rejects(
    a.withAuthTimeout(new Promise(() => {}), 5),
    /trop de temps/,
  );
  count++;
  os = "android";
  await a.signInSocial("google");
  ok(oauthCalls === 1, "Google browser cancellation stays recoverable");
  const j = load("apps/mobile/src/product/authJourney.ts");
  const journey = {
    screen: "favorites",
    focus: "",
    coachId: "a",
    offerId: "b",
    day: "2026-09-20",
    expires: Date.now() + 10000,
    favorite: "a",
  };
  await j.saveJourney(journey);
  ok((await j.readJourney()).favorite === "a", "Guest action survives remount");
  ok(
    !j.parseJourney(JSON.stringify({ ...journey, expires: Date.now() - 1 })),
    "Expired guest intent discarded",
  );
  ok(
    !j.parseJourney(JSON.stringify({ ...journey, screen: "coach" })),
    "Guest intent cannot open coach settings",
  );
  ok(
    !j.parseJourney(JSON.stringify({ ...journey, screen: "setup" })),
    "Checkout requires saved draft",
  );
  await j.clearJourney();
  ok(
    !(await j.readJourney()),
    "Intent consumed without persisting across accounts",
  );
  console.log(
    `PASS ${count} native auth and guest-resume checks (provider responses simulated).`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
