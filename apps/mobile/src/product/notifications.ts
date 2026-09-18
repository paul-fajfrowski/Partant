import {
  coachAccountId,
  configFor,
  now,
  noticeContext,
  type Notice,
  type Store,
} from "./model";
import { noticeKind } from "./noticeEvents";
import { effectiveProposalStatus } from "./workflows";
export type NotificationTarget = {
  screen: string;
  focus?: string;
  booking?: string;
  config?: string;
};
export type NotificationRow = {
  notice: Notice;
  title: string;
  person: string;
  session: string;
  detail: string[];
  outcome?: string;
  actionable: boolean;
  label: string;
  target: NotificationTarget;
  icon: string;
};
const titles = {
  booking: "Séance confirmée",
  cancelled: "Séance annulée",
  rescheduled: "Séance modifiée",
  transferred: "Cours changé",
  seats: "Places modifiées",
  proposal: "Changement proposé",
  "proposal-result": "Réponse à la proposition",
  message: "Nouveau message",
  review: "Nouvel avis",
  "review-reply": "Réponse à votre avis",
  support: "Réponse de l’assistance",
  dossier: "Votre dossier coach",
  calendar: "Votre agenda",
  reminder: "Votre séance approche",
  availability: "Un créneau se libère",
  other: "Votre activité",
};
const outcomes = {
  pending: "En attente de réponse",
  accepted: "Proposition acceptée",
  declined: "Séance initiale conservée",
  withdrawn: "Proposition retirée",
  expired: "Proposition expirée",
};
export const parisDay = (stamp: number) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(stamp);
export function sessionDate(day: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return `${day} · ${time}`;
  return (
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(day + "T12:00:00Z")) +
    " · " +
    time
  );
}
export function notificationGroup(n: Notice, at = now()) {
  if (!n.createdAt || !Number.isFinite(n.createdAt)) return "Historique";
  const key = parisDay(n.createdAt),
    today = parisDay(at),
    d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  if (key === today) return "Aujourd’hui";
  if (key === d.toISOString().slice(0, 10)) return "Hier";
  d.setTime(Date.parse(today + "T12:00:00Z"));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (key >= d.toISOString().slice(0, 10) && key <= today)
    return "Cette semaine";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(n.createdAt);
}
export function notificationTime(n: Notice) {
  if (!n.createdAt || !Number.isFinite(n.createdAt))
    return "Date de réception non renseignée";
  return (
    "Reçu le " +
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(n.createdAt)
  );
}
export function notificationRows(s: Store): NotificationRow[] {
  const me = s.account;
  if (!me) return [];
  const own = s.notices.filter((n) => n.recipient === me.id);
  const stamp = (n: Notice) =>
    Number.isFinite(n.createdAt) ? n.createdAt! : 0;
  const latestDossier = own
    .filter((n) => noticeKind(n) === "dossier")
    .sort((a, b) => stamp(a) - stamp(b))
    .at(-1)?.id;
  return own
    .map((n, index) => {
      const kind = noticeKind(n),
        b = s.bookings.find(
          (b) =>
            b.id === n.booking &&
            (b.clientId === me.id ||
              (me.role === "coach" && b.coach === coachAccountId(s))),
        );
      const context = n.context ?? (b ? noticeContext(s, b) : undefined);
      const row: NotificationRow = {
        notice: n,
        title:
          kind === "booking" && me.role === "coach"
            ? "Nouvelle réservation"
            : titles[kind],
        person: context
          ? me.role === "coach"
            ? context.clientName
            : context.coachName
          : "",
        session: context
          ? `${context.serviceName} · ${sessionDate(context.day, context.time)}${context.kind === "Groupe" || context.kind === "Duo" ? ` · ${context.seats} place${context.seats > 1 ? "s" : ""}` : ""}`
          : "",
        detail: [],
        actionable: false,
        label: b ? "Voir la séance" : "Voir le détail",
        target: b
          ? { screen: "bookingDetail", booking: b.id }
          : { screen: "support-native" },
        icon:
          kind === "message"
            ? "message"
            : kind === "calendar"
              ? "calendar"
              : kind === "dossier"
                ? "shield"
                : "bell",
      };
      if (!n.context && context)
        row.session = "Séance actuelle · " + row.session;
      if (kind === "rescheduled" || kind === "transferred") {
        if (n.previous && n.context) {
          row.detail.push(
            "Avant : " + sessionDate(n.previous.day, n.previous.time),
            "Après : " + sessionDate(n.context.day, n.context.time),
          );
          if (n.previous.address !== n.context.address)
            row.detail.push(
              "Ancien lieu : " + n.previous.address,
              "Nouveau lieu : " + n.context.address,
            );
        } else row.detail.push(n.body);
      } else if (kind === "seats" && n.previous && n.context)
        row.detail.push(
          `${n.previous.seats} → ${n.context.seats} places conservées`,
        );
      else if (kind === "cancelled") row.detail.push(n.body);
      if (kind === "message") {
        row.target = b
          ? { screen: "chat", booking: b.id }
          : { screen: "messages" };
        row.label = "Ouvrir la conversation";
      }
      if (kind === "proposal" || kind === "proposal-result") {
        // Old ambiguous events lead to the session history, never a guessed proposal.
        const candidates =
          s.proposals?.filter((p) => p.booking === n.booking) ?? [];
        const p = n.proposalId
          ? candidates.find((p) => p.id === n.proposalId)
          : candidates.length === 1
            ? candidates[0]
            : undefined;
        if (p && b) {
          const status = effectiveProposalStatus(s, p);
          row.outcome = outcomes[status];
          row.actionable =
            status === "pending" && me.id === b.clientId && kind === "proposal";
          row.detail.push(
            "Proposé : " + sessionDate(p.target.day, p.target.time),
          );
          if (p.target.address !== context?.address)
            row.detail.push("Lieu proposé : " + p.target.address);
          row.target = {
            screen: "proposal-native",
            focus: p.id,
            booking: b.id,
          };
          row.label = row.actionable
            ? "Répondre à la proposition"
            : status === "pending"
              ? "Voir la proposition"
              : "Voir le résultat";
        } else row.detail.push(n.body);
      }
      if (kind === "calendar") {
        const c = s.calendarStatus?.[coachAccountId(s) ?? ""];
        row.actionable =
          me.role === "coach" &&
          !n.resolvedAt &&
          !!(c?.error || c?.conflicts?.length);
        row.outcome = row.actionable
          ? "À vérifier"
          : n.resolvedAt
            ? "Incident clôturé"
            : "Aucune action en attente";
        row.detail.push(
          row.actionable
            ? c?.error
              ? "La synchronisation de votre agenda nécessite une intervention."
              : `${c?.conflicts?.length} conflit(s) à vérifier dans votre agenda.`
            : "Consultez les réglages pour connaître l’état actuel de la connexion.",
        );
        row.target = { screen: "config", config: "calendars" };
        row.label = row.actionable ? "Vérifier mon agenda" : "Voir mon agenda";
      }
      if (kind === "dossier") {
        const status = configFor(s, coachAccountId(s) ?? "").dossier.status;
        row.actionable =
          me.role === "coach" &&
          n.id === latestDossier &&
          ["correction", "rejected", "expired"].includes(status);
        row.detail.push(n.body);
        row.outcome =
          n.id === latestDossier
            ? {
                approved: "Dossier validé",
                pending: "Dossier en cours d’examen",
                correction: "Pièces à compléter",
                rejected: "Dossier à revoir",
                expired: "Justificatifs expirés",
                draft: "Dossier en préparation",
              }[status]
            : "Décision précédente";
        row.target = { screen: "config", config: "documents" };
        row.label = row.actionable
          ? "Compléter mon dossier"
          : "Voir mon dossier";
      }
      if (kind === "support") {
        row.target = { screen: "support-native", focus: n.ticketId };
        row.label = "Lire la réponse";
      }
      if (kind === "availability") {
        row.target = { screen: "alerts-native" };
        row.label = "Voir les disponibilités";
        row.detail.push(n.body);
      }
      if (kind === "review" || kind === "review-reply") {
        row.target = { screen: "reviews-native", focus: b?.coach };
        row.label = "Voir les avis";
      }
      if (kind === "other") row.detail.push(n.body);
      if (
        b &&
        b.status === "cancelled" &&
        ["booking", "reminder", "rescheduled", "transferred"].includes(kind)
      )
        row.outcome = "Séance annulée depuis";
      return { row, index };
    })
    .sort(
      (a, b) => stamp(b.row.notice) - stamp(a.row.notice) || b.index - a.index,
    )
    .map((x) => x.row);
}
