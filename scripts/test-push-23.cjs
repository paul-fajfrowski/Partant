const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const ts = require("../apps/mobile/node_modules/typescript");
function load(file, extra = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    {
      exports,
      crypto: crypto.webcrypto,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      Date,
      JSON,
      Error,
      RegExp,
      Number,
      Array,
      Object,
      Promise,
      Math,
      Set,
      Map,
      btoa,
      atob,
      AbortSignal,
      fetch,
      Response,
      Request,
      ...extra,
    },
  );
  return exports;
}
const apns = load("supabase/functions/_shared/apns.ts"),
  http = load("supabase/functions/_shared/http.ts");
(async () => {
  let checks = 0;
  function ok(v, msg) {
    assert.ok(v, msg);
    checks++;
  }
  const keys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pem = keys.privateKey.export({ format: "pem", type: "pkcs8" });
  const jwt = await apns.providerToken(
    pem,
    "TEAMTEST00",
    "KEYTEST000",
    1_800_000_000_000,
  );
  const [h, p, s] = jwt.split(".");
  ok(JSON.parse(Buffer.from(h, "base64url")).alg === "ES256", "algorithm");
  ok(
    crypto.verify(
      "sha256",
      Buffer.from(h + "." + p),
      { key: keys.publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(s, "base64url"),
    ),
    "signed APNs token",
  );
  ok(
    jwt ===
      (await apns.providerToken(
        pem,
        "TEAMTEST00",
        "KEYTEST000",
        1_800_000_010_000,
      )),
    "cache provider token",
  );
  const job = {
    id: crypto.randomUUID(),
    recipient: "actor",
    notice_id: "notice",
    booking: "booking",
    event: "message",
    environment: "sandbox",
    token: "a".repeat(64),
    expires_at: new Date(Date.now() + 60000).toISOString(),
    body: "PRIVATE MESSAGE",
    address: "PRIVATE ADDRESS",
  };
  const payload = apns.pushContent(job);
  ok(!JSON.stringify(payload).includes("PRIVATE"), "payload privacy");
  ok(payload.partant.recipient === "actor", "account binding");
  for (const [status, reason, expected, disable] of [
    [200, null, "accepted", false],
    [410, "Unregistered", "failed", true],
    [400, "BadDeviceToken", "failed", true],
    [403, "InvalidProviderToken", "failed", false],
    [429, "TooManyRequests", "pending", false],
    [503, "ServiceUnavailable", "pending", false],
  ]) {
    const result = await apns.sendApns(
      job,
      {
        key: pem,
        keyId: "KEYTEST000",
        team: "TEAMTEST00",
        topic: "com.paulfajfrowski.partant",
      },
      async (url, opts) => {
        ok(
          url.startsWith("https://api.sandbox.push.apple.com/"),
          "sandbox isolation",
        );
        ok(
          opts.headers["apns-collapse-id"] === job.id,
          "stable collapse identifier",
        );
        return new Response(JSON.stringify({ reason }), { status });
      },
    );
    ok(
      result.status === expected && result.disable === disable,
      "APNs outcome " + status,
    );
  }
  for (const value of ["null", "[]", "{", '{"__proto__":{}}']) {
    let rejected = false;
    try {
      await http.readJson(
        new Request("https://test", { method: "POST", body: value }),
      );
    } catch (e) {
      rejected = e.status === 400;
    }
    ok(rejected, "bad request rejected");
  }
  let rejected = false;
  try {
    await http.readJson(
      new Request("https://test", {
        method: "POST",
        body: '{"x":"' + "x".repeat(100) + '"}',
      }),
      20,
    );
  } catch (e) {
    rejected = e.status === 413;
  }
  ok(rejected, "stream size cap");
  ok(
    (
      await http.readJson(
        new Request("https://test", { method: "POST", body: '{"ok":true}' }),
      )
    ).ok,
    "valid JSON",
  );
  console.log(
    `PASS ${checks} push/server checks (APNs responses simulated, no notification sent).`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
