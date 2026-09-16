const fs = require("node:fs"),
  assert = require("node:assert/strict");
const fixture = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json"),
);
const env = Object.fromEntries(
  fs
    .readFileSync("apps/mobile/.env", "utf8")
    .split("\n")
    .filter((s) => s && !s.startsWith("#"))
    .map((s) => {
      let i = s.indexOf("=");
      return [s.slice(0, i), s.slice(i + 1)];
    }),
);
const user = fixture[0],
  base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
(async () => {
  const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const session = await login.json();
  assert.ok(session.access_token);
  const sessionFile = "/private/tmp/partant-connected-web-session.json";
  fs.writeFileSync(
    sessionFile,
    JSON.stringify({
      key: `sb-${new URL(base).hostname.split(".")[0]}-auth-token`,
      session,
    }),
    { mode: 0o600 },
  );
  process.env.PARTANT_QA_SESSION = sessionFile;
  process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
  const H = require("./native-web-harness.cjs"),
    { d, w, ok, click, input, wait } = H;
  const read = async () => {
    const r = await fetch(`${base}/functions/v1/product-api`, {
      method: "POST",
      headers: {
        apikey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const data = await r.json();
    return data.store;
  };
  const until = async (fn, label) => {
    for (let i = 0; i < 100; i++) {
      if (await fn()) return;
      await wait();
    }
    throw Error(label + "\n" + d.body.textContent.slice(-1800));
  };
  try {
    await until(
      () => d.body.textContent.includes("Réglages"),
      "Connected coach home",
    );
    ok(
      d.body.textContent.includes("Agenda"),
      "Real session restores coach home",
    );
    const original = await read();
    const expectedPlace =
      original.settings[user.id].week[0][0][3][0] === "gym" ? "track" : "gym";
    await click("Réglages");
    await click("Disponibilités");
    await click("Lieux de la plage 1");
    ok(
      d.body.textContent.includes("Où êtes-vous sur cette plage ?"),
      "Venue editor reachable",
    );
    const toggle = async (label, desired) => {
      const el =
        d.querySelector(`[role="switch"][aria-label="${label}"]`) ??
        d.querySelector(`input[aria-label="${label}"]`);
      assert.ok(
        el,
        label +
          "\n" +
          d.body.textContent.slice(-2600) +
          "\n" +
          [...d.querySelectorAll("input")].map((x) => x.outerHTML).join("\n"),
      );
      if (el.checked !== desired) el.click();
      await wait();
    };
    await toggle("Autoriser Salle QA", expectedPlace === "gym");
    await toggle("Autoriser Piste QA", expectedPlace === "track");
    await click("Appliquer les lieux");
    await click("Enregistrer les réglages");
    await until(async () => {
      const s = await read();
      return s.settings[user.id].week[0][0][3].join() === expectedPlace;
    }, "Coach range reaches server");
    ok(true, "Range venue saved through real RN transport");
    await until(
      () => !d.body.textContent.includes("Enregistrement sur Partant"),
      "Pending completes",
    );
    await click("Retour");
    await click("Disponibilités");
    ok(d.body.textContent.includes("Piste QA"), "Saved venue restored");
    await click("Retour");
    await click("Préférences de notification");
    const sw = d.querySelector(
      '[role="switch"][aria-label="Nouvelle réservation"]',
    );
    assert.ok(sw, "Notification switch reachable");
    if (sw) {
      const expectedNotification = !sw.checked;
      sw.click();
      await wait();
      await click("Enregistrer les réglages");
      await until(
        async () =>
          (await read()).settings[user.id].notifications.booking ===
          expectedNotification,
        "Notifications preference persists",
      );
      ok(true, "Notification settings connected");
    }
    // Two sequential operations must not replay an earlier saveSettings command.
    const s = await read();
    ok(
      s.settings[user.id].week[0][0][3].join() === expectedPlace,
      "Other settings preserve venue selection",
    );
    H.finish("connected React Native with deployed Supabase");
  } catch (e) {
    H.close();
    throw e;
  } finally {
    fs.rmSync(sessionFile, { force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
