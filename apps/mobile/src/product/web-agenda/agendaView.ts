import { Store, addDays, configFor, intervalsFor, mins } from "../model";

export type AgendaItem = {
  id: string;
  kind: "booking" | "group" | "external" | "block" | "calendar" | "closed";
  time: string;
  duration: number;
  title: string;
  detail: string;
  location?: string;
  completed?: boolean;
};

export function weekStart(day: string) {
  return addDays(day, -((new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7));
}

/** Presentation only: no generated slots, availability rules or store writes. */
export function agendaDay(store: Store, coachId: string, day: string) {
  const config = configFor(store, coachId);
  const groups = (store.groups ?? []).filter(
    (g) => g.offer.coach === coachId && g.day === day && !g.cancelled,
  );
  const bookings = store.bookings.filter(
    (b) => b.coach === coachId && b.day === day && b.status !== "cancelled",
  );
  const items: AgendaItem[] = [
    ...groups.map((g): AgendaItem => {
      const seats = bookings
        .filter((b) => b.offerId === g.offer.id && b.time === g.time)
        .reduce((count, b) => count + b.seats, 0);
      return {
        id: g.id,
        kind: "group",
        time: g.time,
        duration: g.offer.duration,
        title: g.offer.name,
        detail: `${seats} / ${g.offer.capacity} places`,
        location: g.locationName || g.address,
      };
    }),
    ...bookings
      .filter(
        (b) =>
          b.kind !== "Groupe" ||
          !groups.some((g) => g.offer.id === b.offerId && g.time === b.time),
      )
      .map(
        (b): AgendaItem => ({
          id: b.id,
          kind: "booking",
          time: b.time,
          duration: b.duration,
          title: b.clientName,
          detail: b.serviceName,
          location: b.locationName || b.address,
          completed: b.status === "completed",
        }),
      ),
    ...(store.externalSessions ?? [])
      .filter((b) => b.coach === coachId && b.day === day && !b.cancelled)
      .map(
        (b): AgendaItem => ({
          id: b.id,
          kind: "external",
          time: b.time,
          duration: b.duration,
          title: b.name,
          detail: b.serviceName,
          location: b.address,
        }),
      ),
    ...config.blocks
      .filter((b) => b.day === day)
      .map(
        (b): AgendaItem => ({
          id: b.id,
          kind: "block",
          time: b.start,
          duration: mins(b.end) - mins(b.start),
          title: b.title || "Indisponibilité",
          detail: "Temps bloqué",
        }),
      ),
    ...(store.calendarBusy?.[coachId] ?? [])
      .filter((b) => b.day === day)
      .map(
        (b, index): AgendaItem => ({
          id: `${day}-${b.time}-${index}`,
          kind: "calendar",
          time: b.time,
          duration: b.duration,
          title: "Agenda connecté",
          detail: "Occupé",
        }),
      ),
    ...store.closed
      .filter((key) => key.startsWith(`${coachId}|${day}|`))
      .map(
        (key): AgendaItem => ({
          id: key,
          kind: "closed",
          time: key.split("|")[2],
          duration: 0,
          title: "Départ fermé",
          detail: "Fermeture enregistrée",
        }),
      ),
  ];
  items.sort(
    (a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title),
  );
  return {
    day,
    ranges: intervalsFor(config, day),
    exception: Object.prototype.hasOwnProperty.call(config.exceptions, day),
    items,
    appointments: items.filter((item) =>
      ["booking", "group", "external"].includes(item.kind),
    ).length,
  };
}
