// Deterministic, isolated service fixture. Never forwards network calls.
if (process.env.PARTANT_QA_NEW === "1")
  process.env.PARTANT_QA_SCENARIO = "incomplete";
const base = require("./auth-connected-19.cjs");
const control = (exports.control = {
  guestPending: 0,
  privateReads: 0,
  registrations: 0,
  authAt: 0,
  fail: false,
  release: null,
});
let registered = null;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const reply = (v, status = 200) =>
  new Response(JSON.stringify(v), {
    status,
    headers: { "Content-Type": "application/json" },
  });
exports.fetch = async (input, init = {}) => {
  const url = String(input.url ?? input),
    body = JSON.parse(init.body || "{}");
  if (url.includes("/auth/v1/token") || url.includes("/auth/v1/verify")) {
    await pause(450);
    control.authAt = Date.now();
  }
  const res = await base.fetch(input, init);
  if (!url.includes("/functions/v1/product-api")) return res;
  const data = await res.json();
  if (!data.store.identities?.length) {
    control.guestPending++;
    await new Promise((r) => {
      control.release = r;
    });
    return reply(data);
  }
  if (body.register) {
    control.registrations++;
    await pause(400);
    if (process.env.PARTANT_QA_NEW === "1") {
      registered = {
        ...data.store.identities[0],
        name: body.register.name,
        role: body.register.role,
      };
    }
  } else {
    control.privateReads++;
    await pause(350);
    if (control.fail)
      return reply({ error: "Connexion de test indisponible" }, 503);
  }
  if (registered) data.store.account = registered;
  return reply(data);
};
