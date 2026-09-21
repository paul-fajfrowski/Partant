const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const ts = require("../apps/mobile/node_modules/typescript");
const storage = new Map(),
  requests = [];
let owner = "alice",
  granted = false,
  asked = 0,
  rotateOwner = false,
  dismissed = 0;
const N = {
  getPermissionsAsync: async () => ({ granted }),
  requestPermissionsAsync: async () => {
    asked++;
    return { granted };
  },
  getDevicePushTokenAsync: async () => {
    if (rotateOwner) owner = "bob";
    return { data: "a".repeat(64) };
  },
  dismissAllNotificationsAsync: async () => {
    dismissed++;
  },
  setBadgeCountAsync: async () => {},
};
const mock = {
  "@react-native-async-storage/async-storage": {
    getItem: async (k) => storage.get(k) ?? null,
    setItem: async (k, v) => storage.set(k, v),
    removeItem: async (k) => storage.delete(k),
  },
  "react-native": { Platform: { OS: "ios" } },
  "expo-crypto": { randomUUID: crypto.randomUUID },
  "expo-notifications": N,
  "../lib/supabase": {
    supabase: {
      auth: {
        getSession: async () => ({
          data: {
            session: { access_token: owner + "-token", user: { id: owner } },
          },
        }),
        getUser: async () => ({ data: { user: { id: owner } } }),
      },
      functions: {
        invoke: async (name, input) => {
          requests.push(input);
          return {
            data: {
              registered: input.body.action === "register",
              configured: true,
              categories: { messages: true },
            },
            error: null,
          };
        },
      },
    },
  },
};
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("apps/mobile/src/product/pushDevice.ts", "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText,
  {
    exports: exportsObject,
    require: (n) => {
      if (!mock[n]) throw Error(n);
      return mock[n];
    },
    process: { env: {} },
    setTimeout, clearTimeout,
    console,
  },
);
(async () => {
  let checks = 0;
  const ok = (v, m) => {
    assert.ok(v, m);
    checks++;
  };
  const id = await exportsObject.deviceId();
  ok(id === (await exportsObject.deviceId()), "stable device");
  const payload = {
    partant: {
      v: 1,
      recipient: "alice",
      noticeId: "n",
      event: "message",
      bookingId: "b",
    },
  };
  ok(
    exportsObject.parsePushTarget(payload, "alice").bookingId === "b",
    "valid target",
  );
  ok(
    !exportsObject.parsePushTarget(payload, "bob"),
    "foreign account rejected",
  );
  ok(
    !exportsObject.parsePushTarget(
      { url: "https://malicious.invalid" },
      "alice",
    ),
    "arbitrary URL ignored",
  );
  let denied = false;
  try {
    await exportsObject.enablePushDevice("alice", true);
  } catch {
    denied = true;
  }
  ok(
    denied && asked === 1 && requests.length === 0,
    "no registration after refusal",
  );
  granted = true;
  await exportsObject.enablePushDevice("alice", true);
  ok(
    requests.at(-1).headers.Authorization === "Bearer alice-token",
    "session bound",
  );
  ok(requests.at(-1).body.environment === "sandbox", "development environment");
  await exportsObject.unregisterPushDevice();
  ok(
    requests.at(-1).body.action === "remove" &&
      !storage.has("partant-push-owner-v1") &&
      dismissed === 1,
    "logout unregisters and clears local notifications",
  );
  rotateOwner = true;
  let switched = false;
  try {
    await exportsObject.enablePushDevice("alice", false);
  } catch {
    switched = true;
  }
  ok(
    switched && requests.at(-1).body.action === "remove",
    "account change during APNs registration rejected",
  );
  console.log(
    `PASS ${checks} native push permission, account, token and logout checks (native APIs simulated).`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
