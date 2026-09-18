import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Chip, H2, P, Row, Icon, TextButton } from "./ui";
import { tokens as t } from "./tokens";
import type { Store } from "./model";
import { noticeKind } from "./noticeEvents";
import {
  notificationRows,
  notificationGroup,
  notificationTime,
  type NotificationRow,
} from "./notifications";
export function NotificationsScreen({
  store,
  onOpen,
  busy,
}: {
  store: Store;
  onOpen: (row: NotificationRow) => void;
  busy: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "action">("all");
  const rows = notificationRows(store),
    actions = rows.filter((r) => r.actionable);
  const shown = filter === "action" ? actions : rows;
  const groups = new Map<string, NotificationRow[]>();
  for (const row of shown) {
    const label = notificationGroup(row.notice);
    groups.set(label, [...(groups.get(label) ?? []), row]);
  }
  return (
    <>
      <H2>Votre activité, au fil du temps.</H2>
      <P muted style={{ marginTop: 10, marginBottom: 20 }}>
        Les informations utiles et les réponses attendues, au même endroit.
      </P>
      <Row style={{ gap: 8, marginBottom: 24 }}>
        <Chip active={filter === "all"} onPress={() => setFilter("all")}>
          Tout
        </Chip>
        <Chip active={filter === "action"} onPress={() => setFilter("action")}>
          À traiter{actions.length ? ` · ${actions.length}` : ""}
        </Chip>
      </Row>
      {!shown.length && (
        <View style={{ paddingVertical: 36 }}>
          <H2>
            {filter === "action"
              ? "Aucune action en attente."
              : "Tout est à jour."}
          </H2>
          <P muted style={{ marginTop: 10 }}>
            {filter === "action"
              ? "Vos informations restent accessibles dans « Tout »."
              : "Vos réservations et leurs changements apparaîtront ici."}
          </P>
        </View>
      )}
      {[...groups].map(([label, entries]) => (
        <View key={label}>
          <H2 style={{ fontSize: 16, marginTop: 10, marginBottom: 6 }}>
            {label}
          </H2>
          {entries.map((row) => (
            <Pressable
              key={row.notice.id}
              testID={`notification-${row.notice.id}`}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`${row.notice.read ? "" : "Non lue. "}${row.title}. ${row.person}. ${row.session}. ${row.label}`}
              onPress={() => onOpen(row)}
              style={({ pressed }) => ({
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderBottomColor: t.border,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Row between style={{ alignItems: "flex-start", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <P bold={!row.notice.read} style={{ fontSize: 17 }}>
                    {row.title}
                  </P>
                </View>
                {!row.notice.read && (
                  <View
                    accessibilityElementsHidden
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: t.ink,
                      marginTop: 8,
                    }}
                  />
                )}
              </Row>
              {!!row.person && (
                <P bold style={{ marginTop: 7 }}>
                  {row.person}
                </P>
              )}
              {!!row.session && (
                <P small muted style={{ marginTop: 4 }}>
                  {row.session}
                </P>
              )}
              {row.detail.map((line, i) => (
                <P key={i} small style={{ marginTop: 7 }}>
                  {line}
                </P>
              ))}
              {!!row.outcome && (
                <P small bold style={{ marginTop: 9 }}>
                  {row.outcome}
                </P>
              )}
              <P small muted style={{ marginTop: 10, fontSize: 11 }}>
                {notificationTime(row.notice)} · heure de Paris
              </P>
              <Row style={{ marginTop: 12, gap: 8 }}>
                <Icon name={row.icon} size={15} />
                <P small bold>
                  {row.label}
                </P>
                <Icon name="arrow" size={14} />
              </Row>
            </Pressable>
          ))}
        </View>
      ))}
    </>
  );
}
export function BookingNotificationHistory({
  store,
  booking,
}: {
  store: Store;
  booking: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const changes = store.bookings.find((b) => b.id === booking)?.changes ?? [];
  const events = notificationRows(store).filter(
    (r) =>
      r.notice.booking === booking &&
      !["message", "reminder"].includes(noticeKind(r.notice)),
  );
  if (!events.length && !changes.length) return null;
  return (
    <>
      <H2 style={{ marginTop: 24, marginBottom: 14 }}>
        Événements de la séance
      </H2>
      {events.map((row) => (
        <View
          key={row.notice.id}
          style={{
            borderLeftWidth: 1,
            borderLeftColor: t.border,
            paddingLeft: 15,
            paddingBottom: 18,
          }}
        >
          <P bold>{row.title}</P>
          {!!row.session && (
            <P small style={{ marginTop: 5 }}>
              {row.session}
            </P>
          )}
          <P small muted style={{ marginTop: 4 }}>
            {notificationTime(row.notice)}
          </P>
          {row.detail.map((line, i) => (
            <P small key={i} style={{ marginTop: 5 }}>
              {line}
            </P>
          ))}
          {!!row.outcome && (
            <P small style={{ marginTop: 5 }}>
              {row.outcome}
            </P>
          )}
        </View>
      ))}
      {!!changes.length && (
        <>
          <TextButton onPress={() => setShowDetails(!showDetails)}>
            {showDetails
              ? "Masquer les détails des opérations"
              : "Détails des opérations"}
          </TextButton>
          {showDetails &&
            changes.map((text, i) => (
              <P small key={i} style={{ marginBottom: 12 }}>
                {text}
              </P>
            ))}
        </>
      )}
    </>
  );
}
