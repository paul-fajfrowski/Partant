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
export function errorMessage(error: unknown) {
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
