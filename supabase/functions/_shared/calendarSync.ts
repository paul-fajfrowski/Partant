import { db, access, google, hash } from "./google.ts";
import { pullGoogle } from "./calendarProviders.js";
import { emptyConnected, documents, instant } from "../product-api/domain.js";
// Updates use the marketplace CAS; external events can never replace an unrelated product write.
async function merge(admin: any, coach: string, busy: any[], status: any) {
  for (let n = 0; n < 8; n++) {
    const loaded = await admin.rpc("product_load", {});
    if (loaded.error) throw loaded.error;
    const state = { ...emptyConnected(), ...loaded.data.documents };
    state.calendarBusy = { ...state.calendarBusy, [coach]: busy };
    state.calendarStatus = { ...state.calendarStatus, [coach]: status };
    const saved = await admin.rpc("product_commit", {
      p_version: loaded.data.version,
      p_documents: documents(state),
      p_actor: null,
      p_request: null,
      p_digest: null,
    });
    if (saved.error) throw saved.error;
    if (saved.data) return;
  }
  throw Error("Le planning change actuellement. Réessayez.");
}
export async function clearCalendar(admin: any, coach: string) {
  await merge(admin, coach, [], { connected: false, updatedAt: Date.now() });
}
export function toBusy(blocks: any[]) {
  const rows: any[] = [];
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (const b of blocks) {
    let cursor = Date.parse(b.starts_at),
      end = Date.parse(b.ends_at);
    while (cursor < end) {
      const local = fmt.format(cursor),
        day = local.slice(0, 10),
        time = local.slice(11, 16);
      const nextDay = new Date(Date.parse(day + "T12:00:00Z") + 86400000)
        .toISOString()
        .slice(0, 10);
      const stop = Math.min(end, instant(nextDay, "00:00"));
      const endLocal = stop === end ? fmt.format(stop) : "";
      const endM =
        endLocal.slice(0, 10) === day
          ? Number(endLocal.slice(11, 13)) * 60 +
            Number(endLocal.slice(14, 16)) +
            (stop % 60000 ? 1 : 0)
          : 1440;
      const startM = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
      if (endM > startM) rows.push({ day, time, duration: endM - startM });
      cursor = stop;
    }
  }
  return rows.sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
}
export function sessions(state: any, coach: string) {
  const rows = new Map<string, any>();
  for (const g of state.groups ?? [])
    if (g.offer.coach === coach && !g.cancelled)
      rows.set("group:" + g.id, {
        id: "group:" + g.id,
        day: g.day,
        time: g.time,
        duration: g.offer.duration,
        address: g.address,
      });
  for (const b of state.bookings ?? [])
    if (b.coach === coach && b.status === "confirmed" && b.kind !== "Groupe")
      rows.set("booking:" + b.id, { ...b, id: "booking:" + b.id });
  for (const b of state.externalSessions ?? [])
    if (b.coach === coach && !b.cancelled)
      rows.set("direct:" + b.id, { ...b, id: "direct:" + b.id });
  return [...rows.values()].filter(
    (b) => instant(b.day, b.time) + b.duration * 60000 > Date.now(),
  );
}
export async function syncGoogle(admin: any, coach: string) {
  const lease = crypto.randomUUID();
  const original = await db(admin, "get", coach);
  if (!original) return;
  if (!original.read?.length || !original.write)
    throw Error("Terminez le choix des agendas dans vos réglages.");
  const link = await db(admin, "lock", coach, { id: lease });
  if (!link)
    throw Error(
      "Une synchronisation est déjà en cours. Réessayez dans un instant.",
    );
  let latest: any;
  try {
    const token = await access(admin, coach, link);
    const loaded = await admin.rpc("product_load", {});
    if (loaded.error) throw loaded.error;
    const state = { ...emptyConnected(), ...loaded.data.documents };
    const start = new Date().toISOString(),
      end = new Date(Date.now() + 90 * 86400000).toISOString();
    const desired = sessions(state, coach).filter(
      (b) => instant(b.day, b.time) < Date.parse(end),
    );
    const mapped = link.events ?? {},
      wanted: any = {};
    // Stable provider IDs make retries safe, including an interrupted create response.
    for (const s of desired) {
      const id = "p" + (await hash(coach + ":" + s.id));
      wanted[s.id] = {
        id,
        body: {
          summary: "Séance Partant",
          location: s.address ?? "",
          start: { dateTime: new Date(instant(s.day, s.time)).toISOString() },
          end: {
            dateTime: new Date(
              instant(s.day, s.time) + s.duration * 60000,
            ).toISOString(),
          },
          extendedProperties: { private: { partant: "true" } },
        },
      };
    }
    // Record the intended mapping before network writes: retry and cancellation can recover it.
    link.events = {
      ...mapped,
      ...Object.fromEntries(
        Object.entries(wanted).map(([id, v]: any) => [
          id,
          { ...mapped[id], id: v.id, body: v.body },
        ]),
      ),
    };
    await db(admin, "save", coach, link);
    for (const [id, v] of Object.entries(wanted) as any) {
      if (mapped[id]?.applied === JSON.stringify(v.body)) continue;
      const path = `calendars/${encodeURIComponent(link.write)}/events`;
      try {
        await google(token, path, {
          method: "POST",
          body: JSON.stringify({ id: v.id, ...v.body }),
        });
      } catch (e) {
        if ((e as any).status !== 409) throw e;
        await google(token, path + "/" + v.id, {
          method: "PATCH",
          body: JSON.stringify(v.body),
        });
      }
      link.events[id] = { ...v, applied: JSON.stringify(v.body) };
      await db(admin, "save", coach, link);
    }
    for (const [id, v] of Object.entries(mapped) as any) {
      if (wanted[id]) continue;
      if (
        v.body?.end?.dateTime &&
        Date.parse(v.body.end.dateTime) < Date.now()
      ) {
        delete link.events[id];
        continue;
      }
      try {
        await google(
          token,
          `calendars/${encodeURIComponent(link.write)}/events/${v.id}`,
          { method: "DELETE" },
        );
      } catch (e) {
        if (![404, 410].includes((e as any).status)) throw e;
      }
      delete link.events[id];
      await db(admin, "save", coach, link);
    }
    const ownIds = new Set(Object.values(link.events).map((e: any) => e.id));
    const blocks = [];
    for (const calendarId of link.read)
      blocks.push(
        ...(await pullGoogle({
          accessToken: token,
          calendarId,
          start,
          end,
          ownEventIds: calendarId === link.write ? ownIds : new Set(),
        })),
      );
    latest = toBusy(blocks);
    // Existing reservations remain confirmed; report overlaps rather than silently cancelling them.
    const conflicts = desired
      .filter((s) =>
        blocks.some(
          (b) =>
            Date.parse(b.starts_at) <
              instant(s.day, s.time) + s.duration * 60000 &&
            Date.parse(b.ends_at) > instant(s.day, s.time),
        ),
      )
      .map((s) => s.id);
    const updatedAt = Date.now();
    if (!(await db(admin, "lease", coach, { id: lease })))
      throw Error("Synchronisation interrompue. Réessayez.");
    await merge(admin, coach, latest, {
      connected: true,
      updatedAt,
      through: end,
      error: "",
      conflicts,
    });
    await db(admin, "save", coach, {
      ...link,
      status: conflicts.length ? "conflict" : "synced",
      lastSync: updatedAt,
      error: conflicts.length
        ? "Un événement externe chevauche une séance Partant. Vérifiez votre agenda."
        : "",
      conflicts,
    });
  } catch (e) {
    const error =
      e instanceof Error ? e.message : "Synchronisation indisponible.";
    if (!(await db(admin, "lease", coach, { id: lease }))) throw e;
    await db(admin, "save", coach, { ...link, status: "error", error });
    const loaded = await admin.rpc("product_load", {});
    if (!loaded.error)
      await merge(
        admin,
        coach,
        loaded.data.documents.calendarBusy?.[coach] ?? [],
        {
          connected: true,
          updatedAt:
            loaded.data.documents.calendarStatus?.[coach]?.updatedAt ?? 0,
          error,
        },
      );
    throw e;
  } finally {
    await db(admin, "unlock", coach, { id: lease });
  }
}
