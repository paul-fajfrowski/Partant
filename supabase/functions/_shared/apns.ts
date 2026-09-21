// APNs signs short-lived provider JWTs server-side; device payloads contain no private content.
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const encodedJson = (value: unknown) =>
  encode(new TextEncoder().encode(JSON.stringify(value)));
let cached: { token: string; until: number; keyId: string } | undefined;
export async function providerToken(
  pem: string,
  team: string,
  keyId: string,
  now = Date.now(),
) {
  if (cached && cached.until > now && cached.keyId === keyId)
    return cached.token;
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----|\s/g, "")),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const unsigned =
    encodedJson({ alg: "ES256", kid: keyId }) +
    "." +
    encodedJson({ iss: team, iat: Math.floor(now / 1000) });
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );
  const token = unsigned + "." + encode(new Uint8Array(signature));
  cached = { token, until: now + 45 * 60_000, keyId };
  return token;
}
export function pushContent(job: any) {
  const titles: Record<string, string> = {
    booking: "Réservation confirmée",
    cancelled: "Séance annulée",
    rescheduled: "Séance modifiée",
    transferred: "Séance transférée",
    seats: "Participants mis à jour",
    proposal: "Changement proposé",
    "proposal-result": "Réponse à votre proposition",
    message: "Nouveau message",
    reminder: "Votre séance approche",
    review: "Nouvel avis",
    "review-reply": "Réponse à votre avis",
    support: "Votre demande a une réponse",
    dossier: "Votre dossier coach",
    calendar: "Votre agenda nécessite votre attention",
    availability: "Un créneau est disponible",
  };
  return {
    aps: {
      alert: {
        title: titles[job.event] ?? "Du nouveau sur Partant",
        body:
          job.event === "message"
            ? "Ouvrez votre conversation dans Partant."
            : "Retrouvez les détails dans Partant.",
      },
      sound: "default",
    },
    partant: {
      v: 1,
      recipient: job.recipient,
      noticeId: job.notice_id,
      bookingId: job.booking,
      event: job.event,
    },
  };
}
export async function sendApns(
  job: any,
  config: { key: string; team: string; keyId: string; topic: string },
  request = fetch,
) {
  const host =
    job.environment === "production"
      ? "https://api.push.apple.com"
      : "https://api.sandbox.push.apple.com";
  const token = await providerToken(config.key, config.team, config.keyId);
  const response = await request(`${host}/3/device/${job.token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "apns-topic": config.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-id": job.id,
      "apns-collapse-id": job.id,
      "apns-expiration": String(Math.floor(Date.parse(job.expires_at) / 1000)),
    },
    body: JSON.stringify(pushContent(job)),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.ok) return { status: "accepted", error: null, disable: false };
  let reason = "APNsError";
  try {
    reason = (await response.json()).reason ?? reason;
  } catch {}
  const disable = [
    "BadDeviceToken",
    "Unregistered",
    "DeviceTokenNotForTopic",
  ].includes(reason);
  return {
    status:
      response.status === 429 || response.status >= 500 ? "pending" : "failed",
    error: String(reason).slice(0, 80),
    disable,
  };
}
