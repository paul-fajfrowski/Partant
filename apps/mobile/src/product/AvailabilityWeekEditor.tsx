import React, { useState } from "react";
import { Platform, Pressable, View, useWindowDimensions } from "react-native";
import type { Offer } from "./model";
import type { CoachSettings, Interval } from "./extendedTypes";
import { AvailabilityIntervals } from "./AvailabilityIntervals";
import { copyDay } from "./agendaTools";
import {
  Button,
  Chip,
  Dialog,
  H2,
  P,
  Row,
  Setting,
  TextButton,
  Icon,
} from "./ui";
const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
export function dayAvailabilitySummary(ranges: Interval[]) {
  if (!ranges.length) return "Aucune disponibilité";
  const valid = ranges.filter(
    (r) => /^\d{2}:\d{2}$/.test(r[0]) && /^\d{2}:\d{2}$/.test(r[1]),
  );
  if (valid.length !== ranges.length)
    return `${ranges.length} plage${ranges.length > 1 ? "s" : ""} · à compléter`;
  return `${ranges.length} plage${ranges.length > 1 ? "s" : ""} · amplitude ${valid.map((r) => r[0]).sort()[0]}–${valid
    .map((r) => r[1])
    .sort()
    .at(-1)}`;
}
export function AvailabilityWeekEditor({
  settings,
  offers,
  onChange,
  onSave,
  onSingleDate,
  showSave = true,
}: {
  settings: CoachSettings;
  offers: Offer[];
  onChange: (week: Interval[][]) => void;
  onSave: () => void;
  onSingleDate: () => void;
  showSave?: boolean;
}) {
  const { width } = useWindowDimensions();
  // Keep the day editor spacious alongside the app and settings navigation.
  const wide = Platform.OS === "web" && width >= 1360;
  const [selected, setSelected] = useState<number | null>(null);
  const [copy, setCopy] = useState(false),
    [targets, setTargets] = useState<number[]>([]),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  const week = (
    <View
      style={
        wide
          ? {
              width: 230,
              borderRightWidth: 1,
              borderColor: "#e7e7e7",
              paddingRight: 20,
            }
          : undefined
      }
    >
      {days.map((day, i) => (
        <Pressable
          key={day}
          accessibilityRole="button"
          accessibilityLabel={`Configurer ${day.toLowerCase()}`}
          accessibilityState={{ selected: selected === i }}
          onPress={() => setSelected(i)}
          style={{
            padding: wide ? 12 : 0,
            paddingVertical: 16,
            marginBottom: 4,
            borderRadius: 16,
            backgroundColor: wide && selected === i ? "#f5f5f3" : "transparent",
          }}
        >
          <Row between>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <P bold>{day}</P>
              <P small muted style={{ marginTop: 5 }}>
                {dayAvailabilitySummary(settings.week[i])}
              </P>
            </View>
            <Icon name="chevron" size={16} />
          </Row>
        </Pressable>
      ))}
    </View>
  );
  const detail =
    selected !== null ? (
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
        {!wide && (
          <TextButton onPress={() => setSelected(null)}>
            Retour à la semaine
          </TextButton>
        )}
        <Row between>
          <H2>{days[selected]}</H2>
          <TextButton
            onPress={() => {
              setCopy(true);
              setTargets([]);
              setConfirm(false);
              setError("");
            }}
          >
            Copier ce jour
          </TextButton>
        </Row>
        <P small muted style={{ marginTop: 4 }}>
          {dayAvailabilitySummary(settings.week[selected])}
        </P>
        <AvailabilityIntervals
          key={selected}
          list={settings.week[selected]}
          offers={offers}
          settings={settings}
          onChange={(ranges) =>
            onChange(settings.week.map((r, i) => (i === selected ? ranges : r)))
          }
        />
      </View>
    ) : (
      <View style={{ flex: 1, paddingTop: 24 }}>
        <H2>Votre semaine, jour par jour.</H2>
        <P muted style={{ marginTop: 12 }}>
          Choisissez un jour pour voir ou modifier ses plages.
        </P>
      </View>
    );
  return (
    <View>
      <H2>Semaine habituelle</H2>
      <P muted small style={{ marginTop: 8, marginBottom: 20 }}>
        Vos horaires se répètent chaque semaine. L’amplitude inclut les
        intervalles entre vos plages.
      </P>
      <View
        style={
          wide
            ? { flexDirection: "row", gap: 28, alignItems: "flex-start" }
            : undefined
        }
      >
        {(wide || selected === null) && week}
        {(wide || selected !== null) && detail}
      </View>
      {showSave && (
        <Button style={{ marginTop: 24 }} onPress={onSave}>
          Enregistrer les modifications
        </Button>
      )}
      <Setting
        title="Modifier une seule date"
        description="Un changement ponctuel sans modifier votre semaine habituelle."
        onPress={onSingleDate}
      />
      <Dialog
        title={
          confirm
            ? "Remplacer ces journées ?"
            : `Copier ${selected === null ? "la journée" : days[selected].toLowerCase()}`
        }
        open={copy}
        onClose={() => setCopy(false)}
      >
        {confirm ? (
          <>
            <P>
              Les horaires, séances et lieux de{" "}
              {targets.map((i) => days[i].toLowerCase()).join(", ")} seront
              remplacés par ceux de{" "}
              {selected === null ? "la journée" : days[selected].toLowerCase()}.
            </P>
            <P small muted style={{ marginTop: 12 }}>
              Les dates particulières et les réservations sont conservées.
            </P>
            <Button
              style={{ marginTop: 20 }}
              onPress={() => {
                try {
                  if (selected === null) return;
                  onChange(copyDay(settings.week, selected, targets));
                  setCopy(false);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Confirmer la copie
            </Button>
            <TextButton onPress={() => setConfirm(false)}>
              Revoir les jours choisis
            </TextButton>
          </>
        ) : (
          <>
            <P small muted>
              Choisissez les jours qui reprendront ces plages, séances et lieux.
            </P>
            <Row wrap style={{ marginVertical: 20 }}>
              {days.map(
                (day, i) =>
                  i !== selected && (
                    <Chip
                      key={day}
                      active={targets.includes(i)}
                      onPress={() =>
                        setTargets(
                          targets.includes(i)
                            ? targets.filter((t) => t !== i)
                            : [...targets, i],
                        )
                      }
                    >
                      {day}
                    </Chip>
                  ),
              )}
            </Row>
            <Button disabled={!targets.length} onPress={() => setConfirm(true)}>
              Continuer la copie
            </Button>
          </>
        )}
        {!!error && (
          <P small style={{ color: "#a32626", marginTop: 12 }}>
            {error}
          </P>
        )}
      </Dialog>
    </View>
  );
}
