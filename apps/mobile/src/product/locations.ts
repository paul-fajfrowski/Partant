import type { CoachLocation } from "./extendedTypes";
export const placeTypes = [
  "Salle de musculation",
  "Piste d’athlétisme",
  "Parc",
  "Studio",
  "Salle de boxe",
  "Terrain de tennis",
  "Terrain de football",
  "Piscine",
  "Chez le coach",
  "Domicile",
  "Visio",
  "Autre lieu",
];
export function suggestedPlaces(sport: string) {
  if (/muscul|physique|renfor|forme/i.test(sport))
    return ["Salle de musculation", "Parc", "Domicile"];
  if (/running|course|athl/i.test(sport))
    return ["Piste d’athlétisme", "Parc", "Domicile"];
  if (/boxe|combat/i.test(sport)) return ["Salle de boxe", "Studio", "Parc"];
  if (/tennis/i.test(sport))
    return ["Terrain de tennis", "Salle de musculation"];
  if (/football/i.test(sport))
    return ["Terrain de football", "Piste d’athlétisme"];
  if (/natation/i.test(sport)) return ["Piscine", "Salle de musculation"];
  if (/yoga|pilates|mobilit/i.test(sport))
    return ["Studio", "Domicile", "Visio"];
  return ["Parc", "Studio", "Domicile"];
}
export function validateLocations(locations: Record<string, CoachLocation>) {
  const rows = Object.entries(locations);
  if (!rows.length)
    throw Error("Ajoutez au moins un lieu ou un mode de séance.");
  for (const [id, p] of rows) {
    if (
      p.coordinates &&
      (!Number.isFinite(p.coordinates.latitude) ||
        !Number.isFinite(p.coordinates.longitude) ||
        Math.abs(p.coordinates.latitude) > 90 ||
        Math.abs(p.coordinates.longitude) > 180 ||
        p.coordinates.label !== p.address)
    )
      throw Error("Sélectionnez à nouveau l’adresse de ce lieu.");
    if (!placeTypes.includes(p.type) || !p.name.trim())
      throw Error("Précisez le type et le nom de chaque lieu.");
    if ((p.type === "Domicile" || p.type === "Visio") && p.type !== id)
      throw Error("Un seul réglage Domicile et Visio par coach.");
    if (p.type === "Domicile") {
      if (
        !p.sector?.trim() ||
        !Number.isFinite(p.radius) ||
        p.radius! < 1 ||
        p.radius! > 100 ||
        !Number.isFinite(p.travelFee) ||
        p.travelFee! < 0 ||
        p.travelFee! > 300
      )
        throw Error(
          "Précisez le secteur, un rayon de 1 à 100 km et un supplément de 0 à 300 € pour le domicile.",
        );
    } else if (p.type !== "Visio" && !p.address.trim())
      throw Error(`Précisez l’adresse de « ${p.name} ».`);
  }
  return locations;
}
