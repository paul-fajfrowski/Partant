import {
  addDays,
  today,
  newPreviewStore,
  configFor,
  Offer,
  Booking,
  Store,
} from "./model";
import { loginDemo } from "./workflows";
import type { Interval } from "./extendedTypes";

/** Isolated, fictitious demonstration. Never used by connected accounts. */
export function coachAgendaPreview(): Store {
  const s = loginDemo(
    newPreviewStore(),
    "thomas@example.test",
    "",
    "coach",
    false,
  );
  const studio = "place:atelier",
    parc = "place:square";
  const individual: Offer = {
    id: "demo30-individual",
    coach: "0",
    name: "Renforcement personnalisé",
    kind: "Individuel",
    duration: 60,
    price: 60,
    capacity: 1,
    active: true,
    formats: [studio],
  };
  const duo: Offer = {
    ...individual,
    id: "demo30-duo",
    name: "Bouger à deux",
    kind: "Duo",
    price: 80,
    capacity: 2,
  };
  const running: Offer = {
    ...individual,
    id: "demo30-running",
    name: "Running & mobilité",
    duration: 45,
    price: 45,
    formats: [parc],
  };
  const group: Offer = {
    ...individual,
    id: "demo30-group",
    name: "Circuit training au square",
    kind: "Groupe",
    duration: 45,
    price: 18,
    capacity: 6,
    formats: [parc],
  };
  s.offers = [
    ...s.offers.filter((o) => o.coach !== "0"),
    individual,
    duo,
    running,
    group,
  ];
  s.coachOverrides = {
    ...s.coachOverrides,
    "0": {
      formats: [studio, parc],
      price: 45,
      area: "Paris 11e · Voltaire",
      quote: "Progresser à votre rythme, dans votre quartier.",
    },
  };
  const ranges: Interval[] = [
    ["07:30", "08:15", [running.id], [parc]],
    ["09:00", "11:00", [individual.id, duo.id], [studio]],
    ["12:15", "13:00", [group.id], [parc]],
    ["14:00", "16:00", [individual.id], [studio]],
    ["17:00", "17:45", [running.id], [parc]],
    ["18:30", "20:30", [individual.id, duo.id], [studio]],
  ];
  s.settings = {
    ...s.settings,
    "0": {
      ...configFor(s, "0"),
      published: true,
      weeklyConfigured: true,
      notice: 0,
      blocks: [],
      exceptions: {},
      week: Array.from({ length: 7 }, (_, i) =>
        i === 6
          ? []
          : i === 5
            ? [ranges[0], ranges[1]]
            : ranges.map((r) => [...r] as Interval),
      ),
      locations: {
        [studio]: {
          type: "Studio",
          name: "Atelier Voltaire · lieu de démonstration",
          address: "18 rue de la Roquette, 75011 Paris",
          instructions: "Accueil dans le hall. Matériel fourni.",
        },
        [parc]: {
          type: "Parc",
          name: "Square Maurice-Gardette",
          address: "2 rue du Général-Blaise, 75011 Paris",
          instructions: "Rendez-vous à l’entrée côté rue du Général-Blaise.",
        },
      },
      preparation: {
        provided: "Élastiques et tapis",
        bring: "Eau, tenue de sport et serviette",
        meeting: "Retrouvez le lieu dans votre réservation",
        weather: "En cas de pluie, le coach vous contacte",
      },
    },
  };
  s.bookings = s.bookings.filter((b) => b.coach !== "0");
  s.groups = [];
  s.externalSessions = [];
  s.closed = [];
  s.busyTimes = [];
  s.calendarBusy = {};
  s.notices = [];
  s.messages = {};
  const book = (
    day: string,
    time: string,
    offer: Offer,
    name: string,
    i: number,
  ): Booking => ({
    id: `demo30-${day}-${i}`,
    coach: "0",
    clientId: `demo30-${i}@example.test`,
    clientName: name,
    day,
    time,
    duration: offer.duration,
    offerId: offer.id,
    serviceName: offer.name,
    kind: offer.kind,
    format: offer.formats![0],
    seats: 1,
    price: offer.price,
    paid: offer.price,
    refunded: 0,
    goal: "Progresser régulièrement",
    address: s.settings!["0"].locations![offer.formats![0]].address,
    locationName: s.settings!["0"].locations![offer.formats![0]].name,
    status: "confirmed",
    cancelHours: 24,
  });
  for (let offset = -2; offset < 8; offset++) {
    const day = addDays(today(), offset),
      weekday = new Date(day + "T12:00:00Z").getUTCDay();
    if (weekday === 0) continue;
    s.bookings.push(book(day, "09:00", individual, "Camille Laurent", 0));
    if (weekday === 6) continue;
    s.bookings.push(book(day, "18:30", duo, "Léa & Hugo", 1));
    const g = {
      id: `demo30-group-${day}`,
      offer: group,
      day,
      time: "12:15",
      format: parc,
      address: s.settings!["0"].locations![parc].address,
      locationName: "Square Maurice-Gardette",
    };
    s.groups.push(g);
    for (let i = 0; i < 3; i++)
      s.bookings.push({
        ...book(day, "12:15", group, ["Inès", "Mehdi", "Julie"][i], i + 2),
        slotId: g.id,
      });
    s.externalSessions.push({
      id: `demo30-external-${day}`,
      coach: "0",
      name: "Antoine Moreau",
      day,
      time: "14:00",
      duration: 60,
      offerId: individual.id,
      serviceName: individual.name,
      address: s.settings!["0"].locations![studio].address,
      format: studio,
      price: 60,
    });
  }
  s.bookings = s.bookings.map((b) =>
    b.day < today() ? { ...b, status: "completed" } : b,
  );
  return s;
}
