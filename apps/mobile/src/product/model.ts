import type { ExtendedStore, CoachSettings, Interval } from "./extendedTypes";
import reference from "../reference/prototype.json";
export type Coach = {
  id: string;
  photo: number | null;
  photoUri?: string;
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
  level?: string;
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
  cancelHours?: number;
  paid?: number;
  refunded?: number;
  preparation?: Record<string, string>;
  prepared?: boolean;
  changes?: string[];
  noShow?: boolean;
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
  coachId?: string;
};
export type Notice = {
  category?: "booking" | "changes" | "reminder" | "availability";
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
  cancelled?: boolean;
  cancelHours?: number;
  preparation?: Record<string, string>;
  level?: string;
};
export type Store = ExtendedStore & {
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
  messages: Record<string, { who: string; text: string; readBy?: string[] }[]>;
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
let clockOffset = 0;
export const setDemoClock = (hours: number) => {
  clockOffset = hours * 3600000;
};
export const now = () => Date.now() + clockOffset;
export const today = () =>
  new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now()));
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
  const cfg = configFor(store, c.id);
  if (
    !cfg.published ||
    cfg.dossier.status !== "approved" ||
    cfg.dossier.expires < today() ||
    day < today() ||
    day >= addDays(today(), cfg.horizon)
  )
    return [];
  const offset = Math.round(
    (Date.parse(day) - Date.parse(reference.anchor)) / 86400000,
  );
  const groups = (store.groups ?? []).filter(
    (g) => g.offer.coach === c.id && g.day === day && !g.cancelled,
  );
  const base =
    offer?.kind === "Groupe"
      ? groups.filter((g) => g.offer.id === offer.id).map((g) => g.time)
      : cfg.weeklyConfigured || cfg.exceptions[day]
        ? generatedTimes(cfg, day, offer?.duration ?? 60)
        : (reference.availability[Number(c.id)]?.[((offset % 7) + 7) % 7] ??
          generatedTimes(cfg, day, offer?.duration ?? 60));
  return base.filter(
    (time) =>
      instant(day, time) > now() + cfg.notice * 3600000 &&
      !store.closed.some((k) => {
        const [id, d, t] = k.split("|");
        return (
          id === c.id &&
          d === day &&
          overlap(time, offer?.duration ?? 60, t, 30)
        );
      }) &&
      !cfg.blocks.some(
        (b) =>
          b.day === day &&
          overlap(
            time,
            offer?.duration ?? 60,
            b.start,
            mins(b.end) - mins(b.start),
          ),
      ) &&
      (!offer || (offer.active && offer.coach === c.id)) &&
      (!offer ||
        offer.kind !== "Groupe" ||
        remaining(offer, day, time, store) > 0) &&
      !groups.some(
        (g) =>
          overlap(
            time,
            (offer?.duration ?? 60) + cfg.buffer,
            g.time,
            g.offer.duration + cfg.buffer,
          ) && !(offer?.id === g.offer.id && time === g.time),
      ) &&
      !store.bookings.some(
        (b) =>
          b.coach === c.id &&
          b.day === day &&
          b.status === "confirmed" &&
          overlap(
            time,
            (offer?.duration ?? 60) + cfg.buffer,
            b.time,
            b.duration + cfg.buffer,
          ) &&
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
  const c = allCoaches(store).find((c) => c.id === draft.coach);
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
    price: quotePrice(store, draft, o),
    paid: quotePrice(store, draft, o),
    refunded: 0,
    cancelHours: group?.cancelHours ?? configFor(store, c.id).cancelHours,
    preparation: {
      ...(group?.preparation ?? configFor(store, c.id).preparation),
    },
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
        category: "booking" as const,
        id: `${b.id}:coach`,
        recipient: "coach-" + c.id,
        body: "Une nouvelle séance a été réservée.",
        read: false,
        booking: b.id,
      },
      {
        category: "booking" as const,
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
  if (instant(b.day, b.time) < now() + 86400000)
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
    instant(group.day, group.time) < now() + 7200000 ||
    !group.address.trim()
  )
    throw Error("Vérifiez la date, l’heure et le lieu du cours.");
  const cfg = configFor(store, o.coach);
  if (
    group.day >= addDays(today(), cfg.horizon) ||
    !intervalFits(cfg, group.day, group.time, o.duration) ||
    cfg.blocks.some(
      (b) =>
        b.day === group.day &&
        overlap(group.time, o.duration, b.start, mins(b.end) - mins(b.start)),
    )
  )
    throw Error("Le cours doit respecter vos horaires et indisponibilités.");
  if (
    (store.groups ?? []).some(
      (g) =>
        !g.cancelled &&
        g.offer.coach === o.coach &&
        g.day === group.day &&
        overlap(
          g.time,
          g.offer.duration + cfg.buffer,
          group.time,
          o.duration + cfg.buffer,
        ),
    ) ||
    store.bookings.some(
      (b) =>
        b.coach === o.coach &&
        b.day === group.day &&
        b.status === "confirmed" &&
        overlap(
          b.time,
          b.duration + cfg.buffer,
          group.time,
          o.duration + cfg.buffer,
        ),
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
    groups: [
      ...(store.groups ?? []),
      {
        ...group,
        offer: { ...o },
        cancelHours: cfg.cancelHours,
        preparation: { ...cfg.preparation },
        level: group.level ?? o.level ?? "Tous niveaux",
      },
    ],
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

export function allCoaches(store: Store): Coach[] {
  return [...seedCoaches, ...(store.extraCoaches ?? [])].map((c) => ({
    ...c,
    ...store.coachOverrides?.[c.id],
  }));
}
export function configFor(store: Store, id: string): CoachSettings {
  const existing = store.settings?.[id];
  if (existing) return existing;
  const c = allCoaches(store).find((c) => c.id === id) ?? seedCoaches[0];
  return {
    published: id === "0" ? store.published : true,
    weeklyConfigured: false,
    week: Array.from({ length: 7 }, (_, d) =>
      d === 6 ? [] : [["09:00", "21:00"]],
    ),
    exceptions: {},
    blocks: [],
    buffer: 0,
    notice: 2,
    horizon: 90,
    cancelHours: 24,
    studio: c.place,
    studioAddress: c.address,
    radius: 3,
    travelFee: 0,
    preparation: {
      provided: "Le matériel nécessaire à la séance est fourni.",
      bring: "Une tenue confortable, une bouteille d’eau et une serviette.",
      meeting:
        "Retrouvez-moi quelques minutes avant le début au point de rendez-vous.",
      weather: "En cas de météo défavorable, nous échangeons avant la séance.",
    },
    notifications: {
      booking: true,
      changes: true,
      reminder: true,
      marketing: false,
    },
    business: {
      name: c.name,
      status: "Entreprise individuelle",
      email: c.name.split(" ")[0].toLowerCase() + "@example.test",
      address: c.address,
    },
    payoutReady: true,
    dossier: {
      status: "approved",
      documents: [
        "identite-test.pdf",
        "diplome-test.pdf",
        "carte-test.pdf",
        "assurance-test.pdf",
      ],
      expires: addDays(today(), 365),
      reason: "Profil de démonstration initial.",
      history: [],
    },
    clientNotes: {},
  };
}
export function intervalsFor(cfg: CoachSettings, day: string): Interval[] {
  return (
    cfg.exceptions[day] ??
    cfg.week[(new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7]
  );
}
export function intervalFits(
  cfg: CoachSettings,
  day: string,
  time: string,
  duration: number,
) {
  return intervalsFor(cfg, day).some(
    ([a, b]) => mins(time) >= mins(a) && mins(time) + duration <= mins(b),
  );
}
export function generatedTimes(
  cfg: CoachSettings,
  day: string,
  duration: number,
) {
  const times: string[] = [];
  for (const [a, b] of intervalsFor(cfg, day))
    for (let t = mins(a); t + duration <= mins(b); t += 30)
      times.push(endTime("00:00", t));
  return times;
}
export function validateIntervals(list: Interval[]) {
  if (list.length > 3) throw Error("Trois plages maximum par jour.");
  const sorted = [...list].sort((a, b) => mins(a[0]) - mins(b[0]));
  for (let i = 0; i < sorted.length; i++) {
    const [a, b] = sorted[i];
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(a) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(b) ||
      mins(a) >= mins(b) ||
      (i > 0 && mins(a) < mins(sorted[i - 1][1]))
    )
      throw Error(
        "Vérifiez les horaires : les plages ne doivent pas se chevaucher.",
      );
  }
  return sorted;
}
export function quotePrice(store: Store, b: Booking, o: Offer) {
  return (
    Math.round(
      (o.price * (o.kind === "Groupe" ? b.seats : 1) +
        (o.kind !== "Groupe" && b.format === "Domicile"
          ? configFor(store, b.coach).travelFee
          : 0)) *
        100,
    ) / 100
  );
}
export const coachAccountId = (store: Store) =>
  store.account?.coachId ?? store.account?.id.replace(/^coach-/, "") ?? "0";

export function newPreviewStore(): Store {
  const c = seedCoaches[1],
    o = seedOffers.find((o) => o.coach === "1" && o.kind === "Individuel")!;
  return {
    ...initialStore,
    bookings: [
      {
        id: "past-sarah",
        coach: "1",
        clientId: "alex@example.test",
        clientName: "Alex",
        day: addDays(today(), -5),
        time: "18:00",
        duration: 60,
        offerId: o.id,
        serviceName: o.name,
        kind: "Individuel",
        format: "Studio",
        seats: 1,
        price: 45,
        paid: 45,
        refunded: 0,
        goal: "Retrouver de la mobilité",
        address: c.address,
        status: "completed",
        cancelHours: 24,
      },
    ],
  };
}
