import { AvailabilityRangeButton } from "../AvailabilityRange";
import type { RangeSelection } from "../rangeDetailsModel";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Store, addDays, configFor, dayLabel, endTime, today } from "../model";
import { tokens as t } from "../tokens";
import { AgendaItem, agendaDay, weekStart } from "./agendaView";

export type AgendaSection =
  | "schedule"
  | "blocks"
  | "groups"
  | "external"
  | "calendars";
export type DesktopAgendaProps = {
  store: Store;
  coachId: string;
  onBooking: (id: string) => void;
  onGroup: (id: string) => void;
  /** Opens the existing date editor; selecting a day alone never edits it. */
  onDate: (date: string) => void;
  onRange: (selection: RangeSelection) => void;
  onConfigure: (section: AgendaSection) => void;
  onExternal?: (id: string) => void;
  initialDate?: string;
  onSelectedDate?: (day: string) => void;
  onReopen?: (key: string) => void;
  renderDay?: (day: string) => React.ReactNode;
};

const kinds: Record<AgendaItem["kind"], string> = {
  booking: "Séance",
  group: "Groupe",
  external: "Hors Partant",
  block: "Indisponible",
  calendar: "Agenda connecté",
  closed: "Départ fermé",
};
const shortDate = (day: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(day + "T12:00:00Z"));

function Action({
  children,
  onPress,
  primary = false,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        primary && s.primary,
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.actionText, primary && s.white]}>{children}</Text>
    </Pressable>
  );
}

/** Weekly desktop presentation of the same Store and existing editor actions. */
export function DesktopAgenda(props: DesktopAgendaProps) {
  // A coach switch remounts the local navigation without retaining another agenda's date.
  return <CoachAgenda key={props.coachId} {...props} />;
}

