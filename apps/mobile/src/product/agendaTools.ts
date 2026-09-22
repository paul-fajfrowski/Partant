import { canOffer } from "./verification";
import { recorded } from "./commands";
import {
  Store,
  Offer,
  GroupSession,
  Coach,
  configFor,
  coachAccountId,
  allCoaches,
  validateIntervals,
  mins,
  overlap,
  instant,
  now,
  today,
  addDays,
  slotsFor,
  generatedTimes,
  intervalsFor,
  openGroup,
  offerFormats,
  offerAddress,
  locationsReady,
} from "./model";
import { Interval } from "./extendedTypes";
import { uid } from "./workflows";

export function copyDay(week: Interval[][], source: number, targets: number[]) {
  validateIntervals(week[source]);
  if (!targets.length)
    throw Error("Choisissez au moins un jour de destination.");
  return week.map((ranges, i) =>
    targets.includes(i)
      ? week[source].map(
          ([a, b, ids, places]): Interval => [
            a,
            b,
            ids == null ? ids : [...ids],
            places == null ? places : [...places],
          ],
        )
      : ranges,
  );
}

function _repeatGroup(
  s: Store,
  original: GroupSession,
  days: string[],
  time: string,
) {
  if (!days.length || new Set(days).size !== days.length || days.length > 12)
    throw Error("Choisissez entre 1 et 12 dates distinctes.");
  const current = s.offers.find((o) => o.id === original.offer.id && o.active);
  if (!current || current.coach !== coachAccountId(s))
    throw Error("Cette offre n’est plus disponible.");
  // Transaction locale : aucun cours n’est ajouté si une date échoue.
  return [...days].sort().reduce((next, day) => {
    try {
      return openGroup(next, {
        ...original,
        id: uid(),
        cancelled: false,
        offer: current,
        day,
        time,
      });
    } catch (e) {
      throw Error(`${day} : ${(e as Error).message} Aucune date ajoutée.`);
    }
  }, s);
}

function _addExternalSession(
  s: Store,
  values: {
    name: string;
    offerId: string;
    day: string;
    time: string;
    format: string;
    address: string;
  },
) {
  const id = coachAccountId(s),
    c = allCoaches(s).find((c) => c.id === id),
    o = s.offers.find(
      (o) => o.id === values.offerId && o.coach === id && o.active,
    );
  if (s.account?.role !== "coach" || !c || !o || o.kind === "Groupe")
    throw Error("Choisissez une séance individuelle ou duo de votre offre.");
  if (
    !values.name.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(values.day) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time) ||
    !Number.isFinite(instant(values.day, values.time)) ||
    instant(values.day, values.time) <= now() ||
    mins(values.time) + o.duration > 1440
  )
    throw Error("Vérifiez le nom, la date future et l’heure au format HH:mm.");
  if (!offerFormats(c, o).includes(values.format) || !values.address.trim())
    throw Error("Choisissez un lieu autorisé et précisez l’adresse.");
  const cfg = configFor(s, id),
    conflict = (b: { day: string; time: string; duration: number }) =>
      b.day === values.day &&
      overlap(
        values.time,
        o.duration + cfg.buffer,
        b.time,
        b.duration + cfg.buffer,
      );
  if (
    s.bookings.some(
      (b) => b.coach === id && b.status === "confirmed" && conflict(b),
    ) ||
    (s.externalSessions ?? []).some(
      (b) => b.coach === id && !b.cancelled && conflict(b),
    ) ||
    (s.groups ?? []).some(
      (g) =>
        g.offer.coach === id &&
        !g.cancelled &&
        conflict({ ...g, duration: g.offer.duration }),
    ) ||
    cfg.blocks.some((b) =>
      conflict({
        day: b.day,
        time: b.start,
        duration: mins(b.end) - mins(b.start),
      }),
    ) ||
    s.closed.some((k) => {
      const [c, d, t] = k.split("|");
      return c === id && conflict({ day: d, time: t, duration: 30 });
    })
  )
    throw Error(
      "Votre agenda est déjà occupé à ce moment, durée complète comprise.",
    );
  return {
    ...s,
    externalSessions: [
      ...(s.externalSessions ?? []),
      {
        ...values,
        id: uid(),
        coach: id,
        duration: o.duration,
        serviceName: o.name,
        price: o.price,
      },
    ],
  };
}
function _cancelExternalSession(s: Store, id: string) {
  const b = s.externalSessions?.find((b) => b.id === id);
  if (!b || s.account?.role !== "coach" || b.coach !== coachAccountId(s))
    throw Error("Rendez-vous inaccessible.");
  return {
    ...s,
    externalSessions: s.externalSessions!.map((x) =>
      x.id === id ? { ...x, cancelled: true } : x,
    ),
  };
}

