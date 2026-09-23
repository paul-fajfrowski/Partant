import {
  allCoaches,
  configFor,
  intervalsFor,
  coachLocations,
  offerFormats,
  slotsFor,
  mins,
  Store,
} from "./model";
import type { CoachLocation, Interval } from "./extendedTypes";
import { canOffer } from "./verification";

/** Merge legacy aliases for the same venue, without hiding distinct access/fees. */
export function locationPresentationKey(p: CoachLocation) {
  const normalize = (s = "") =>
    s.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
  return JSON.stringify([
    p.type === "Domicile" || p.type === "Visio" ? p.type : "venue",
    normalize(p.name),
    normalize(p.address),
    normalize(p.instructions),
    normalize(p.sector),
    p.radius ?? 0,
    p.travelFee ?? 0,
  ]);
}

export type RangeSelection = {
  coach: string;
  day: string;
  range?: Interval;
  fromDayList?: boolean;
};

/** Read-only presentation. The booking engine remains the authority for departures. */
export function availabilityRangeView(store: Store, selection: RangeSelection) {
  if (!selection.range) return null;
  const coach = allCoaches(store).find((c) => c.id === selection.coach);
  if (!coach) return null;
  const cfg = configFor(store, coach.id);
  const range = intervalsFor(cfg, selection.day).find(
    (r) => JSON.stringify(r) === JSON.stringify(selection.range),
  );
  if (!range) return null; // Never show an obsolete range after a remote edit.
  const [from, to, offerIds, placeIds] = range;
  const places = coachLocations(store, coach);
  const offers = store.offers
    .filter(
      (o) =>
        o.coach === coach.id &&
        (offerIds == null ? o.active : offerIds.includes(o.id)),
    )
    .map((offer) => {
      const locations = offerFormats(coach, offer)
        .filter((id) => placeIds == null || placeIds.includes(id))
        .map((id) => ({ id, ...places[id] }))
        .filter((p) => !!p.name)
        .filter(
          (p, i, all) =>
            all.findIndex(
              (v) => locationPresentationKey(v) === locationPresentationKey(p),
            ) === i,
        );
      const groups = (store.groups ?? []).filter(
        (g) =>
          !g.cancelled &&
          g.offer.coach === coach.id &&
          g.offer.id === offer.id &&
          g.day === selection.day &&
          mins(g.time) >= mins(from) &&
          mins(g.time) + g.offer.duration <= mins(to),
      );
      const departures = !locations.length
        ? []
        : slotsFor(coach, selection.day, store, offer).filter(
            (time) =>
              mins(time) >= mins(from) &&
              mins(time) + offer.duration <= mins(to),
          );
      const status = !offer.active
        ? "Offre désactivée"
        : !cfg.published
          ? "Profil non publié"
          : !canOffer(cfg.dossier, coach, offer, selection.day)
            ? "Pratique non autorisée pour cette date"
            : !locations.length
              ? "Aucun lieu compatible avec cette plage"
              : offer.duration > mins(to) - mins(from)
                ? "Durée supérieure à cette plage"
                : offer.kind === "Groupe" && !groups.length
                  ? "Cours à planifier : la plage seule ne crée pas de cours"
                  : departures.length
                    ? `${departures.length} départ${departures.length > 1 ? "s" : ""} réservable${departures.length > 1 ? "s" : ""}`
                    : "Aucun départ réservable actuellement";
      return { offer, locations, departures, groups, status };
    });
  return {
    from,
    to,
    offers,
    specificDate: Object.hasOwn(cfg.exceptions, selection.day),
  };
}
