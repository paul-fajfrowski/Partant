import { Booking, Offer, instant, now } from "./model";

/** Mirrors the cancellation deadline used by workflows, without changing policy. */
export function cancellationSummary(
  booking: Pick<Booking, "day" | "time" | "cancelHours">,
  at = now(),
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(booking.day) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(booking.time)
  )
    return "Choisissez un créneau pour connaître la limite d’annulation gratuite.";
  const deadline =
    instant(booking.day, booking.time) - (booking.cancelHours ?? 24) * 3600000;
  if (at > deadline)
    return "Le délai d’annulation gratuite est dépassé. En cas d’annulation, la séance reste due.";
  return `Annulation gratuite jusqu’au ${new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(deadline))}.`;
}

export type OfferErrors = Partial<
  Record<"name" | "duration" | "price" | "capacity", string>
>;
export function offerErrors(offer: Offer): OfferErrors {
  const errors: OfferErrors = {};
  if (!offer.name.trim()) errors.name = "Donnez un nom à cette séance.";
  if (
    !Number.isInteger(offer.duration) ||
    offer.duration < 15 ||
    offer.duration > 240
  )
    errors.duration = "Choisissez une durée entière entre 15 et 240 minutes.";
  if (!Number.isFinite(offer.price) || offer.price < 0)
    errors.price = "Saisissez un prix supérieur ou égal à 0 €.";
  const minimum = offer.kind === "Groupe" ? 2 : 1;
  if (
    !Number.isInteger(offer.capacity) ||
    offer.capacity < minimum ||
    offer.capacity > 20
  )
    errors.capacity = `Choisissez entre ${minimum} et 20 participants.`;
  return errors;
}
