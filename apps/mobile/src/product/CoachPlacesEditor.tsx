import React, { useState } from "react";
import { View } from "react-native";
import type { CoachLocation } from "./extendedTypes";
import {
  Button,
  Chip,
  Field,
  H2,
  Note,
  P,
  Row,
  Select,
  Setting,
  TextButton,
} from "./ui";
import { uid } from "./workflows";
import { placeTypes, suggestedPlaces } from "./locations";
export function CoachPlacesEditor({
  sport,
  locations,
  onChange,
  onSave,
}: {
  sport: string;
  locations: Record<string, CoachLocation>;
  onChange: (p: Record<string, CoachLocation>) => void;
  onSave: () => void;
}) {
  const [selected, setSelected] = useState(Object.keys(locations)[0] ?? ""),
    [type, setType] = useState(suggestedPlaces(sport)[0]),
    [removing, setRemoving] = useState(false);
  const p = locations[selected];
  const update = (patch: Partial<CoachLocation>) =>
    onChange({ ...locations, [selected]: { ...p, ...patch } });
  const add = (kind: string) => {
    const id = ["Domicile", "Visio"].includes(kind) ? kind : "place:" + uid();
    if (!locations[id])
      onChange({
        ...locations,
        [id]: {
          type: kind,
          name:
            kind === "Domicile"
              ? "Chez le client"
              : kind === "Visio"
                ? "En visioconférence"
                : "",
          address: "",
          instructions: "",
          ...(kind === "Domicile"
            ? { sector: "", radius: 3, travelFee: 0 }
            : {}),
        },
      });
    setSelected(id);
    setRemoving(false);
  };
  return (
    <>
      <H2>Vos lieux de séance</H2>
      <P muted style={{ marginVertical: 16 }}>
        Enregistrez les lieux où vous exercez, puis associez-les à vos séances
        et tarifs.
      </P>
      {Object.entries(locations).map(([id, l]) => (
        <Setting
          key={id}
          title={l.name || `Nouveau lieu · ${l.type}`}
          description={
            l.type === "Domicile"
              ? `${l.sector || "Secteur à préciser"} · chez le client`
              : `${l.type}${l.address ? " · " + l.address : ""}`
          }
          onPress={() => {
            setSelected(id);
            setRemoving(false);
          }}
        />
      ))}
      {p && (
        <View style={{ marginTop: 24 }}>
          <H2>{p.type}</H2>
          <Field
            label={
              p.type === "Domicile"
                ? "Nom de cette zone de déplacement"
                : p.type === "Visio"
                  ? "Nom du format à distance"
                  : "Nom du lieu"
            }
            value={p.name}
            onChange={(name) => update({ name })}
          />
          {p.type === "Domicile" ? (
            <>
              <Field
                label="Secteur de déplacement"
                placeholder="Paris 11e et communes voisines"
                value={p.sector ?? ""}
                onChange={(sector) => update({ sector })}
              />
              <Field
                label="Rayon de déplacement à domicile (km)"
                numeric
                value={String(p.radius ?? 3)}
                onChange={(v) =>
                  update({ radius: Number(v.replace(",", ".")) })
                }
              />
              <Field
                label="Supplément déplacement à domicile (€)"
                numeric
                value={String(p.travelFee ?? 0)}
                onChange={(v) =>
                  update({ travelFee: Number(v.replace(",", ".")) })
                }
              />
              <P small muted>
                Le client renseignera son adresse pendant la réservation. Le
                supplément apparaîtra avant confirmation. Le rayon est indicatif
                dans la simulation.
              </P>
            </>
          ) : p.type === "Visio" ? (
            <P small muted>
              Précisez l’outil utilisé. Le lien de rendez-vous sera partagé dans
              la conversation.
            </P>
          ) : (
            <Field
              label="Adresse du lieu"
              placeholder="Numéro, rue, code postal et ville"
              value={p.address}
              onChange={(address) => update({ address })}
            />
          )}
          <Field
            label={
              p.type === "Visio"
                ? "Consignes pour la visioconférence"
                : "Accès et consignes"
            }
            placeholder={
              p.type === "Salle de musculation"
                ? "Entrée, point de rendez-vous, abonnement ou droit d’accès nécessaire…"
                : "Point de rendez-vous, équipement, conditions d’accès…"
            }
            value={p.instructions}
            onChange={(instructions) => update({ instructions })}
            multiline
          />
          <TextButton onPress={() => setRemoving(true)}>
            Retirer ce lieu
          </TextButton>
          {removing && (
            <Note>
              <P>
                Retirer ce lieu des nouvelles réservations ? Les séances déjà
                confirmées conservent leur adresse.
              </P>
              <Button
                onPress={() => {
                  const next = { ...locations };
                  delete next[selected];
                  onChange(next);
                  setSelected(Object.keys(next)[0] ?? "");
                  setRemoving(false);
                }}
              >
                Confirmer le retrait du lieu
              </Button>
              <TextButton onPress={() => setRemoving(false)}>
                Conserver ce lieu
              </TextButton>
            </Note>
          )}
        </View>
      )}
      <H2 style={{ marginTop: 28, marginBottom: 12 }}>Ajouter un lieu</H2>
      <P small muted>
        Suggestions pour votre spécialité · tous les types restent disponibles.
      </P>
      <Row wrap style={{ marginVertical: 16 }}>
        {suggestedPlaces(sport).map((t) => (
          <Chip key={t} onPress={() => add(t)}>
            + {t}
          </Chip>
        ))}
      </Row>
      <Select
        label="Type de lieu"
        value={type}
        items={placeTypes}
        onChange={setType}
      />
      <Button light onPress={() => add(type)}>
        Ajouter ce type de lieu
      </Button>
      <Button style={{ marginTop: 24 }} onPress={onSave}>
        Enregistrer les lieux
      </Button>
    </>
  );
}
