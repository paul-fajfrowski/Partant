import React from "react";
import { Pressable, View } from "react-native";
import { Store, endTime } from "./model";
import { agendaDay, AgendaItem } from "./web-agenda/agendaView";
import { P, Row, Icon } from "./ui";

/** A single chronological feed, using the desktop agenda's read-only projection. */
export function MobileAgendaAppointments({
  store,
  coach,
  day,
  onOpen,
}: {
  store: Store;
  coach: string;
  day: string;
  onOpen: (item: AgendaItem) => void;
}) {
  const agenda = agendaDay(store, coach, day);
  return (
    <View>
      {!agenda.appointments && (
        <P small muted style={{ marginTop: 12 }}>
          Aucune réservation pour le moment.
        </P>
      )}
      {agenda.items.map((item) => {
        const dark = item.kind === "booking" && !item.completed;
        const content = (
          <Row between>
            <View style={{ flex: 1 }}>
              <P small bold style={{ color: dark ? "#fff" : "#141414" }}>
                {item.time}
                {item.duration > 0
                  ? `–${endTime(item.time, item.duration)}`
                  : ""}
                {item.kind === "external"
                  ? " · Hors Partant"
                  : item.kind === "group"
                    ? " · Groupe"
                    : item.completed
                      ? " · Terminée"
                      : ""}
              </P>
              <P
                bold
                style={{ color: dark ? "#fff" : "#141414", marginTop: 5 }}
              >
                {item.title}
              </P>
              <P
                small
                style={{ color: dark ? "#ddd" : "#626262", marginTop: 3 }}
              >
                {item.detail}
              </P>
              {!!item.location && (
                <P
                  small
                  numberOfLines={1}
                  style={{ color: dark ? "#ddd" : "#626262" }}
                >
                  {item.location}
                </P>
              )}
            </View>
            {item.kind !== "calendar" && (
              <Icon
                name="chevron"
                color={dark ? "#fff" : "#141414"}
                size={18}
              />
            )}
          </Row>
        );
        const style = {
          padding: 16,
          marginTop: 12,
          borderRadius: 12,
          backgroundColor: dark ? "#141414" : "#f5f5f3",
        };
        return item.kind === "calendar" ? (
          <View key={`${item.kind}-${item.id}`} style={style}>
            {content}
          </View>
        ) : (
          <Pressable
            key={`${item.kind}-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${item.time} · ${item.title}`}
            onPress={() => onOpen(item)}
            style={style}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
