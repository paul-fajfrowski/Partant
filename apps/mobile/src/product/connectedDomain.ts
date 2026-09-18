/** Authoritative domain used by the Edge Function. No browser state is trusted. */
import * as M from "./model";
import * as W from "./workflows";
import * as A from "./agendaTools";
import type { Command } from "./commands";
import type { CoachSettings } from "./extendedTypes";
export type Actor = { id: string; email: string; staff?: boolean };
export const emptyConnected = (): M.Store => ({
  ...M.initialStore,
  connected: true,
  offers: [],
  groups: [],
  extraCoaches: [],
  identities: [],
  settings: {},
  published: false,
  bookings: [],
  notices: [],
  closed: [],
  messages: {},
  accounts: {},
  preferences: { ...M.initialPreferences },
  favorites: [],
  account: null,
});
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const pick = (v: any, keys: string[]) =>
  Object.fromEntries(
    keys.filter((k) => v?.[k] !== undefined).map((k) => [k, v[k]]),
  );
const string = (v: unknown, max = 3000) => {
  if (typeof v !== "string" || v.length > max) throw Error("Texte invalide.");
  return v;
};
const me = (s: M.Store) => {
  if (!s.account) throw Error("Connectez-vous.");
  return s.account;
};
const ownCoach = (s: M.Store, id: string) => {
  if (me(s).role !== "coach" || M.coachAccountId(s) !== id)
    throw Error("Configuration inaccessible.");
};
export function register(
  s: M.Store,
  actor: Actor,
  name: string,
  role: "client" | "coach",
): M.Store {
  if (s.deletedAccounts?.includes(actor.id))
    throw Error("Ce compte a été supprimé.");
  const existing = s.identities?.find((a) => a.id === actor.id);
  if (existing) return s;
  name = string(name, 100).trim();
  if (!name || !["client", "coach"].includes(role))
    throw Error("Complétez votre profil.");
  const account: M.Account = {
    id: actor.id,
    email: actor.email,
    name,
    role,
    ...(role === "coach" ? { coachId: actor.id } : {}),
  };
  let next = { ...s, identities: [...(s.identities ?? []), account] };
  if (role === "coach") {
    const coach: M.Coach = {
      id: actor.id,
      name,
      photo: null,
      sport: "Coaching sportif",
      tags: [],
      price: 0,
      rating: null,
      reviews: 0,
      sessions: 0,
      years: 0,
      area: "",
      dist: null,
      formats: [],
      place: "",
      address: "",
      cert: "",
      langs: "Français",
      quote: "",
      bio: "",
      method: "",
      verified: false,
    };
    next = { ...next, extraCoaches: [...(next.extraCoaches ?? []), coach] };
    next = {
      ...next,
      settings: { ...next.settings, [actor.id]: M.configFor(next, actor.id) },
    };
  }
  return next;
}
export function asActor(s: M.Store, actor?: Actor): M.Store {
  const account = actor
    ? (s.identities?.find((a) => a.id === actor.id) ?? null)
    : null;
  return {
    ...s,
    connected: true,
    testMode: false,
    clockHours: 0,
    account,
    preferences: account
      ? (s.accounts?.[account.id]?.preferences ?? M.initialPreferences)
      : M.initialPreferences,
    favorites: account ? (s.accounts?.[account.id]?.favorites ?? []) : [],
  };
}
function updateAccountPreferences(s: M.Store): M.Store {
  const id = me(s).id;
  return {
    ...s,
    accounts: {
      ...s.accounts,
      [id]: { preferences: s.preferences, favorites: s.favorites },
    },
  };
}
export function applyCommand(
  source: M.Store,
  actor: Actor,
  cmd: Command,
): M.Store {
  let s = asActor(source, actor);
  me(s);
  const a = cmd.args;
  if (!Array.isArray(a)) throw Error("Action invalide.");
  let n = s;
  switch (cmd.name) {
    case "preferences": {
      const p = {
        ...s.preferences,
        ...pick(a[0], Object.keys(M.initialPreferences)),
      } as M.Preferences;
      if (
        !Number.isFinite(p.budget) ||
        p.budget < 0 ||
        p.budget > 10000 ||
        !Number.isFinite(p.distance) ||
        p.distance < 0 ||
        p.distance > 500
      )
        throw Error("Préférences invalides.");
      n = updateAccountPreferences({ ...s, preferences: p });
      break;
    }
    case "favorites":
      n = updateAccountPreferences({
        ...s,
        favorites: [
          ...new Set(
            (a[0] as string[]).filter((id) =>
              M.allCoaches(s).some((c) => c.id === id),
            ),
          ),
        ],
      });
      break;
    case "account": {
      const values = a[0],
        name = string(values.name, 100).trim();
      if (!name) throw Error("Indiquez votre nom.");
      if (values.email !== actor.email)
        throw Error(
          "Le changement d’e-mail nécessite une confirmation ; conservez votre e-mail de connexion.",
        );
      n = {
        ...s,
        identities: s.identities?.map((x) =>
          x.id === actor.id ? { ...x, name, email: actor.email } : x,
        ),
        accountInfo: {
          ...s.accountInfo,
          [actor.id]: {
            phone: string(values.phone ?? "", 30),
            reminders: !!values.reminders,
            alerts: !!values.alerts,
          },
        },
      };
      break;
    }
    case "drafts": {
      ownCoach(s, actor.id);
      const mine = Object.fromEntries(
        Object.entries(a[0] ?? {}).filter(([k]) =>
          k.startsWith(actor.id + ":"),
        ),
      );
      n = {
        ...s,
        coachDrafts: {
          ...Object.fromEntries(
            Object.entries(s.coachDrafts ?? {}).filter(
              ([k]) => !k.startsWith(actor.id + ":"),
            ),
          ),
          ...mine,
        },
      } as M.Store;
      break;
    }
    case "saveSettings": {
      ownCoach(s, a[0]);
      const old = M.configFor(s, a[0]);
      const cfg = {
        ...old,
        ...pick(a[1], Object.keys(old).concat("locations")),
      } as CoachSettings;
      // Verification decisions and history belong to the team, never to a coach.
      if (JSON.stringify(cfg.dossier) !== JSON.stringify(old.dossier)) {
        if (!["draft", "pending"].includes(cfg.dossier.status))
          throw Error(
            "La validation du dossier appartient à l’équipe Partant.",
          );
        if (
          cfg.dossier.status === "pending" &&
          (cfg.dossier.documents.length !== 4 ||
            cfg.dossier.documents.some((x) => !x.trim()) ||
            cfg.dossier.expires <= M.today())
        )
          throw Error("Complétez les quatre justificatifs et leur validité.");
        cfg.dossier = {
          ...cfg.dossier,
          reason:
            cfg.dossier.status === "pending"
              ? "Dossier soumis à l’équipe."
              : "À compléter.",
          history: [
            ...old.dossier.history,
            {
              date: M.today(),
              status: cfg.dossier.status,
              reason: "Mise à jour du dossier",
            },
          ],
        };
        cfg.published = false;
      }
      if (
        !Number.isFinite(cfg.notice) ||
        cfg.notice < 1 ||
        cfg.notice > 720 ||
        !Number.isFinite(cfg.cancelHours) ||
        cfg.cancelHours < 0 ||
        cfg.cancelHours > 720
      )
        throw Error("Délais invalides.");
      for (const block of cfg.blocks) {
        M.validateIntervals([[block.start, block.end]]);
        if (
          s.bookings.some(
            (b) =>
              b.coach === actor.id &&
              b.status === "confirmed" &&
              b.day === block.day &&
              M.overlap(
                b.time,
                b.duration,
                block.start,
                M.mins(block.end) - M.mins(block.start),
              ),
          ) ||
          (s.groups ?? []).some(
            (g) =>
              g.offer.coach === actor.id &&
              !g.cancelled &&
              g.day === block.day &&
              M.overlap(
                g.time,
                g.offer.duration,
                block.start,
                M.mins(block.end) - M.mins(block.start),
              ),
          ) ||
          (s.externalSessions ?? []).some(
            (b) =>
              b.coach === actor.id &&
              !b.cancelled &&
              b.day === block.day &&
              M.overlap(
                b.time,
                b.duration,
                block.start,
                M.mins(block.end) - M.mins(block.start),
              ),
          )
        )
          throw Error("Une séance occupe cette indisponibilité.");
      }
      const clients = new Set(
        s.bookings.filter((b) => b.coach === actor.id).map((b) => b.clientId),
      );
      if (Object.keys(cfg.clientNotes).some((id) => !clients.has(id)))
        throw Error("Client inaccessible.");
      if (cfg.locations) {
        const formats = Object.keys(cfg.locations);
        if (
          s.offers.some(
            (o) =>
              o.coach === actor.id &&
              o.active &&
              o.formats?.some((f) => !formats.includes(f)),
          )
        )
          throw Error("Un lieu retiré est encore associé à une séance.");
        const physical = Object.values(cfg.locations).find(
          (p) => !["Visio", "Domicile"].includes(p.type),
        );
        s = {
          ...s,
          coachOverrides: {
            ...s.coachOverrides,
            [actor.id]: {
              ...s.coachOverrides?.[actor.id],
              formats,
              place: physical?.name ?? "",
              address: physical?.address ?? "",
            },
          },
        };
      }
      const publishing = cfg.published && !old.published;
      n = W.saveSettings(s, a[0], {
        ...cfg,
        published: publishing ? false : cfg.published,
      });
      if (publishing) n = W.publish(n, a[0]);
      break;
    }
    case "publish":
      n = W.publish(s, a[0]);
      break;
    case "saveCoach":
      n = W.saveCoach(
        s,
        a[0],
        pick(a[1], [
          "name",
          "sport",
          "tags",
          "years",
          "area",
          "cert",
          "langs",
          "quote",
          "bio",
          "method",
          "photoUri",
        ]),
      );
      break;
    case "saveOffer": {
      const old = s.offers.find((o) => o.id === a[0].id);
      if (old && old.coach !== actor.id) throw Error("Offre inaccessible.");
      const o = pick(a[0], [
        "id",
        "coach",
        "name",
        "kind",
        "duration",
        "price",
        "active",
        "capacity",
        "formats",
        "level",
      ]) as M.Offer;
      if (
        !["Individuel", "Duo", "Groupe"].includes(o.kind) ||
        o.price > 1000 ||
        (o.kind === "Individuel" && o.capacity !== 1) ||
        (o.kind === "Duo" && o.capacity !== 2)
      )
        throw Error("Séance invalide.");
      n = W.saveOffer(s, o);
      break;
    }
    case "reserve": {
      const d = a[0] as M.Booking;
      const o = s.offers.find((o) => o.id === d.offerId && o.coach === d.coach);
      if (!o || d.coach === actor.id) throw Error("Séance inaccessible.");
      if (
        (o.kind === "Individuel" && d.seats !== 1) ||
        (o.kind === "Duo" && d.seats !== 2)
      )
        throw Error("Nombre de places invalide.");
      const g = s.groups?.find(
        (g) =>
          g.offer.id === o.id &&
          g.day === d.day &&
          g.time === d.time &&
          !g.cancelled,
      );
      if (M.quotePrice(s, d, g?.offer ?? o) !== d.price)
        throw Error("Le tarif a changé. Revoyez le récapitulatif.");
      if (d.format === "Domicile" && !d.address?.trim())
        throw Error("Indiquez votre adresse.");
      const old = s.bookings.find((b) => b.id === d.id);
      if (old) {
        if (
          old.clientId !== actor.id ||
          old.offerId !== d.offerId ||
          old.day !== d.day ||
          old.time !== d.time ||
          old.seats !== d.seats
        )
          throw Error("Référence de réservation déjà utilisée.");
        return s;
      }
      n = M.reserve(s, {
        ...pick(d, [
          "id",
          "coach",
          "offerId",
          "day",
          "time",
          "format",
          "seats",
          "price",
          "goal",
          "address",
          "participantNames",
        ]),
        clientId: actor.id,
        clientName: me(s).name,
        status: "confirmed",
      } as M.Booking);
      break;
    }
    case "openGroup": {
      if (s.groups?.some((g) => g.id === a[0].id))
        throw Error("Ce cours existe déjà.");
      const g = pick(a[0], [
        "id",
        "offer",
        "day",
        "time",
        "format",
        "address",
        "level",
      ]) as M.GroupSession;
      const c = M.allCoaches(s).find((c) => c.id === actor.id);
      if (!c) throw Error("Coach inaccessible.");
      if (g.format !== "Domicile")
        g.address = M.offerAddress(s, c, g.format ?? "");
      n = M.openGroup(s, g);
      break;
    }
    case "repeatGroup": {
      const g = s.groups?.find((g) => g.id === a[0].id);
      if (!g) throw Error("Cours inaccessible.");
      n = A.repeatGroup(s, g, a[1], a[2]);
      break;
    }
    case "addExternalSession":
      n = A.addExternalSession(
        s,
        pick(a[0], [
          "name",
          "offerId",
          "day",
          "time",
          "format",
          "address",
        ]) as any,
      );
      break;
    case "cancelExternalSession":
      n = A.cancelExternalSession(s, a[0]);
      break;
    case "cancelSession":
      n = W.cancelSession(s, a[0], string(a[1] ?? "", 500));
      break;
    case "partialCancel":
      n = W.partialCancel(s, a[0], a[1]);
      break;
    case "transfer":
      if (me(s).role !== "client")
        throw Error("Proposez ce changement au client.");
      n = W.transfer(s, a[0], a[1], a[2], a[3]);
      break;
    case "reschedule":
      if (me(s).role !== "client")
        throw Error("Proposez ce changement au client.");
      n = W.reschedule(s, a[0], a[1], a[2], a[3]);
      break;
    case "closeGroup":
      n = W.closeGroup(s, a[0], string(a[1], 500));
      break;
    case "addProposal":
      n = W.addProposal(
        s,
        a[0],
        pick(a[1], ["day", "time", "address", "offerId"]) as any,
        string(a[2], 1000),
      );
      break;
    case "answerProposal":
      if (!["accepted", "declined", "withdrawn"].includes(a[1]))
        throw Error("Réponse invalide.");
      n = W.answerProposal(s, a[0], a[1]);
      break;
    case "saveReview":
      n = W.saveReview(s, a[0], a[1], string(a[2], 3000));
      break;
    case "replyReview":
      n = W.replyReview(s, a[0], string(a[1], 3000));
      break;
    case "report":
      n = W.report(
        s,
        pick(a[0], ["kind", "body", "coach", "booking", "review"]),
      );
      break;
    case "message": {
      const b = W.owned(s, a[0]),
        text = string(a[1], 4000).trim();
      if (!text) throw Error("Écrivez un message.");
      n = {
        ...s,
        messages: {
          ...s.messages,
          [b.id]: [
            ...(s.messages[b.id] ?? []),
            { who: actor.id, text, readBy: [actor.id] },
          ],
        },
      };
      n = W.notify(
        n,
        b.clientId === actor.id ? b.coach : b.clientId,
        "Vous avez reçu un message.",
        b.id,
      );
      break;
    }
    case "readMessages":
      W.owned(s, a[0]);
      n = {
        ...s,
        messages: {
          ...s.messages,
          [a[0]]: (s.messages[a[0]] ?? []).map((m) => ({
            ...m,
            readBy: [...new Set([...(m.readBy ?? []), actor.id])],
          })),
        },
      };
      break;
    case "readNotice":
      n = {
        ...s,
        notices: s.notices.map((x) =>
          x.id === a[0] && x.recipient === actor.id ? { ...x, read: true } : x,
        ),
      };
      break;
    case "prepared": {
      const b = W.owned(s, a[0]);
      if (b.clientId !== actor.id) throw Error("Action client uniquement.");
      n = {
        ...s,
        bookings: s.bookings.map((x) =>
          x.id === b.id ? { ...x, prepared: !!a[1] } : x,
        ),
      };
      break;
    }
    case "closed": {
      ownCoach(s, actor.id);
      const added: string[] = a[0],
        removed: string[] = a[1];
      for (const k of [...added, ...removed]) {
        const [id, day, time] = k.split("|");
        if (
          id !== actor.id ||
          !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
        )
          throw Error("Créneau inaccessible.");
      }
      n = {
        ...s,
        closed: [
          ...new Set([
            ...s.closed.filter((k) => !removed.includes(k)),
            ...added,
          ]),
        ],
      };
      break;
    }
    case "alert": {
      const old = s.alerts?.find((x) => x.id === a[0].id);
      if (old && old.owner !== actor.id) throw Error("Alerte inaccessible.");
      const alert = {
        ...pick(a[0], [
          "id",
          "coach",
          "sport",
          "day",
          "from",
          "to",
          "budget",
          "seats",
          "groupOnly",
          "format",
          "active",
        ]),
        owner: actor.id,
        seen: old?.seen ?? [],
      } as any;
      if (
        !Number.isFinite(alert.budget) ||
        alert.budget < 0 ||
        !Number.isInteger(alert.seats) ||
        alert.seats < 1 ||
        alert.seats > 20
      )
        throw Error("Alerte invalide.");
      n = {
        ...s,
        alerts: [...(s.alerts ?? []).filter((x) => x.id !== alert.id), alert],
      };
      break;
    }
    case "removeAlert":
      n = {
        ...s,
        alerts: s.alerts?.filter((x) => x.id !== a[0] || x.owner !== actor.id),
      };
      break;
    case "deleteAccount":
      n = W.deleteAccount(s);
      break;
    case "reviewDossier":
      if (!actor.staff) throw Error("Accès équipe requis.");
      n = W.reviewDossier(
        { ...s, testMode: true },
        a[0],
        a[1],
        string(a[2], 1000),
      );
      break;
    case "resolveTicket":
      if (!actor.staff) throw Error("Accès équipe requis.");
      n = W.resolveTicket(
        { ...s, testMode: true },
        a[0],
        string(a[1], 3000),
        a[2],
      );
      break;
    default:
      throw Error("Action serveur non reconnue.");
  }
  // All paths that occupy a time (including coach proposals and direct sessions) respect Google.
  const occupied = (state: M.Store) => [
    ...state.bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => ({
        id: "b:" + b.id,
        coach: b.coach,
        day: b.day,
        time: b.time,
        duration: b.duration,
      })),
    ...(state.groups ?? [])
      .filter((g) => !g.cancelled)
      .map((g) => ({
        id: "g:" + g.id,
        coach: g.offer.coach,
        day: g.day,
        time: g.time,
        duration: g.offer.duration,
      })),
    ...(state.externalSessions ?? [])
      .filter((b) => !b.cancelled)
      .map((b) => ({
        id: "e:" + b.id,
        coach: b.coach,
        day: b.day,
        time: b.time,
        duration: b.duration,
      })),
  ];
  const prior = new Map(occupied(s).map((b) => [b.id, JSON.stringify(b)]));
  for (const b of occupied(n)) {
    if (prior.get(b.id) === JSON.stringify(b)) continue;
    const cal = n.calendarStatus?.[b.coach];
    if (
      cal?.connected &&
      (cal.error ||
        M.now() - cal.updatedAt > 15 * 60000 ||
        (cal.through && b.day >= cal.through.slice(0, 10)))
    )
      throw Error("Synchronisez l’agenda Google avant d’ouvrir ce créneau.");
    if (
      n.calendarBusy?.[b.coach]?.some(
        (x) =>
          x.day === b.day && M.overlap(b.time, b.duration, x.time, x.duration),
      )
    )
      throw Error("Un événement Google occupe ce créneau.");
  }
  return {
    ...copy(n),
    account: null,
    preferences: { ...M.initialPreferences },
    favorites: [],
    testMode: false,
    clockHours: 0,
  };
}
/** Public discovery plus strictly scoped private information. */
export function project(source: M.Store, actor?: Actor): M.Store {
  const s = asActor(source, actor),
    id = actor?.id,
    own = (coach: string) => !!id && coach === id;
  const bookings = s.bookings.filter((b) => b.clientId === id || own(b.coach));
  const bookingIds = new Set(bookings.map((b) => b.id));
  const related = new Set(bookings.map((b) => b.coach));
  const coaches = M.allCoaches(s).filter(
    (c) =>
      actor?.staff ||
      own(c.id) ||
      related.has(c.id) ||
      M.configFor(s, c.id).published,
  );
  const ids = new Set(coaches.map((c) => c.id));
  const settings = Object.fromEntries(
    coaches.map((c) => {
      const cfg = M.configFor(s, c.id);
      if (own(c.id) || actor?.staff) return [c.id, cfg];
      return [
        c.id,
        {
          ...cfg,
          clientNotes: {},
          business: { name: "", status: "", email: "", address: "" },
          notifications: {
            booking: false,
            changes: false,
            reminder: false,
            marketing: false,
          },
          dossier: {
            status: cfg.dossier.status,
            expires: cfg.dossier.expires,
            documents: [],
            reason: "",
            history: [],
          },
          blocks: cfg.blocks.map((b) => ({ ...b, title: "Indisponible" })),
        },
      ];
    }),
  );
  const busyTimes = [
    ...(s.busyTimes ?? []),
    ...s.bookings
      .filter(
        (b) =>
          !bookingIds.has(b.id) && b.status === "confirmed" && ids.has(b.coach),
      )
      .map((b) => ({
        coach: b.coach,
        day: b.day,
        time: b.time,
        duration: b.duration,
        offerId: b.kind === "Groupe" ? b.offerId : undefined,
        seats: b.kind === "Groupe" ? b.seats : undefined,
      })),
    ...(s.externalSessions ?? [])
      .filter((b) => !own(b.coach) && !b.cancelled && ids.has(b.coach))
      .map((b) => ({
        coach: b.coach,
        day: b.day,
        time: b.time,
        duration: b.duration,
      })),
  ];
  return {
    ...emptyConnected(),
    account: s.account,
    staff: !!actor?.staff,
    extraCoaches: coaches,
    settings,
    offers: s.offers.filter(
      (o) =>
        ids.has(o.coach) &&
        (o.active || own(o.coach) || bookings.some((b) => b.offerId === o.id)),
    ),
    groups: s.groups?.filter((g) => ids.has(g.offer.coach)),
    bookings,
    calendarBusy: Object.fromEntries(
      Object.entries(s.calendarBusy ?? {}).filter(([coach]) => ids.has(coach)),
    ),
    calendarStatus: Object.fromEntries(
      Object.entries(s.calendarStatus ?? {})
        .filter(([coach]) => ids.has(coach))
        .map(([coach, status]) => [
          coach,
          own(coach)
            ? status
            : {
                ...status,
                error: status.error ? "Agenda temporairement indisponible" : "",
                conflicts: undefined,
              },
        ]),
    ),
    busyTimes,
    closed: s.closed.filter((k) => ids.has(k.split("|")[0])),
    preferences: s.preferences,
    favorites: s.favorites,
    accounts: id
      ? { [id]: { preferences: s.preferences, favorites: s.favorites } }
      : {},
    identities: s.account ? [s.account] : [],
    accountInfo: id && s.accountInfo?.[id] ? { [id]: s.accountInfo[id] } : {},
    externalSessions: s.externalSessions?.filter((b) => own(b.coach)),
    coachDrafts: Object.fromEntries(
      Object.entries(s.coachDrafts ?? {}).filter(
        ([k]) => !!id && k.startsWith(id + ":"),
      ),
    ),
    messages: Object.fromEntries(
      Object.entries(s.messages).filter(([b]) => bookingIds.has(b)),
    ),
    notices: s.notices.filter((n) => n.recipient === id),
    reviews: s.reviews
      ?.filter((r) => (!r.hidden && ids.has(r.coach)) || r.owner === id)
      .map((r) =>
        r.owner === id || own(r.coach) ? r : { ...r, owner: "", booking: "" },
      ),
    proposals: s.proposals?.filter((p) => bookingIds.has(p.booking)),
    refunds: s.refunds?.filter((r) => bookingIds.has(r.booking)),
    alerts: s.alerts?.filter((a) => a.owner === id),
    tickets: s.tickets?.filter((t) => t.owner === id || actor?.staff),
  };
}
/** Store fields become separate private documents, not a writable client snapshot. */
export function documents(s: M.Store) {
  return Object.fromEntries(
    Object.entries(s).filter(
      ([k]) =>
        ![
          "account",
          "preferences",
          "favorites",
          "busyTimes",
          "staff",
          "connected",
          "testMode",
          "clockHours",
        ].includes(k),
    ),
  );
}
