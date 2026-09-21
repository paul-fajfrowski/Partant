import { readJson, HttpError } from "../_shared/http.ts";
import { syncGoogle } from "../_shared/calendarSync.ts";
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
    const input = await readJson(req);
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
    if (!writing && Number.isSafeInteger(input.ifVersion)) {
      const checkpoint = await admin.rpc("product_checkpoint", {
        p_actor: actor?.id ?? null,
      });
      if (checkpoint.error) throw checkpoint.error;
      if (checkpoint.data.deleted)
        return reply({ error: "Ce compte a été supprimé." }, 403);
      if (
        checkpoint.data.fresh &&
        checkpoint.data.version === input.ifVersion &&
        checkpoint.data.staff === input.ifStaff &&
        input.scope === (actor?.id ?? null)
      )
        return reply({ unchanged: true, version: checkpoint.data.version });
    }
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
    let calendarChecked = false;
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
      // Refresh external occupancy before any action that takes a new time slot.
      // First validate ownership against the authenticated actor, never an arbitrary coach ID.
      if (
        !calendarChecked &&
        actor &&
        commands.some((c: any) =>
          [
            "reserve",
            "reschedule",
            "transfer",
            "answerProposal",
            "openGroup",
            "repeatGroup",
            "addExternalSession",
          ].includes(c.name),
        )
      ) {
        calendarChecked = true;
        const coaches = new Set<string>();
        for (const cmd of commands) {
          const a = cmd.args ?? [];
          if (
            cmd.name === "reserve" &&
            state.offers.some(
              (o: any) => o.id === a[0]?.offerId && o.coach === a[0]?.coach,
            )
          )
            coaches.add(a[0].coach);
          if (["reschedule", "transfer"].includes(cmd.name)) {
            const b = state.bookings.find(
              (b: any) => b.id === a[0] && b.clientId === actor.id,
            );
            if (b) coaches.add(b.coach);
          }
          if (cmd.name === "answerProposal") {
            const p = state.proposals?.find((p: any) => p.id === a[0]);
            const b = state.bookings.find(
              (b: any) => b.id === p?.booking && b.clientId === actor.id,
            );
            if (b) coaches.add(b.coach);
          }
          if (
            ["openGroup", "repeatGroup", "addExternalSession"].includes(
              cmd.name,
            ) &&
            state.identities?.some(
              (a: any) => a.id === actor.id && a.role === "coach",
            )
          )
            coaches.add(actor.id);
        }
        const activeCoaches = [...coaches].filter(
          (id) => state.calendarStatus?.[id]?.connected,
        );
        if (activeCoaches.length) {
          const unchanged = (docs: any) =>
            JSON.stringify(
              Object.fromEntries(
                Object.entries(docs)
                  .filter(
                    ([k]) => !["calendarBusy", "calendarStatus"].includes(k),
                  )
                  .sort(([a], [b]) => a.localeCompare(b)),
              ),
            );
          for (const coach of activeCoaches) await syncGoogle(admin, coach);
          const fresh = await admin.rpc("product_load", { p_actor: actor.id });
          if (fresh.error) throw fresh.error;
          if (unchanged(docs) !== unchanged(fresh.data.documents))
            return reply(
              {
                error: "Les données ont changé. Vérifiez puis réessayez.",
                store: project(
                  { ...emptyConnected(), ...fresh.data.documents },
                  actor,
                ),
                version: fresh.data.version,
              },
              409,
            );
          input.version = fresh.data.version;
          continue;
        }
      }
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
        if (committedVersion === version + 1)
          await admin.rpc("product_maintenance_done", {
            p_version: committedVersion,
          });
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
      await admin.rpc("product_maintenance_done", { p_version: version });
      return reply({ store: project(state, actor), version });
    }
    return reply(
      { error: "L’agenda vient de changer. Actualisez puis réessayez." },
      409,
    );
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.message }, e.status);
    // Domain Errors are user-facing validation messages; database objects stay on the server.
    if (e instanceof Error && !["TypeError", "SyntaxError"].includes(e.name))
      return reply({ error: e.message }, 400);
    console.error(
      JSON.stringify({ service: "product-api", code: "request_failed" }),
    );
    return reply(
      { error: "Le serveur est momentanément indisponible. Réessayez." },
      503,
    );
  }
});
