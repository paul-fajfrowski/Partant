// Resolve on the server: coordinates supplied by the browser are never authoritative.
export async function resolveGeo(query: string, street: boolean, fetcher = fetch) {
  if (typeof query !== "string" || query.trim().length < 3 || query.length > 300)
    throw Error("Précisez l’adresse ou le secteur parmi les suggestions.");
  let data;
  try {
    const response = await fetcher(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query.trim())}&limit=5`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw Error("provider");
    data = await response.json();
  } catch {
    throw Error("La vérification des adresses est momentanément indisponible. Votre saisie est conservée ; réessayez.");
  }
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rows = (data.features ?? []).filter((f: any) => f.geometry?.type === "Point" &&
    typeof f.properties?.label === "string" && Number.isFinite(f.properties?.score) && f.properties.score >= 0.6 &&
    (!street || ["housenumber", "street"].includes(f.properties?.type)) &&
    f.geometry.coordinates?.length >= 2 && f.geometry.coordinates.every(Number.isFinite));
  const exact = rows.find((f: any) => norm(f.properties.label) === norm(query));
  const candidate = exact ?? rows[0];
  if (!candidate || (!exact && rows[1] && Math.abs(rows[0].properties.score - rows[1].properties.score) < 0.05))
    throw Error("Cette adresse est imprécise. Sélectionnez une suggestion avec la ville et le code postal.");
  const [longitude, latitude] = candidate.geometry.coordinates;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw Error("Adresse non reconnue.");
  return { label: candidate.properties.label, latitude, longitude };
}
