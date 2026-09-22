import communes from "../reference/communes-idf.json";
import { searchAddresses } from "../lib/geo";
export const departments: Record<string, string> = {
  "75": "Paris",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d’Oise",
};
export const sectors = [
  ...Array.from({ length: 20 }, (_, i) => ({
    nom: `Paris ${i + 1}${i ? "e" : "er"}`,
    code: String(75101 + i),
    codeDepartement: "75",
    codesPostaux: [String(75001 + i)],
  })),
  ...communes,
];
export const normalizeSector = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export type SectorOption = { value: string; label: string; detail: string };
export function localSectors(query: string, department = ""): SectorOption[] {
  const words = normalizeSector(query).split(" ").filter(Boolean);
  return sectors
    .filter(
      (s) =>
        (!department || s.codeDepartement === department) &&
        words.every((w) =>
          normalizeSector(
            `${s.nom} ${s.codesPostaux.join(" ")} ${departments[s.codeDepartement]}`,
          ).includes(w),
        ),
    )
    .map((s) => ({
      value:
        s.codeDepartement === "75" ? s.nom : `${s.nom} · ${s.codeDepartement}`,
      label: s.nom,
      detail: `${s.codesPostaux.join(", ")} · ${departments[s.codeDepartement]}`,
    }));
}
export function sectorFromAddress(
  city: string,
  postcode: string,
): string | null {
  const dep = postcode.slice(0, 2);
  if (!departments[dep]) return null;
  if (dep === "75") {
    const n = postcode === "75116" ? 16 : Number(postcode.slice(3));
    if (n >= 1 && n <= 20) return `Paris ${n}${n === 1 ? "er" : "e"}`;
    return "Paris";
  }
  const match = communes.find(
    (s) =>
      s.codeDepartement === dep &&
      normalizeSector(s.nom) === normalizeSector(city),
  );
  return match ? `${match.nom} · ${dep}` : null;
}
export async function addressSectors(
  query: string,
  signal?: AbortSignal,
): Promise<SectorOption[]> {
  const rows = await searchAddresses(query, signal);
  return rows.flatMap((row) => {
    const value = sectorFromAddress(row.city, row.postcode ?? "");
    return value
      ? [{ value, label: row.label, detail: `Secteur proposé : ${value}` }]
      : [];
  });
}
