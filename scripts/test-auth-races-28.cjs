// Shared React hook exercised with native iOS and web platform adapters.
// No credentials, external provider, or network used.
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const ts = require("../apps/mobile/node_modules/typescript");
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
const { JSDOM } = require(process.env.PARTANT_QA_JSDOM);
const dom = new JSDOM('<div id="root"></div>', { url: "http://127.0.0.1/" });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
const React = require("../apps/mobile/node_modules/react");
const { createRoot } = require("../apps/mobile/node_modules/react-dom/client");
const M = require("../apps/mobile/src/product/model.ts");
const initial = { ...M.initialStore, connected: true, account: null };
const user = { id: "qa-user", email: "qa@example.test" };
const account = { ...user, role: "client", name: "Camille" };
const authenticated = { ...initial, account };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let count = 0;
function ok(v, m) {
  assert.ok(v, m);
  count++;
}
async function until(f) {
  for (let i = 0; i < 100 && !f(); i++) await wait(10);
  ok(f(), "State settled");
}
async function scenario(os) {
  let hook,
    listener,
    resolveGuest,
    resolvePrivate,
    privateCalls = 0,
    registrations = 0,
    fail = false,
    hold = true;
  const requests = [];
  const supabase = {
    functions: {
      invoke: async (_, { body }) => {
        requests.push(body);
        if (body.register) {
          registrations++;
          return { data: { store: authenticated, version: 4 } };
        }
        if (body.scope == null) {
          return new Promise((r) => {
            resolveGuest = () => r({ data: { store: initial, version: 1 } });
          });
        }
        privateCalls++;
        if (fail) return { error: { message: "offline" } };
        if (hold)
          return new Promise((r) => {
            resolvePrivate = () =>
              r({ data: { store: authenticated, version: 2 } });
          });
        return { data: { store: authenticated, version: 3 } };
      },
    },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (fn) => {
        listener = fn;
        return { data: { subscription: { unsubscribe() {} } } };
      },
      verifyOtp: async () => {
        const session = { user };
        listener("SIGNED_IN", session);
        return { data: { user, session } };
      },
      signOut: async () => {
        listener("SIGNED_OUT", null);
        return {};
      },
    },
  };
  const exports = {};
  const mocks = {
    react: React,
    "@react-native-async-storage/async-storage": {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      multiRemove: async () => {},
    },
    "../lib/supabase": { supabase },
    "../lib/auth": {
      completeAuth: async () => {},
      redirectTo: () => "",
      withAuthTimeout: (p) => p,
    },
    "react-native": {
      Platform: { OS: os },
      AppState: {
        currentState: "active",
        addEventListener: () => ({ remove() {} }),
      },
      Linking: {
        getInitialURL: async () => null,
        addEventListener: () => ({ remove() {} }),
      },
    },
    "./pushDevice": {
      unregisterPushDevice: async () => {},
      clearLocalPushDevice: async () => {},
    },
    "expo-crypto": { randomUUID: () => require("node:crypto").randomUUID() },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        process.env.PARTANT_QA_HOOK ||
          "apps/mobile/src/product/useMarketplace.ts",
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
        },
      },
    ).outputText,
    {
      exports,
      require: (n) =>
        n in mocks
          ? mocks[n]
          : require(
              "../apps/mobile/src/product/" + n.replace("./", "") + ".ts",
            ),
      window: dom.window,
      document: dom.window.document,
      URLSearchParams,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console,
    },
  );
  const root = createRoot(document.getElementById("root"));
  function Test() {
    hook = exports.useMarketplace(true);
    return null;
  }
  root.render(React.createElement(Test));
  await until(() => resolveGuest);
  listener("SIGNED_IN", { user });
  await until(() => privateCalls === 1);
  ok(!hook.profileReady, os + ": do not expose account before server read");
  resolvePrivate();
  await until(() => hook.profileReady);
  ok(
    hook.store.account?.id === user.id,
    os + ": private profile did not wait for guest",
  );
  resolveGuest();
  await wait(30);
  ok(
    hook.store.account?.id === user.id,
    os + ": stale guest snapshot discarded",
  );
  fail = true;
  hold = false;
  await assert.rejects(hook.refresh(), /offline/);
  await wait(20);
  ok(hook.profileError === "offline", os + ": recoverable load error");
  fail = false;
  await hook.refresh();
  await wait(20);
  ok(!hook.profileError, os + ": successful retry clears load error");
  // A refresh already in flight when registering cannot replace its snapshot.
  hold = true;
  const pending = hook.refresh();
  await until(() => privateCalls === 4);
  await hook.finishSocial("Camille", "client");
  await wait(20);
  resolvePrivate();
  await pending;
  await wait(20);
  ok(
    hook.store.account?.name === "Camille",
    os + ": registration supersedes prior read",
  );
  const before = privateCalls;
  await hook.verifyCode("qa@example.test", "123456", "Camille", "client");
  ok(
    privateCalls === before && registrations === 2,
    os + ": OTP uses one registration request and no preliminary fetch",
  );
  root.unmount();
}
(async () => {
  await scenario("ios");
  await scenario("web");
  dom.window.close();
  console.log(
    `PASS ${count} auth concurrency/recovery checks (iOS + web adapters).`,
  );
})().catch((e) => {
  console.error(e);
  dom.window.close();
  process.exit(1);
});
