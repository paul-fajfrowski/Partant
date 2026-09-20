import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { H2, P, Row, Icon, TextButton } from "./ui";
import { tokens as t } from "./tokens";
import type { Store } from "./model";
import { noticeKind } from "./noticeEvents";
import {
  notificationRows,
  notificationWindow,
  NOTIFICATION_PAGE_SIZE,
  notificationChapters,
  notificationGroup,
  notificationTime,
  type NotificationRow,
} from "./notifications";
export function NotificationsScreen({
  store,
  onOpen,
  busy,
  expanded,
  onExpand,
  limits,
  onLimit,
  actionsOnly,
  onModeChange,
}: {
  store: Store;
  onOpen: (row: NotificationRow) => void;
  busy: boolean;
  expanded: string | null;
  onExpand: (id: string | null) => void;
  limits: Record<string, number>;
  onLimit: (key: string, count: number) => void;
  actionsOnly: boolean;
  onModeChange: (active: boolean, firstChapter: string | null) => void;
}) {
  const allChapters = notificationChapters(store);
  const actionCount = allChapters.reduce((n, c) => n + c.actions, 0);
  const chapters = actionsOnly
    ? allChapters.filter((c) => c.actions > 0)
    : allChapters;
  return (
    <>
      {actionCount > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: actionsOnly }}
          accessibilityLabel={`${actionCount} action${actionCount > 1 ? "s" : ""} à traiter`}
          testID="pending-actions"
          onPress={() =>
            onModeChange(
              !actionsOnly,
              allChapters.find((c) => c.actions > 0)?.id ?? null,
            )
          }
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            maxWidth: "100%",
            minHeight: t.touch,
            justifyContent: "center",
            backgroundColor: actionsOnly ? t.ink : t.white,
            borderWidth: 1,
            borderColor: actionsOnly ? t.ink : t.muted,
            borderRadius: t.pill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginBottom: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <P small bold style={{ color: actionsOnly ? t.white : t.ink }}>
            {actionCount} action{actionCount > 1 ? "s" : ""} à traiter
          </P>
        </Pressable>
      )}
      {actionsOnly && (
        <TextButton onPress={() => onModeChange(false, null)}>
          Toutes les notifications
        </TextButton>
      )}
      {!chapters.length && (
        <View style={{ paddingVertical: 30 }}>
          <H2>{actionsOnly ? "Tout est traité." : "Tout est à jour."}</H2>
          <P muted style={{ marginTop: 10 }}>
            {actionsOnly
              ? "Retrouvez les événements dans l’historique."
              : "Vos réservations et leurs changements apparaîtront ici."}
          </P>
        </View>
      )}
      {chapters.map((chapter) => {
        const open = expanded === chapter.id;
        const pageKey = `${actionsOnly ? "actions" : "all"}:${chapter.id}`;
        const page = notificationWindow(chapter, limits[pageKey], actionsOnly);
        let previous = "";
        return (
          <View key={chapter.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={chapter.title}
              accessibilityState={{ expanded: open }}
              testID={`notification-chapter-${chapter.id}`}
              onPress={() => onExpand(open ? null : chapter.id)}
              style={({ pressed }) => ({
                paddingVertical: 22,
                borderBottomWidth: 1,
                borderBottomColor: t.border,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Row between style={{ gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <H2 style={{ fontSize: 18 }}>{chapter.title}</H2>
                  <P small muted style={{ marginTop: 6 }}>
                    {chapter.rows.length} notification
                    {chapter.rows.length > 1 ? "s" : ""}
                    {chapter.unread
                      ? ` · ${chapter.unread} non lue${chapter.unread > 1 ? "s" : ""}`
                      : ""}
                    {chapter.actions ? ` · ${chapter.actions} à traiter` : ""}
                  </P>
                </View>
                <View
                  style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
                >
                  <Icon name="down" size={18} />
                </View>
              </Row>
            </Pressable>
            {open && (
              <View style={{ paddingLeft: 10 }}>
                {page.rows.map((row) => {
                  const day = notificationGroup(row.notice),
                    heading = day !== previous;
                  previous = day;
                  return (
                    <View key={row.notice.id}>
                      {heading && (
                        <P
                          small
                          muted
                          style={{ marginTop: 20, marginBottom: 4 }}
                        >
                          {day}
                        </P>
                      )}
                      <Pressable
                        testID={`notification-${row.notice.id}`}
                        disabled={busy}
                        accessibilityRole="button"
                        accessibilityLabel={`${row.notice.read ? "" : "Non lue. "}${row.title}. ${row.person}. ${row.session}. ${row.label}`}
                        onPress={() => onOpen(row)}
                        style={({ pressed }) => ({
                          paddingVertical: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: t.border,
                          opacity: pressed ? 0.65 : 1,
                        })}
                      >
                        <Row
                          between
                          style={{ gap: 10, alignItems: "flex-start" }}
                        >
                          <P
                            bold={!row.notice.read}
                            style={{ flex: 1, fontSize: 16 }}
                          >
                            {row.person || row.title}
                          </P>
                          {!row.notice.read && (
                            <View
                              accessibilityElementsHidden
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 4,
                                backgroundColor: t.ink,
                                marginTop: 7,
                              }}
                            />
                          )}
                        </Row>
                        {!!row.session && (
                          <P small muted style={{ marginTop: 5 }}>
                            {row.session}
                          </P>
                        )}
                        {row.detail.map((line, i) => (
                          <P key={i} small style={{ marginTop: 6 }}>
                            {line}
                          </P>
                        ))}
                        {!!row.outcome && (
                          <P small bold style={{ marginTop: 7 }}>
                            {row.outcome}
                          </P>
                        )}
                        <P small muted style={{ marginTop: 9, fontSize: 11 }}>
                          {notificationTime(row.notice)}
                        </P>
                        <Row style={{ marginTop: 10, gap: 8 }}>
                          <P small bold>
                            {row.label}
                          </P>
                          <Icon name="arrow" size={14} />
                        </Row>
                      </Pressable>
                    </View>
                  );
                })}
                <P small muted style={{ marginTop: 14 }}>
                  {page.rows.length} sur {page.total}
                  {actionsOnly ? " actions en attente" : " notifications"}
                </P>
                {page.remaining > 0 && (
                  <TextButton
                    onPress={() =>
                      onLimit(
                        pageKey,
                        page.rows.length + NOTIFICATION_PAGE_SIZE,
                      )
                    }
                  >
                    Voir les précédents
                  </TextButton>
                )}
                {page.rows.length > NOTIFICATION_PAGE_SIZE && (
                  <TextButton
                    onPress={() => onLimit(pageKey, NOTIFICATION_PAGE_SIZE)}
                  >
                    Réduire l’historique
                  </TextButton>
                )}
              </View>
            )}
          </View>
        );
      })}
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
