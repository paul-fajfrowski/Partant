import {
  Account,
  Booking,
  Coach,
  Store,
  Offer,
  GroupSession,
  allCoaches,
  configFor,
  coachAccountId,
  initialPreferences,
  seedCoaches,
  addDays,
  today,
  now,
  instant,
  mins,
  overlap,
  slotsFor,
  remaining,
  reserve,
  switchAccount,
  validateIntervals,
  quotePrice,
} from "./model";
import type {
  CoachSettings,
  PaymentAttempt,
  Proposal,
  AvailabilityAlert,
  Ticket,
  AccountInfo,
} from "./extendedTypes";
export const uid = () =>
  `${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const money = (n: number) => Math.round(n * 100) / 100;
export const net = (b: Booking) =>
  money((b.paid ?? b.price) - (b.refunded ?? 0));
export const fingerprint = (b: Booking) =>
  JSON.stringify([
    b.day,
    b.time,
    b.offerId,
    b.seats,
    b.price,
    b.status,
    b.refunded ?? 0,
    b.address,
  ]);
export const infoFor = (s: Store, id: string): AccountInfo =>
  s.accountInfo?.[id] ?? { phone: "", reminders: true, alerts: true };
export function identities(s: Store): Account[] {
  return [
    ...(s.identities ?? []),
    ...[
      {
        id: "alex@example.test",
        email: "alex@example.test",
        name: "Alex",
        role: "client" as const,
      },
      {
        id: "nina@example.test",
        email: "nina@example.test",
        name: "Nina",
        role: "client" as const,
      },
    ],
    ...seedCoaches.map((c) => ({
      id: "coach-" + c.id,
      coachId: c.id,
      name: c.name,
      email: c.name.split(" ")[0].toLowerCase() + "@example.test",
      role: "coach" as const,
    })),
  ].filter(
    (a, i, list) =>
      list.findIndex((b) => b.id === a.id) === i &&
      !s.deletedAccounts?.includes(a.id),
  );
}
export function loginDemo(
  s: Store,
  email: string,
  name: string,
  role: "client" | "coach",
  signup: boolean,
) {
  const found = identities(s).find(
    (a) =>
      a.email.toLowerCase() === email.trim().toLowerCase() && a.role === role,
  );
  if (signup && found) throw Error("Ce compte existe déjà. Connectez-vous.");
  if (!signup && !found)
    throw Error("Ce compte n’existe pas. Créez votre compte pour continuer.");
  if (found) return switchAccount(s, found);
  if (!name.trim()) throw Error("Indiquez votre nom.");
  const id = uid(),
    coachId = "new-" + id,
    a: Account = {
      id: role === "coach" ? "coach-" + coachId : "client-" + id,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      ...(role === "coach" ? { coachId } : {}),
    };
  let next = { ...s, identities: [...(s.identities ?? []), a] };
  if (role === "coach") {
    const c: Coach = {
      ...seedCoaches[0],
      id: coachId,
      name: a.name,
      photo: null,
      photoUri: undefined,
      verified: false,
      rating: null,
      reviews: 0,
      sessions: 0,
      years: 0,
      bio: "",
      quote: "",
      method: "",
      cert: "",
      address: "",
      place: "",
      tags: [],
      price: 0,
    };
    next = { ...next, extraCoaches: [...(s.extraCoaches ?? []), c] };
    const cfg = configFor(next, coachId);
    next.settings = {
      ...next.settings,
      [coachId]: {
        ...cfg,
        published: false,
        weeklyConfigured: true,
        week: Array.from({ length: 7 }, () => []),
        payoutReady: false,
        dossier: {
          ...cfg.dossier,
          status: "draft",
          documents: ["", "", "", ""],
          history: [],
        },
      },
    };
  }
  return switchAccount(next, a);
}
export function notify(
  s: Store,
  recipient: string,
  body: string,
  booking = "",
  id = uid(),
): Store {
  if (s.notices.some((n) => n.id === id)) return s;
  return {
    ...s,
    notices: [
      ...s.notices,
      {
        id,
        recipient,
        body,
        booking,
        read: false,
        category: id.startsWith("reminder:")
          ? "reminder"
          : id.startsWith("alert:")
            ? "availability"
            : "changes",
      },
    ],
  };
}
function notifyBoth(s: Store, b: Booking, body: string) {
  return notify(
    notify(s, b.clientId, body, b.id),
    "coach-" + b.coach,
    body,
    b.id,
  );
}
export function canRead(s: Store, b: Booking) {
  return (
    b.clientId === s.account?.id ||
    (s.account?.role === "coach" && b.coach === coachAccountId(s))
  );
}
export function owned(s: Store, id: string) {
  const b = s.bookings.find((b) => b.id === id);
  if (!b || !canRead(s, b))
    throw Error("Cette séance n’est pas accessible à ce compte.");
  return b;
}
function future(b: Booking) {
  if (b.status !== "confirmed" || instant(b.day, b.time) <= now())
    throw Error("Cette séance n’est plus modifiable.");
}
export function saveSettings(s: Store, id: string, cfg: CoachSettings): Store {
  if (s.account?.role !== "coach" || coachAccountId(s) !== id)
    throw Error("Connectez-vous à ce compte coach.");
  if (cfg.week.length !== 7)
    throw Error("Complétez les sept jours de la semaine.");
  const ownOffers = new Set(
    s.offers.filter((o) => o.coach === id).map((o) => o.id),
  );
  for (const ranges of [...cfg.week, ...Object.values(cfg.exceptions)]) {
    validateIntervals(ranges);
    if (
      ranges.some(([, , ids]) =>
        ids?.some((offerId) => !ownOffers.has(offerId)),
      )
    )
      throw Error("Une séance de cette plage n’appartient pas à votre offre.");
  }
  if (
    ![7, 14, 30, 60, 90].includes(cfg.horizon) ||
    cfg.notice < 1 ||
    !Number.isInteger(cfg.buffer) ||
    cfg.buffer < 0 ||
    cfg.buffer > 1440 ||
    (cfg.departureStep != null &&
      (!Number.isInteger(cfg.departureStep) ||
        cfg.departureStep < 1 ||
        cfg.departureStep > 1440)) ||
    cfg.cancelHours < 0
  )
    throw Error("Vérifiez les délais.");
  return {
    ...s,
    settings: { ...s.settings, [id]: cfg },
    ...(id === "0" ? { published: cfg.published } : {}),
  };
}
export function publicationIssues(s: Store, id: string) {
  const c = allCoaches(s).find((c) => c.id === id),
    cfg = configFor(s, id);
  return [
    !c?.name || !c?.bio || !c?.cert ? "Complétez votre profil." : "",
    !s.offers.some((o) => o.coach === id && o.active)
      ? "Créez au moins une offre active."
      : "",
    !c?.formats.length || !c?.address ? "Précisez vos lieux." : "",
    !cfg.week.some((day) => day.length) ? "Ouvrez votre planning." : "",
    cfg.dossier.status !== "approved" || cfg.dossier.expires < today()
      ? "Votre dossier doit être validé et à jour."
      : "",
    !cfg.payoutReady ? "Activez vos versements de test." : "",
  ].filter(Boolean);
}
export function publish(s: Store, id: string) {
  const cfg = configFor(s, id);
  if (!cfg.published) {
    const issues = publicationIssues(s, id);
    if (issues.length) throw Error(issues.join(" "));
  }
  return saveSettings(s, id, { ...cfg, published: !cfg.published });
}
export function saveCoach(s: Store, id: string, changes: Partial<Coach>) {
  const old = allCoaches(s).find((c) => c.id === id);
  if (!old || s.account?.role !== "coach" || coachAccountId(s) !== id)
    throw Error("Profil inaccessible.");
  const c = { ...old, ...changes };
  if (!c.name.trim() || !c.bio.trim() || !c.cert.trim())
    throw Error("Complétez le nom, la présentation et les qualifications.");
  if (!Number.isFinite(c.years) || c.years < 0 || c.years > 60)
    throw Error("Vérifiez l’expérience.");
  let next: Store = {
    ...s,
    coachOverrides: {
      ...s.coachOverrides,
      [id]: { ...s.coachOverrides?.[id], ...changes },
    },
  };
  if (old.name !== c.name || old.cert !== c.cert) {
    const cfg = configFor(next, id);
    next = saveSettings(next, id, {
      ...cfg,
      published: false,
      dossier: {
        ...cfg.dossier,
        status: "draft",
        reason:
          "Le nom ou les qualifications ont changé. Soumettez un dossier actualisé.",
      },
    });
  }
  return next;
}
export function saveOffer(s: Store, o: Offer) {
  if (s.account?.role !== "coach" || o.coach !== coachAccountId(s))
    throw Error("Offre inaccessible.");
  if (
    !o.name.trim() ||
    o.price < 0 ||
    !Number.isFinite(o.price) ||
    !Number.isInteger(o.duration) ||
    o.duration < 15 ||
    o.duration > 240 ||
    !Number.isInteger(o.capacity) ||
    o.capacity < 1 ||
    o.capacity > 20 ||
    (o.kind === "Groupe" && o.capacity < 2)
  )
    throw Error("Vérifiez le nom, le prix, la durée et les places.");
  return {
    ...s,
    offers: s.offers.some((x) => x.id === o.id)
      ? s.offers.map((x) =>
          x.id === o.id ? { ...o, price: money(o.price) } : x,
        )
      : [...s.offers, { ...o, price: money(o.price) }],
  };
}
function refund(s: Store, b: Booking, amount: number): Store {
  amount = money(Math.max(0, Math.min(amount, net(b))));
  if (!amount) return s;
  return {
    ...s,
    refunds: [
      ...(s.refunds ?? []),
      { id: uid(), booking: b.id, amount, status: "pending" },
    ],
  };
}
export function cancelSession(s: Store, id: string, reason: string) {
  const b = owned(s, id);
  if (b.status === "cancelled") return s;
  future(b);
  const isCoach = s.account?.role === "coach";
  if (isCoach && !reason.trim())
    throw Error("Expliquez l’annulation à votre client.");
  const amount =
    isCoach || instant(b.day, b.time) - now() >= (b.cancelHours ?? 24) * 3600000
      ? net(b)
      : 0;
  const next = refund(s, b, amount);
  return notifyBoth(
    {
      ...next,
      bookings: next.bookings.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "cancelled",
              refunded: money((x.refunded ?? 0) + amount),
              changes: [
                ...(x.changes ?? []),
                `${isCoach ? "Coach" : "Client"} : annulation · ${reason} · ${amount} € remboursés (simulation)`,
              ],
            }
          : x,
      ),
    },
    b,
    `Séance annulée. ${amount} € de remboursement simulé. ${reason}`,
  );
}
export function partialCancel(s: Store, id: string, seats: number) {
  const b = owned(s, id);
  future(b);
  if (
    s.account?.id !== b.clientId ||
    b.kind !== "Groupe" ||
    !Number.isInteger(seats) ||
    seats < 1 ||
    seats >= b.seats
  )
    throw Error("Choisissez les places à conserver.");
  const unit = b.price / b.seats,
    amount =
      instant(b.day, b.time) - now() >= (b.cancelHours ?? 24) * 3600000
        ? money(unit * (b.seats - seats))
        : 0;
  const next = refund(s, b, amount);
  return notifyBoth(
    {
      ...next,
      bookings: next.bookings.map((x) =>
        x.id === id
          ? {
              ...x,
              seats,
              price: money(unit * seats),
              refunded: money((x.refunded ?? 0) + amount),
              changes: [
                ...(x.changes ?? []),
                `Annulation partielle : ${b.seats} → ${seats} places · ${amount} € remboursés`,
              ],
            }
          : x,
      ),
    },
    b,
    `Places modifiées : ${b.seats} → ${seats}.`,
  );
}
export function clientConflict(
  s: Store,
  b: Booking,
  day: string,
  time: string,
  duration: number,
) {
  return s.bookings.some(
    (x) =>
      x.id !== b.id &&
      x.clientId === b.clientId &&
      x.status === "confirmed" &&
      x.day === day &&
      overlap(x.time, x.duration, time, duration),
  );
}
export function transferCandidates(s: Store, b: Booking) {
  return (s.groups ?? []).filter(
    (g) =>
      !g.cancelled &&
      g.offer.coach === b.coach &&
      !(g.day === b.day && g.time === b.time && g.offer.id === b.offerId) &&
      remaining(g.offer, g.day, g.time, s) >= b.seats &&
      slotsFor(
        allCoaches(s).find((c) => c.id === b.coach)!,
        g.day,
        s,
        g.offer,
      ).includes(g.time) &&
      !clientConflict(s, b, g.day, g.time, g.offer.duration),
  );
}
export function transfer(
  s: Store,
  id: string,
  groupId: string,
  before: string,
  price: number,
  coachProposal = false,
) {
  const b = owned(s, id);
  future(b);
  if (fingerprint(b) !== before)
    throw Error("La réservation a changé. Revoyez le récapitulatif.");
  if (
    !coachProposal &&
    instant(b.day, b.time) - now() < (b.cancelHours ?? 24) * 3600000
  )
    throw Error("La limite de transfert est dépassée.");
  const g = transferCandidates(s, b).find((g) => g.id === groupId);
  if (!g || g.offer.price !== price)
    throw Error("Le cours ou ses places ont changé. Revoyez le récapitulatif.");
  const delta = money(g.offer.price * b.seats - b.price),
    amount = Math.max(0, -delta),
    next = refund(s, b, amount);
  return notifyBoth(
    {
      ...next,
      bookings: next.bookings.map((x) =>
        x.id === id
          ? {
              ...x,
              day: g.day,
              time: g.time,
              duration: g.offer.duration,
              offerId: g.offer.id,
              serviceName: g.offer.name,
              address: g.address,
              price: money(g.offer.price * b.seats),
              paid: money((x.paid ?? x.price) + Math.max(0, delta)),
              refunded: money((x.refunded ?? 0) + amount),
              cancelHours: g.cancelHours ?? configFor(s, b.coach).cancelHours,
              preparation: {
                ...(g.preparation ?? configFor(s, b.coach).preparation),
              },
              prepared: false,
              changes: [
                ...(x.changes ?? []),
                `Transfert vers ${g.day} ${g.time} · supplément ${Math.max(0, delta)} € · remboursement ${amount} €`,
              ],
            }
          : x,
      ),
    },
    b,
    "Votre réservation a été transférée. Actualisez votre calendrier.",
  );
}
export function reschedule(
  s: Store,
  id: string,
  day: string,
  time: string,
  address?: string,
  fromCoach = false,
) {
  const b = owned(s, id);
  future(b);
  if (b.kind === "Groupe")
    throw Error("Choisissez le parcours Changer de cours.");
  if (instant(b.day, b.time) - now() < 7200000)
    throw Error("Modification possible jusqu’à deux heures avant.");
  const c = allCoaches(s).find((c) => c.id === b.coach)!,
    o = {
      id: b.offerId,
      coach: b.coach,
      name: b.serviceName,
      kind: b.kind,
      price: b.price,
      duration: b.duration,
      capacity: b.seats,
      active: true,
    };
  if (
    !slotsFor(
      c,
      day,
      { ...s, bookings: s.bookings.filter((x) => x.id !== b.id) },
      o,
    ).includes(time) ||
    clientConflict(s, b, day, time, b.duration)
  )
    throw Error("Le nouveau créneau n’est plus disponible.");
  return notifyBoth(
    {
      ...s,
      bookings: s.bookings.map((x) =>
        x.id === id
          ? {
              ...x,
              day,
              time,
              address: address ?? x.address,
              changes: [
                ...(x.changes ?? []),
                `${b.day} ${b.time} → ${day} ${time}`,
              ],
            }
          : x,
      ),
    },
    b,
    `Séance modifiée : ${b.day} ${b.time} → ${day} ${time}.`,
  );
}
export function closeGroup(s: Store, id: string, reason: string) {
  const g = s.groups?.find((g) => g.id === id);
  if (!g || g.offer.coach !== coachAccountId(s) || s.account?.role !== "coach")
    throw Error("Cours inaccessible.");
  if (!reason.trim()) throw Error("Indiquez un motif.");
  let next = s;
  for (const b of s.bookings.filter(
    (b) =>
      b.offerId === g.offer.id &&
      b.day === g.day &&
      b.time === g.time &&
      b.status === "confirmed",
  ))
    next = cancelSession(next, b.id, reason);
  return {
    ...next,
    groups: next.groups?.map((x) =>
      x.id === id ? { ...x, cancelled: true } : x,
    ),
  };
}
export function beginPayment(s: Store, b: Booking, method: string): Store {
  if (s.account?.role !== "client")
    throw Error("Connectez-vous avant de réserver.");
  return {
    ...s,
    attempts: [
      ...(s.attempts ?? []),
      {
        id: uid(),
        owner: s.account.id,
        draft: { ...b, clientId: s.account.id },
        created: now(),
        status: "pending",
        method,
      },
    ],
  };
}
export function paymentResult(
  s: Store,
  id: string,
  result: "success" | "refused" | "interrupted",
): Store {
  const p = s.attempts?.find((p) => p.id === id && p.owner === s.account?.id);
  if (!p) throw Error("Tentative introuvable.");
  if (p.status === "success") return s;
  if (now() - p.created >= 600000)
    throw Error("Votre tentative a expiré. Réessayez avec votre sélection.");
  if (p.status !== "pending")
    throw Error("Créez une nouvelle tentative avant de confirmer.");
  let next = s;
  if (result === "success") {
    const o = s.offers.find((o) => o.id === p.draft.offerId),
      g = s.groups?.find(
        (g) =>
          g.offer.id === p.draft.offerId &&
          g.day === p.draft.day &&
          g.time === p.draft.time,
      );
    if (!o || quotePrice(s, p.draft, g?.offer ?? o) !== p.draft.price)
      throw Error("Le prix a changé. Revoyez le récapitulatif.");
    next = reserve(s, p.draft);
  }
  return {
    ...next,
    attempts: next.attempts?.map((x) =>
      x.id === id ||
      (result === "success" && x.owner === p.owner && x.draft.id === p.draft.id)
        ? { ...x, status: result }
        : x,
    ),
  };
}
export function addProposal(
  s: Store,
  id: string,
  target: Proposal["target"],
  reason: string,
) {
  const b = owned(s, id);
  future(b);
  if (s.account?.role !== "coach" || !reason.trim())
    throw Error("Expliquez la proposition à votre client.");
  if (!target.address.trim()) throw Error("Indiquez le lieu proposé.");
  // Validate a prospective change without committing it; acceptance rechecks it.
  if (b.kind === "Groupe") {
    const candidate = transferCandidates(s, b).find(
      (g) =>
        g.day === target.day &&
        g.time === target.time &&
        g.offer.id === target.offerId,
    );
    if (!candidate || money(candidate.offer.price * b.seats) !== b.price)
      throw Error("Choisissez un cours disponible au même tarif.");
  } else {
    reschedule(s, id, target.day, target.time, target.address, true);
  }
  const p: Proposal = {
    id: uid(),
    booking: id,
    before: fingerprint(b),
    target,
    reason,
    status: "pending",
  };
  const next = {
    ...s,
    proposals: [
      ...(s.proposals ?? []).map((x) =>
        x.booking === id && x.status === "pending"
          ? { ...x, status: "withdrawn" as const }
          : x,
      ),
      p,
    ],
  };
  return notify(next, b.clientId, "Votre coach propose un changement.", id);
}
export function answerProposal(
  s: Store,
  id: string,
  answer: "accepted" | "declined" | "withdrawn",
) {
  const p = s.proposals?.find((p) => p.id === id);
  if (!p || p.status !== "pending")
    throw Error("Cette proposition n’est plus ouverte.");
  const b = owned(s, p.booking);
  if (
    answer === "withdrawn"
      ? s.account?.role !== "coach"
      : s.account?.id !== b.clientId
  )
    throw Error("Action indisponible pour ce compte.");
  let next = s;
  if (answer === "accepted") {
    if (fingerprint(b) !== p.before)
      throw Error(
        "La réservation a changé. Demandez une nouvelle proposition.",
      );
    if (b.kind === "Groupe") {
      const g = transferCandidates(s, b).find(
        (g) =>
          g.day === p.target.day &&
          g.time === p.target.time &&
          g.offer.id === p.target.offerId,
      );
      if (!g || money(g.offer.price * b.seats) !== b.price)
        throw Error("Les conditions du cours ont changé.");
      next = transfer(s, b.id, g.id, p.before, g.offer.price, true);
    } else
      next = reschedule(
        s,
        b.id,
        p.target.day,
        p.target.time,
        p.target.address,
        true,
      );
  }
  return notifyBoth(
    {
      ...next,
      proposals: next.proposals?.map((x) =>
        x.id === id ? { ...x, status: answer } : x,
      ),
    },
    b,
    answer === "accepted"
      ? "Proposition acceptée."
      : answer === "declined"
        ? "Le client garde la séance initiale."
        : "Proposition retirée.",
  );
}
export function saveReview(s: Store, id: string, rating: number, text: string) {
  const b = owned(s, id);
  if (b.clientId !== s.account?.id || b.status !== "completed" || b.noShow)
    throw Error("Un avis suit une séance terminée.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !text.trim())
    throw Error("Ajoutez une note et votre avis.");
  if (s.reviews?.some((r) => r.booking === id))
    throw Error("Un avis existe déjà pour cette séance.");
  return notify(
    {
      ...s,
      reviews: [
        ...(s.reviews ?? []),
        {
          id: uid(),
          booking: id,
          coach: b.coach,
          owner: b.clientId,
          name: b.clientName,
          rating,
          text,
          reply: "",
          hidden: false,
        },
      ],
    },
    "coach-" + b.coach,
    "Un nouvel avis a été publié.",
    id,
  );
}
export function replyReview(s: Store, id: string, text: string) {
  const r = s.reviews?.find((r) => r.id === id);
  if (
    !r ||
    s.account?.role !== "coach" ||
    r.coach !== coachAccountId(s) ||
    !text.trim()
  )
    throw Error("Réponse indisponible.");
  return notify(
    {
      ...s,
      reviews: s.reviews?.map((x) => (x.id === id ? { ...x, reply: text } : x)),
    },
    r.owner,
    "Votre coach a répondu à votre avis.",
    r.booking,
  );
}
export function report(s: Store, values: Partial<Ticket>) {
  if (!s.account || !values.body?.trim())
    throw Error("Connectez-vous et précisez votre demande.");
  if (values.booking) owned(s, values.booking);
  return {
    ...s,
    tickets: [
      ...(s.tickets ?? []),
      {
        id: uid(),
        owner: s.account.id,
        kind: "Assistance",
        status: "open",
        response: "",
        ...values,
      } as Ticket,
    ],
  };
}
export function resolveTicket(
  s: Store,
  id: string,
  response: string,
  decision: string,
) {
  if (!s.testMode)
    throw Error("L’espace équipe est réservé au mode Test de démonstration.");
  const ticket = s.tickets?.find((t) => t.id === id && t.status === "open");
  if (!ticket || !response.trim()) throw Error("Indiquez une réponse motivée.");
  let next = s;
  if (decision === "Rembourser la séance" && ticket.booking) {
    const b = s.bookings.find((b) => b.id === ticket.booking);
    if (b) {
      const amount = net(b);
      next = refund(s, b, amount);
      next = {
        ...next,
        bookings: next.bookings.map((x) =>
          x.id === b.id ? { ...x, refunded: (x.refunded ?? 0) + amount } : x,
        ),
      };
    }
  }
  if (decision === "Masquer l’avis" && ticket.review)
    next = {
      ...next,
      reviews: next.reviews?.map((r) =>
        r.id === ticket.review ? { ...r, hidden: true } : r,
      ),
    };
  if (decision === "Suspendre le profil" && ticket.coach) {
    const cfg = configFor(next, ticket.coach);
    next = {
      ...next,
      settings: {
        ...next.settings,
        [ticket.coach]: { ...cfg, published: false },
      },
    };
  }
  return notify(
    {
      ...next,
      tickets: next.tickets?.map((t) =>
        t.id === id ? { ...t, status: "resolved", response, decision } : t,
      ),
    },
    ticket.owner,
    "Votre demande a reçu une réponse.",
    ticket.booking,
  );
}
export function reviewDossier(
  s: Store,
  id: string,
  status: "approved" | "correction" | "rejected",
  reason: string,
) {
  if (!s.testMode || !reason.trim())
    throw Error("Ajoutez une décision motivée en mode Test.");
  const cfg = configFor(s, id);
  if (cfg.dossier.status !== "pending")
    throw Error("Ce dossier n’attend pas de décision.");
  return notify(
    {
      ...s,
      settings: {
        ...s.settings,
        [id]: {
          ...cfg,
          published: false,
          dossier: {
            ...cfg.dossier,
            status,
            reason,
            history: [
              ...cfg.dossier.history,
              { date: today(), status, reason },
            ],
          },
        },
      },
    },
    "coach-" + id,
    "Votre dossier : " + reason,
  );
}
export function alertMatches(s: Store, a: AvailabilityAlert) {
  if (!a.active) return [];
  const result: {
    coach: Coach;
    offer: Offer;
    day: string;
    time: string;
    price: number;
  }[] = [];
  for (const c of allCoaches(s)) {
    if (
      (a.coach && c.id !== a.coach) ||
      (a.sport !== "Tout" && ![c.sport, ...c.tags].includes(a.sport)) ||
      (a.format !== "Tous" && !c.formats.includes(a.format))
    )
      continue;
    for (const o of s.offers.filter(
      (o) =>
        o.coach === c.id && o.active && (!a.groupOnly || o.kind === "Groupe"),
    )) {
      if (a.seats > 1 && o.kind !== "Groupe") continue;
      for (const time of slotsFor(c, a.day, s, o)) {
        const g = s.groups?.find(
            (g) => g.offer.id === o.id && g.day === a.day && g.time === time,
          ),
          price = g?.offer.price ?? o.price;
        if (
          time < a.from ||
          time > a.to ||
          price * a.seats > a.budget ||
          remaining(o, a.day, time, s) < a.seats ||
          s.bookings.some(
            (b) =>
              b.clientId === a.owner &&
              b.status === "confirmed" &&
              b.day === a.day &&
              overlap(b.time, b.duration, time, o.duration),
          )
        )
          continue;
        result.push({
          coach: c,
          offer: g?.offer ?? o,
          day: a.day,
          time,
          price,
        });
      }
    }
  }
  return result;
}
export function maintain(s: Store): Store {
  let next = s,
    changed = false;
  const bookings = s.bookings.map((b) => {
    if (
      b.status === "confirmed" &&
      instant(b.day, b.time) + b.duration * 60000 <= now()
    ) {
      changed = true;
      return { ...b, status: "completed" as const };
    }
    return b;
  });
  if (changed) next = { ...next, bookings };
  for (const c of allCoaches(next)) {
    const cfg = next.settings?.[c.id];
    if (cfg?.dossier.status === "approved" && cfg.dossier.expires < today())
      next = {
        ...next,
        settings: {
          ...next.settings,
          [c.id]: {
            ...cfg,
            published: false,
            dossier: {
              ...cfg.dossier,
              status: "expired",
              reason: "La validité du dossier est dépassée.",
            },
          },
        },
      };
  }
  for (const b of next.bookings) {
    if (b.status !== "confirmed" || instant(b.day, b.time) - now() > 86400000)
      continue;
    for (const recipient of [b.clientId, "coach-" + b.coach]) {
      const enabled = recipient.startsWith("coach-")
        ? configFor(next, b.coach).notifications.reminder
        : infoFor(next, recipient).reminders;
      if (enabled)
        next = notify(
          next,
          recipient,
          "Votre séance approche : " + b.day + " à " + b.time,
          b.id,
          `reminder:${b.id}:${b.day}:${b.time}:${recipient}`,
        );
    }
  }
  const attempts = next.attempts?.map((p) =>
    p.status === "pending" && now() - p.created >= 600000
      ? { ...p, status: "expired" as const }
      : p,
  );
  if (attempts?.some((p, i) => p !== next.attempts![i]))
    next = { ...next, attempts };
  const proposals = next.proposals?.map((p) => {
    const b = next.bookings.find((b) => b.id === p.booking);
    return p.status === "pending" &&
      (!b ||
        b.status !== "confirmed" ||
        instant(p.target.day, p.target.time) <= now())
      ? { ...p, status: "expired" as const }
      : p;
  });
  if (proposals?.some((p, i) => p !== next.proposals![i]))
    next = { ...next, proposals };
  for (const a of next.alerts ?? []) {
    const matches = alertMatches(next, a),
      keys = matches.map(
        (m) => `${m.coach.id}|${a.day}|${m.time}|${m.offer.id}`,
      ),
      fresh = keys.some((k) => !a.seen.includes(k));
    if (JSON.stringify(keys) !== JSON.stringify(a.seen))
      next = {
        ...next,
        alerts: next.alerts?.map((x) =>
          x.id === a.id ? { ...x, seen: keys } : x,
        ),
      };
    if (fresh && infoFor(next, a.owner).alerts)
      next = notify(
        next,
        a.owner,
        `Un créneau vous attend : ${a.day}, ${matches.length} possibilité(s).`,
        "",
        `alert:${a.id}:${uid()}`,
      );
  }
  return next;
}
export function accountExport(s: Store) {
  if (!s.account) throw Error("Connectez-vous.");
  const bookings = s.bookings.filter((b) => canRead(s, b)),
    ids = new Set(bookings.map((b) => b.id));
  return {
    exportedAt: new Date(now()).toISOString(),
    account: s.account,
    preferences: s.preferences,
    profile:
      s.account.role === "coach"
        ? configFor(s, coachAccountId(s))
        : infoFor(s, s.account.id),
    bookings,
    messages: Object.fromEntries(
      Object.entries(s.messages).filter(([id]) => ids.has(id)),
    ),
    notifications: s.notices.filter((n) => n.recipient === s.account!.id),
    payments: s.attempts?.filter((p) => p.owner === s.account!.id),
  };
}
export function deleteAccount(s: Store) {
  if (!s.account) throw Error("Connectez-vous.");
  if (s.bookings.some((b) => canRead(s, b) && b.status === "confirmed"))
    throw Error("Traitez vos séances confirmées avant de supprimer ce compte.");
  const id = s.account.id,
    coach = s.account.role === "coach" ? coachAccountId(s) : null;
  let next = {
    ...s,
    identities: identities(s).filter((a) => a.id !== id),
    deletedAccounts: [
      ...((s as Store & { deletedAccounts?: string[] }).deletedAccounts ?? []),
      id,
    ],
    notices: s.notices.filter((n) => n.recipient !== id),
    attempts: s.attempts?.filter((p) => p.owner !== id),
    alerts: s.alerts?.filter((a) => a.owner !== id),
    bookings: s.bookings.map((b) =>
      b.clientId === id
        ? {
            ...b,
            clientName: "Compte supprimé",
            goal: "",
            address: b.format === "Domicile" ? "Adresse supprimée" : b.address,
          }
        : b,
    ),
    messages: Object.fromEntries(
      Object.entries(s.messages).map(([k, ms]) => [
        k,
        ms.map((m) =>
          m.who === id ? { ...m, text: "Message supprimé", who: "deleted" } : m,
        ),
      ]),
    ),
  };
  if (coach)
    next = {
      ...next,
      settings: {
        ...next.settings,
        [coach]: { ...configFor(next, coach), published: false },
      },
      coachOverrides: {
        ...next.coachOverrides,
        [coach]: { name: "Compte supprimé", bio: "", photoUri: "" },
      },
    };
  const out = switchAccount(next, null);
  delete out.accounts?.[id];
  delete out.accountInfo?.[id];
  return out;
}
export function sessionICS(b: Booking, coach: string) {
  const utc = (ms: number) =>
      new Date(ms)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z/, "Z"),
    esc = (s: string) =>
      s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Partant//Séance//FR",
    "BEGIN:VEVENT",
    "UID:" + b.id + "@partant.local",
    "DTSTAMP:" + utc(now()),
    "DTSTART:" + utc(instant(b.day, b.time)),
    "DTEND:" + utc(instant(b.day, b.time) + b.duration * 60000),
    "SUMMARY:" + esc("Séance avec " + coach),
    "LOCATION:" + esc(b.address),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
