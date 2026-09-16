import reference from "../reference/prototype.json";
export type Coach = {
  id: string;
  photo: number | null;
  name: string;
  sport: string;
  tags: string[];
  price: number;
  rating: string | null;
  reviews: number;
  sessions: number;
  years: number;
  area: string;
  dist: number | null;
  formats: string[];
  place: string;
  address: string;
  cert: string;
  langs: string;
  quote: string;
  bio: string;
  method: string;
  verified: boolean;
};
export type Offer = {
  id: string;
  coach: string;
  name: string;
  kind: string;
  duration: number;
  price: number;
  active: boolean;
  capacity: number;
};
export type Booking = {
  id: string;
  coach: string;
  clientId: string;
  clientName: string;
  day: string;
  time: string;
  duration: number;
  offerId: string;
  serviceName: string;
  kind: string;
  format: string;
  seats: number;
  price: number;
  goal: string;
  address: string;
  status: "confirmed" | "cancelled" | "completed";
  slotId?: string;
};
export type Preferences = {
  sport: string;
  goal: string;
  level: string;
  city: string;
  budget: number;
  distance: number;
  format: string;
  moment: string;
};
export type Account = {
  id: string;
  name: string;
  email: string;
  role: "client" | "coach";
};
export type Notice = {
  id: string;
  recipient: string;
  body: string;
  read: boolean;
  booking: string;
};
export type GroupSession = {
  id: string;
  offer: Offer;
  day: string;
  time: string;
  address: string;
};
export type Store = {
  groups?: GroupSession[];
  accounts?: Record<string, { preferences: Preferences; favorites: string[] }>;
  coachOverrides?: Record<string, Partial<Coach>>;
  account: Account | null;
  preferences: Preferences;
  favorites: string[];
  bookings: Booking[];
  notices: Notice[];
  closed: string[];
  published: boolean;
  offers: Offer[];
  messages: Record<string, { who: string; text: string }[]>;
};
export const seedCoaches: Coach[] = reference.coaches.map((c) => ({
  ...c,
  id: String(c.id),
  photo: c.id,
  verified: true,
}));
export const seedOffers: Offer[] = reference.services.flatMap((s) =>
  s.offers.map((o) => ({
    ...o,
    id: `${s.coach}:${o.id}`,
    coach: String(s.coach),
    capacity: o.kind === "Duo" ? 2 : 1,
  })),
);
export const initialPreferences: Preferences = {
  sport: "Tout",
  goal: "Me remettre en forme",
  level: "Je reprends",
  city: "Paris 11e",
  budget: 80,
  distance: 10,
  format: "Tous",
  moment: "Libre",
};
export const initialStore: Store = {
  account: null,
  preferences: initialPreferences,
  favorites: [],
  bookings: [],
  notices: [],
  closed: [],
  published: true,
  offers: seedOffers,
  messages: {},
};
export const goalsFor = (sport: string): string[] =>
  (reference.goals as Record<string, string[]>)[sport] ?? reference.goals.Tout;
export function changeSport(p: Preferences, sport: string): Preferences {
  const goals = goalsFor(sport);
  return { ...p, sport, goal: goals.includes(p.goal) ? p.goal : goals[0] };
}
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'\-]/g, " ");
export const today = () =>
  new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const addDays = (iso: string, n: number) =>
  new Date(Date.parse(iso + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function dayLabel(day: string, short = false) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: short ? "short" : "long",
    day: "numeric",
    month: short ? "short" : "long",
    timeZone: "Europe/Paris",
  }).format(new Date(day + "T12:00:00Z"));
}
export function instant(day: string, time: string) {
  const target = Date.parse(`${day}T${time}:00Z`);
  let utc = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(new Date(utc));
    utc += target - Date.parse(parts.replace(" ", "T") + "Z");
  }
  return utc;
}
export const mins = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const endTime = (t: string, d: number) =>
  `${Math.floor((mins(t) + d) / 60)}`.padStart(2, "0") +
  ":" +
  `${(mins(t) + d) % 60}`.padStart(2, "0");
export const overlap = (a: string, ad: number, b: string, bd: number) =>
  mins(a) < mins(b) + bd && mins(b) < mins(a) + ad;
