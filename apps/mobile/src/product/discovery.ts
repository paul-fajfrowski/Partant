import {
  Coach,
  Offer,
  Store,
  addDays,
  today,
  configFor,
  slotsFor,
  formatsAt,
  coachLocations,
  quotePrice,
} from "./model";
import { practiceOptions } from "./verification";

export const normalizeSearch = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export type DiscoveryFilter = {
  sport: string;
  query: string;
  kind: string;
  format: string;
  budget: number;
  day: string;
  flexible: boolean;
  hour: string;
  evening: boolean;
};
export type DiscoveryMatch = {
  offer: Offer;
  day: string;
  times: string[];
  format: string;
  price: number;
  variablePrice: boolean;
};

/** The same offer, place and effective quote travel from results to checkout. */
export function discoveryMatch(
  s: Store,
  c: Coach,
  f: DiscoveryFilter,
): DiscoveryMatch | undefined {
  const typedPractice = practiceOptions.find(
    (p) => normalizeSearch(p) === normalizeSearch(f.query),
  );
  const practice = f.sport !== "Tout" ? f.sport : typedPractice;
  const offers = s.offers.filter(
    (o) =>
      o.coach === c.id &&
      o.active &&
      (!practice || (o.discipline ?? c.sport) === practice) &&
      (f.kind === "Tous" || o.kind === f.kind),
  );
  if (!offers.length) return;
  const text = normalizeSearch(
    [
      c.name,
      c.sport,
      ...(c.disciplines ?? []),
      c.area,
      ...c.tags,
      ...offers.map((o) => o.name),
    ].join(" "),
  );
  if (f.query.trim() && !text.includes(normalizeSearch(f.query))) return;
  const count = f.flexible ? Math.min(90, configFor(s, c.id).horizon) : 1;
  for (let i = 0; i < count; i++) {
    const day = f.flexible ? addDays(today(), i) : f.day;
    const matches: DiscoveryMatch[] = [];
    for (const offer of offers) {
      const options = slotsFor(c, day, s, offer)
        .filter(
          (time) =>
            (!f.hour || time === f.hour) && (!f.evening || time >= "18:00"),
        )
        .flatMap((time) => {
          const group = s.groups?.find(
            (g) =>
              !g.cancelled &&
              g.offer.id === offer.id &&
              g.day === day &&
              g.time === time,
          );
          const places = group?.format
            ? [group.format]
            : formatsAt(s, c, offer, day, time);
          return places
            .filter((p) => !!p)
            .filter(
              (p) =>
                f.format === "Tous" ||
                p === f.format ||
                coachLocations(s, c)[p]?.type === f.format,
            )
            .map((format) => ({
              time,
              format,
              price: quotePrice(
                s,
                { coach: c.id, format, seats: 1 },
                group?.offer ?? offer,
              ),
            }));
        });
      const eligible = options
        .filter((x) => x.price <= f.budget)
        .sort((a, b) => a.price - b.price || a.time.localeCompare(b.time));
      const first = eligible[0];
      if (first)
        matches.push({
          offer,
          day,
          format: first.format,
          price: first.price,
          times: eligible
            .filter((x) => x.format === first.format && x.price === first.price)
            .map((x) => x.time)
            .sort(),
          variablePrice: new Set(options.map((x) => x.price)).size > 1,
        });
    }
    if (matches.length)
      return matches.sort(
        (a, b) =>
          (f.kind === "Tous"
            ? Number(a.offer.kind !== "Individuel") -
              Number(b.offer.kind !== "Individuel")
            : 0) ||
          a.price - b.price ||
          a.times[0].localeCompare(b.times[0]),
      )[0];
  }
}

export function offerDisplayPrice(
  s: Store,
  c: Coach,
  o: Offer,
  format = "Tous",
) {
  const places = (o.formats ?? c.formats).filter(
    (p) =>
      format === "Tous" ||
      p === format ||
      coachLocations(s, c)[p]?.type === format,
  );
  const prices = places.map((p) =>
    quotePrice(s, { coach: c.id, format: p, seats: 1 }, o),
  );
  return {
    price: prices.length ? Math.min(...prices) : o.price,
    variablePrice: new Set(prices).size > 1,
  };
}
