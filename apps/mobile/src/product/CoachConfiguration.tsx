import {
  AvailabilityIntervals,
  intervalSummary,
} from "./AvailabilityIntervals";
import React, { useEffect, useState } from "react";
import { Pressable, View, Switch } from "react-native";
import {
  Store,
  Coach,
  Offer,
  allCoaches,
  configFor,
  coachAccountId,
  addDays,
  today,
  validateIntervals,
  mins,
  overlap,
} from "./model";
import type { CoachSettings, Interval } from "./extendedTypes";
import {
  saveCoach,
  saveSettings,
  saveOffer,
  uid,
  publicationIssues,
} from "./workflows";
import { choosePhoto } from "./deviceFiles";
import {
  Button,
  Chip,
  Field,
  H1,
  H2,
  Note,
  P,
  Photo,
  Row,
  Rule,
  Select,
  Setting,
  TextButton,
  Eyebrow,
} from "./ui";
import reference from "../reference/prototype.json";
export const euro = (n: number) =>
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row between style={{ minHeight: 56, gap: 12 }}>
      <P style={{ flex: 1 }}>{label}</P>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#ddd", true: "#141414" }}
        thumbColor="#fff"
      />
    </Row>
  );
}
export type FlowProps = {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  coachId: string;
  bookingId: string;
  go: (s: string, focus?: string) => void;
  focus?: string;
  message: (s: string) => void;
  selectBooking: (id: string) => void;
  openCoach: (id: string) => void;
  choose: (coach: Coach, day: string, time: string, offer: Offer) => void;
};
export function CoachConfiguration({
  store,
  setStore,
  coachId,
  section,
  message,
  go,
}: FlowProps & { section: string }) {
  const actual = coachAccountId(store),
    c = allCoaches(store).find((c) => c.id === actual)!;
  const [cfg, setCfg] = useState<CoachSettings>(() => configFor(store, actual));
  const [profile, setProfile] = useState<Coach>(c);
  const [expanded, setExpanded] = useState(0);
  const [exceptionDay, setExceptionDay] = useState(addDays(today(), 1));
  const [exceptionClosed, setExceptionClosed] = useState(false);
  const [exception, setException] = useState<Interval[]>([["", ""]]);
  const [blockDay, setBlockDay] = useState(addDays(today(), 1));
  const [blockStart, setBlockStart] = useState("14:00"),
    [blockEnd, setBlockEnd] = useState("15:00"),
    [blockTitle, setBlockTitle] = useState("Rendez-vous personnel");
  const [edit, setEdit] = useState<Offer>({
    id: uid(),
    coach: actual,
    name: "",
    kind: "Individuel",
    duration: 60,
    price: 50,
    capacity: 1,
    active: true,
  });
  useEffect(() => {
    setCfg(configFor(store, actual));
    setProfile(allCoaches(store).find((c) => c.id === actual)!);
  }, [section, actual]);
  const run = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      message(e instanceof Error ? e.message : "Vérifiez vos informations.");
    }
  };
  const save = (next = cfg) =>
    run(() => {
      setStore(saveSettings(store, actual, next));
      message(
        "Réglages enregistrés. Les réservations confirmées sont conservées.",
      );
    });
  const text = (label: string, key: keyof Coach, multi = false) => (
    <Field
      label={label}
      value={String(profile[key] ?? "")}
      onChange={(v) => setProfile({ ...profile, [key]: v })}
      multiline={multi}
    />
  );
  const num = (label: string, key: "radius" | "travelFee") => (
    <Field
      label={label}
      value={String(cfg[key])}
      onChange={(v) => setCfg({ ...cfg, [key]: Number(v.replace(",", ".")) })}
      numeric
    />
  );
  const ownOffers = store.offers.filter((o) => o.coach === actual);
  const intervals = (list: Interval[], change: (list: Interval[]) => void) => (
    <AvailabilityIntervals
      list={list}
      offers={ownOffers}
      settings={cfg}
      onChange={change}
    />
  );
  const dates = Array.from({ length: 90 }, (_, i) => {
    const d = addDays(today(), i);
    return [d, d] as [string, string];
  });
  if (section === "profile")
    return (
      <>
        <Eyebrow>VOS RÉGLAGES</Eyebrow>
        <View style={{ height: 20 }} />
        {text("Nom public", "name")}
        <Select
          label="Discipline principale"
          value={profile.sport}
          items={Object.keys(reference.sportGoals).filter((s) => s !== "Tout")}
          onChange={(sport) => setProfile({ ...profile, sport })}
        />
        {text("Votre approche", "bio", true)}
        <Field
          label="Années d’expérience"
          value={String(profile.years)}
          numeric
          onChange={(v) => setProfile({ ...profile, years: Number(v) })}
        />
        {text("Diplômes et certifications", "cert")}
        {text("Langues parlées", "langs")}
        <H2>Votre photographie</H2>
        <Row wrap style={{ marginVertical: 18 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choisir le portrait ${i + 1}`}
              key={i}
              onPress={() =>
                setProfile({ ...profile, photo: i, photoUri: undefined })
              }
              style={{
                borderWidth: profile.photo === i && !profile.photoUri ? 3 : 1,
                borderColor: "#141414",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <Photo index={i} height={90} style={{ width: 76 }} />
            </Pressable>
          ))}
        </Row>
        <Button
          light
          onPress={async () => {
            try {
              const uri = await choosePhoto();
              if (uri) setProfile({ ...profile, photoUri: uri });
            } catch (e) {
              message((e as Error).message);
            }
          }}
        >
          Importer votre photo
        </Button>
        <P small muted style={{ marginVertical: 14 }}>
          JPEG, PNG ou WebP · 600 Ko maximum.
        </P>
        {text("Votre phrase d’introduction", "quote")}
        {text("Votre méthode", "method", true)}
        <Field
          label="Spécialités (séparées par des virgules)"
          value={profile.tags.join(", ")}
          onChange={(v) =>
            setProfile({ ...profile, tags: v.split(",").map((s) => s.trim()) })
          }
        />
        {text("Quartier / secteur", "area")}
        <Button
          onPress={() =>
            run(() => {
              setStore(saveCoach(store, actual, profile));
              message(
                "Profil enregistré. Un changement d’identité ou de qualification demande une nouvelle vérification.",
              );
            })
          }
        >
          Enregistrer
        </Button>
      </>
    );
  if (section === "offers")
    return (
      <>
        <P muted style={{ marginVertical: 16 }}>
          Créez une offre par formule : par exemple, renforcement 30 min à 30 €
          et renforcement 60 min à 50 €. Choisissez ensuite leurs plages dans
          Disponibilités.
        </P>
        <TextButton onPress={() => go("config-native", "schedule")}>
          Associer mes séances aux disponibilités
        </TextButton>
        {store.offers
          .filter((o) => o.coach === actual)
          .map((o) => (
            <View key={o.id}>
              <Setting
                title={o.name}
                description={`${o.duration} min · ${o.kind} · ${euro(o.price)}${o.kind === "Groupe" ? "/personne · " + o.capacity + " places" : ""}`}
                onPress={() => setEdit({ ...o })}
              />
              <Row between>
                <TextButton onPress={() => setEdit({ ...o })}>
                  Modifier {o.name}
                </TextButton>
                <TextButton
                  onPress={() =>
                    run(() =>
                      setStore(saveOffer(store, { ...o, active: !o.active })),
                    )
                  }
                >
                  {o.active ? "Mettre en pause" : "Activer"}
                </TextButton>
              </Row>
            </View>
          ))}
        <Rule />
        <H2 style={{ marginBottom: 16 }}>
          {store.offers.some((o) => o.id === edit.id)
            ? "Modifier une séance"
            : "Créer une séance"}
        </H2>
        <Field
          label="Nom de la séance"
          value={edit.name}
          onChange={(name) => setEdit({ ...edit, name })}
        />
        <Select
          label="Format"
          value={edit.kind}
          items={["Individuel", "Duo", "Groupe"]}
          onChange={(kind) =>
            setEdit({
              ...edit,
              kind,
              capacity: kind === "Groupe" ? 6 : kind === "Duo" ? 2 : 1,
            })
          }
        />
        <Field
          label="Durée (minutes)"
          value={String(edit.duration)}
          numeric
          onChange={(v) => setEdit({ ...edit, duration: Number(v) })}
        />
        <Field
          label={
            edit.kind === "Groupe"
              ? "Prix par personne (€)"
              : "Prix de la séance (€)"
          }
          value={String(edit.price)}
          numeric
          onChange={(v) =>
            setEdit({ ...edit, price: Number(v.replace(",", ".")) })
          }
        />
        {edit.kind === "Groupe" && (
          <Field
            label="Nombre maximum de participants"
            value={String(edit.capacity)}
            numeric
            onChange={(v) => setEdit({ ...edit, capacity: Number(v) })}
          />
        )}
        {edit.kind === "Groupe" && (
          <Select
            label="Niveau du cours"
            value={edit.level ?? "Tous niveaux"}
            items={["Tous niveaux", "Débutant", "Intermédiaire", "Confirmé"]}
            onChange={(level) => setEdit({ ...edit, level })}
          />
        )}
        <Button
          onPress={() =>
            run(() => {
              setStore(saveOffer(store, edit));
              setEdit({ ...edit, id: uid(), name: "" });
              message(
                "Offre enregistrée. Les cours déjà planifiés gardent leur tarif et capacité.",
              );
            })
          }
        >
          Enregistrer l’offre
        </Button>
        <TextButton
          onPress={() =>
            setEdit({
              id: uid(),
              coach: actual,
              name: "",
              kind: "Individuel",
              price: 50,
              duration: 60,
              capacity: 1,
              active: true,
            })
          }
        >
          Créer une autre séance
        </TextButton>
        <Note>
          Les réservations confirmées conservent leur prix et leur durée.
        </Note>
      </>
    );
  if (section === "places")
    return (
      <>
        <Eyebrow style={{ marginBottom: 20 }}>VOS RÉGLAGES</Eyebrow>

        <H2>Formats proposés</H2>
        {["Parc", "Studio", "Domicile", "Visio"].map((f) => (
          <Toggle
            key={f}
            label={f}
            value={profile.formats.includes(f)}
            onChange={(v) =>
              setProfile({
                ...profile,
                formats: v
                  ? [...profile.formats, f]
                  : profile.formats.filter((x) => x !== f),
              })
            }
          />
        ))}
        {text("Lieu extérieur / lieu principal", "place")}
        {text("Adresse du lieu principal", "address")}
        <Field
          label="Nom du studio"
          value={cfg.studio}
          onChange={(studio) => setCfg({ ...cfg, studio })}
        />
        <Field
          label="Adresse du studio"
          value={cfg.studioAddress}
          onChange={(studioAddress) => setCfg({ ...cfg, studioAddress })}
        />
        {num("Rayon de déplacement à domicile (km)", "radius")}
        {num("Supplément déplacement à domicile (€)", "travelFee")}
        <Note>
          Le supplément est présenté avant paiement. Le rayon et les adresses
          restent fictifs dans la démonstration.
        </Note>
        <Button
          style={{ marginTop: 20 }}
          onPress={() =>
            run(() => {
              if (
                !profile.formats.length ||
                (profile.formats.includes("Parc") &&
                  (!profile.place.trim() || !profile.address.trim())) ||
                (profile.formats.includes("Studio") &&
                  (!cfg.studio.trim() || !cfg.studioAddress.trim())) ||
                !Number.isFinite(cfg.travelFee) ||
                cfg.travelFee < 0 ||
                cfg.travelFee > 30 ||
                cfg.radius < 1 ||
                cfg.radius > 10
              )
                throw Error(
                  "Vérifiez les formats, les adresses et le déplacement.",
                );
              setStore({
                ...saveSettings(store, actual, cfg),
                coachOverrides: {
                  ...store.coachOverrides,
                  [actual]: {
                    ...store.coachOverrides?.[actual],
                    formats: profile.formats,
                    place: profile.place,
                    address: profile.address,
                  },
                },
              });
              message("Lieux enregistrés.");
            })
          }
        >
          Enregistrer
        </Button>
      </>
    );
  if (section === "schedule")
    return (
      <>
        <H1>À votre rythme.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Vous choisissez les jours, l’heure de début et l’heure de fin. Chaque
          plage commence à l’heure que vous saisissez, même à 9 h 10 ou 14 h 20.
        </P>
        <Field
          label="Pause entre deux séances (minutes)"
          numeric
          value={String(cfg.buffer)}
          onChange={(v) => setCfg({ ...cfg, buffer: Number(v) })}
        />
        <Select
          label="Espacement des départs"
          value={cfg.departureStep == null ? "duration" : "custom"}
          items={[
            ["duration", "Selon mes séances et mes pauses"],
            ["custom", "Intervalle de mon choix"],
          ]}
          onChange={(v) =>
            setCfg({
              ...cfg,
              departureStep:
                v === "duration" ? null : (cfg.departureStep ?? 30),
            })
          }
        />
        {cfg.departureStep != null && (
          <Field
            label="Minutes entre deux départs"
            numeric
            value={String(cfg.departureStep)}
            onChange={(v) => setCfg({ ...cfg, departureStep: Number(v) })}
          />
        )}
        <P small muted style={{ marginBottom: 16 }}>
          Le premier départ correspond au début de votre plage. Les suivants
          respectent la durée de chaque séance et votre pause, ou l’intervalle
          que vous choisissez. Le client réserve parmi ces possibilités.
        </P>
        {[
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
          "Dimanche",
        ].map((label, i) => (
          <View key={label}>
            <Setting
              title={label}
              description={
                cfg.week[i].length
                  ? cfg.week[i]
                      .map((x) => intervalSummary(x, ownOffers))
                      .join(" · ")
                  : "Fermé"
              }
              onPress={() => setExpanded(expanded === i ? -1 : i)}
            />
            {expanded === i &&
              intervals(cfg.week[i], (v) =>
                setCfg({
                  ...cfg,
                  week: cfg.week.map((x, j) => (j === i ? v : x)),
                }),
              )}
          </View>
        ))}
        <TextButton onPress={() => go("config-native", "offers")}>
          Gérer mes séances et leurs tarifs
        </TextButton>
        <P small muted>
          Choisissez les séances proposées sur chaque plage. Pour un cours
          collectif, vous choisissez également la date et l’heure dans « Mes
          cours en groupe ».
        </P>
        <Note style={{ marginVertical: 20 }}>
          Les séances déjà confirmées sont conservées lorsque vous changez vos
          horaires.
        </Note>
        <Button onPress={() => save({ ...cfg, weeklyConfigured: true })}>
          Enregistrer la semaine
        </Button>
        <H2 style={{ marginVertical: 20 }}>Exceptions datées</H2>
        {Object.entries(cfg.exceptions).map(([d, list]) => (
          <Setting
            key={d}
            title={d}
            description={
              list.map((x) => intervalSummary(x, ownOffers)).join(" · ") ||
              "Fermé"
            }
            onPress={() => {
              const next = { ...cfg, exceptions: { ...cfg.exceptions } };
              delete next.exceptions[d];
              setCfg(next);
              save(next);
            }}
          />
        ))}
        <Select
          label="Jour de l’exception"
          value={exceptionDay}
          items={dates}
          onChange={setExceptionDay}
        />
        <Toggle
          label="Fermer cette journée"
          value={exceptionClosed}
          onChange={setExceptionClosed}
        />
        {!exceptionClosed && intervals(exception, setException)}
        <Button
          light
          style={{ marginVertical: 20 }}
          onPress={() =>
            run(() => {
              const list = exceptionClosed ? [] : validateIntervals(exception);
              const next = {
                ...cfg,
                exceptions: { ...cfg.exceptions, [exceptionDay]: list },
              };
              setCfg(next);
              save(next);
            })
          }
        >
          Ajouter une exception
        </Button>
      </>
    );
  if (section === "rules")
    return (
      <>
        <Eyebrow style={{ marginBottom: 20 }}>VOS RÉGLAGES</Eyebrow>
        {(
          [
            ["buffer", "Temps entre deux séances", [0, 15, 30, 60], "minutes"],
            [
              "notice",
              "Délai minimum avant réservation",
              [1, 2, 6, 12, 24],
              "heures",
            ],
            [
              "horizon",
              "Ouverture du planning",
              [7, 14, 30, 60, 90],
              "jours à l’avance",
            ],
            [
              "cancelHours",
              "Annulation gratuite jusqu’à",
              [12, 24, 48],
              "heures avant",
            ],
          ] as const
        ).map(([key, label, values, suffix]) =>
          key === "buffer" ? (
            <Field
              key={key}
              label="Temps entre deux séances (minutes)"
              numeric
              value={String(cfg.buffer)}
              onChange={(v) => setCfg({ ...cfg, buffer: Number(v) })}
            />
          ) : (
            <Select
              key={key}
              label={label}
              value={String(cfg[key])}
              items={values.map((v) => [String(v), `${v} ${suffix}`])}
              onChange={(v) => setCfg({ ...cfg, [key]: Number(v) })}
            />
          ),
        )}
        <Note>
          <P bold>Réservation automatique</P>
          <P small>
            Seuls vos créneaux éligibles sont vendus. Les règles d’annulation
            sont conservées sur chaque réservation.
          </P>
        </Note>
        <Button style={{ marginTop: 24 }} onPress={() => save()}>
          Enregistrer
        </Button>
      </>
    );
  if (section === "preparation")
    return (
      <>
        <H1>Une rencontre{"\n"}bien préparée.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Ces indications accompagnent vos nouvelles réservations. Les séances
          déjà confirmées gardent leurs consignes.
        </P>
        {(
          [
            ["provided", "Matériel fourni"],
            ["bring", "À apporter"],
            ["meeting", "Point de rendez-vous et accès"],
            ["weather", "Votre solution en cas de météo défavorable"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={cfg.preparation[key]}
            multiline
            onChange={(v) =>
              setCfg({ ...cfg, preparation: { ...cfg.preparation, [key]: v } })
            }
          />
        ))}
        <Button onPress={() => save()}>Enregistrer les consignes</Button>
      </>
    );
  if (section === "documents")
    return (
      <>
        <H1>La confiance{"\n"}se construit.</H1>
        <Note style={{ marginVertical: 20 }}>
          {
            {
              approved: "Dossier validé · simulation",
              expired: "Validité expirée : soumettez un dossier à jour",
              pending: "En attente de décision",
              draft: "À compléter",
              rejected: "Refusé",
              correction: "Correction demandée",
            }[cfg.dossier.status]
          }
          {cfg.dossier.reason ? " · " + cfg.dossier.reason : ""}
        </Note>
        {cfg.dossier.status !== "pending" && (
          <>
            {[
              "Identité",
              "Qualification / diplôme",
              "Carte professionnelle ou justification",
              "Assurance professionnelle",
            ].map((label, i) => (
              <Field
                key={label}
                label={label}
                value={cfg.dossier.documents[i] ?? ""}
                onChange={(v) =>
                  setCfg({
                    ...cfg,
                    dossier: {
                      ...cfg.dossier,
                      documents: Array.from({ length: 4 }, (_, j) =>
                        j === i ? v : (cfg.dossier.documents[j] ?? ""),
                      ),
                    },
                  })
                }
              />
            ))}
            <Field
              label="Date de fin de validité (AAAA-MM-JJ)"
              value={cfg.dossier.expires}
              onChange={(expires) =>
                setCfg({ ...cfg, dossier: { ...cfg.dossier, expires } })
              }
            />
            <Button
              onPress={() =>
                run(() => {
                  if (
                    cfg.dossier.documents.some((d) => !d.trim()) ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(cfg.dossier.expires) ||
                    cfg.dossier.expires <= today()
                  )
                    throw Error(
                      "Complétez les quatre références et une validité future.",
                    );
                  const next: CoachSettings = {
                    ...cfg,
                    published: false,
                    dossier: {
                      ...cfg.dossier,
                      status: "pending",
                      reason:
                        "Votre dossier fictif attend une décision de l’équipe.",
                      history: [
                        ...cfg.dossier.history,
                        {
                          date: today(),
                          status: "pending",
                          reason: "Dossier soumis",
                        },
                      ],
                    },
                  };
                  setCfg(next);
                  save(next);
                })
              }
            >
              Soumettre le dossier fictif
            </Button>
          </>
        )}
        <H2 style={{ marginVertical: 20 }}>Historique</H2>
        {cfg.dossier.history.map((h, i) => (
          <P small key={i}>
            {h.date} · {h.status}
            {"\n"}
            {h.reason}
          </P>
        ))}
        <P small muted style={{ marginTop: 20 }}>
          Références fictives uniquement. Aucun document personnel ni contrôle
          réel.
        </P>
      </>
    );
  if (section === "payout")
    return (
      <>
        <Eyebrow style={{ marginBottom: 20 }}>VOS RÉGLAGES</Eyebrow>
        {(
          [
            ["name", "Nom professionnel de démonstration"],
            ["email", "E-mail de contact fictif"],
            ["address", "Adresse professionnelle fictive"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={cfg.business[key]}
            onChange={(v) =>
              setCfg({ ...cfg, business: { ...cfg.business, [key]: v } })
            }
          />
        ))}
        <Select
          label="Statut professionnel"
          value={cfg.business.status}
          items={[
            "Entreprise individuelle",
            "Microentreprise",
            "Société",
            "Association",
          ]}
          onChange={(status) =>
            setCfg({ ...cfg, business: { ...cfg.business, status } })
          }
        />
        <Note>
          {cfg.payoutReady
            ? "Versements activés · compte de test"
            : "Activez les versements de test pour publier"}
        </Note>
        <Rule />
        <Row between>
          <P>Commission par réservation</P>
          <P bold>15 %</P>
        </Row>
        <Row between>
          <P>Abonnement</P>
          <P bold>0 €</P>
        </Row>
        <Row between>
          <P>Versement</P>
          <P bold>Après la séance</P>
        </Row>
        <Button
          style={{ marginTop: 24 }}
          onPress={() => {
            const next = { ...cfg, payoutReady: true };
            setCfg(next);
            save(next);
          }}
        >
          Activer un compte de test
        </Button>
        <Button light style={{ marginTop: 12 }} onPress={() => save()}>
          Enregistrer
        </Button>
        <P small muted style={{ marginTop: 20 }}>
          Aucune donnée bancaire réelle. Les paiements réels restent reportés.
        </P>
      </>
    );
  if (section === "notifications")
    return (
      <>
        <P muted style={{ marginBottom: 20 }}>
          Rester au courant, sans multiplier les sollicitations.
        </P>
        {(
          [
            ["booking", "Nouvelle réservation"],
            ["changes", "Modification ou annulation"],
            ["reminder", "Rappel avant une séance"],
            ["marketing", "Actualités et conseils Partant"],
          ] as const
        ).map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            value={cfg.notifications[key]}
            onChange={(v) =>
              setCfg({
                ...cfg,
                notifications: { ...cfg.notifications, [key]: v },
              })
            }
          />
        ))}
        <Note style={{ marginVertical: 24 }}>
          L’historique reste consultable. Aucun push, SMS ou e-mail n’est envoyé
          dans la simulation.
        </Note>
        <Button onPress={() => save()}>Enregistrer</Button>
      </>
    );
  if (section === "calendars" || section === "blocks")
    return (
      <>
        <H1>
          {section === "calendars"
            ? "Un planning.\nTous vos agendas."
            : "Bloquer un moment."}
        </H1>
        {section === "calendars" && (
          <>
            {["Google Calendar", "Apple Calendar", "Outlook"].map((p) => (
              <Setting
                key={p}
                title={p}
                description="Non connecté"
                onPress={() =>
                  message(
                    "Connexion externe non activée. Vous pouvez tester un événement occupé ci-dessous.",
                  )
                }
              />
            ))}
            <Note style={{ marginVertical: 20 }}>
              Un événement occupé masque les créneaux publics. Le libellé reste
              privé.
            </Note>
          </>
        )}
        <Select
          label="Jour"
          value={blockDay}
          items={dates}
          onChange={setBlockDay}
        />
        <Field label="De" value={blockStart} onChange={setBlockStart} />
        <Field label="À" value={blockEnd} onChange={setBlockEnd} />
        <Field
          label="Libellé privé"
          value={blockTitle}
          onChange={setBlockTitle}
        />
        <Button
          onPress={() =>
            run(() => {
              validateIntervals([[blockStart, blockEnd]]);
              if (
                store.bookings.some(
                  (b) =>
                    b.coach === actual &&
                    b.day === blockDay &&
                    b.status === "confirmed" &&
                    overlap(
                      b.time,
                      b.duration,
                      blockStart,
                      mins(blockEnd) - mins(blockStart),
                    ),
                ) ||
                (store.groups ?? []).some(
                  (g) =>
                    !g.cancelled &&
                    g.offer.coach === actual &&
                    g.day === blockDay &&
                    overlap(
                      g.time,
                      g.offer.duration,
                      blockStart,
                      mins(blockEnd) - mins(blockStart),
                    ),
                )
              )
                throw Error("Une séance ou un cours occupe déjà ce moment.");
              const next = {
                ...cfg,
                blocks: [
                  ...cfg.blocks,
                  {
                    id: uid(),
                    day: blockDay,
                    start: blockStart,
                    end: blockEnd,
                    title: blockTitle,
                  },
                ],
              };
              setCfg(next);
              save(next);
            })
          }
        >
          Bloquer ce créneau
        </Button>
        {cfg.blocks.map((b) => (
          <Setting
            key={b.id}
            title={b.title}
            description={`${b.day} · ${b.start}–${b.end} · Retirer`}
            onPress={() => {
              const next = {
                ...cfg,
                blocks: cfg.blocks.filter((x) => x.id !== b.id),
              };
              setCfg(next);
              save(next);
            }}
          />
        ))}
      </>
    );
  return <Note>Choisissez une rubrique de configuration.</Note>;
}