export function availabilityReasons(
  s: Store,
  c: Coach,
  o: Offer,
  day: string,
  time: string,
): string[] {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    return ["Saisissez une heure au format HH:mm."];
  if (slotsFor(c, day, s, o).includes(time)) return [];
  const cfg = configFor(s, c.id),
    reasons: string[] = [];
  if (!cfg.published) reasons.push("Votre profil n’est pas publié.");
  if (!canOffer(cfg.dossier, c, o, today()))
    reasons.push("Votre dossier doit être validé et à jour.");
  if (!o.active) reasons.push("Cette prestation est en pause.");
  if (day < today() || day >= addDays(today(), cfg.horizon))
    reasons.push("Cette date est en dehors de votre période de réservation.");
  if (instant(day, time) <= now() + cfg.notice * 3600000)
    reasons.push("Le délai minimum avant réservation n’est pas respecté.");
  if (o.kind === "Groupe") {
    const g = s.groups?.find(
      (g) =>
        g.offer.id === o.id && g.day === day && g.time === time && !g.cancelled,
    );
    if (!g)
      reasons.push("Aucun cours collectif n’est programmé à cette heure.");
    else if (
      s.bookings
        .filter(
          (b) =>
            b.offerId === o.id &&
            b.day === day &&
            b.time === time &&
            b.status === "confirmed",
        )
        .reduce((n, b) => n + b.seats, 0) >= g.offer.capacity
    )
      reasons.push("Toutes les places de ce cours sont réservées.");
  } else if (!generatedTimes(cfg, day, o.duration, o.id).includes(time)) {
    const ranges = intervalsFor(cfg, day);
    if (!ranges.length)
      reasons.push("Cette journée est fermée dans votre planning.");
    else if (
      !ranges.some(
        ([a, b, ids]) =>
          mins(time) >= mins(a) &&
          mins(time) + o.duration <= mins(b) &&
          (ids == null || ids.includes(o.id)),
      )
    )
      reasons.push(
        "La séance entière doit tenir dans une plage autorisant cette prestation.",
      );
    else
      reasons.push(
        "Cette heure ne correspond pas aux départs calculés depuis le début de la plage et la durée de la séance.",
      );
  }
  const occupied = (d: string, t: string, duration: number) =>
    d === day &&
    overlap(time, o.duration + cfg.buffer, t, duration + cfg.buffer);
  if (
    s.bookings.some(
      (b) =>
        b.coach === c.id &&
        b.status === "confirmed" &&
        occupied(b.day, b.time, b.duration) &&
        !(o.kind === "Groupe" && b.offerId === o.id && b.time === time),
    )
  )
    reasons.push("Une réservation occupent ce moment.");
  if (
    (s.groups ?? []).some(
      (g) =>
        g.offer.coach === c.id &&
        !g.cancelled &&
        occupied(g.day, g.time, g.offer.duration) &&
        !(g.offer.id === o.id && g.time === time),
    )
  )
    reasons.push("Un cours collectif occupent ce moment.");
  if (
    (s.externalSessions ?? []).some(
      (b) =>
        b.coach === c.id && !b.cancelled && occupied(b.day, b.time, b.duration),
    )
  )
    reasons.push("Un rendez-vous hors Partant occupent ce moment.");
  if (
    cfg.blocks.some(
      (b) =>
        b.day === day &&
        overlap(time, o.duration, b.start, mins(b.end) - mins(b.start)),
    ) ||
    s.closed.some((k) => {
      const [id, d, t] = k.split("|");
      return id === c.id && d === day && overlap(time, o.duration, t, 30);
    })
  )
    reasons.push("Une indisponibilité ferme ce moment.");
  return reasons.length
    ? reasons
    : ["Ce créneau n’est pas proposé dans votre planning actuel."];
}

export function setupSteps(s: Store, id: string) {
  const c = allCoaches(s).find((c) => c.id === id),
    cfg = configFor(s, id);
  return [
    {
      id: "profile",
      title: "Présentez-vous",
      done: !!(c?.name && c.bio && c.cert),
    },
    {
      id: "offers",
      title: "Créez votre offre",
      done: s.offers.some((o) => o.coach === id && o.active),
    },
    {
      id: "places",
      title: "Choisissez vos lieux",
      done: locationsReady(s, c),
    },
    {
      id: "schedule",
      title: "Ouvrez votre planning",
      done: cfg.week.some((d) => d.length > 0),
    },
    {
      id: "documents",
      title: "Vérifiez votre profil",
      done: !!c && canOffer(cfg.dossier, c, undefined, today()),
    },
    {
      id: "payout",
      title: "Activez vos versements de test",
      done: cfg.payoutReady,
    },
  ];
}

export const repeatGroup = recorded("repeatGroup", _repeatGroup);

export const addExternalSession = recorded(
  "addExternalSession",
  _addExternalSession,
);

export const cancelExternalSession = recorded(
  "cancelExternalSession",
  _cancelExternalSession,
);
