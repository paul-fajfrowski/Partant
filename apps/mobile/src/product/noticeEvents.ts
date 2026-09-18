import type { Notice } from "./model";
export type NoticeEvent =
  | "booking"
  | "cancelled"
  | "rescheduled"
  | "transferred"
  | "seats"
  | "proposal"
  | "proposal-result"
  | "message"
  | "review"
  | "review-reply"
  | "support"
  | "dossier"
  | "calendar"
  | "reminder"
  | "availability"
  | "other";
/** Legacy notices retain their body; new notices persist a stable semantic event. */
export function noticeKind(
  n: Pick<Notice, "body" | "id" | "category" | "event">,
): NoticeEvent {
  if (n.event) return n.event;
  const text = n.body.toLowerCase();
  if (n.id.startsWith("reminder:") || n.category === "reminder")
    return "reminder";
  if (n.id.startsWith("alert:") || n.category === "availability")
    return "availability";
  if (text.startsWith("votre dossier")) return "dossier";
  if (text.startsWith("séance annulée")) return "cancelled";
  if (text.includes("propose un changement")) return "proposal";
  if (text.includes("proposition") || text.includes("garde la séance initiale"))
    return "proposal-result";
  if (text.includes("annulée")) return "cancelled";
  if (text.includes("transférée")) return "transferred";
  if (text.includes("séance modifiée")) return "rescheduled";
  if (text.includes("places modifiées")) return "seats";
  if (text.includes("message")) return "message";
  if (text.includes("répondu à votre avis")) return "review-reply";
  if (text.includes("avis")) return "review";
  if (text.includes("demande a reçu")) return "support";
  if (
    n.category === "booking" ||
    text.includes("séance est confirmée") ||
    text.includes("séance a été réservée")
  )
    return "booking";
  return "other";
}
