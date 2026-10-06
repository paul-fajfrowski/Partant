import React, { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Offer, generatedTimes, today, validateIntervals, mins } from "./model";
import type { CoachSettings, Interval } from "./extendedTypes";
import { Button, Dialog, Field, P, Row, TextButton, Icon, Setting } from "./ui";

const price = (o: Offer) =>
  `${o.price.toLocaleString("fr-FR")} €${o.kind === "Groupe" ? "/pers." : ""}`;
export function intervalSummary(
  [a, b, ids, places]: Interval,
  offers: Offer[],
  locations: CoachSettings["locations"] = {},
) {
  return `${a}–${b} · ${ids == null ? "Toutes les séances" : ids.map((id) => offers.find((o) => o.id === id)?.name ?? "Offre indisponible").join(", ")} · ${places == null ? "Tous les lieux autorisés" : places.map((id) => locations?.[id]?.name ?? "Lieu à vérifier").join(", ")}`;
}
const compact = (values: string[]) =>
  values.length > 2
    ? `${values.slice(0, 2).join(", ")} +${values.length - 2}`
    : values.join(", ");
const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

/** UI-only validation; validateIntervals still checks the complete list on apply/save. */
export function intervalEditorIssue(
  range: Interval,
  list: Interval[],
  index: number | null,
) {
  const [start, end] = range;
  if (!start || !end) return "Renseignez le début et la fin de la plage.";
  if (!validTime(start) || !validTime(end))
    return "Utilisez le format HH:mm, par exemple 09:15.";
  if (mins(end) <= mins(start)) return "La fin doit être après le début.";
  const collision = list.find(
    (r, i) =>
      i !== index &&
      validTime(r[0]) &&
      validTime(r[1]) &&
      mins(start) < mins(r[1]) &&
      mins(r[0]) < mins(end),
  );
  if (collision)
    return `Cette plage chevauche ${collision[0]}–${collision[1]}. Ajustez vos horaires.`;
  if (range[2]?.length === 0) return "Choisissez au moins une séance.";
  if (range[3]?.length === 0) return "Choisissez au moins un lieu.";
  return "";
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
  const [editor, setEditor] = useState<{
    index: number | null;
    range: Interval;
    duplicated?: boolean;
  } | null>(null);
  const [stage, setStage] = useState<"range" | "offers" | "places">("range");
  const [preview, setPreview] = useState(false),
    [removing, setRemoving] = useState(false),
    [discard, setDiscard] = useState(false);
  const [error, setError] = useState("");
  const [original, setOriginal] = useState("");
  const names = (ids: string[] | null | undefined) =>
    ids == null
      ? "Toutes mes séances"
      : compact(
          ids.map(
            (id) =>
              offers.find((o) => o.id === id)?.name ?? "Offre indisponible",
          ),
        );
  const places = (ids: string[] | null | undefined) =>
    ids == null
      ? "Tous les lieux compatibles"
      : compact(
          ids.map((id) => settings.locations?.[id]?.name ?? "Lieu à vérifier"),
        );
  const start = (index: number | null, range: Interval, duplicated = false) => {
    const copy = JSON.parse(JSON.stringify(range)) as Interval;
    setEditor({ index, range: copy, duplicated });
    setOriginal(JSON.stringify(copy));
    setStage("range");
    setPreview(false);
    setRemoving(false);
    setDiscard(false);
    setError("");
  };
  const close = () => {
    if (editor && JSON.stringify(editor.range) !== original) setDiscard(true);
    else setEditor(null);
  };
  const edit = (range: Interval) => {
    if (editor) setEditor({ ...editor, range });
    setError("");
  };
  const issue = editor
    ? intervalEditorIssue(editor.range, list, editor.index)
    : "";
  const sorted = list
    .map((range, index) => ({ range, index }))
    .sort(
      (a, b) =>
        (validTime(a.range[0]) ? mins(a.range[0]) : 9999) -
        (validTime(b.range[0]) ? mins(b.range[0]) : 9999),
    );
  const apply = () => {
    if (!editor) return;
    try {
      if (issue) throw Error(issue);
      const next =
        editor.index === null
          ? [...list, editor.range]
          : list.map((r, i) => (i === editor.index ? editor.range : r));
      onChange(validateIntervals(next));
      setEditor(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <View>
      {sorted.map(({ range, index }) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityLabel={`Modifier la plage ${range[0] || "à compléter"}${range[1] ? `–${range[1]}` : ""}`}
          onPress={() => start(index, range)}
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: "#e7e7e7",
            minHeight: 64,
          }}
        >
          <Row between>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <P bold>
                {range[0] && range[1]
                  ? `${range[0]}–${range[1]}`
                  : "Plage à compléter"}
              </P>
              <P small muted numberOfLines={2} style={{ marginTop: 4 }}>
                {names(range[2])} · {places(range[3])}
              </P>
            </View>
            <Icon name="chevron" size={18} />
          </Row>
        </Pressable>
      ))}
      {!list.length && (
        <P muted style={{ marginVertical: 20 }}>
          Aucune disponibilité. Ajoutez votre première plage.
        </P>
      )}
      <Button
        light
        style={{ marginTop: 16 }}
        onPress={() => start(null, ["", "", null, null])}
      >
        Ajouter une plage
      </Button>
      <Dialog
        onBack={() => {
          if (discard) setDiscard(false);
          else if (removing) setRemoving(false);
          else if (stage !== "range") setStage("range");
          else close();
        }}
        open={!!editor}
        title={
          discard
            ? "Quitter cette modification ?"
            : stage === "offers"
              ? "Séances proposées"
              : stage === "places"
                ? "Lieu de la plage"
                : editor?.duplicated
                  ? "Dupliquer la plage"
                  : editor?.index == null
                    ? "Ajouter une plage"
                    : "Modifier la plage"
        }
        onClose={close}
      >
        {editor &&
          (discard ? (
            <>
              <P>
                Les changements de cette plage n’ont pas été appliqués à la
                journée.
              </P>
              <Button
                style={{ marginTop: 20 }}
                onPress={() => setDiscard(false)}
              >
                Continuer à modifier
              </Button>
              <TextButton
                onPress={() => {
                  setEditor(null);
                  setDiscard(false);
                }}
              >
                Abandonner ces changements
              </TextButton>
            </>
          ) : stage !== "range" ? (
            <>
              <TextButton onPress={() => setStage("range")}>
                Retour à la plage
              </TextButton>
              <Row between style={{ minHeight: 56 }}>
                <P>
                  {stage === "offers" ? "Toutes mes séances" : "Tous mes lieux"}
                </P>
                <Switch
                  accessibilityLabel={
                    stage === "offers" ? "Toutes mes séances" : "Tous mes lieux"
                  }
                  value={editor.range[stage === "offers" ? 2 : 3] == null}
                  onValueChange={(v) => {
                    const r = [...editor.range] as Interval;
                    if (stage === "offers")
                      r[2] = v
                        ? null
                        : offers.filter((o) => o.active).map((o) => o.id);
                    else
                      r[3] = v ? null : Object.keys(settings.locations ?? {});
                    edit(r);
                  }}
                />
              </Row>
              {stage === "offers" ? (
                editor.range[2] == null ? (
                  <P small muted>
                    Inclut les offres actives actuelles et celles que vous
                    créerez.
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
                          {o.duration} min · {price(o)}
                        </P>
                      </View>
                      <Switch
                        accessibilityLabel={`Proposer ${o.name}`}
                        value={editor.range[2]!.includes(o.id)}
                        onValueChange={(v) =>
                          edit([
                            editor.range[0],
                            editor.range[1],
                            v
                              ? [...editor.range[2]!, o.id]
                              : editor.range[2]!.filter((id) => id !== o.id),
                            editor.range[3],
                          ])
                        }
                      />
                    </Row>
                  ))
                )
              ) : editor.range[3] == null ? (
                <P small muted>
                  Seuls les lieux autorisés par chaque séance seront proposés.
                </P>
              ) : (
                Object.entries(settings.locations ?? {}).map(([id, p]) => (
                  <Row key={id} between style={{ minHeight: 68, gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <P bold>{p.name}</P>
                      <P small muted>
                        {p.address || p.sector || p.type}
                      </P>
                    </View>
                    <Switch
                      accessibilityLabel={`Autoriser ${p.name}`}
                      value={editor.range[3]!.includes(id)}
                      onValueChange={(v) =>
                        edit([
                          editor.range[0],
                          editor.range[1],
                          editor.range[2],
                          v
                            ? [...editor.range[3]!, id]
                            : editor.range[3]!.filter((x) => x !== id),
                        ])
                      }
                    />
                  </Row>
                ))
              )}
              <Button
                style={{ marginTop: 20 }}
                onPress={() => setStage("range")}
              >
                Revenir aux horaires
              </Button>
            </>
          ) : (
            <>
              {editor.duplicated && (
                <P small muted style={{ marginBottom: 16 }}>
                  Séances et lieux conservés. Choisissez les nouveaux horaires.
                </P>
              )}
              <Row style={{ alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Début de plage"
                    value={editor.range[0]}
                    placeholder="HH:mm"
                    onChange={(v) =>
                      edit([
                        v,
                        editor.range[1],
                        editor.range[2],
                        editor.range[3],
                      ])
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Fin de plage"
                    value={editor.range[1]}
                    placeholder="HH:mm"
                    onChange={(v) =>
                      edit([
                        editor.range[0],
                        v,
                        editor.range[2],
                        editor.range[3],
                      ])
                    }
                  />
                </View>
              </Row>
              {!!(
                error || (editor.range[0] && editor.range[1] ? issue : "")
              ) && (
                <View
                  accessibilityLiveRegion="polite"
                  style={{ marginBottom: 12 }}
                >
                  <P small style={{ color: "#a32626" }}>
                    {error || issue}
                  </P>
                </View>
              )}
              <Setting
                title="Séances proposées"
                description={names(editor.range[2])}
                onPress={() => setStage("offers")}
              />
              <Setting
                title="Lieu de la plage"
                description={places(editor.range[3])}
                onPress={() => setStage("places")}
              />
              <TextButton onPress={() => setPreview((v) => !v)}>
                {preview
                  ? "Masquer l’aperçu des horaires"
                  : "Voir l’aperçu des horaires"}
              </TextButton>
              {preview && (
                <View style={{ gap: 8, marginVertical: 12 }}>
                  {offers
                    .filter(
                      (o) =>
                        o.active &&
                        (editor.range[2] == null ||
                          editor.range[2].includes(o.id)),
                    )
                    .map((o) => {
                      const times =
                        !issue && o.kind !== "Groupe"
                          ? generatedTimes(
                              {
                                ...settings,
                                exceptions: { [today()]: [editor.range] },
                              },
                              today(),
                              o.duration,
                              o.id,
                            )
                          : [];
                      return (
                        <P key={o.id} small muted>
                          {o.name} · {o.duration} min · {price(o)} :{" "}
                          {o.kind === "Groupe"
                            ? "à programmer dans Mes cours en groupe"
                            : issue
                              ? "complétez les horaires"
                              : times.length
                                ? times.join(" · ")
                                : "durée supérieure à la plage"}
                        </P>
                      );
                    })}
                  <P small muted>
                    À titre indicatif. Les réservations et indisponibilités
                    retireront les départs occupés.
                  </P>
                </View>
              )}
              <Button
                style={{ marginTop: 16 }}
                disabled={!!issue}
                onPress={apply}
              >
                Appliquer à la journée
              </Button>
              <P small muted style={{ marginTop: 8 }}>
                Enregistrez ensuite vos modifications pour les rendre
                disponibles.
              </P>
              {editor.index !== null && (
                <>
                  <TextButton
                    onPress={() =>
                      start(
                        null,
                        ["", "", editor.range[2], editor.range[3]],
                        true,
                      )
                    }
                  >
                    Dupliquer cette plage
                  </TextButton>
                  <TextButton onPress={() => setRemoving((v) => !v)}>
                    Retirer cette plage
                  </TextButton>
                  {removing && (
                    <View>
                      <P small>
                        Les réservations existantes restent confirmées.
                      </P>
                      <TextButton
                        onPress={() => {
                          onChange(list.filter((_, i) => i !== editor.index));
                          setEditor(null);
                        }}
                      >
                        Confirmer le retrait
                      </TextButton>
                    </View>
                  )}
                </>
              )}
            </>
          ))}
      </Dialog>
    </View>
  );
}
