import { useLocalBack } from "./BackNavigation";
import React, { useState } from "react";
import { View } from "react-native";
import { FlowProps, euro } from "./CoachConfiguration";
import {
  H1,
  H2,
  P,
  Field,
  Select,
  Button,
  TextButton,
  Note,
  Setting,
  Chip,
  Row,
} from "./ui";
import {
  addDays,
  today,
  allCoaches,
  coachAccountId,
  configFor,
  offerFormats,
  offerAddress,
  locationLabel,
  dayLabel,
  endTime,
} from "./model";
import {
  addExternalSession,
  cancelExternalSession,
  availabilityReasons,
  repeatGroup,
} from "./agendaTools";

export function AgendaTools({
  store,
  setStore,
  focus,
  go,
  message,
  screen,
}: FlowProps & { screen: string }) {
  const coachId = coachAccountId(store),
    c = allCoaches(store).find((c) => c.id === coachId)!;
  const offers = store.offers.filter((o) => o.coach === coachId && o.active);
  const [offerId, setOfferId] = useState(
    offers.find((o) => o.kind !== "Groupe")?.id ?? offers[0]?.id ?? "",
  );
  const o = offers.find((o) => o.id === offerId);
  const [day, setDay] = useState(addDays(today(), 1)),
    [time, setTime] = useState(""),
    [name, setName] = useState("");
  const [format, setFormat] = useState(o ? (offerFormats(c, o)[0] ?? "") : "");
  const [address, setAddress] = useState(offerAddress(store, c, format));
  const [error, setError] = useState(""),
    [checked, setChecked] = useState(false),
    [cancelId, setCancelId] = useState("");
  const [dates, setDates] = useState<string[]>([]),
    [preview, setPreview] = useState(false);
  useLocalBack(!!cancelId, () => setCancelId(""), 20);
  useLocalBack(preview, () => setPreview(false));
  const g = store.groups?.find(
    (g) => g.id === focus && g.offer.coach === coachId,
  );
  const [repeatTime, setRepeatTime] = useState(g?.time ?? "");
  const datesList = Array.from(
    { length: configFor(store, coachId).horizon },
    (_, i) => {
      const d = addDays(today(), i);
      return [d, dayLabel(d)] as [string, string];
    },
  );
  const run = (fn: () => void) => {
    try {
      setError("");
      fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (store.account?.role !== "coach")
    return <Note>Connectez-vous à votre espace coach.</Note>;
  if (screen === "external-session-native" && focus) {
    const appointment = store.externalSessions?.find(
      (b) => b.id === focus && b.coach === coachId,
    );
    if (!appointment) return <Note>Ce rendez-vous n’est plus disponible.</Note>;
    return (
      <>
        <P small muted>
          RENDEZ-VOUS DIRECT
        </P>
        <H1 style={{ marginVertical: 18 }}>{appointment.name}</H1>
        <P>
          {dayLabel(appointment.day)} · {appointment.time} –{" "}
          {endTime(appointment.time, appointment.duration)}
        </P>
        <P muted style={{ marginVertical: 18 }}>
          {appointment.serviceName}
          {"\n"}
          {appointment.address}
        </P>
        {appointment.cancelled ? (
          <Note>Ce rendez-vous a été annulé.</Note>
        ) : (
          <>
            <TextButton onPress={() => setCancelId(appointment.id)}>
              Annuler ce rendez-vous
            </TextButton>
            {cancelId === appointment.id && (
              <Note>
                <P>
                  Cette annulation libère votre agenda. Prévenez directement{" "}
                  {appointment.name}.
                </P>
                <Button
                  onPress={() =>
                    run(() => {
                      setStore(cancelExternalSession(store, appointment.id));
                      setCancelId("");
                      message("Rendez-vous annulé.");
                    })
                  }
                >
                  Confirmer l’annulation du rendez-vous
                </Button>
                <TextButton onPress={() => setCancelId("")}>
                  Conserver le rendez-vous
                </TextButton>
              </Note>
            )}
          </>
        )}
        {!!error && <Note>{error}</Note>}
        <TextButton onPress={() => go("external-session-native")}>
          Ajouter un rendez-vous direct
        </TextButton>
      </>
    );
  }
  if (screen === "repeat-group-native") {
    if (!g) return <Note>Cours inaccessible.</Note>;
    const current = offers.find((o) => o.id === g.offer.id);
    return (
      <>
        <H1>La même énergie.{"\n"}De nouveaux rendez-vous.</H1>
        <P muted style={{ marginVertical: 20 }}>
          {g.offer.name} · {g.address}
        </P>
        {!current ? (
          <Note>
            Réactivez cette offre dans Séances & tarifs avant de programmer de
            nouvelles dates.
          </Note>
        ) : (
          <>
            <Note>
              {current.duration} min · {euro(current.price)} par personne ·{" "}
              {current.capacity} places. Les nouvelles dates utilisent votre
              tarif et capacité actuels.
            </Note>
            <Field
              label="Heure de début choisie"
              value={repeatTime}
              onChange={(v) => {
                setRepeatTime(v);
                setPreview(false);
              }}
              placeholder="HH:mm"
            />
            <Select
              label="Ajouter une date"
              value={day}
              items={datesList}
              onChange={setDay}
            />
            <Button
              light
              onPress={() =>
                run(() => {
                  if (dates.includes(day))
                    throw Error("Cette date est déjà sélectionnée.");
                  if (dates.length >= 12)
                    throw Error("12 dates maximum par programmation.");
                  setDates([...dates, day].sort());
                  setPreview(false);
                })
              }
            >
              Ajouter cette date
            </Button>
            <TextButton
              onPress={() =>
                run(() => {
                  const next = [1, 2, 3, 4].map((i) => addDays(day, i * 7));
                  const combined = [
                    ...new Set([...dates, day, ...next]),
                  ].sort();
                  if (combined.length > 12)
                    throw Error("12 dates maximum par programmation.");
                  if (combined.some((d) => !datesList.some(([x]) => x === d)))
                    throw Error(
                      "Étendez votre période de réservation dans les réglages pour répéter jusqu’à cette date.",
                    );
                  setDates(combined);
                  setPreview(false);
                })
              }
            >
              Répéter chaque semaine pendant 5 semaines
            </TextButton>
            <P small muted>
              Le premier jour est la date sélectionnée. Retirez les dates à
              exclure. Chaque cours doit tenir dans vos disponibilités.
            </P>
            {dates.map((d) => (
              <Setting
                key={d}
                title={dayLabel(d)}
                description={`${repeatTime || "Heure à choisir"} · Retirer cette date`}
                onPress={() => {
                  setDates(dates.filter((x) => x !== d));
                  setPreview(false);
                }}
              />
            ))}
            {error && <Note style={{ marginVertical: 16 }}>{error}</Note>}
            <Button
              disabled={!dates.length}
              style={{ marginTop: 20 }}
              onPress={() =>
                run(() => {
                  repeatGroup(store, g, dates, repeatTime);
                  setPreview(true);
                })
              }
            >
              Vérifier les dates
            </Button>
            {preview && (
              <Note style={{ marginTop: 16 }}>
                <P>
                  {dates.length} cours prêts à ouvrir, de {dates[0]} à{" "}
                  {dates.at(-1)}. Aucun participant existant n’est transféré.
                </P>
                <Button
                  style={{ marginTop: 12 }}
                  onPress={() =>
                    run(() => {
                      const next = repeatGroup(store, g, dates, repeatTime);
                      setStore(next);
                      message(`${dates.length} cours programmés.`);
                      go("groups-saved");
                    })
                  }
                >
                  Confirmer les nouveaux cours
                </Button>
              </Note>
            )}
          </>
        )}
      </>
    );
  }
  if (screen === "availability-help-native")
    return (
      <>
        <H1>Comprendre un créneau.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Retrouvez la règle qui rend une heure disponible ou indisponible pour
          vos clients.
        </P>
        <Select
          label="Prestation"
          value={offerId}
          items={offers.map((o) => [o.id, o.name])}
          onChange={(v) => {
            setOfferId(v);
            setChecked(false);
          }}
        />
        <Select
          label="Date à vérifier"
          value={day}
          items={datesList}
          onChange={(v) => {
            setDay(v);
            setChecked(false);
          }}
        />
        <Field
          label="Heure à vérifier"
          value={time}
          onChange={(v) => {
            setTime(v);
            setChecked(false);
          }}
          placeholder="HH:mm"
        />
        <Button disabled={!o} onPress={() => setChecked(true)}>
          Vérifier ce créneau
        </Button>
        {checked && o && (
          <Note style={{ marginTop: 20 }}>
            {availabilityReasons(store, c, o, day, time).join("\n\n") ||
              "Ce créneau est disponible à la réservation."}
          </Note>
        )}
        <TextButton onPress={() => go("config-native", "schedule")}>
          Ajuster mes disponibilités
        </TextButton>
        <TextButton onPress={() => go("config-native", "rules")}>
          Ajuster mes délais de réservation
        </TextButton>
      </>
    );
  return (
    <>
      <H1>Un rendez-vous{"\n"}pris directement.</H1>
      <P muted style={{ marginVertical: 20 }}>
        Ajoutez un client qui a réservé auprès de vous. Le rendez-vous bloque
        votre agenda, pendant toute la durée de la prestation.
      </P>
      <Field label="Nom du client" value={name} onChange={setName} />
      <Select
        label="Prestation réservée"
        value={offerId}
        items={offers
          .filter((o) => o.kind !== "Groupe")
          .map((o) => [o.id, `${o.name} · ${o.duration} min`])}
        onChange={(id) => {
          setOfferId(id);
          const next = offers.find((o) => o.id === id);
          const f = offerFormats(c, next)[0] ?? "";
          setFormat(f);
          setAddress(offerAddress(store, c, f));
        }}
      />
      <Select
        label="Date du rendez-vous"
        value={day}
        items={datesList}
        onChange={setDay}
      />
      <Field
        label="Heure du rendez-vous"
        value={time}
        onChange={setTime}
        placeholder="HH:mm"
      />
      <Select
        label="Lieu de la séance"
        value={format}
        items={offerFormats(c, o).map((id) => [
          id,
          locationLabel(store, c, id),
        ])}
        onChange={(f) => {
          setFormat(f);
          setAddress(offerAddress(store, c, f));
        }}
      />
      <Field
        label="Adresse ou lieu de rendez-vous"
        value={address}
        onChange={setAddress}
      />
      <P small muted>
        Aucun paiement, commission ni message automatique. Ce rendez-vous peut
        être placé hors de vos plages publiques, s’il n’empiète sur aucune
        occupation.
      </P>
      {error && <Note style={{ marginVertical: 16 }}>{error}</Note>}
      <Button
        disabled={!o || o.kind === "Groupe"}
        style={{ marginVertical: 20 }}
        onPress={() =>
          run(() => {
            setStore(
              addExternalSession(store, {
                name,
                offerId,
                day,
                time,
                format,
                address,
              }),
            );
            setName("");
            setTime("");
            message("Rendez-vous ajouté à votre agenda.");
          })
        }
      >
        Enregistrer le rendez-vous
      </Button>
      <H2>Vos rendez-vous directs</H2>
      {(store.externalSessions ?? [])
        .filter((b) => b.coach === coachId && !b.cancelled)
        .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time))
        .map((b) => (
          <View key={b.id}>
            <Setting
              title={`${b.name} · ${dayLabel(b.day, true)} à ${b.time}`}
              description={`${b.serviceName} · jusqu’à ${endTime(b.time, b.duration)} · ${b.address}`}
              onPress={() => setCancelId(b.id)}
            />
            {cancelId === b.id && (
              <Note>
                <P>
                  Annuler ce rendez-vous libère votre agenda. Prévenez
                  directement {b.name}.
                </P>
                <Button
                  style={{ marginTop: 12 }}
                  onPress={() =>
                    run(() => {
                      setStore(cancelExternalSession(store, b.id));
                      setCancelId("");
                      message("Rendez-vous annulé.");
                    })
                  }
                >
                  Confirmer l’annulation du rendez-vous
                </Button>
                <TextButton onPress={() => setCancelId("")}>
                  Conserver le rendez-vous
                </TextButton>
              </Note>
            )}
          </View>
        ))}
    </>
  );
}