export function slotsFor(
  c: Coach,
  day: string,
  store: Store,
  offer?: Offer,
): string[] {
  if (c.id === "0" && !store.published) return [];
  const offset = Math.round(
    (Date.parse(day) - Date.parse(reference.anchor)) / 86400000,
  );
  const groups = (store.groups ?? []).filter(
    (g) => g.offer.coach === c.id && g.day === day,
  );
  const base =
    offer?.kind === "Groupe"
      ? groups.filter((g) => g.offer.id === offer.id).map((g) => g.time)
      : (reference.availability[Number(c.id)]?.[((offset % 7) + 7) % 7] ?? []);
  return base.filter(
    (time) =>
      instant(day, time) > Date.now() + 7200000 &&
      !store.closed.includes(`${c.id}|${day}|${time}`) &&
      (!offer || (offer.active && offer.coach === c.id)) &&
      (!offer ||
        offer.kind !== "Groupe" ||
        remaining(offer, day, time, store) > 0) &&
      !groups.some(
        (g) =>
          overlap(time, offer?.duration ?? 60, g.time, g.offer.duration) &&
          !(offer?.id === g.offer.id && time === g.time),
      ) &&
      !store.bookings.some(
        (b) =>
          b.coach === c.id &&
          b.day === day &&
          b.status === "confirmed" &&
          overlap(time, offer?.duration ?? 60, b.time, b.duration) &&
          !(
            offer?.kind === "Groupe" &&
            b.offerId === offer.id &&
            time === b.time
          ),
      ),
  );
}
export function remaining(
  offer: Offer,
  day: string,
  time: string,
  store: Store,
) {
  return (
    ((store.groups ?? []).find(
      (g) => g.offer.id === offer.id && g.day === day && g.time === time,
    )?.offer.capacity ?? offer.capacity) -
    store.bookings
      .filter(
        (b) =>
          b.offerId === offer.id &&
          b.day === day &&
          b.time === time &&
          b.status === "confirmed",
      )
      .reduce((n, b) => n + b.seats, 0)
  );
}
export function reserve(store: Store, draft: Booking): Store {
  if (!store.account || store.account.role !== "client")
    throw Error("Connectez-vous pour retrouver votre séance.");
  if (store.bookings.some((b) => b.id === draft.id)) return store;
  const c = seedCoaches.find((c) => c.id === draft.coach);
  const current = store.offers.find(
    (o) => o.id === draft.offerId && o.coach === draft.coach && o.active,
  );
  const group = (store.groups ?? []).find(
    (g) =>
      g.offer.id === draft.offerId &&
      g.day === draft.day &&
      g.time === draft.time,
  );
  const o = current?.kind === "Groupe" ? group?.offer : current;
  if (!c || !o || !slotsFor(c, draft.day, store, o).includes(draft.time))
    throw Error("Ce créneau n’est plus disponible.");
  if (
    draft.seats < 1 ||
    !Number.isInteger(draft.seats) ||
    draft.seats > remaining(o, draft.day, draft.time, store)
  )
    throw Error("Il ne reste pas assez de places.");
  if (
    store.bookings.some(
      (b) =>
        b.clientId === store.account!.id &&
        b.status === "confirmed" &&
        b.day === draft.day &&
        overlap(b.time, b.duration, draft.time, o.duration),
    )
  )
    throw Error("Une autre séance est déjà prévue à cette heure.");
  const b = {
    ...draft,
    clientId: store.account.id,
    clientName: store.account.name,
    price: o.price * (o.kind === "Groupe" ? draft.seats : 1),
    duration: o.duration,
    kind: o.kind,
    serviceName: o.name,
    address: group?.address ?? draft.address,
    status: "confirmed" as const,
  };
  return {
    ...store,
    bookings: [...store.bookings, b],
    notices: [
      ...store.notices,
      {
        id: `${b.id}:coach`,
        recipient: "coach-" + c.id,
        body: "Une nouvelle séance a été réservée.",
        read: false,
        booking: b.id,
      },
      {
        id: `${b.id}:client`,
        recipient: b.clientId,
        body: "Votre séance est confirmée.",
        read: false,
        booking: b.id,
      },
    ],
  };
}
export function cancel(store: Store, id: string): Store {
  const b = store.bookings.find((b) => b.id === id);
  if (!b || b.clientId !== store.account?.id)
    throw Error("Cette réservation ne vous appartient pas.");
  if (b.status === "cancelled") return store;
  if (instant(b.day, b.time) < Date.now() + 86400000)
    throw Error(
      "La limite d’annulation gratuite est dépassée. Contactez le coach.",
    );
  return {
    ...store,
    bookings: store.bookings.map((x) =>
      x.id === id ? { ...x, status: "cancelled" } : x,
    ),
    notices: [
      ...store.notices,
      {
        id: `${id}:cancel:coach`,
        recipient: "coach-" + b.coach,
        body: "Une réservation a été annulée.",
        read: false,
        booking: id,
      },
      {
        id: `${id}:cancel:client`,
        recipient: b.clientId,
        body: "Votre réservation a été annulée.",
        read: false,
        booking: id,
      },
    ],
  };
}

export function openGroup(store: Store, group: GroupSession): Store {
  const o = store.offers.find(
    (o) => o.id === group.offer.id && o.active && o.kind === "Groupe",
  );
  if (
    !o ||
    store.account?.id !== "coach-" + o.coach ||
    store.account.role !== "coach"
  )
    throw Error("Connectez-vous au compte de ce coach.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(group.day) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(group.time) ||
    !Number.isFinite(instant(group.day, group.time)) ||
    instant(group.day, group.time) < Date.now() + 7200000 ||
    !group.address.trim()
  )
    throw Error("Vérifiez la date, l’heure et le lieu du cours.");
  if (
    (store.groups ?? []).some(
      (g) =>
        g.offer.coach === o.coach &&
        g.day === group.day &&
        overlap(g.time, g.offer.duration, group.time, o.duration),
    ) ||
    store.bookings.some(
      (b) =>
        b.coach === o.coach &&
        b.day === group.day &&
        b.status === "confirmed" &&
        overlap(b.time, b.duration, group.time, o.duration),
    ) ||
    store.closed.some((k) => {
      const [c, d, t] = k.split("|");
      return (
        c === o.coach &&
        d === group.day &&
        overlap(t, 60, group.time, o.duration)
      );
    })
  )
    throw Error("Votre agenda est déjà occupé à ce moment.");
  return {
    ...store,
    groups: [...(store.groups ?? []), { ...group, offer: { ...o } }],
  };
}
export function switchAccount(store: Store, account: Account | null): Store {
  const previous = store.account?.id ?? "guest";
  const accounts = {
    ...store.accounts,
    [previous]: { preferences: store.preferences, favorites: store.favorites },
  };
  const next = accounts[account?.id ?? "guest"] ?? {
    preferences: { ...initialPreferences },
    favorites: [],
  };
  return {
    ...store,
    account,
    accounts,
    preferences: { ...next.preferences },
    favorites: [...next.favorites],
  };
}
