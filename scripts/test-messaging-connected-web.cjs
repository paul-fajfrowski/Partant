// Run after test-connected-api.mjs. Only isolated QA users; no external messages.
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  { randomUUID } = require("node:crypto");
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json"),
);
assert.ok(users.every((u) => /^partant-qa-.*@example\.invalid$/.test(u.email)));
const env = Object.fromEntries(
  fs
    .readFileSync("apps/mobile/.env", "utf8")
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const base = env.EXPO_PUBLIC_SUPABASE_URL,
  apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  realFetch = global.fetch,
  sessionFile = "/private/tmp/partant-messaging-qa-session.json";
let H,
  checks = 0,
  blocked = false,
  dropAfterCommit = false;
const ok = (v, label) => {
  assert.ok(v, label);
  checks++;
};
async function session(u) {
  const r = await realFetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  const data = await r.json();
  assert.ok(data.access_token);
  return data;
}
async function api(s, body = {}) {
  const r = await realFetch(base + "/functions/v1/product-api", {
    method: "POST",
    headers: {
      apikey,
      Authorization: "Bearer " + s.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, ...(await r.json()) };
}
async function read(s) {
  const r = await api(s);
  assert.equal(r.status, 200);
  return r.store;
}
async function command(s, name, ...args) {
  const current = await api(s);
  const r = await api(s, {
    version: current.version,
    requestId: randomUUID(),
    commands: [{ name, args }],
  });
  assert.equal(r.status, 200, r.error);
  return r.store;
}
const until = async (fn, label) => {
  for (let i = 0; i < 120; i++) {
    if (await fn()) return;
    await H.wait();
  }
  throw Error(label + "\n" + H.d.body.textContent.slice(-1300));
};
async function load(s, storage = {}) {
  if (H) {
    ok(!H.errors.length, "No runtime errors before reload");
    H.close();
    delete require.cache[require.resolve("./native-web-harness.cjs")];
  }
  fs.writeFileSync(
    sessionFile,
    JSON.stringify({
      key: `sb-${new URL(base).hostname.split(".")[0]}-auth-token`,
      session: s,
    }),
    { mode: 0o600 },
  );
  process.env.PARTANT_QA_URL = "http://127.0.0.1:8081/?data=connected";
  process.env.PARTANT_QA_SESSION = sessionFile;
  H = require("./native-web-harness.cjs");
  for (const [k, v] of Object.entries(storage)) H.w.localStorage.setItem(k, v);
  await until(
    () =>
      H.d.body.textContent.includes("Mon espace") ||
      H.d.body.textContent.includes("Agenda"),
    "Authenticated app",
  );
}
const snapshot = () =>
  Object.fromEntries(
    Object.keys(H.w.localStorage).map((k) => [k, H.w.localStorage.getItem(k)]),
  );
const outbox = () => {
  const key = Object.keys(H.w.localStorage).find((k) =>
    k.startsWith("partant-messages-v1:connected:"),
  );
  return Object.values(JSON.parse(H.w.localStorage.getItem(key) || "{}")).find(
    (x) => x.outgoing,
  )?.outgoing;
};
(async () => {
  try {
    const client = await session(users[1]),
      coach = await session(users[0]),
      bob = await session(users[2]);
    const initial = await read(client),
      b = initial.bookings.find(
        (b) => b.coach === users[0].id && b.kind === "Individuel",
      );
    assert.ok(b);
    const laterDay = new Date(Date.now() + 8 * 86400000)
        .toISOString()
        .slice(0, 10),
      existing = initial.bookings.find(
        (x) => x.coach === b.coach && x.day === laterDay && x.time === "09:10",
      );
    const secondId = existing?.id ?? randomUUID(),
      offer = initial.offers.find(
        (o) => o.coach === b.coach && o.kind === "Individuel",
      );
    if (!existing)
      await command(client, "reserve", {
        id: secondId,
        coach: b.coach,
        offerId: offer.id,
        day: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
        time: "09:10",
        format: "gym",
        seats: 1,
        price: offer.price,
        goal: "",
        address: "Canonical",
      });
    await command(
      coach,
      "message",
      b.id,
      "Message pour la première séance",
      randomUUID(),
    );
    await command(
      coach,
      "message",
      secondId,
      "Message pour la prochaine séance",
      randomUUID(),
    );
    global.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/functions/v1/product-api")) {
        if (blocked) throw new TypeError("QA simulated offline");
        const response = await realFetch(input, init);
        const body = JSON.parse(init?.body || "{}");
        if (
          dropAfterCommit &&
          body.commands?.some(
            (c) => c.name === "message" && c.args[1] === "Message réseau QA",
          )
        ) {
          dropAfterCommit = false;
          blocked = true;
          throw new TypeError("QA lost acknowledged response");
        }
        return response;
      }
      return realFetch(input, init);
    };
    await load(client);
    await H.click("Mon espace");
    await H.click("Mes messages");
    ok(
      H.d.querySelectorAll('[data-testid^="conversation-"]').length === 1,
      "Connected repeated sessions grouped",
    );
    const coachName = initial.extraCoaches.find((c) => c.id === b.coach).name;
    await H.click(coachName);
    await until(async () => {
      const s = await read(coach);
      return [b.id, secondId].every((id) =>
        s.messages[id]
          .filter((m) => m.who === users[0].id)
          .every((m) => m.readBy.includes(users[1].id)),
      );
    }, "Read receipt across sessions");
    ok(true, "Grouped reading persisted server side");
    H.input("Votre message", "Message réseau QA");
    await H.wait();
    dropAfterCommit = true;
    await H.click("Envoyer");
    await until(
      () => H.d.body.textContent.includes("Réessayer l’envoi"),
      "Lost response shows retry",
    );
    const uncertain = outbox();
    ok(
      uncertain?.status === "failed" && uncertain.text === "Message réseau QA",
      "Unconfirmed message persisted locally",
    );
    const committed = (await read(client)).messages[uncertain.booking].filter(
      (m) => m.id === uncertain.id,
    );
    ok(committed.length === 1, "First uncertain request actually committed");
    const selector = [...H.d.querySelectorAll('[role="button"]')].find((e) =>
      e
        .getAttribute("aria-label")
        ?.startsWith("Séance liée au prochain message :"),
    );
    selector.click();
    await H.wait();
    [...H.d.querySelectorAll('[role="radio"]')].at(-1).click();
    await H.wait();
    H.input("Votre message", "Brouillon de la prochaine séance");
    await H.wait();
    blocked = false;
    await H.click("Réessayer l’envoi");
    await until(() => !outbox(), "Retry acknowledged");
    ok(
      H.d.querySelector('textarea[aria-label="Votre message"]').value ===
        "Brouillon de la prochaine séance",
      "Retry preserves a newly written draft",
    );
    const draftKey = Object.keys(H.w.localStorage).find((k) =>
      k.startsWith("partant-messages-v1:connected:"),
    );
    ok(
      Object.values(JSON.parse(H.w.localStorage.getItem(draftKey))).some(
        (d) =>
          d.text === "Brouillon de la prochaine séance" &&
          d.booking === secondId,
      ),
      "Retry preserves new draft session choice",
    );
    ok(
      (await read(client)).messages[uncertain.booking].filter(
        (m) => m.id === uncertain.id,
      ).length === 1,
      "Manual retry does not duplicate committed message",
    );
    ok(
      (await read(coach)).notices.filter((n) => n.messageId === uncertain.id)
        .length === 1,
      "Manual retry creates one notification",
    );
    H.input("Votre message", "Message conservé après fermeture");
    await H.wait();
    blocked = true;
    await H.click("Envoyer");
    await until(
      () => H.d.body.textContent.includes("Réessayer l’envoi"),
      "Offline before commit",
    );
    const pending = outbox(),
      storage = snapshot();
    ok(
      !!pending &&
        !Object.values((await read(client)).messages)
          .flat()
          .some((m) => m.id === pending.id),
      "Offline message not falsely reported sent",
    );
    blocked = false;
    await load(client, storage);
    await H.click("Mon espace");
    await H.click("Mes messages");
    await H.click(coachName);
    ok(
      H.d.body.textContent.includes("Message conservé après fermeture") &&
        H.d.body.textContent.includes("Réessayer l’envoi"),
      "Unsent message survives full reload",
    );
    await H.click("Réessayer l’envoi");
    await until(() => !outbox(), "Reload retry succeeds");
    ok(
      (await read(client)).messages[pending.booking].filter(
        (m) => m.id === pending.id,
      ).length === 1,
      "Reload retry sends exactly once",
    );
    ok(
      !JSON.stringify((await read(bob)).messages).includes("Message réseau QA"),
      "Another customer cannot read conversation",
    );
    const current = await api(client),
      bad = await api(client, {
        version: current.version,
        requestId: randomUUID(),
        commands: [
          {
            name: "message",
            args: [uncertain.booking, "Different text", uncertain.id],
          },
        ],
      });
    ok(bad.status === 400, "Same identifier cannot replace original text");
    ok(!H.errors.length, "No runtime errors");
    console.log(
      `PASS ${checks} deployed messaging and network-recovery DOM checks. No device visual validation.`,
    );
  } finally {
    H?.close();
    global.fetch = realFetch;
    fs.rmSync(sessionFile, { force: true });
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
