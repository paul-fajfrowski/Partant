// Google consent is independent from sign-in. No provider token is returned to a client.
export const callback = () =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar/callback`;
export const configured = () =>
  [
    "GOOGLE_CALENDAR_CLIENT_ID",
    "GOOGLE_CALENDAR_CLIENT_SECRET",
    "CALENDAR_TOKEN_KEY",
  ].every((k) => !!Deno.env.get(k));
const enc = new TextEncoder();
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const un64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const random = () =>
  b64(crypto.getRandomValues(new Uint8Array(32)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
export async function hash(s: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s))),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function key() {
  const raw = un64(Deno.env.get("CALENDAR_TOKEN_KEY") ?? "");
  if (raw.length !== 32) throw Error("Configuration du calendrier incomplète.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function seal(value: unknown, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: enc.encode(owner) },
    await key(),
    enc.encode(JSON.stringify(value)),
  );
  return `${b64(iv)}.${b64(new Uint8Array(data))}`;
}
export async function open(value: string, owner: string) {
  const [iv, body] = value.split(".");
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: un64(iv), additionalData: enc.encode(owner) },
        await key(),
        un64(body),
      ),
    ),
  );
}
export async function db(
  admin: any,
  action: string,
  actor: string | null,
  data: any = {},
) {
  const r = await admin.rpc("calendar_store", {
    p_action: action,
    p_actor: actor,
    p_data: data,
  });
  if (r.error) throw Error("Enregistrement du calendrier indisponible.");
  return r.data;
}
export async function tokenRequest(params: Record<string, string>) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      ...params,
      client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw Error(
      r.status === 400
        ? "Reconnectez votre agenda Google."
        : "Google est momentanément indisponible.",
    );
  return r.json();
}
export async function access(admin: any, coach: string, link: any) {
  let t = await open(link.tokens, coach);
  if (t.expires_at < Date.now() + 60000) {
    const next = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: t.refresh_token,
    });
    t = { ...t, ...next, expires_at: Date.now() + next.expires_in * 1000 };
    link.tokens = await seal(t, coach);
    await db(admin, "save", coach, link);
  }
  return t.access_token;
}
export async function google(
  token: string,
  path: string,
  options: RequestInit = {},
) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });
  if ([401, 403].includes(r.status))
    throw Error(
      "Reconnectez votre agenda Google et autorisez les calendriers.",
    );
  if (!r.ok)
    throw Object.assign(Error("Google Calendar est indisponible. Réessayez."), {
      status: r.status,
    });
  return r.status === 204 ? null : r.json();
}
export async function calendars(token: string) {
  const rows: any[] = [];
  let next = "";
  for (let i = 0; i < 20; i++) {
    const data = await google(
      token,
      `users/me/calendarList?maxResults=250${next ? "&pageToken=" + encodeURIComponent(next) : ""}`,
    );
    rows.push(
      ...(data.items ?? [])
        .filter((x: any) => !x.deleted)
        .map((x: any) => ({
          id: x.id,
          name: x.summary,
          write: ["owner", "writer"].includes(x.accessRole),
        })),
    );
    next = data.nextPageToken;
    if (!next) return rows;
  }
  throw Error("Trop de calendriers à charger.");
}
