import type { Store, Booking, Coach, Offer } from "./model";
import type { Command } from "./commands";
import type { AvailabilityAlert, CoachLocation } from "./extendedTypes";
import { distanceKm } from "../lib/geo";

export type GeoPoint = { label: string; latitude: number; longitude: number };
// Supplied by the server resolver, NEVER read from a command or client coordinates.
export type GeoContext = Record<string, GeoPoint>;
export function validPoint(p?: GeoPoint): p is GeoPoint {
  return !!p && !!p.label?.trim() && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
}
export function assertHomeZone(location: CoachLocation | undefined, address: string, geo: GeoContext) {
  if (!location?.sector || !Number.isFinite(location.radius) || !location.radius)
    throw Error("Le coach doit préciser sa zone de déplacement avant une réservation à domicile.");
  const center = geo[location.sector], point = geo[address];
  if (!validPoint(center) || !validPoint(point))
    throw Error("Sélectionnez une adresse proposée pour vérifier la zone de déplacement.");
  if (distanceKm(center, point) > location.radius)
    throw Error(`Cette adresse est hors de la zone de déplacement du coach (${location.radius} km autour de ${location.sector}). Choisissez un autre lieu ou un autre coach.`);
}
export function geoQueries(s: Store, cmd: Command, actorId: string): { query: string; street: boolean }[] {
  const out: { query: string; street: boolean }[] = [];
  const add = (query: string | undefined, street = false) => {
    if (typeof query === "string" && query.trim()) out.push({ query, street });
  };
  const home = (coach: string, address: string) => {
    add(s.settings?.[coach]?.locations?.Domicile?.sector);
    add(address, true);
  };
  const a = cmd.args;
  if (cmd.name === "saveSettings" && a[0] === actorId) {
    const current = s.settings?.[actorId]?.locations?.Domicile;
    const incoming = a[1]?.locations?.Domicile;
    if (incoming?.sector !== current?.sector || !validPoint(current?.areaCenter)) add(incoming?.sector);
  }
  if (cmd.name === "alert") {
    const old = s.alerts?.find(x => x.id === a[0]?.id && x.owner === actorId);
    if (a[0]?.area?.label !== old?.area?.label || !validPoint(old?.area)) add(a[0]?.area?.label);
  }
  if (cmd.name === "reserve" && a[0]?.format === "Domicile") home(a[0].coach, a[0].address);
  if (["reschedule", "addProposal"].includes(cmd.name)) {
    const b = s.bookings.find(b => b.id === a[0]);
    if (b?.format === "Domicile" && (cmd.name === "reschedule" ? b.clientId === actorId : b.coach === actorId)) home(b.coach, cmd.name === "reschedule" ? (a[3] ?? b.address) : a[1]?.address);
  }
  if (cmd.name === "answerProposal" && a[1] === "accepted") {
    const p = s.proposals?.find(p => p.id === a[0]);
    const b = s.bookings.find(b => b.id === p?.booking);
    if (b?.clientId === actorId) {
      const g = s.groups?.find(g => g.offer.id === p?.target.offerId && g.day === p.target.day && g.time === p.target.time);
      if (g?.format === "Domicile") home(g.offer.coach, g.address);
      else if (b.format === "Domicile") home(b.coach, p!.target.address);
    }
  }
  if (cmd.name === "openGroup" && a[0]?.format === "Domicile") home(a[0].offer?.coach, a[0].address);
  if (cmd.name === "repeatGroup") {
    const g = s.groups?.find(g => g.id === a[0]);
    if (g?.format === "Domicile" && g.offer.coach === actorId) home(g.offer.coach, g.address);
  }
  if (cmd.name === "transfer") {
    const b = s.bookings.find(b => b.id === a[0] && b.clientId === actorId);
    const g = s.groups?.find(g => g.id === a[1]);
    if (b && g?.format === "Domicile") home(g.offer.coach, g.address);
  }
  return out;
}
export function validateGeoChanges(before: Store, after: Store, geo: GeoContext = {}) {
  for (const b of after.bookings) {
    if (b.status !== "confirmed" || b.format !== "Domicile") continue;
    const old = before.bookings.find(x => x.id === b.id);
    if (!old || old.address !== b.address || old.day !== b.day || old.time !== b.time)
      assertHomeZone(after.settings?.[b.coach]?.locations?.Domicile, b.address, geo);
  }
  for (const p of after.proposals ?? []) {
    if (before.proposals?.some(x => x.id === p.id)) continue;
    const b = after.bookings.find(b => b.id === p.booking);
    if (b?.format === "Domicile") assertHomeZone(after.settings?.[b.coach]?.locations?.Domicile, p.target.address, geo);
  }
  for (const g of after.groups ?? []) {
    if (g.format === "Domicile" && !before.groups?.some(x => x.id === g.id))
      assertHomeZone(after.settings?.[g.offer.coach]?.locations?.Domicile, g.address, geo);
  }
}
export function alertPlaceMatches(s: Store, c: Coach, format: string, a: AvailabilityAlert) {
  const place = s.settings?.[c.id]?.locations?.[format];
  if (format === "Visio" || place?.type === "Visio") return true;
  if (!a.area) return !!a.coach; // Old global alerts must be updated, not silently worldwide.
  if (!validPoint(a.area)) return false;
  if (format === "Domicile" || place?.type === "Domicile")
    return validPoint(place?.areaCenter) && distanceKm(a.area, place.areaCenter) <= a.area.radius + (place.radius ?? 0);
  return validPoint(place?.coordinates) && distanceKm(a.area, place.coordinates) <= a.area.radius;
}
