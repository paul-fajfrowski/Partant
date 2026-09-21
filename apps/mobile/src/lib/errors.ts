const messages: Record<string, string> = {
  SLOT_FULL: "Ce créneau vient d’être réservé. Choisissez-en un autre.",
  CLIENT_BUSY: "Vous avez déjà une séance à cette heure.",
  COACH_BUSY: "Le coach est occupé à cet horaire.",
  CALENDAR_SYNC_REQUIRED:
    "L’agenda externe doit être synchronisé avant de réserver.",
  SLOT_UNAVAILABLE: "Ce créneau n’est plus disponible.",
  CHANGE_WINDOW_CLOSED:
    "Les modifications sont possibles jusqu’à 24 h avant la séance.",
  SELF_BOOKING: "Vous ne pouvez pas réserver votre propre séance.",
  INVALID_SEATS: "Le nombre de participants ne correspond pas à cette offre.",
  OUTSIDE_BOOKING_WINDOW:
    "Choisissez un horaire entre dans une heure et dans 90 jours.",
};
export function isEmailRateLimit(error: unknown) {
  const e = error as {
    code?: string;
    message?: string;
    status?: number;
  } | null;
  return (
    e?.code === "over_email_send_rate_limit" ||
    /email rate limit exceeded/i.test(e?.message ?? "")
  );
}
export function errorMessage(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (isEmailRateLimit(error))
    return "L’envoi d’e-mails est temporairement limité. Réessayez plus tard ou utilisez une connexion Google ou Apple disponible. Aucun nouvel e-mail n’a été envoyé.";
  if (code === "over_request_rate_limit")
    return "Trop de tentatives rapprochées. Patientez avant de réessayer.";
  if (code === "email_address_not_authorized")
    return "L’envoi d’e-mails n’est pas encore ouvert à cette adresse dans la version de test. Utilisez une connexion Google ou Apple disponible.";
  if (code === "otp_expired")
    return "Ce code ou ce lien est incorrect ou a expiré. Vérifiez votre dernier e-mail ou demandez un nouvel envoi.";

  const raw =
    error instanceof Error
      ? error.message
      : ((error as any)?.message ?? "Une erreur est survenue.");
  return (
    Object.entries(messages).find(([key]) => raw.includes(key))?.[1] ??
    (raw.includes("exclusion constraint")
      ? "Ce créneau chevauche une autre séance."
      : raw)
  );
}
