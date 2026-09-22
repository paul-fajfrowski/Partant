// Isolated UI fixture: no outgoing calls and no real Auth session.
const base = require("./auth-connected-19.cjs");
const D = require("../../apps/mobile/src/product/connectedDomain.ts");
let state = null,
  version = 1;
const control = (exports.control = {
  fail: false,
  delay: 0,
  logoutDelay: 0,
  writes: 0,
});
const reply = (v, status = 200) =>
  new Response(JSON.stringify(v), {
    status,
    headers: { "Content-Type": "application/json" },
  });
exports.fetch = async (input, init = {}) => {
  const url = String(input.url ?? input),
    body = JSON.parse(init.body || "{}");
  if (url.includes("/auth/v1/logout") && control.logoutDelay) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, control.logoutDelay);
      init.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }
  if (url.includes("data.geopf.fr"))
    return reply({
      features: [
        {
          geometry: { type: "Point", coordinates: [2.38, 48.86] },
          properties: {
            city: "Paris",
            postcode: "75011",
            label: "Rue de la Roquette 75011 Paris",
          },
        },
      ],
    });
  if (url.includes("/functions/v1/push-devices"))
    return reply({
      configured: true,
      registered: false,
      categories: {
        booking: true,
        changes: true,
        reminder: true,
        messages: true,
        activity: true,
        availability: true,
      },
    });
  const response = await base.fetch(input, init);
  if (!url.includes("/functions/v1/product-api")) return response;
  const remote = await response.json();
  if (!remote.store.account) {
    state = null;
    return reply(remote);
  }
  if (!state) {
    state=remote.store;
    state.settings=Object.fromEntries(Object.entries(state.settings).map(([id,cfg])=>[id,{...cfg,dossier:{...cfg.dossier,documents:cfg.dossier.documents.map((p,i)=>p?`${id}/proof-${i}.pdf`:p)}}]));
  }
  if (body.commands?.length) {
    const save = body.commands.some((c) => c.name !== "drafts");
    if (save) {
      control.lastCommands = body.commands.map((c) => c.name);
      control.writes++;
      await new Promise((r) => setTimeout(r, control.delay));
    }
    if (save && control.fail)
      return reply(
        {
          error: "Échec de test : vos modifications ne sont pas enregistrées.",
          store: state,
          version: version++,
        },
        400,
      );
    try {
      for (const c of body.commands) {
        // Demo identities have a distinct coachId; only this UI fixture adapts drafts.
        if (c.name === "drafts") {
          state = { ...state, coachDrafts: c.args[0] };
          continue;
        }
        state = D.applyCommand(
          state,
          {
            id: remote.store.account.id,
            email: remote.store.account.email,
            staff: !!state.staff,
          },
          c,
        );
      }
    } catch (e) {
      control.lastError = e.message;
      return reply({ error: e.message, store: state, version: version++ }, 400);
    }
  }
  state = { ...state, account: remote.store.account };
  return reply({ store: state, version: version++ });
};
