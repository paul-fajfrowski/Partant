import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import {
  callback,
  configured,
  random,
  hash,
  seal,
  db,
  tokenRequest,
  access,
  calendars,
  open,
} from "../_shared/google.ts";
import { syncGoogle, clearCalendar } from "../_shared/calendarSync.ts";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-client-info",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const allowed = [
  "http://127.0.0.1:8081/?data=connected",
  "http://localhost:8081/?data=connected",
  "partant://calendar/callback",
];
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const url = new URL(req.url);
  try {
    if (req.method === "GET" && url.pathname.endsWith("/callback")) {
      const state = url.searchParams.get("state");
      if (!state || state.length > 100)
        return reply({ error: "Retour de connexion invalide." }, 400);
      const pending = await db(admin, "consume", null, {
        state: await hash(state),
      });
      if (!pending)
        return reply(
          { error: "Cette demande a expiré. Recommencez depuis Partant." },
          400,
        );
      const redirect = new URL(pending.redirect);
      if (url.searchParams.has("error")) {
        redirect.searchParams.set("calendar", "cancelled");
        return Response.redirect(redirect, 303);
      }
      const code = url.searchParams.get("code");
      if (!code) return reply({ error: "Autorisation absente." }, 400);
      try {
        const tokens = await tokenRequest({
          grant_type: "authorization_code",
          code,
          redirect_uri: callback(),
          code_verifier: await open(pending.verifier, pending.coach),
        });
        if (!tokens.refresh_token)
          throw Error("Autorisez à nouveau Google Calendar.");
        const scopes = new Set((tokens.scope ?? "").split(" "));
        if (
          !scopes.has("https://www.googleapis.com/auth/calendar.events") ||
          !scopes.has(
            "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
          )
        )
          throw Error("Autorisations agenda incomplètes.");
        const old = await db(admin, "get", pending.coach);
        await db(admin, "save", pending.coach, {
          ...old,
          events: {},
          tokens: await seal(
            { ...tokens, expires_at: Date.now() + tokens.expires_in * 1000 },
            pending.coach,
          ),
          status: "selection",
          read: [],
          write: "",
          lastSync: null,
          error: "",
        });
        redirect.searchParams.set("calendar", "connected");
      } catch {
        redirect.searchParams.set("calendar", "error");
      }
      return Response.redirect(redirect, 303);
    }
    if (req.method !== "POST")
      return reply({ error: "Méthode non autorisée." }, 405);
    const input = await req.json();
    if (input.action === "scheduled") {
      const valid = await db(admin, "job", null, {
        key: req.headers.get("x-calendar-job") ?? "",
      });
      if (!valid) return reply({ error: "Accès refusé." }, 401);
      if (!configured())
        return reply({ error: "Configuration en attente." }, 503);
      if (!/^[0-9a-f-]{36}$/i.test(input.coach ?? ""))
        return reply({ error: "Coach invalide." }, 400);
      await syncGoogle(admin, input.coach);
      return reply({ synced: true });
    }
    if (input.action === "status-public")
      return reply({ googleCalendar: configured() });
    const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!jwt) return reply({ error: "Connectez-vous." }, 401);
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return reply({ error: "Reconnectez-vous." }, 401);
    const coach = data.user.id;
    const loaded = await admin.rpc("product_load", { p_actor: coach });
    if (loaded.error) throw loaded.error;
    if (
      loaded.data.documents.identities?.find((a: any) => a.id === coach)
        ?.role !== "coach"
    )
      return reply({ error: "Espace coach requis." }, 403);
    const limit = await admin.rpc("product_rate_limit", {
      p_actor: "calendar:" + coach,
    });
    if (limit.error || !limit.data)
      return reply({ error: "Réessayez dans une minute." }, 429);
    const link = await db(admin, "get", coach);
    if (input.action === "status")
      return reply({
        configured: configured(),
        connected: !!link,
        status: link?.status,
        read: link?.read ?? [],
        write: link?.write ?? "",
        lastSync: link?.lastSync,
        error: link?.error ?? "",
      });
    if (input.action === "connect") {
      if (!configured())
        return reply(
          { error: "Google Calendar attend sa configuration par Partant." },
          503,
        );
      if (!allowed.includes(input.redirect))
        return reply({ error: "Adresse de retour non autorisée." }, 400);
      const state = random(),
        verifier = random();
      const challenge = btoa(
        String.fromCharCode(
          ...new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(verifier),
            ),
          ),
        ),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      await db(admin, "state", coach, {
        state: await hash(state),
        verifier: await seal(verifier, coach),
        redirect: input.redirect,
      });
      const params = new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
        redirect_uri: callback(),
        response_type: "code",
        scope:
          "https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events",
        access_type: "offline",
        prompt: "consent select_account",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      return reply({
        url: "https://accounts.google.com/o/oauth2/v2/auth?" + params,
      });
    }
    if (!link) return reply({ error: "Connectez votre agenda Google." }, 400);
    if (input.action === "disconnect") {
      // Keep no provider credentials or imported busy times after a deliberate disconnect.
      const id = crypto.randomUUID();
      const locked = await db(admin, "lock", coach, { id });
      if (!locked)
        throw Error("Synchronisation en cours. Réessayez dans un instant.");
      try {
        await clearCalendar(admin, coach);
        await db(admin, "delete", coach, { _lease: id });
      } finally {
        await db(admin, "unlock", coach, { id });
      }
      return reply({ disconnected: true });
    }
    if (!configured())
      return reply(
        { error: "Configuration de Google Calendar indisponible." },
        503,
      );
    if (input.action === "calendars")
      return reply({
        calendars: await calendars(await access(admin, coach, link)),
      });
    if (input.action === "select") {
      const rows = await calendars(await access(admin, coach, link));
      if (
        !Array.isArray(input.read) ||
        input.read.length < 1 ||
        input.read.length > 10 ||
        input.read.some((id: string) => !rows.some((c) => c.id === id)) ||
        !rows.some((c) => c.id === input.write && c.write)
      )
        throw Error(
          "Choisissez les agendas à lire et un agenda accessible en écriture.",
        );
      if (link.write && link.write !== input.write)
        throw Error(
          "Déconnectez l’agenda avant de changer la destination. Les anciens événements resteront dans Google.",
        );
      await db(admin, "save", coach, {
        ...link,
        read: [...new Set(input.read)],
        write: input.write,
        status: "pending",
        error: "",
      });
    } else if (input.action !== "sync")
      return reply({ error: "Action inconnue." }, 400);
    await syncGoogle(admin, coach);
    return reply({ synced: true });
  } catch (e) {
    return reply(
      {
        error:
          e instanceof Error
            ? e.message
            : "Connexion au calendrier impossible.",
      },
      400,
    );
  }
});
