import React, { useState } from "react";
import { Switch, View } from "react-native";
import { Offer, generatedTimes, today } from "./model";
import type { CoachSettings, Interval } from "./extendedTypes";
import { Button, Dialog, Field, P, Row, Rule, TextButton } from "./ui";

const price = (o: Offer) =>
  `${o.price.toLocaleString("fr-FR")} €${o.kind === "Groupe" ? "/pers." : ""}`;
export function intervalSummary([a, b, ids]: Interval, offers: Offer[]) {
  return `${a}–${b} · ${ids == null ? "Toutes les séances" : ids.map((id) => offers.find((o) => o.id === id)?.name ?? "Offre indisponible").join(", ")}`;
}
export function AvailabilityIntervals({
  list,
  offers,
  settings,
  onChange,
}: {
  list: Interval[];
  offers: Offer[];
  settings: CoachSettings;
  onChange: (list: Interval[]) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
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
                placeholder="HH:mm"
                onChange={(v) => replace(i, [v, b, ids ?? null])}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={`Fin de plage ${i + 1}`}
                value={b}
                placeholder="HH:mm"
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
          {!!a && !!b && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <P small bold>
                Aperçu des départs selon vos réglages
              </P>
              {offers
                .filter(
                  (o) =>
                    o.active &&
                    o.kind !== "Groupe" &&
                    (ids == null || ids.includes(o.id)),
                )
                .map((o) => {
                  const day = today();
                  const times = generatedTimes(
                    { ...settings, exceptions: { [day]: [[a, b, ids]] } },
                    day,
                    o.duration,
                    o.id,
                  );
                  return (
                    <P key={o.id} small muted>
                      {o.name} :{" "}
                      {times.length
                        ? `${times.slice(0, 4).join(" · ")}${times.length > 4 ? "…" : ""}`
                        : "la séance ne tient pas dans cette plage"}
                    </P>
                  );
                })}
              <P small muted>
                Les réservations et indisponibilités retireront les départs
                occupés.
              </P>
            </View>
          )}
          <TextButton onPress={() => onChange(list.filter((_, j) => j !== i))}>
            Retirer la plage {i + 1}
          </TextButton>
          <Rule />
        </View>
      ))}
      <Button light onPress={() => onChange([...list, ["", ""]])}>
        Ajouter une plage
      </Button>
      {!list.length && (
        <P small muted>
          Journée fermée. Ajoutez vos horaires pour l’ouvrir.
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
