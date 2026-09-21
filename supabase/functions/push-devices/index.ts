import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { readJson, HttpError } from "../_shared/http.ts";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-client-info",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST")
    return reply({ error: "Méthode non autorisée." }, 405);
  try {
    const input = await readJson(req, 8000);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token)
      return reply(
        { error: "Reconnectez-vous pour régler vos notifications." },
        401,
      );
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user)
      return reply({ error: "Votre session a expiré." }, 401);
    // Payload is decoded only after getUser verified the signed token.
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const session = JSON.parse(
      atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")),
    ).session_id;
    if (!session)
      return reply(
        { error: "Reconnectez-vous pour activer cet appareil." },
        401,
      );
    const rate = await admin.rpc("product_rate_limit", {
      p_actor: "push:" + data.user.id,
    });
    if (rate.error) throw rate.error;
    if (!rate.data) return reply({ error: "Réessayez dans une minute." }, 429);
    if (input.action === "register" && input.environment !== (Deno.env.get("APNS_ENVIRONMENT") ?? "sandbox"))
      return reply({error:"Cette version de l’application n’est pas configurée pour les notifications. Contactez l’assistance."},400);
    const result = await admin.rpc("product_push_device", {
      p_actor: data.user.id,
      p_session: session,
      p_action: input.action,
      p_input: input,
    });
    if (result.error) {
      const message = result.error.message;
      if (message.includes("PUSH_SESSION_REQUIRED"))
        return reply(
          { error: "Terminez votre inscription puis reconnectez-vous." },
          403,
        );
      if (message.includes("PUSH_DEVICE_LIMIT"))
        return reply(
          { error: "La limite de dix appareils est atteinte." },
          400,
        );
      if (
        message.includes("PUSH_INVALID_INPUT") ||
        result.error.code === "22P02"
      )
        return reply({ error: "Réglage invalide." }, 400);
      throw result.error;
    }
    return reply({
      ...result.data,
      configured:
        !!Deno.env.get("APNS_PRIVATE_KEY_BASE64") && !!Deno.env.get("APNS_KEY_ID"),
    });
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.message }, e.status);
    console.error(
      JSON.stringify({ service: "push-devices", code: "request_failed" }),
    );
    return reply(
      { error: "Les notifications sont momentanément indisponibles." },
      503,
    );
  }
});
