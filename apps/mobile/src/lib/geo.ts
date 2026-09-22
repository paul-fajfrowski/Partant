export type Place = {
  label: string;
  city: string;
  postcode?: string;
  latitude: number;
  longitude: number;
};
export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  if (query.trim().length < 3) return [];
  const response = await fetch(
    `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query.trim())}&limit=5`,
    { signal },
  );
  if (!response.ok)
    throw new Error("La recherche d’adresses est indisponible. Réessayez.");
  const data = await response.json();
  return (data.features ?? [])
    .filter((f: any) => f.geometry?.type === "Point")
    .map((f: any) => ({
      label: f.properties.label,
      city: f.properties.city,
      postcode: f.properties.postcode,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    }));
}
export function distanceKm(
  a: Pick<Place, "latitude" | "longitude">,
  b: Pick<Place, "latitude" | "longitude">,
) {
  const r = Math.PI / 180;
  const x =
    Math.sin(((b.latitude - a.latitude) * r) / 2) ** 2 +
    Math.cos(a.latitude * r) *
      Math.cos(b.latitude * r) *
      Math.sin(((b.longitude - a.longitude) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function osmUrl(p: Pick<Place, "latitude" | "longitude">) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude - 0.015},${p.latitude - 0.008},${p.longitude + 0.015},${p.latitude + 0.008}&layer=mapnik&marker=${p.latitude},${p.longitude}`;
}
