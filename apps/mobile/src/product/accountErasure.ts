import type { Coach, Store } from "./model";

/** Minimal historical label; no profile/contact/location data survives in it. */
function deletedCoach(id: string): Coach {
  return {
    id, name: "Compte supprimé", photo: null, photoUri: "", sport: "",
    disciplines: [], tags: [], price: 0, rating: null, reviews: 0, sessions: 0,
    years: 0, area: "", dist: null, formats: [], place: "", address: "",
    cert: "", langs: "", quote: "", bio: "", method: "", verified: false,
  };
}

/** Erase account-owned content; retain only useful, scoped session history. */
export function eraseAccountData(s: Store, id: string, coach: string | null): Store {
  const affected = new Set(s.bookings.filter(b => b.clientId === id || b.coach === coach).map(b => b.id));
  const without = <T,>(values: Record<string, T> | undefined, key: string | null) =>
    Object.fromEntries(Object.entries(values ?? {}).filter(([k]) => k !== key));
  return {
    ...s,
    identities: s.identities?.filter(a => a.id !== id),
    deletedAccounts: [...new Set([...(s.deletedAccounts ?? []), id])],
    accounts: Object.fromEntries(Object.entries(s.accounts ?? {})
      .filter(([key]) => key !== id)
      .map(([key, value]) => [key, { ...value, favorites: value.favorites.filter(x => x !== coach) }])),
    accountInfo: without(s.accountInfo, id),
    settings: Object.fromEntries(Object.entries(s.settings ?? {})
      .filter(([key]) => key !== coach)
      .map(([key, value]) => [key, { ...value, clientNotes: without(value.clientNotes, id) }])),
    coachOverrides: without(s.coachOverrides, coach),
    coachDrafts: Object.fromEntries(Object.entries(s.coachDrafts ?? {})
      .filter(([key]) => !coach || !key.startsWith(coach + ":"))),
    extraCoaches: s.extraCoaches?.map(c => c.id === coach ? deletedCoach(c.id) : c),
    offers: s.offers.filter(o => o.coach !== coach),
    groups: s.groups?.filter(g => g.offer.coach !== coach),
    externalSessions: s.externalSessions?.filter(b => b.coach !== coach),
    calendarBusy: without(s.calendarBusy, coach),
    calendarStatus: without(s.calendarStatus, coach),
    closed: s.closed.filter(key => key.split("|")[0] !== coach),
    busyTimes: s.busyTimes?.filter(b => b.coach !== coach),
    attempts: s.attempts?.filter(a => a.owner !== id && a.draft.coach !== coach),
    alerts: s.alerts?.filter(a => a.owner !== id && a.coach !== coach),
    notices: s.notices.filter(n => n.recipient !== id).map(n => affected.has(n.booking)
      ? { ...n, body: "Historique de séance · compte supprimé", context: undefined, previous: undefined }
      : n),
    bookings: s.bookings.map(b => affected.has(b.id) ? {
      ...b,
      ...(b.clientId === id ? { clientName: "Compte supprimé", participantNames: undefined, goal: "" } : {}),
      address: b.coach === coach || b.format === "Domicile" ? "Adresse supprimée" : b.address,
      locationInstructions: undefined,
      locationName: b.coach === coach ? undefined : b.locationName,
      preparation: undefined,
      changes: undefined,
    } : b),
    messages: Object.fromEntries(Object.entries(s.messages).map(([key, values]) => [key,
      values.map(m => ({ ...m,
        ...(m.who === id ? { text: "Message supprimé", who: "deleted" } : {}),
        readBy: m.readBy?.filter(reader => reader !== id),
        context: affected.has(key) ? undefined : m.context,
      })),
    ])),
    proposals: s.proposals?.map(p => affected.has(p.booking)
      ? { ...p, before: "", reason: "", target: { ...p.target, address: "Adresse supprimée" } }
      : p),
    reviews: s.reviews?.filter(r => r.coach !== coach).map(r => r.owner === id
      ? { ...r, name: "Compte supprimé", text: "Avis retiré par son auteur", reply: "", hidden: true }
      : r),
    tickets: s.tickets?.map(t => t.owner === id
      ? { ...t, body: "Compte supprimé", response: "", decision: undefined, status: "resolved" }
      : t),
  };
}
