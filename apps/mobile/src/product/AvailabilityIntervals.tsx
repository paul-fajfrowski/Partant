import React, { useState } from "react";
import { Switch, View } from "react-native";
import { Offer, generatedTimes, today } from "./model";
import type { CoachSettings, Interval } from "./extendedTypes";
import { Button, Dialog, Field, P, Row, Rule, TextButton } from "./ui";

const price = (o: Offer) =>
  `${o.price.toLocaleString("fr-FR")} €${o.kind === "Groupe" ? "/pers." : ""}`;
export function intervalSummary(
  [a, b, ids, places]: Interval,
  offers: Offer[],
  locations: CoachSettings["locations"] = {},
) {
  return `${a}–${b} · ${ids == null ? "Toutes les séances" : ids.map((id) => offers.find((o) => o.id === id)?.name ?? "Offre indisponible").join(", ")} · ${places == null ? "Tous les lieux autorisés" : places.map((id) => locations?.[id]?.name ?? "Lieu à vérifier").join(", ")}`;
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
  const [placeEditing, setPlaceEditing] = useState<number | null>(null);
  const [placeSelection, setPlaceSelection] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
  const replace = (index: number, value: Interval) =>
    onChange(list.map((range, i) => (i === index ? value : range)));
  return (
    <View style={{ gap: 10 }}>
      {list.map(([a, b, ids, places], i) => (
        <View key={i}>
          <Row style={{ alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Field
                label={`Début de plage ${i + 1}`}
                value={a}
                placeholder="HH:mm"
                onChange={(v) => replace(i, [v, b, ids ?? null, places])}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={`Fin de plage ${i + 1}`}
                value={b}
                placeholder="HH:mm"
                onChange={(v) => replace(i, [a, v, ids ?? null, places])}
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
          <Button
            light
            style={{ marginTop: 12 }}
            onPress={() => {
              setPlaceSelection(places == null ? null : [...places]);
              setPlaceEditing(i);
            }}
          >
            Lieux de la plage {i + 1}
          </Button>
          <P small muted style={{ marginTop: 8 }}>
            {places == null
              ? "Tous les lieux autorisés par la séance."
              : places
                  .map(
                    (id) => settings.locations?.[id]?.name ?? "Lieu à vérifier",
                  )
                  .join(" · ")}
          </P>
          {!!a && !!b && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <P small bold>
                Séances possibles dans cette plage
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
                    {
                      ...settings,
                      exceptions: { [day]: [[a, b, ids, places]] },
                    },
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
        open={placeEditing !== null}
        title="Où êtes-vous sur cette plage ?"
        onClose={() => setPlaceEditing(null)}
      >
        <P muted>
          Exemple : votre salle le matin, la piste le soir. Le client verra
          uniquement les lieux compatibles avec sa séance et son horaire.
        </P>
        <Row between style={{ minHeight: 64 }}>
          <P>Tous mes lieux</P>
          <Switch
            accessibilityLabel="Tous mes lieux"
            value={placeSelection === null}
            onValueChange={(v) =>
              setPlaceSelection(
                v ? null : Object.keys(settings.locations ?? {}),
              )
            }
          />
        </Row>
        {placeSelection !== null &&
          Object.entries(settings.locations ?? {}).map(([id, place]) => (
            <Row key={id} between style={{ minHeight: 64 }}>
              <View style={{ flex: 1 }}>
                <P bold>{place.name}</P>
                <P small muted>
                  {place.address || place.sector || place.type}
                </P>
              </View>
              <Switch
                accessibilityLabel={`Autoriser ${place.name}`}
                value={placeSelection.includes(id)}
                onValueChange={(v) =>
                  setPlaceSelection(
                    v
                      ? [...placeSelection, id]
                      : placeSelection.filter((x) => x !== id),
                  )
                }
              />
            </Row>
          ))}
        {!Object.keys(settings.locations ?? {}).length && (
          <P small muted>
            Configurez d’abord vos lieux dans Lieux & déplacements.
          </P>
        )}
        <Button
          disabled={placeSelection?.length === 0}
          onPress={() => {
            if (placeEditing !== null && list[placeEditing]) {
              const [a, b, ids] = list[placeEditing];
              replace(placeEditing, [a, b, ids, placeSelection]);
              setPlaceEditing(null);
            }
          }}
        >
          Appliquer les lieux
        </Button>
      </Dialog>
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
              replace(editing, [
                list[editing][0],
                list[editing][1],
                selection,
                list[editing][3],
              ]);
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
