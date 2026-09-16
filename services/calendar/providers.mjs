// Server-only adapters. OAuth tokens must never be imported into the mobile app.
import { Temporal } from "@js-temporal/polyfill";
export function instant(value, zone = "UTC") {
  if (/([zZ]|[+-]\d\d:\d\d)$/.test(value))
    return Temporal.Instant.from(value).toString();
  const dateTime = value.length === 10 ? `${value}T00:00:00` : value;
  // Reject unknown zones or nonexistent/ambiguous local times; never guess an availability.
  return Temporal.PlainDateTime.from(dateTime)
    .toZonedDateTime(zone, { disambiguation: "reject" })
    .toInstant()
    .toString();
}
export function normalizeGoogle(event, calendarZone, ownEventIds = new Set()) {
  if (
    event.status === "cancelled" ||
    event.transparency === "transparent" ||
    ownEventIds.has(event.id)
  )
    return null;
  if (!event.id || !event.start || !event.end)
    throw new Error("INVALID_CALENDAR_EVENT");
  const start = instant(
    event.start.dateTime ?? event.start.date,
    event.start.timeZone ?? calendarZone,
  );
  const end = instant(
    event.end.dateTime ?? event.end.date,
    event.end.timeZone ?? calendarZone,
  );
  if (Date.parse(end) <= Date.parse(start))
    throw new Error("INVALID_CALENDAR_RANGE");
  return { external_id: event.id, starts_at: start, ends_at: end };
}
export function normalizeOutlook(event, ownEventIds = new Set()) {
  if (event.isCancelled || event.showAs === "free" || ownEventIds.has(event.id))
    return null;
  if (!event.id || !event.start || !event.end)
    throw new Error("INVALID_CALENDAR_EVENT");
  // Graph requests below ask for UTC: Windows time zone names are not silently reinterpreted.
  const start = instant(event.start.dateTime, event.start.timeZone);
  const end = instant(event.end.dateTime, event.end.timeZone);
  if (Date.parse(end) <= Date.parse(start))
    throw new Error("INVALID_CALENDAR_RANGE");
  return { external_id: event.id, starts_at: start, ends_at: end };
}
async function read(response) {
  if (response.status === 401 || response.status === 403)
    throw new Error("CALENDAR_REAUTH_REQUIRED");
  if (response.status === 429) throw new Error("CALENDAR_RATE_LIMITED");
  if (!response.ok) throw new Error("CALENDAR_UNAVAILABLE");
  return response.json();
}
function windowParams(start, end) {
  const a = Temporal.Instant.from(start),
    b = Temporal.Instant.from(end);
  if (
    Temporal.Instant.compare(a, b) >= 0 ||
    Date.parse(b.toString()) - Date.parse(a.toString()) > 92 * 86400000
  )
    throw new Error("INVALID_SYNC_WINDOW");
  return { start: a.toString(), end: b.toString() };
}
export async function pullGoogle({
  accessToken,
  calendarId = "primary",
  start,
  end,
  ownEventIds = new Set(),
  fetcher = fetch,
}) {
  const range = windowParams(start, end);
  let pageToken;
  const blocks = [];
  let zone;
  for (let page = 0; page < 50; page++) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.search = new URLSearchParams({
      timeMin: range.start,
      timeMax: range.end,
      singleEvents: "true",
      maxResults: "2500",
      showDeleted: "false",
      ...(pageToken ? { pageToken } : {}),
    }).toString();
    const data = await read(
      await fetcher(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(15000),
      }),
    );
    zone = data.timeZone ?? zone;
    if (!zone) throw new Error("CALENDAR_TIMEZONE_MISSING");
    for (const e of data.items ?? []) {
      const block = normalizeGoogle(e, zone, ownEventIds);
      if (block) blocks.push(block);
    }
    if (!data.nextPageToken) return blocks;
    pageToken = data.nextPageToken;
  }
  throw new Error("CALENDAR_PAGINATION_LIMIT");
}
export async function pullOutlook({
  accessToken,
  calendarId,
  start,
  end,
  ownEventIds = new Set(),
  fetcher = fetch,
}) {
  const range = windowParams(start, end);
  let url = new URL(
    calendarId
      ? `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/calendarView`
      : "https://graph.microsoft.com/v1.0/me/calendarView",
  );
  url.search = new URLSearchParams({
    startDateTime: range.start,
    endDateTime: range.end,
    $top: "1000",
  }).toString();
  const blocks = [];
  for (let page = 0; page < 50; page++) {
    if (
      url.origin !== "https://graph.microsoft.com" ||
      !url.pathname.startsWith("/v1.0/me/")
    )
      throw new Error("INVALID_CALENDAR_NEXT_LINK");
    const data = await read(
      await fetcher(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="UTC"',
        },
        signal: AbortSignal.timeout(15000),
      }),
    );
    for (const e of data.value ?? []) {
      const block = normalizeOutlook(e, ownEventIds);
      if (block) blocks.push(block);
    }
    if (!data["@odata.nextLink"]) return blocks;
    url = new URL(data["@odata.nextLink"]);
  }
  throw new Error("CALENDAR_PAGINATION_LIMIT");
}
export function googleEvent(slot) {
  return {
    summary: "Séance Partant",
    location: slot.location,
    start: { dateTime: slot.starts_at },
    end: { dateTime: slot.ends_at },
  };
}
export function outlookEvent(slot) {
  return {
    subject: "Séance Partant",
    location: { displayName: slot.location },
    start: {
      dateTime: instant(slot.starts_at).replace("Z", ""),
      timeZone: "UTC",
    },
    end: { dateTime: instant(slot.ends_at).replace("Z", ""), timeZone: "UTC" },
    transactionId: slot.id,
  };
}
// One remote event per slot (not per participant); mapping of remote IDs is server-managed.
// Creating, updating, deleting and token refresh are deliberately not activated without OAuth setup.
