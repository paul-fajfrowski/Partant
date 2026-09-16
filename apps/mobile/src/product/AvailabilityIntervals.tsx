import React, { useState } from "react";
import { Switch, View } from "react-native";
import { Offer, endTime, mins } from "./model";
import type { Interval } from "./extendedTypes";
import { Button, Dialog, Field, P, Row, Rule, TextButton } from "./ui";

const price = (o: Offer) =>
  `${o.price.toLocaleString("fr-FR")} €${o.kind === "Groupe" ? "/pers." : ""}`;
export function intervalSummary([a, b, ids]: Interval, offers: Offer[]) {
  return `${a}–${b} · ${ids == null ? "Toutes les séances" : ids.map((id) => offers.find((o) => o.id === id)?.name ?? "Offre indisponible").join(", ")}`;
}
function nextRange(list: Interval[]): Interval | null {
  const valid = list
    .filter(([a, b]) => Number.isFinite(mins(a)) && mins(b) > mins(a))
    .sort((a, b) => mins(a[0]) - mins(b[0]));
  const start = valid.length ? mins(valid[valid.length - 1][1]) : 9 * 60;
  if (start + 30 <= 1439)
    return [
      endTime("00:00", start),
      endTime("00:00", Math.min(start + 60, 1439)),
    ];
  let cursor = 0;
  for (const [a, b] of valid) {
    if (mins(a) - cursor >= 30)
      return [
        endTime("00:00", cursor),
        endTime("00:00", Math.min(cursor + 60, mins(a))),
      ];
    cursor = Math.max(cursor, mins(b));
  }
  return null;
}
export function AvailabilityIntervals({
  list,
  offers,
  onChange,
}: {
  list: Interval[];
  offers: Offer[];
  onChange: (list: Interval[]) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
  const next = nextRange(list);
  const replace = (index: number, value: Interval) =>
    onChange(list.map((range, i) => (i === index ? value : range)));
  return (
    <View style={{ gap: 10 }}>
      {list.map(([a, b, ids], i) => (
        <View key={i}>
          <Row style={{ alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Field
                label={`Début de plage ${i + 1}`}
                value={a}
                onChange={(v) => replace(i, [v, b, ids ?? null])}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={`Fin de plage ${i + 1}`}
                value={b}
                onChange={(v) => replace(i, [a, v, ids ?? null])}
              />
            </View>
          </Row>
          <Button
            light
            onPress={() => {
              setSelection(ids == null ? null : [...ids]);
              setEditing(i);
            }}
          >
            Séances de la plage {i + 1}
          </Button>
          <P small muted style={{ marginTop: 8 }}>
            {ids == null
              ? "Toutes vos séances, à leurs tarifs respectifs."
              : ids
                  .map((id) => {
                    const o = offers.find((x) => x.id === id);
                    return o
                      ? `${o.name} · ${o.duration} min · ${price(o)}${o.active ? "" : " · en pause"}`
                      : "Offre indisponible";
                  })
                  .join("\n")}
          </P>
          <TextButton onPress={() => onChange(list.filter((_, j) => j !== i))}>
            Retirer la plage {i + 1}
          </TextButton>
          <Rule />
        </View>
      ))}
      <Button
        light
        disabled={!next}
        onPress={() => {
          if (next) onChange([...list, next]);
        }}
      >
        Ajouter une plage
      </Button>
      {!list.length && (
        <P small muted>
          Journée fermée.
        </P>
      )}
      {!next && (
        <P small muted>
          La journée est entièrement couverte. Ajustez une plage existante.
        </P>
      )}
      <Dialog
        open={editing !== null}
        title="Quelles séances proposer ?"
        onClose={() => setEditing(null)}
      >
        <P muted>
          Chaque séance conserve sa durée et son prix. Une réservation bloque le
          coach pour toutes ses offres pendant ce temps.
        </P>
        <Row between style={{ minHeight: 64 }}>
          <P style={{ flex: 1 }}>Toutes mes séances</P>
          <Switch
            accessibilityLabel="Toutes mes séances"
            value={selection === null}
            onValueChange={(v) =>
              setSelection(
                v ? null : offers.filter((o) => o.active).map((o) => o.id),
              )
            }
            trackColor={{ false: "#ddd", true: "#141414" }}
            thumbColor="#fff"
          />
        </Row>
        {selection === null ? (
          <P small muted>
            Inclut aussi les séances que vous créerez plus tard.
          </P>
        ) : (
          offers.map((o) => (
            <Row key={o.id} between style={{ minHeight: 68, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <P bold>
                  {o.name}
                  {!o.active ? " · en pause" : ""}
                </P>
                <P small muted>
                  {o.kind} · {o.duration} min · {price(o)}
                </P>
              </View>
              <Switch
                accessibilityLabel={`Proposer ${o.name}`}
                value={selection.includes(o.id)}
                onValueChange={(v) =>
                  setSelection(
                    v
                      ? [...selection, o.id]
                      : selection.filter((id) => id !== o.id),
                  )
                }
                trackColor={{ false: "#ddd", true: "#141414" }}
                thumbColor="#fff"
              />
            </Row>
          ))
        )}
        {!offers.length && (
          <P small muted style={{ marginTop: 12 }}>
            Créez d’abord vos offres dans Séances & tarifs.
          </P>
        )}
        {selection?.length === 0 && (
          <P small muted>
            Choisissez au moins une séance.
          </P>
        )}
        <Button
          style={{ marginTop: 20 }}
          disabled={selection?.length === 0}
          onPress={() => {
            if (editing !== null && list[editing]) {
              replace(editing, [list[editing][0], list[editing][1], selection]);
              setEditing(null);
            }
          }}
        >
          Appliquer à cette plage
        </Button>
      </Dialog>
    </View>
  );
}
