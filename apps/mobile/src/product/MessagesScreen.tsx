import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import {
  H2,
  P,
  Row,
  Photo,
  Field,
  Select,
  Button,
  TextButton,
  Icon,
} from "./ui";
import { tokens as t } from "./tokens";
import { notificationGroup, sessionDate } from "./notifications";
import type { Booking, Store } from "./model";
import {
  conversations,
  receipts,
  type Conversation,
  type ReadReceipt,
} from "./messaging";
import type { MessageDraft } from "./useMessageDrafts";
const clock = (stamp?: number) =>
  stamp
    ? new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }).format(stamp)
    : "Heure non renseignée";
const dateLabel = (stamp?: number) => {
  const label = notificationGroup({
    id: "date",
    recipient: "",
    booking: "",
    body: "",
    read: true,
    createdAt: stamp,
  });
  return label === "Cette semaine" ? new Intl.DateTimeFormat("fr-FR", {timeZone:"Europe/Paris",day:"numeric",month:"long",year:"numeric"}).format(stamp) : label;
};
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function Portrait({ thread }: { thread: Conversation }) {
  return thread.photo || thread.photoIndex !== null ? (
    <Photo
      uri={thread.photo}
      index={thread.photoIndex}
      height={48}
      style={{ width: 48, borderRadius: 24 }}
      label={`Portrait de ${thread.name}`}
    />
  ) : (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: t.fog,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <P bold>
        {thread.name
          .split(" ")
          .slice(0, 2)
          .map((x) => x[0])
          .join("")}
      </P>
    </View>
  );
}
export function MessagesScreen({
  store,
  drafts,
  onOpen,
}: {
  store: Store;
  drafts: Record<string, MessageDraft>;
  onOpen: (c: Conversation) => void;
}) {
  const [query, setQuery] = useState("");
  const all = conversations(store),
    shown = all.filter((c) => fold(c.name).includes(fold(query.trim())));
  return (
    <>
      <H2>
        {all.length ? "Gardons le lien." : "La conversation commence ici."}
      </H2>
      <P muted style={{ marginTop: 10, marginBottom: 22 }}>
        Tous vos échanges avec une personne, dans une seule conversation.
      </P>
      {!!all.length && (
        <Field
          label="Rechercher une conversation"
          value={query}
          onChange={setQuery}
          placeholder="Un prénom, un nom"
        />
      )}
      {!all.length && (
        <P muted>Vos échanges apparaîtront après une première réservation.</P>
      )}
      {!!all.length && !shown.length && (
        <P muted>Aucune conversation ne correspond à ce nom.</P>
      )}
      {shown.map((c) => {
        const draft = drafts[c.id],
          latest = c.latest,
          stamp = latest?.createdAt;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={c.name}
            testID={`conversation-${c.coachId}-${c.clientId}`}
            onPress={() => onOpen(c)}
            style={({ pressed }) => ({
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Row style={{ gap: 12, alignItems: "flex-start" }}>
              <Portrait thread={c} />
              <View style={{ flex: 1 }}>
                <Row between style={{ gap: 8 }}>
                  <P bold={c.unread > 0} style={{ flex: 1 }}>
                    {c.name}
                  </P>
                  <P small muted>
                    {stamp
                      ? dateLabel(stamp) === "Aujourd’hui"
                        ? clock(stamp)
                        : dateLabel(stamp)
                      : latest
                        ? "Historique"
                        : ""}
                  </P>
                </Row>
                <P small muted style={{ marginTop: 5 }} numberOfLines={2}>
                  {draft?.outgoing
                    ? (draft.outgoing.status === "failed"
                        ? "Envoi à vérifier · "
                        : "Envoi en cours · ") + draft.outgoing.text
                    : draft?.text
                      ? "Brouillon · " + draft.text
                      : latest
                        ? (latest.who === store.account?.id ? "Vous : " : "") +
                          latest.text
                        : "Commencer la conversation"}
                </P>
                <Row between style={{ marginTop: 6 }}>
                  <P small muted>
                    {c.bookings.length} séance{c.bookings.length > 1 ? "s" : ""}
                  </P>
                  {c.unread > 0 && (
                    <P small bold>
                      {c.unread} non lu{c.unread > 1 ? "s" : ""} · Nouveau
                      message
                    </P>
                  )}
                </Row>
              </View>
            </Row>
          </Pressable>
        );
      })}
    </>
  );
}
export function ConversationScreen({
  store,
  thread,
  entry,
  draft,
  ready,
  storageError,
  onEdit,
  onSend,
  onRead,
  onBooking,
  onScrollEnd,
}: {
  store: Store;
  thread: Conversation;
  entry: Booking;
  draft: MessageDraft;
  ready: boolean;
  storageError: string;
  onEdit: (text: string, booking: string) => void;
  onSend: (booking: string, retry?: boolean) => Promise<void>;
  onRead: (booking: string, seen: ReadReceipt[]) => Promise<void>;
  onBooking: (id: string) => void;
  onScrollEnd: () => void;
}) {
  const [readError, setReadError] = useState(false),
    [readRevision, setReadRevision] = useState(0);
  const reading = useRef(false);
  const booking = thread.bookings.find((b) => b.id === draft.booking) ?? entry;
  const readKey =
    thread.messages
      .filter(
        (m) =>
          m.who !== store.account?.id && !m.readBy?.includes(store.account!.id),
      )
      .map((m) => m.key)
      .join("|") +
    store.notices
      .filter(
        (n) =>
          n.recipient === store.account?.id &&
          !n.read &&
          n.event === "message" &&
          thread.bookings.some((b) => b.id === n.booking),
      )
      .map((n) => n.id)
      .join("|");
  async function markRead() {
    if (reading.current) return;
    reading.current = true;
    try {
      await onRead(entry.id, receipts(thread));
      setReadError(false);
      setReadRevision((n) => n + 1);
    } catch {
      setReadError(true);
    } finally {
      reading.current = false;
    }
  }
  useEffect(() => {
    if (readKey) void markRead();
  }, [thread.id, readKey, readRevision]);
  useEffect(() => {
    if (thread.messages.length) onScrollEnd();
  }, [thread.id]);
  const outgoing = draft.outgoing,
    visiblePending =
      outgoing && !thread.messages.some((m) => m.id === outgoing.id);
  const pendingBooking = thread.bookings.find(
    (b) => b.id === outgoing?.booking,
  );
  let previous = "";
  return (
    <>
      <Row style={{ gap: 12, marginBottom: 20 }}>
        <Portrait thread={thread} />
        <View style={{ flex: 1 }}>
          <H2>{thread.name}</H2>
          <P small muted>
            Conversation privée
          </P>
        </View>
      </Row>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir la séance liée à la conversation"
        onPress={() => onBooking(booking.id)}
        style={{
          backgroundColor: t.fog,
          borderRadius: 20,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Row between>
          <View style={{ flex: 1 }}>
            <P bold>{booking.serviceName}</P>
            <P small muted style={{ marginTop: 5 }}>
              {sessionDate(booking.day, booking.time)}
            </P>
            <P small muted>
              {booking.status === "cancelled"
                ? "Séance annulée"
                : booking.status === "completed"
                  ? "Séance passée"
                  : "Séance réservée"}
            </P>
          </View>
          <Icon name="arrow" size={18} />
        </Row>
      </Pressable>
      {!thread.messages.length && (
        <P muted style={{ marginVertical: 20 }}>
          Un objectif à préciser ou une question pratique ? Échangez ici.
        </P>
      )}
      {thread.messages.map((m) => {
        const group = dateLabel(m.createdAt),
          heading = group !== previous;
        previous = group;
        const mine = m.who === store.account?.id,
          context = m.context ?? m.booking;
        return (
          <React.Fragment key={m.key}>
            {heading && (
              <P
                small
                muted
                style={{ textAlign: "center", marginVertical: 18 }}
              >
                {group === "Historique"
                  ? "Historique · dates non renseignées"
                  : group}
              </P>
            )}
            <View
              testID={m.id ? `message-${m.id}` : undefined}
              style={{
                backgroundColor: mine ? t.ink : t.fog,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 18,
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "90%",
                marginBottom: 12,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir la séance du message : ${sessionDate(context.day, context.time)}`}
                onPress={() => onBooking(m.booking.id)}
              >
                <P
                  small
                  style={{
                    color: mine ? "#dedede" : t.muted,
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  {m.context ? "À propos de" : "Séance actuelle"} ·{" "}
                  {context.serviceName} ·{" "}
                  {sessionDate(context.day, context.time)}
                </P>
              </Pressable>
              <P style={{ color: mine ? t.white : t.ink, fontSize: 15 }}>
                {m.text}
              </P>
              <P
                small
                style={{
                  color: mine ? "#dedede" : t.muted,
                  fontSize: 11,
                  marginTop: 7,
                }}
              >
                {clock(m.createdAt)}
                {mine
                  ? ` · ${m.readBy?.some((id) => id !== m.who) ? "Lu" : "Envoyé"}`
                  : ""}
              </P>
            </View>
          </React.Fragment>
        );
      })}
      {visiblePending && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            alignSelf: "flex-end",
            maxWidth: "90%",
            backgroundColor: t.fog,
            borderRadius: 18,
            padding: 16,
            marginVertical: 12,
          }}
        >
          {pendingBooking && (
            <P small muted style={{ marginBottom: 8 }}>
              À propos de · {pendingBooking.serviceName} ·{" "}
              {sessionDate(pendingBooking.day, pendingBooking.time)}
            </P>
          )}
          <P>{outgoing.text}</P>
          <P small muted style={{ marginTop: 8 }}>
            {outgoing.status === "sending"
              ? "Envoi en cours…"
              : (outgoing.error ?? "Envoi non confirmé.")}
          </P>
          {outgoing.status === "failed" && (
            <TextButton
              onPress={() =>
                void onSend(outgoing.booking, true).then(onScrollEnd)
              }
            >
              Réessayer l’envoi
            </TextButton>
          )}
        </View>
      )}
      {readError && (
        <TextButton onPress={() => void markRead()}>
          Synchroniser la lecture
        </TextButton>
      )}
      {thread.bookings.length > 1 && (
        <Select
          label="Séance liée au prochain message"
          value={booking.id}
          items={thread.bookings.map((b) => [
            b.id,
            `${b.serviceName} · ${sessionDate(b.day, b.time)}`,
          ])}
          onChange={(id) => onEdit(draft.text, id)}
        />
      )}
      <P small muted style={{ marginTop: 12, marginBottom: 8 }}>
        Votre message
      </P>
      <TextInput
        accessibilityLabel="Votre message"
        value={draft.text}
        onChangeText={(text) => onEdit(text, booking.id)}
        editable={ready}
        multiline
        maxLength={4000}
        placeholder="Écrivez votre message…"
        style={{
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 20,
          padding: 16,
          minHeight: 100,
          fontFamily: t.font,
          fontSize: 16,
          color: t.ink,
          textAlignVertical: "top",
          marginBottom: 14,
        }}
      />
      <Button
        disabled={!ready || !draft.text.trim() || !!outgoing}
        onPress={() => void onSend(booking.id).then(onScrollEnd)}
      >
        Envoyer
      </Button>
      {!!storageError && (
        <P small muted style={{ marginTop: 12 }}>
          {storageError}
        </P>
      )}
      <P small muted style={{ marginTop: 16 }}>
        Votre message reste privé entre vous et {thread.name.split(" ")[0]}, y
        compris pour un cours collectif.
      </P>
    </>
  );
}
