import {
  allCoaches,
  coachRecipient,
  now,
  noticeContext,
  type Booking,
  type Message,
  type Store,
} from "./model";
import { canRead, notify, owned, uid } from "./workflows";
import { noticeKind } from "./noticeEvents";
export type ThreadMessage = Message & { key: string; booking: Booking };
export type Conversation = {
  id: string;
  name: string;
  coachId: string;
  clientId: string;
  photo?: string;
  photoIndex: number | null;
  bookings: Booking[];
  messages: ThreadMessage[];
  unread: number;
  latest?: ThreadMessage;
  booking: Booking;
};
export const conversationKey = (b: Booking) =>
  JSON.stringify([b.coach, b.clientId]);
export const messageKey = (m: Message, index: number) =>
  m.id ?? `legacy:${index}`;
export function conversationFor(s: Store, id: string) {
  return conversations(s).find((c) => c.bookings.some((b) => b.id === id));
}
export function conversations(s: Store): Conversation[] {
  if (!s.account) return [];
  const buckets = new Map<string, Booking[]>();
  for (const b of s.bookings.filter((b) => canRead(s, b))) {
    const key = conversationKey(b);
    buckets.set(key, [...(buckets.get(key) ?? []), b]);
  }
  return [...buckets]
    .map(([id, bookings]) => {
      const coach = allCoaches(s).find((c) => c.id === bookings[0].coach),
        isCoach = s.account!.role === "coach";
      const sorted = [...bookings].sort((a, b) =>
        (a.day + a.time).localeCompare(b.day + b.time),
      );
      const upcoming = sorted.find(
        (b) =>
          b.status === "confirmed" && Date.parse(b.day + "T23:59:59Z") >= now(),
      );
      const messages = bookings
        .flatMap((b) =>
          (s.messages[b.id] ?? []).map((m, i) => ({
            ...m,
            key: b.id + ":" + messageKey(m, i),
            booking: b,
          })),
        )
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      const latest = messages.at(-1);
      return {
        id,
        name: isCoach
          ? (s.identities?.find((a) => a.id === bookings[0].clientId)?.name ??
            bookings.at(-1)!.clientName)
          : (coach?.name ?? "Votre coach"),
        coachId: bookings[0].coach,
        clientId: bookings[0].clientId,
        photo: isCoach ? undefined : coach?.photoUri,
        photoIndex: isCoach ? null : (coach?.photo ?? null),
        bookings: sorted,
        messages,
        latest,
        unread: messages.filter(
          (m) => m.who !== s.account!.id && !m.readBy?.includes(s.account!.id),
        ).length,
        booking: upcoming ?? sorted.at(-1)!,
      };
    })
    .sort(
      (a, b) =>
        (b.latest?.createdAt ?? 0) - (a.latest?.createdAt ?? 0) ||
        Number(!!b.latest) - Number(!!a.latest) ||
        (b.booking.day + b.booking.time).localeCompare(
          a.booking.day + a.booking.time,
        ),
    );
}
/** One client-generated ID survives uncertain responses and manual retries. */
export function sendMessage(
  s: Store,
  booking: string,
  text: string,
  id = uid(),
): Store {
  const b = owned(s, booking),
    who = s.account!.id,
    body = text.trim();
  if (!body || body.length > 4000)
    throw Error("Écrivez un message de 1 à 4 000 caractères.");
  if (typeof id !== "string" || id.length > 100 || !id.length)
    throw Error("Référence de message invalide.");
  for (const [key, ms] of Object.entries(s.messages)) {
    const existing = ms.find((m) => m.id === id);
    if (existing) {
      if (key === booking && existing.who === who && existing.text === body)
        return s;
      throw Error("Cette référence correspond à un autre message.");
    }
  }
  const recipient =
    b.clientId === who ? coachRecipient(s, b.coach) : b.clientId;
  if (s.deletedAccounts?.includes(recipient))
    throw Error("Ce compte n’est plus disponible.");
  return notify(
    {
      ...s,
      messages: {
        ...s.messages,
        [booking]: [
          ...(s.messages[booking] ?? []),
          {
            id,
            who,
            text: body,
            createdAt: now(),
            readBy: [who],
            context: noticeContext(s, b),
          },
        ],
      },
    },
    recipient,
    "Vous avez reçu un message.",
    booking,
    `message:${id}`,
    { event: "message", messageId: id },
  );
}
export type ReadReceipt = { booking: string; keys: string[] };
export function receipts(c: Conversation): ReadReceipt[] {
  return c.bookings.map((b) => ({
    booking: b.id,
    keys: c.messages
      .filter((m) => m.booking.id === b.id)
      .map((m) => m.id ?? m.key.slice(b.id.length + 1)),
  }));
}
/** Read only messages actually loaded by this account, including legacy index keys. */
export function readConversation(
  s: Store,
  booking: string,
  seen: ReadReceipt[],
): Store {
  const anchor = owned(s, booking),
    who = s.account!.id,
    key = conversationKey(anchor);
  if (!Array.isArray(seen) || seen.length > 1000)
    throw Error("Lecture invalide.");
  const next = { ...s, messages: { ...s.messages } };
  const selected = new Map<string, Set<string>>();
  for (const item of seen) {
    if (!item || !Array.isArray(item.keys) || item.keys.length > 10000)
      throw Error("Lecture invalide.");
    const b = owned(s, item.booking);
    if (conversationKey(b) !== key) throw Error("Conversation inaccessible.");
    const keys = new Set(item.keys);
    selected.set(b.id, keys);
    next.messages[b.id] = (s.messages[b.id] ?? []).map((m, i) =>
      keys.has(messageKey(m, i)) && !m.readBy?.includes(who)
        ? { ...m, readBy: [...(m.readBy ?? []), who] }
        : m,
    );
  }
  next.notices = s.notices.map((n) => {
    const keys = selected.get(n.booking);
    if (n.recipient !== who || !keys || noticeKind(n) !== "message") return n;
    const read = n.messageId
      ? keys.has(n.messageId)
      : (next.messages[n.booking] ?? []).every(
          (m) => m.who === who || m.readBy?.includes(who),
        );
    return read ? { ...n, read: true } : n;
  });
  return next;
}