function CoachAgenda({
  store,
  coachId,
  onBooking,
  onGroup,
  onDate,
  onRange,
  onConfigure,
  onExternal,
  initialDate,
  onSelectedDate,
  onReopen,
  renderDay,
}: DesktopAgendaProps) {
  const currentDay = today();
  const [selected, setSelected] = useState(initialDate ?? currentDay);
  const [start, setStart] = useState(() =>
    weekStart(initialDate ?? currentDay),
  );
  const [width, setWidth] = useState(840);
  const days = Array.from({ length: 7 }, (_, index) =>
    agendaDay(store, coachId, addDays(start, index)),
  );
  const activeDay = days.find((d) => d.day === selected) ?? days[0];
  const count = days.reduce((sum, d) => sum + d.appointments, 0);
  const config = configFor(store, coachId);
  const calendar = store.calendarStatus?.[coachId];
  const move = (offset: number) => {
    setStart(addDays(start, offset));
    setSelected(addDays(activeDay.day, offset));
    onSelectedDate?.(addDays(activeDay.day, offset));
  };
  const openItem = (item: AgendaItem, day: string) => {
    if (item.kind === "booking") onBooking(item.id);
    else if (item.kind === "group") onGroup(item.id);
    else if (item.kind === "external" && onExternal) onExternal(item.id);
    else if (item.kind === "closed" && onReopen) onReopen(item.id);
    else if (item.kind === "calendar") onConfigure("calendars");
    else if (item.kind === "block") onConfigure("blocks");
    else onDate(day);
  };

  return (
    <View
      style={s.root}
      testID="desktop-agenda"
      onLayout={(event) =>
        setWidth(Math.max(0, event.nativeEvent.layout.width - 56))
      }
    >
      <View style={s.heading}>
        <View style={s.headingCopy}>
          <Text style={s.eyebrow}>VOTRE SEMAINE</Text>
          <Text accessibilityRole="header" style={s.title}>
            Du temps pour chaque mouvement.
          </Text>
          <Text style={s.subtitle}>
            {count} rendez-vous · Horaires de Paris
          </Text>
        </View>
        <View style={s.actions}>
          <Action onPress={() => onConfigure("schedule")}>
            Disponibilités
          </Action>
          <Action primary onPress={() => onConfigure("groups")}>
            + Cours en groupe
          </Action>
        </View>
      </View>

      <View style={s.toolbar}>
        <View style={s.actions}>
          <Action label="Semaine précédente" onPress={() => move(-7)}>
            ‹
          </Action>
          <Action label="Semaine suivante" onPress={() => move(7)}>
            ›
          </Action>
          <Text accessibilityRole="header" style={s.weekLabel}>
            {shortDate(start)} — {shortDate(addDays(start, 6))}{" "}
            {start.slice(0, 4) === addDays(start, 6).slice(0, 4)
              ? start.slice(0, 4)
              : `(${start.slice(0, 4)} / ${addDays(start, 6).slice(0, 4)})`}
          </Text>
        </View>
        <Action
          onPress={() => {
            setStart(weekStart(currentDay));
            setSelected(currentDay);
            onSelectedDate?.(currentDay);
          }}
        >
          Aujourd’hui
        </Action>
      </View>

      {!!(calendar?.error || calendar?.conflicts?.length) && (
        <View style={s.notice}>
          <Text style={s.body}>
            Votre agenda connecté nécessite une vérification.
          </Text>
          <Action onPress={() => onConfigure("calendars")}>
            Vérifier la connexion
          </Action>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={s.calendarScroll}
      >
        <View style={[s.calendar, { width: Math.max(width, 840) }]}>
          {days.map((day, index) => (
            <View
              key={day.day}
              style={[
                s.column,
                index > 0 && s.columnBorder,
                day.day === activeDay.day && s.selectedColumn,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir le ${dayLabel(day.day)}`}
                accessibilityState={{ selected: day.day === activeDay.day }}
                onPress={() => {
                  setSelected(day.day);
                  onSelectedDate?.(day.day);
                }}
                style={s.dayHeader}
              >
                <Text style={s.dayName}>
                  {new Intl.DateTimeFormat("fr-FR", {
                    weekday: "short",
                    timeZone: "Europe/Paris",
                  }).format(new Date(day.day + "T12:00:00Z"))}
                </Text>
                <View
                  style={[s.dayNumber, day.day === currentDay && s.todayNumber]}
                >
                  <Text
                    style={[s.dayNumberText, day.day === currentDay && s.white]}
                  >
                    {Number(day.day.slice(-2))}
                  </Text>
                </View>
                <Text style={s.dayCount}>
                  {day.appointments ? `${day.appointments} RDV` : "Aucun RDV"}
                </Text>
              </Pressable>
              <View style={s.ranges}>
                <Text style={s.rangeLabel}>MES DISPONIBILITÉS</Text>
                {day.ranges.length ? (
                  day.ranges.map((range, i) => (
                    <AvailabilityRangeButton
                      key={i}
                      compact
                      store={store}
                      selection={{ coach: coachId, day: day.day, range }}
                      onPress={() => {
                        setSelected(day.day);
                        onSelectedDate?.(day.day);
                        onRange({ coach: coachId, day: day.day, range });
                      }}
                    />
                  ))
                ) : (
                  <Text style={s.mutedSmall}>Non définies</Text>
                )}
              </View>
              <View style={s.events}>
                <Text style={s.rangeLabel}>MES RENDEZ-VOUS</Text>
                {day.items.length ? (
                  day.items.map((item) => {
                    const dark = item.kind === "booking" && !item.completed;
                    const interactive =
                      item.kind !== "external" || !!onExternal;
                    const content = (
                      <>
                        <Text style={[s.eventTime, dark && s.white]}>
                          {item.time}
                          {item.duration > 0
                            ? `–${endTime(item.time, item.duration)}`
                            : ""}
                        </Text>
                        <Text style={[s.eventKind, dark && s.light]}>
                          {item.completed ? "Terminée" : kinds[item.kind]}
                        </Text>
                        <Text style={[s.eventTitle, dark && s.white]}>
                          {item.title}
                        </Text>
                        <Text style={[s.eventDetail, dark && s.light]}>
                          {item.detail}
                        </Text>
                        {!!item.location && (
                          <Text
                            numberOfLines={2}
                            style={[s.eventLocation, dark && s.light]}
                          >
                            {item.location}
                          </Text>
                        )}
                      </>
                    );
                    return interactive ? (
                      <Pressable
                        key={`${item.kind}-${item.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={
                          item.kind === "closed"
                            ? `Rouvrir ${dayLabel(day.day)} à ${item.time}`
                            : `${dayLabel(day.day)}, ${item.time}, ${kinds[item.kind]}, ${item.title}, ${item.detail}`
                        }
                        onPress={() => openItem(item, day.day)}
                        style={({ pressed }) => [
                          s.event,
                          dark && s.darkEvent,
                          item.kind === "group" && s.groupEvent,
                          pressed && s.pressed,
                        ]}
                      >
                        {content}
                      </Pressable>
                    ) : (
                      <View key={`${item.kind}-${item.id}`} style={s.event}>
                        {content}
                      </View>
                    );
                  })
                ) : (
                  <Text style={s.emptyDay}>
                    Aucune réservation pour le moment.
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.detail}>
        <View style={s.detailCopy}>
          <Text accessibilityRole="header" style={s.detailTitle}>
            {dayLabel(activeDay.day)}
          </Text>
          <Text style={s.body}>
            {activeDay.exception
              ? "Horaires spécifiques à cette date."
              : "Horaires issus de votre semaine habituelle."}
            {!activeDay.ranges.length ? " Aucun horaire ouvert." : ""}
          </Text>
          <Text style={s.hint}>
            Les plages indiquent vos horaires configurés. Les réservations
            tiennent aussi compte de vos offres, des occupations et de vos
            règles.
          </Text>
        </View>
        <Action onPress={() => onDate(activeDay.day)}>
          Modifier cette date
        </Action>
      </View>
      {renderDay?.(activeDay.day)}
      <View style={s.footer}>
        <View style={s.actions}>
          <Action onPress={() => onConfigure("external")}>
            + Rendez-vous direct
          </Action>
          <Action onPress={() => onConfigure("blocks")}>
            + Indisponibilité
          </Action>
          <Action onPress={() => onConfigure("calendars")}>
            Agendas connectés
          </Action>
        </View>
        {!config.published && (
          <Text style={s.hint}>Votre profil n’est pas publié.</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 22, width: "100%", padding: 28 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 20,
  },
  headingCopy: { flexGrow: 1, flexShrink: 1, gap: 8 },
  eyebrow: {
    fontFamily: t.medium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: t.muted,
  },
  title: { fontFamily: t.bold, fontSize: 28, lineHeight: 33, color: t.ink },
  subtitle: { fontFamily: t.font, fontSize: 14, color: t.muted },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  action: {
    minHeight: 42,
    minWidth: 42,
    borderRadius: 99,
    paddingHorizontal: 17,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.white,
    borderWidth: 1,
    borderColor: t.border,
  },
  actionText: { fontFamily: t.medium, fontSize: 13, color: t.ink },
  primary: { backgroundColor: t.ink, borderColor: t.ink },
  pressed: { opacity: 0.65 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  weekLabel: {
    fontFamily: t.medium,
    fontSize: 17,
    color: t.ink,
    marginLeft: 7,
  },
  notice: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: t.fog,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  calendarScroll: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.white,
  },
  calendar: { flexDirection: "row", minHeight: 425 },
  column: { flex: 1, minWidth: 0, backgroundColor: t.white },
  columnBorder: { borderLeftWidth: 1, borderColor: t.border },
  selectedColumn: { backgroundColor: "#fafafa" },
  dayHeader: {
    alignItems: "center",
    paddingVertical: 15,
    gap: 6,
    borderBottomWidth: 1,
    borderColor: t.border,
  },
  dayName: {
    fontFamily: t.medium,
    color: t.muted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  todayNumber: { backgroundColor: t.ink },
  dayNumberText: { fontFamily: t.bold, fontSize: 22, color: t.ink },
  dayCount: { fontFamily: t.font, color: t.muted, fontSize: 11 },
  ranges: {
    padding: 10,
    minHeight: 79,
    gap: 4,
    borderBottomWidth: 1,
    borderColor: t.border,
  },
  rangeLabel: {
    fontFamily: t.medium,
    color: t.muted,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.4,
  },
  rangeTime: {
    fontFamily: t.medium,
    color: t.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  mutedSmall: {
    fontFamily: t.font,
    color: t.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  events: { padding: 8, gap: 8 },
  event: {
    borderRadius: 11,
    padding: 10,
    gap: 5,
    backgroundColor: t.fog,
    borderWidth: 1,
    borderColor: "transparent",
  },
  darkEvent: { backgroundColor: t.ink },
  groupEvent: { backgroundColor: t.white, borderColor: "#bfbfbf" },
  eventTime: { fontFamily: t.bold, color: t.ink, fontSize: 12, lineHeight: 17 },
  eventKind: {
    fontFamily: t.medium,
    color: t.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  eventTitle: {
    fontFamily: t.bold,
    color: t.ink,
    fontSize: 13,
    lineHeight: 17,
  },
  eventDetail: {
    fontFamily: t.font,
    color: t.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  eventLocation: {
    fontFamily: t.font,
    color: t.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  emptyDay: {
    fontFamily: t.font,
    color: t.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  detail: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: 22,
    backgroundColor: t.fog,
    borderRadius: 18,
  },
  detailCopy: { flex: 1, minWidth: 240, gap: 7 },
  detailTitle: { fontFamily: t.bold, fontSize: 18, color: t.ink },
  body: { fontFamily: t.font, fontSize: 14, lineHeight: 20, color: t.ink },
  hint: { fontFamily: t.font, fontSize: 12, lineHeight: 18, color: t.muted },
  footer: { gap: 14 },
  white: { color: t.white },
  light: { color: "#dedede" },
});
