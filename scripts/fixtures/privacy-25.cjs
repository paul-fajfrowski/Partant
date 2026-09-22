// UI-only fixture. Never sends requests outside this process.
const base = require("./settings-24.cjs");
const auth = require("./auth-connected-19.cjs");
exports.control = base.control;
exports.fetch = async (input, init = {}) => {
  const body = JSON.parse(init.body || "{}");
  if (
    String(input.url ?? input).includes("/functions/v1/product-api") &&
    body.commands?.some((c) => c.name === "deleteAccount")
  ) {
    await new Promise((r) => setTimeout(r, exports.control.delay));
    return new Response(
      JSON.stringify(
        exports.control.fail
          ? { error: "Échec de test : suppression non enregistrée." }
          : {
              deleted: true,
              store: {
                ...auth.snapshot(),
                account: null,
                identities: [],
                tickets: [],
                bookings: [],
                notices: [],
                messages: {},
              },
              version: 90,
            },
      ),
      {
        status: exports.control.fail ? 400 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return base.fetch(input, init);
};
