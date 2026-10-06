export type ProductRoute = {
  view: string;
  coach?: string;
  offer?: string;
  booking?: string;
  section?: string;
  tab?: string;
  date?: string;
  sport?: string;
  q?: string;
  format?: string;
  kind?: string;
  budget?: number;
  distance?: number;
  hour?: string;
  evening?: boolean;
  flexible?: boolean;
};
export const routeViews = [
  "welcome",
  "explore",
  "profile",
  "favorites",
  "bookings",
  "bookingDetail",
  "account",
  "account-native",
  "coach",
  "config",
  "messages",
  "notifications",
  "privacy-native",
  "support-native",
];
export const settingsSections = [
  "profile",
  "offers",
  "places",
  "schedule",
  "dates",
  "blocks",
  "rules",
  "calendars",
  "preparation",
  "documents",
  "payout",
  "notifications",
  "groups",
];
const id = (v: string | null) =>
  v && /^[a-zA-Z0-9_:.\-]{1,100}$/.test(v) ? v : undefined;
export function parseProductRoute(url: string): ProductRoute | null {
  try {
    const p = new URL(url).searchParams,
      view = p.get("view");
    if (!view || !routeViews.includes(view)) return null;
    const text = (key: string, max = 100) =>
      p.get(key)?.slice(0, max) || undefined;
    const num = (key: string, min: number, max: number) => {
      const v = Number(p.get(key));
      return p.has(key) && Number.isFinite(v) && v >= min && v <= max
        ? v
        : undefined;
    };
    const date = p.get("date"),
      hour = p.get("hour");
    return {
      view,
      coach: id(p.get("coach")),
      offer: id(p.get("offer")),
      booking: id(p.get("booking")),
      section: settingsSections.includes(p.get("section") || "")
        ? p.get("section")!
        : undefined,
      tab: ["agenda", "clients", "activity", "settings"].includes(
        p.get("tab") || "",
      )
        ? p.get("tab")!
        : undefined,
      date:
        date &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        new Date(date + "T12:00Z").toISOString().startsWith(date)
          ? date
          : undefined,
      sport: text("sport"),
      q: text("q"),
      format: text("format"),
      kind: text("kind"),
      budget: num("budget", 20, 300),
      distance: num("distance", 1, 10),
      hour: hour && /^([01]\d|2[0-3]):[0-5]\d$/.test(hour) ? hour : undefined,
      evening: p.get("evening") === "1",
      flexible: p.get("flexible") === "1",
    };
  } catch {
    return null;
  }
}
export function productRouteURL(base: string, r: ProductRoute) {
  const url = new URL(base),
    keep = new URLSearchParams();
  for (const key of ["data", "surface", "recette", "version"]) {
    const value = url.searchParams.get(key);
    if (value) keep.set(key, value);
  }
  for (const [key, value] of Object.entries(r))
    if (value !== undefined && value !== "" && value !== false)
      keep.set(key, value === true ? "1" : String(value));
  url.search = keep.toString();
  url.hash = "";
  return url.toString();
}
export function routeIsPrivate(view: string) {
  return !["welcome", "explore", "profile", "privacy-native"].includes(view);
}
