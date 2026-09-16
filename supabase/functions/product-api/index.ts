import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import {
  emptyConnected,
  register,
  applyCommand,
  project,
  documents,
} from "./domain.js";
import { maintain } from "./domain.js";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST")
    return reply({ error: "Méthode non autorisée." }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 400000)
      return reply({ error: "Contenu trop volumineux." }, 413);
    const input = JSON.parse(raw);
    if (/"(?:__proto__|constructor|prototype)"\s*:/.test(raw))
      return reply({ error: "Requête invalide." }, 400);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let user = null;
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (token) {
      const r = await admin.auth.getUser(token);
      if (!r.error) user = r.data.user;
    }
    const commands = input.commands ?? [];
    if (!Array.isArray(commands) || commands.length > 30)
      return reply({ error: "Trop d’actions." }, 400);
    const writing = commands.length > 0 || !!input.register;
    if (writing && !user)
      return reply({ error: "Reconnectez-vous pour enregistrer." }, 401);
    const requestId = writing ? input.requestId : null;
    if (writing && !/^[0-9a-f-]{36}$/i.test(requestId ?? ""))
      return reply({ error: "Référence de requête invalide." }, 400);
    const actor = user
      ? { id: user.id, email: user.email ?? "", staff: false }
      : undefined;
    const rate = await admin.rpc("product_rate_limit", {
      p_actor:
        actor?.id ??
        `anon:${req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`,
    });
    if (rate.error) throw rate.error;
    if (!rate.data)
      return reply(
        { error: "Trop de requêtes. Réessayez dans une minute." },
        429,
      );
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(
            JSON.stringify({ commands, register: input.register ?? null }),
          ),
        ),
      ),
    )
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    for (let attempt = 0; attempt < 6; attempt++) {
      const loaded = await admin.rpc("product_load", {
        p_actor: actor?.id ?? null,
        p_request: requestId,
      });
      if (loaded.error) throw loaded.error;
      const { version, documents: docs, staff, requestDigest } = loaded.data;
      if (actor) actor.staff = staff;
      let state = { ...emptyConnected(), ...docs };
      if (actor && state.deletedAccounts?.includes(actor.id))
        return reply({ error: "Ce compte a été supprimé." }, 403);
      if (requestDigest) {
        if (requestDigest !== digest)
          return reply(
            { error: "Cette référence a déjà servi à une autre action." },
            409,
          );
        return reply({ store: project(state, actor), version });
      }
      if (writing && input.version !== undefined && input.version !== version)
        return reply(
          {
            error:
              "Les données ont changé. Elles ont été actualisées ; vérifiez puis réessayez.",
            conflict: true,
            store: project(state, actor),
            version,
          },
          409,
        );
      const before = JSON.stringify(documents(state));
      state = maintain(state);
      if (input.register && actor)
        state = register(
          state,
          actor,
          input.register.name,
          input.register.role,
        );
      if (actor)
        for (const cmd of commands) state = applyCommand(state, actor, cmd);
      state = maintain(state);
      if (writing || before !== JSON.stringify(documents(state))) {
        const saved = await admin.rpc("product_commit", {
          p_version: version,
          p_documents: documents(state),
          p_actor: actor?.id ?? null,
          p_request: requestId,
          p_digest: digest,
        });
        if (saved.error) throw saved.error;
        if (!saved.data) continue;
        // A concurrent replay may have committed first; always return canonical IDs/state.
        const confirmed = await admin.rpc("product_load", {
          p_actor: actor?.id ?? null,
          p_request: requestId,
        });
        if (confirmed.error) throw confirmed.error;
        state = { ...emptyConnected(), ...confirmed.data.documents };
        const committedVersion = confirmed.data.version;
        if (actor && commands.some((c) => c.name === "deleteAccount")) {
          const deletion = await admin.auth.admin.deleteUser(actor.id);
          if (deletion.error)
            console.error("Auth cleanup pending for deleted product account");
          return reply({
            store: project(state),
            version: committedVersion,
            deleted: true,
          });
        }
        return reply({
          store: project(state, actor),
          version: committedVersion,
        });
      }
      return reply({ store: project(state, actor), version });
    }
    return reply(
      { error: "L’agenda vient de changer. Actualisez puis réessayez." },
      409,
    );
  } catch (e) {
    return reply(
      {
        error:
          e instanceof Error
            ? e.message
            : "Enregistrement impossible. Réessayez.",
      },
      400,
    );
  }
});
