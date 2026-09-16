import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import {
  Account,
  Booking,
  Coach,
  Store,
  allCoaches,
  configFor,
  coachAccountId,
  slotsFor,
  remaining,
  addDays,
  dayLabel,
  today,
  now,
  instant,
  switchAccount,
  openGroup,
  initialStore,
  newPreviewStore,
} from "./model";
import * as W from "./workflows";
import type { CoachSettings, AvailabilityAlert } from "./extendedTypes";
import { FlowProps, Toggle, euro } from "./CoachConfiguration";
import { exportFile } from "./deviceFiles";
import {
  Button,
  Chip,
  Choice,
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
export function CompleteFlows(p: FlowProps & { screen: string }) {
  const {
    store: s,
    setStore,
    screen,
    focus = "",
    coachId,
    bookingId,
    go,
    message,
    selectBooking,
    openCoach,
    choose,
  } = p;
  const [form, setForm] = useState<Record<string, string>>({});
  const [flag, setFlag] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [decision, setDecision] = useState("Répondre");
  const [selection, setSelection] = useState("");
  const [quoted, setQuoted] = useState<{
    before: string;
    group: string;
    price: number;
  } | null>(null);
  const b = s.bookings.find((b) => b.id === bookingId),
    c = allCoaches(s).find((c) => c.id === coachId) ?? allCoaches(s)[0];
  const active = coachAccountId(s),
    cfg = configFor(s, active),
    me = s.account;
  useEffect(() => {
    setForm({});
    setFlag(false);
    setConfirm(false);
    setDecision("Répondre");
    setSelection("");
    setQuoted(null);
  }, [screen, focus]);
  const run = async (fn: () => void | Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      message(e instanceof Error ? e.message : "Vérifiez votre demande.");
    }
  };
  const update = (fn: (s: Store) => Store, text = "Enregistré.") =>
    run(() => {
      setStore(fn(s));
      message(text);
    });
  const val = (key: string, fallback = "") => form[key] ?? fallback;
  const field = (
    label: string,
    key: string,
    fallback = "",
    multi = false,
    numeric = false,
  ) => (
    <Field
      label={label}
      value={val(key, fallback)}
      onChange={(v) => setForm((x) => ({ ...x, [key]: v }))}
      multiline={multi}
      numeric={numeric}
    />
  );
  const select = (
    label: string,
    key: string,
    items: string[] | [string, string][],
    fallback = "",
  ) => (
    <Select
      label={label}
      value={val(key, fallback)}
      items={items}
      onChange={(v) => setForm((x) => ({ ...x, [key]: v }))}
    />
  );
  const dates = Array.from({ length: 90 }, (_, i) => {
    const d = addDays(today(), i);
    return [d, dayLabel(d)] as [string, string];
  });
  const showBooking = (id: string) => {
    selectBooking(id);
    go("bookingDetail");
  };
  const mine = s.bookings.filter((b) => W.canRead(s, b));
  function appointment(x: Booking) {
    return (
      <Setting
        key={x.id}
        title={`${dayLabel(x.day, true)} · ${x.time}`}
        description={`${x.clientName} · ${x.serviceName} · ${x.seats} participant(s) · ${euro(W.net(x))}`}
        onPress={() => showBooking(x.id)}
      />
    );
  }
  if (screen === "tools")
    return (
      <>
        <H1>Tester les deux côtés.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Ces outils appartiennent au prototype. Les paiements et les identités
          restent fictifs dans les deux modes.
        </P>
        <Choice
          title="Présentation · parcours épuré"
          active={!s.testMode}
          onPress={() => setStore({ ...s, testMode: false })}
        />
        <Choice
          title="Test · comptes et incidents"
          active={!!s.testMode}
          onPress={() => setStore({ ...s, testMode: true })}
        />
        <Note style={{ marginVertical: 20 }}>
          Horloge :{" "}
          {new Date(now()).toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
          })}{" "}
          · Paris
        </Note>
        {s.testMode && (
          <>
            <Button onPress={() => go("accounts")}>
              Choisir un compte fictif
            </Button>
            <Button light style={{ marginTop: 12 }} onPress={() => go("team")}>
              Ouvrir l’espace équipe
            </Button>
            {[24, 1].map((h) => (
              <TextButton
                key={h}
                onPress={() =>
                  setStore({ ...s, clockHours: (s.clockHours ?? 0) + h })
                }
              >
                Avancer de {h} h
              </TextButton>
            ))}
          </>
        )}
        <TextButton onPress={() => setStore({ ...s, clockHours: 0 })}>
          Revenir à l’heure réelle
        </TextButton>
        <TextButton onPress={() => setConfirm(true)}>
          Réinitialiser la démonstration
        </TextButton>
        {confirm && (
          <Note>
            <P>Tous les essais locaux seront effacés.</P>
            <Button
              onPress={() => {
                setStore(newPreviewStore());
                go("welcome");
              }}
            >
              Confirmer la réinitialisation
            </Button>
          </Note>
        )}
        <P small muted style={{ marginTop: 20 }}>
          Les rappels et alertes se recalculent à chaque visite. Avancer l’heure
          peut terminer des séances ; revenir à l’heure réelle n’annule pas les
          opérations enregistrées.
        </P>
      </>
    );
  if (screen === "accounts")
    return (
      <>
        <H1>Choisir un compte fictif.</H1>
        {!s.testMode ? (
          <Note>Activez le mode Test dans « À propos de la simulation ».</Note>
        ) : (
          <>
            {["client", "coach"].map((role) => (
              <View key={role}>
                <H2 style={{ marginVertical: 20 }}>
                  {role === "coach" ? "Les coachs" : "Les particuliers"}
                </H2>
                {W.identities(s)
                  .filter((a) => a.role === role)
                  .map((a) => (
                    <Setting
                      key={a.id}
                      title={a.name}
                      description={a.email}
                      onPress={() => {
                        setStore(switchAccount(s, a));
                        go(role === "coach" ? "coach" : "explore");
                      }}
                    />
                  ))}
              </View>
            ))}
          </>
        )}
      </>
    );
  if (screen === "account-native") {
    if (!me)
      return (
        <>
          <H1>On se retrouve ?</H1>
          <Button onPress={() => go("welcome")}>Me connecter</Button>
        </>
      );
    const info = W.infoFor(s, me.id);
    return (
      <>
        <H1 style={{ marginBottom: 20 }}>Vos informations.</H1>
        {field("Prénom / nom public", "name", me.name)}
        {field("Adresse e-mail fictive", "email", me.email)}
        {field("Téléphone facultatif", "phone", info.phone)}
        <Toggle
          label="Rappels avant mes séances"
          value={val("reminders", String(info.reminders)) === "true"}
          onChange={(v) => setForm({ ...form, reminders: String(v) })}
        />
        {me.role === "client" && (
          <Toggle
            label="Alertes de disponibilité"
            value={val("alerts", String(info.alerts)) === "true"}
            onChange={(v) => setForm({ ...form, alerts: String(v) })}
          />
        )}
        <Button
          style={{ marginVertical: 20 }}
          onPress={() =>
            run(() => {
              const name = val("name", me.name).trim(),
                email = val("email", me.email).trim().toLowerCase();
              if (!name || !/^\S+@\S+\.\S+$/.test(email))
                throw Error("Vérifiez le nom et l’adresse e-mail.");
              if (
                W.identities(s).some(
                  (a) =>
                    a.id !== me.id && a.role === me.role && a.email === email,
                )
              )
                throw Error("Cette adresse est déjà utilisée pour ce rôle.");
              const account = { ...me, name, email };
              setStore({
                ...s,
                account,
                identities: [
                  account,
                  ...(s.identities ?? []).filter((a) => a.id !== me.id),
                ],
                accountInfo: {
                  ...s.accountInfo,
                  [me.id]: {
                    phone: val("phone", info.phone),
                    reminders:
                      val("reminders", String(info.reminders)) === "true",
                    alerts: val("alerts", String(info.alerts)) === "true",
                  },
                },
              });
              message("Vos informations sont enregistrées.");
            })
          }
        >
          Enregistrer
        </Button>
        <Setting
          title="Exporter mes données locales"
          onPress={() =>
            run(() =>
              exportFile(
                "partant-mes-donnees.json",
                JSON.stringify(W.accountExport(s), null, 2),
                "application/json",
              ),
            )
          }
        />
        <Setting
          title="Me déconnecter"
          onPress={() => {
            setStore(switchAccount(s, null));
            go("welcome");
          }}
        />
        <Setting
          title="Supprimer mon compte de démonstration"
          onPress={() => setConfirm(true)}
        />
        {confirm && (
          <Note>
            <P>
              Votre profil local et vos messages seront anonymisés. Les
              références des séances restent chez vos interlocuteurs.
            </P>
            <Button
              style={{ marginTop: 16 }}
              onPress={() =>
                run(() => {
                  setStore(W.deleteAccount(s));
                  go("welcome");
                })
              }
            >
              Confirmer la suppression
            </Button>
          </Note>
        )}
        <P small muted style={{ marginTop: 20 }}>
          Un changement d’e-mail devra être vérifié dans le service réel.
        </P>
      </>
    );
  }
  if (screen === "client-native") {
    const clientBookings = s.bookings.filter(
      (b) => b.coach === active && b.clientId === focus,
    );
    if (!clientBookings.length || me?.role !== "coach")
      return <Note>Cette fiche n’est pas accessible.</Note>;
    const x = clientBookings[0];
    return (
      <>
        <H1>{x.clientName}</H1>
        <Note style={{ marginVertical: 20 }}>
          <P bold>Son objectif</P>
          <P>{x.goal || "À préciser ensemble."}</P>
        </Note>
        <Button
          onPress={() => {
            selectBooking(x.id);
            go("chat");
          }}
        >
          Écrire à {x.clientName}
        </Button>
        <H2 style={{ marginVertical: 20 }}>Notes privées du coach</H2>
        {field(
          "Repères utiles pour les prochaines séances",
          "notes",
          cfg.clientNotes[focus] ?? "",
          true,
        )}
        <P small muted>
          Notes privées. Ne saisissez pas d’informations médicales ou sensibles.
        </P>
        <Button
          light
          style={{ marginVertical: 20 }}
          onPress={() =>
            update((x) =>
              W.saveSettings(x, active, {
                ...cfg,
                clientNotes: {
                  ...cfg.clientNotes,
                  [focus]: val("notes", cfg.clientNotes[focus] ?? ""),
                },
              }),
            )
          }
        >
          Enregistrer mes notes
        </Button>
        <H2>Historique des séances</H2>
        {clientBookings.map(appointment)}
      </>
    );
  }
  if (screen === "repeat-native" && b) {
    const coach = allCoaches(s).find((c) => c.id === b.coach)!,
      offer =
        s.offers.find((o) => o.id === b.offerId && o.active) ??
        s.offers.find(
          (o) => o.coach === b.coach && o.active && o.kind === b.kind,
        );
    const options: { day: string; time: string }[] = [];
    if (offer)
      for (let i = 0; i < 90 && options.length < 3; i++) {
        const day = addDays(today(), i),
          time = slotsFor(coach, day, s, offer).find(
            (time) =>
              (day > b.day || (day === b.day && time > b.time)) &&
              !W.clientConflict(s, b, day, time, offer.duration),
          );
        if (time) options.push({ day, time });
      }
    return (
      <>
        <Eyebrow>VOTRE PROCHAIN RENDEZ-VOUS</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>
          On continue{"\n"}avec {coach.name.split(" ")[0]} ?
        </H1>
        <P muted>Chaque séance est choisie et confirmée séparément.</P>
        {offer && options.length ? (
          <>
            <Note style={{ marginVertical: 20 }}>
              {offer.name} · {offer.duration} min · {euro(offer.price)}
              {offer.id !== b.offerId
                ? " · Votre ancienne offre a changé."
                : ""}
            </Note>
            {options.map((x) => (
              <Setting
                key={x.day}
                title={dayLabel(x.day)}
                description={`${x.time} · ${euro(offer.price)}`}
                onPress={() => choose(coach, x.day, x.time, offer)}
              />
            ))}
          </>
        ) : (
          <Note style={{ marginVertical: 20 }}>
            Aucun prochain moment compatible pour le moment.
          </Note>
        )}
        <Button light onPress={() => openCoach(coach.id)}>
          Voir tout le profil
        </Button>
        <TextButton onPress={() => go("new-alert", coach.id)}>
          Suivre ses disponibilités
        </TextButton>
      </>
    );
  }
  if (screen === "review-native" && b)
    return (
      <>
        <H1>Ce moment,{"\n"}c’était comment ?</H1>
        <P muted style={{ marginVertical: 20 }}>
          Votre avis aide les prochaines rencontres.
        </P>
        <Select
          label="Votre note"
          value={val("rating", "5")}
          items={[1, 2, 3, 4, 5].map((v) => [String(v), `${v} / 5`])}
          onChange={(v) => setForm({ ...form, rating: v })}
        />
        {field("Votre expérience", "review", "", true)}
        <Button
          onPress={() =>
            run(() => {
              setStore(
                W.saveReview(
                  s,
                  b.id,
                  Number(val("rating", "5")),
                  val("review"),
                ),
              );
              go("bookingDetail");
              message("Votre avis est publié.");
            })
          }
        >
          Publier mon avis
        </Button>
      </>
    );
  if (screen === "reviews-native") {
    const id = focus || coachId,
      reviews = s.reviews?.filter((r) => r.coach === id && !r.hidden) ?? [];
    return (
      <>
        <H1>Les avis de ses clients.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Avis liés à une séance terminée.
        </P>
        {reviews.length ? (
          reviews.map((r) => (
            <View key={r.id}>
              <Row between>
                <H2>{r.name}</H2>
                <P>★ {r.rating}/5</P>
              </Row>
              <P style={{ marginVertical: 16 }}>{r.text}</P>
              {r.reply && (
                <Note>
                  <P bold>Réponse du coach</P>
                  <P>{r.reply}</P>
                </Note>
              )}
              {me?.role === "coach" && active === id && (
                <>
                  {field(
                    "Votre réponse à " + r.name,
                    "reply-" + r.id,
                    r.reply,
                    true,
                  )}
                  <TextButton
                    onPress={() =>
                      update((x) =>
                        W.replyReview(x, r.id, val("reply-" + r.id, r.reply)),
                      )
                    }
                  >
                    Enregistrer ma réponse
                  </TextButton>
                </>
              )}
              <TextButton onPress={() => go("report-native", "review:" + r.id)}>
                Signaler cet avis
              </TextButton>
              <Rule />
            </View>
          ))
        ) : (
          <Note>
            Aucun nouvel avis rédigé dans vos essais. Les notes initiales des
            profils sont fictives.
          </Note>
        )}
      </>
    );
  }
  if (screen === "new-alert")
    return (
      <>
        <H1>Gardons une place{"\n"}à vos envies.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Une alerte vous présente les créneaux compatibles. Aucune réservation
          automatique.
        </P>
        {select(
          "Coach",
          "coach",
          [
            ["", "Tous les coachs"],
            ...allCoaches(s).map((c) => [c.id, c.name] as [string, string]),
          ],
          focus,
        )}
        {select("Pratique", "sport", Object.keys(reference.sportGoals), "Tout")}
        {select("Jour souhaité", "day", dates, addDays(today(), 1))}
        {field("Début entre", "from", "07:00")}
        {field("Et", "to", "21:00")}
        {field(
          "Budget total maximum (€)",
          "budget",
          String(s.preferences.budget),
          false,
          true,
        )}
        {field("Participants souhaités", "seats", "1", false, true)}
        <Toggle
          label="Chercher uniquement des cours en groupe"
          value={flag}
          onChange={setFlag}
        />
        {select(
          "Lieu",
          "format",
          ["Tous", "Parc", "Studio", "Domicile", "Visio"],
          "Tous",
        )}
        <Button
          style={{ marginTop: 20 }}
          onPress={() =>
            run(() => {
              if (!me || me.role !== "client")
                throw Error("Connectez-vous côté particulier.");
              const seats = Number(val("seats", "1")),
                budget = Number(val("budget", String(s.preferences.budget)));
              if (
                !Number.isInteger(seats) ||
                seats < 1 ||
                seats > 20 ||
                !Number.isFinite(budget) ||
                budget < 0 ||
                !/^([01]\d|2[0-3]):[0-5]\d$/.test(val("from", "07:00")) ||
                !/^([01]\d|2[0-3]):[0-5]\d$/.test(val("to", "21:00")) ||
                val("from", "07:00") > val("to", "21:00")
              )
                throw Error("Vérifiez les horaires, le budget et les places.");
              const alert: AvailabilityAlert = {
                id: W.uid(),
                owner: me.id,
                coach: val("coach", focus),
                sport: val("sport", "Tout"),
                day: val("day", addDays(today(), 1)),
                from: val("from", "07:00"),
                to: val("to", "21:00"),
                budget,
                seats,
                groupOnly: flag || seats > 1,
                format: val("format", "Tous"),
                active: true,
                seen: [],
              };
              setStore({ ...s, alerts: [...(s.alerts ?? []), alert] });
              go("alerts-native");
            })
          }
        >
          Créer mon alerte
        </Button>
      </>
    );
  if (screen === "alerts-native")
    return (
      <>
        <Eyebrow>LE BON MOMENT FINIT PAR ARRIVER.</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>
          On garde{"\n"}une place à vos envies.
        </H1>
        {(s.alerts ?? [])
          .filter((a) => a.owner === me?.id)
          .map((a) => (
            <View key={a.id}>
              <H2>
                {a.coach
                  ? allCoaches(s).find((c) => c.id === a.coach)?.name
                  : a.sport}
              </H2>
              <P muted style={{ marginVertical: 12 }}>
                {dayLabel(a.day)} · {a.from}–{a.to}
                {"\n"}
                {a.seats} participant(s) · jusqu’à {euro(a.budget)}
              </P>
              {W.alertMatches(s, a)
                .slice(0, 6)
                .map((m) => (
                  <Setting
                    key={m.offer.id + m.time}
                    title={`${m.coach.name} · ${m.time}`}
                    description={`${euro(m.price)} · ${m.offer.kind}`}
                    onPress={() => choose(m.coach, m.day, m.time, m.offer)}
                  />
                ))}
              <TextButton
                onPress={() =>
                  setStore({
                    ...s,
                    alerts: s.alerts?.map((x) =>
                      x.id === a.id ? { ...x, active: !x.active } : x,
                    ),
                  })
                }
              >
                {a.active ? "Mettre en pause" : "Réactiver"}
              </TextButton>
              <TextButton
                onPress={() =>
                  setStore({
                    ...s,
                    alerts: s.alerts?.filter((x) => x.id !== a.id),
                  })
                }
              >
                Supprimer l’alerte
              </TextButton>
              <Rule />
            </View>
          ))}
        <Button onPress={() => go("new-alert")}>Créer une alerte</Button>
        <P small muted style={{ marginTop: 20 }}>
          Actualisation à chaque visite. Les places restent ouvertes jusqu’à
          confirmation.
        </P>
      </>
    );
  if (screen === "support-native")
    return (
      <>
        <H1>On suit{"\n"}votre demande.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Les réponses et décisions restent accessibles ici.
        </P>
        {(s.tickets ?? [])
          .filter((t) => t.owner === me?.id)
          .map((t) => (
            <Note key={t.id} style={{ marginBottom: 16 }}>
              <H2>{t.kind}</H2>
              <P>{t.body}</P>
              <P small muted style={{ marginTop: 12 }}>
                {t.status === "open" ? "En cours de traitement" : t.response}
              </P>
            </Note>
          ))}
        <Button onPress={() => go("report-native")}>Créer une demande</Button>
      </>
    );
  if (screen === "report-native")
    return (
      <>
        <H1>On est là{"\n"}pour vous.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Expliquez-nous ce qui s’est passé. Votre demande reste accessible dans
          votre espace.
        </P>
        {select(
          "Votre demande",
          "kind",
          [
            "Question sur ma séance",
            "Annulation / remboursement",
            "Coach absent",
            "Signaler un comportement",
            "Signaler un avis",
            "Autre",
          ],
          "Question sur ma séance",
        )}
        {field("Votre message", "body", "", true)}
        <Button
          onPress={() =>
            run(() => {
              setStore(
                W.report(s, {
                  body: val("body"),
                  kind: val("kind", "Question sur ma séance"),
                  ...(focus.startsWith("review:")
                    ? { review: focus.slice(7) }
                    : focus.startsWith("coach:")
                      ? { coach: focus.slice(6) }
                      : focus === "booking" && b
                        ? { booking: b.id, coach: b.coach }
                        : {}),
                }),
              );
              go("support-native");
              message("Votre demande a été enregistrée.");
            })
          }
        >
          Envoyer ma demande
        </Button>
      </>
    );
  if (screen === "team") {
    if (!s.testMode)
      return (
        <Note>
          Activez le mode Test pour accéder à cet espace de démonstration.
        </Note>
      );
    return (
      <>
        <Eyebrow>LES COULISSES DE LA RENCONTRE</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>Chaque demande{"\n"}a une suite.</H1>
        <Note>
          Équipe Partant · simulation. Aucun contrôle documentaire réel.
        </Note>
        <H2 style={{ marginVertical: 20 }}>Dossiers coach</H2>
        {allCoaches(s)
          .filter((c) => configFor(s, c.id).dossier.status === "pending")
          .map((c) => (
            <View key={c.id}>
              <Setting
                title={c.name}
                description="Dossier en attente"
                onPress={() => setSelection(c.id)}
              />
              {selection === c.id && (
                <>
                  <Note>
                    {configFor(s, c.id).dossier.documents.join(" · ")}
                  </Note>
                  {select(
                    "Décision",
                    "docStatus",
                    [
                      ["approved", "Valider"],
                      ["correction", "Demander une correction"],
                      ["rejected", "Refuser"],
                    ],
                    "approved",
                  )}
                  {field("Motif de la décision", "docReason", "", true)}
                  <Button
                    onPress={() =>
                      update((x) =>
                        W.reviewDossier(
                          x,
                          c.id,
                          val("docStatus", "approved") as
                            | "approved"
                            | "correction"
                            | "rejected",
                          val("docReason"),
                        ),
                      )
                    }
                  >
                    Enregistrer la décision
                  </Button>
                </>
              )}
            </View>
          ))}
        <H2 style={{ marginVertical: 20 }}>Demandes d’assistance</H2>
        {(s.tickets ?? []).map((t) => (
          <View key={t.id}>
            <Setting
              title={t.kind}
              description={t.body}
              onPress={() => setSelection(t.id)}
            />
            {selection === t.id && t.status === "open" && (
              <>
                <Select
                  label="Traitement"
                  value={decision}
                  items={[
                    "Répondre",
                    ...(t.booking ? ["Rembourser la séance"] : []),
                    ...(t.review ? ["Masquer l’avis"] : []),
                    ...(t.coach ? ["Suspendre le profil"] : []),
                  ]}
                  onChange={setDecision}
                />
                {field("Réponse motivée", "response", "", true)}
                <Button
                  onPress={() =>
                    update((x) =>
                      W.resolveTicket(x, t.id, val("response"), decision),
                    )
                  }
                >
                  Clôturer la demande
                </Button>
              </>
            )}
            {t.status === "resolved" && (
              <P small muted>
                {t.response}
              </P>
            )}
          </View>
        ))}
      </>
    );
  }
  if (screen === "group-details-native") {
    const g = s.groups?.find((g) => g.id === focus),
      coach = allCoaches(s).find((c) => c.id === g?.offer.coach);
    if (!g || !coach) return <Note>Cours introuvable.</Note>;
    const left = remaining(g.offer, g.day, g.time, s),
      eligible =
        !g.cancelled &&
        configFor(s, coach.id).published &&
        instant(g.day, g.time) > now();
    return (
      <>
        <Photo
          index={coach.photo}
          uri={coach.photoUri}
          height={190}
          style={{ borderRadius: 18 }}
        />
        <P small style={{ marginTop: 20 }}>
          {left ? `${left} places disponibles` : "Cours complet"}
        </P>
        <H1 style={{ marginVertical: 20 }}>{g.offer.name}</H1>
        <P muted>
          Avec {coach.name} · {coach.sport}
        </P>
        <Note style={{ marginVertical: 24 }}>
          <P bold>
            {dayLabel(g.day)} · {g.time}
          </P>
          <P>
            {g.offer.duration} min · {g.level ?? "Tous niveaux"}
            {"\n"}
            {g.offer.capacity} participants maximum
          </P>
        </Note>
        <H2>Le lieu du groupe</H2>
        <P style={{ marginVertical: 20 }}>{g.address}</P>
        <Note>
          {euro(g.offer.price)} par personne, frais inclus. Le cours est
          maintenu dès la première inscription. Chaque réservation suit ses
          propres conditions d’annulation.
        </Note>
        <P small muted style={{ marginVertical: 20 }}>
          Annulation gratuite jusqu’à {g.cancelHours ?? 24} h avant. Si le coach
          annule, toutes les réservations sont intégralement remboursées dans la
          simulation.
        </P>
        <Button
          disabled={!eligible || left < 1}
          onPress={() => choose(coach, g.day, g.time, g.offer)}
        >
          {!eligible
            ? "Inscriptions fermées"
            : left
              ? "Choisir mes places"
              : "Cours complet"}
        </Button>
        <TextButton onPress={() => go("new-alert", coach.id)}>
          Me prévenir si une place se libère
        </TextButton>
      </>
    );
  }
  if (screen === "group-manage") {
    const g = s.groups?.find((g) => g.id === focus);
    if (!g || me?.role !== "coach" || g.offer.coach !== active)
      return <Note>Cours inaccessible.</Note>;
    const bookings = s.bookings.filter(
      (b) =>
        b.offerId === g.offer.id &&
        b.day === g.day &&
        b.time === g.time &&
        b.status !== "cancelled",
    );
    return (
      <>
        <H1>{g.offer.name}</H1>
        <P muted style={{ marginVertical: 20 }}>
          {dayLabel(g.day)} · {g.time}
          {"\n"}
          {g.offer.duration} min · {g.address}
        </P>
        <Note>
          {g.cancelled
            ? "Cours annulé"
            : `${bookings.reduce((n, b) => n + b.seats, 0)} / ${g.offer.capacity} places réservées · ${euro(g.offer.price)}/personne`}
        </Note>
        <H2 style={{ marginVertical: 20 }}>Les participants</H2>
        {bookings.map(appointment)}
        {!g.cancelled && (
          <>
            {field("Motif d’annulation", "reason", "", true)}
            <Button light onPress={() => setConfirm(true)}>
              Annuler ce cours
            </Button>
            {confirm && (
              <Note style={{ marginTop: 20 }}>
                <P>
                  Tous les participants seront prévenus et intégralement
                  remboursés dans la simulation.
                </P>
                <Button
                  style={{ marginTop: 16 }}
                  onPress={() =>
                    update((x) => W.closeGroup(x, g.id, val("reason")))
                  }
                >
                  Confirmer l’annulation du cours
                </Button>
              </Note>
            )}
          </>
        )}
      </>
    );
  }
  if (screen === "partial-native" && b)
    return (
      <>
        <H1>Les places qui restent.</H1>
        <P muted style={{ marginVertical: 20 }}>
          {b.serviceName} · {b.seats} places actuellement.
        </P>
        {select(
          "Places à conserver",
          "seats",
          Array.from({ length: Math.max(0, b.seats - 1) }, (_, i) =>
            String(i + 1),
          ),
          "1",
        )}
        <Note>
          Remboursement simulé :{" "}
          {euro(
            instant(b.day, b.time) - now() >= (b.cancelHours ?? 24) * 3600000
              ? ((b.seats - Number(val("seats", "1"))) * b.price) / b.seats
              : 0,
          )}
          . Les places annulées après le délai restent dues.
        </Note>
        <Button
          style={{ marginTop: 20 }}
          onPress={() =>
            run(() => {
              setStore(W.partialCancel(s, b.id, Number(val("seats", "1"))));
              go("bookingDetail");
            })
          }
        >
          Confirmer les places à garder
        </Button>
      </>
    );
  if (screen === "transfer-native" && b) {
    const targets = W.transferCandidates(s, b);
    return (
      <>
        <H1>Un autre cours,{"\n"}le même élan.</H1>
        <P muted style={{ marginVertical: 20 }}>
          Transférez toutes vos places chez le même coach. Votre conversation
          reste la même.
        </P>
        {targets.map((g) => (
          <Choice
            key={g.id}
            title={`${dayLabel(g.day, true)} · ${g.time}`}
            description={`${g.offer.name} · ${g.offer.duration} min · ${g.address}`}
            price={`${euro(g.offer.price)}/pers.`}
            active={quoted?.group === g.id}
            onPress={() =>
              setQuoted({
                before: W.fingerprint(b),
                group: g.id,
                price: g.offer.price,
              })
            }
          />
        ))}
        {!targets.length && <Note>Aucun cours compatible pour le moment.</Note>}
        {quoted && (
          <>
            <Note style={{ marginVertical: 20 }}>
              <P>Places actuelles : {euro(b.price)}</P>
              <P>Nouvelles places : {euro(quoted.price * b.seats)}</P>
              <P bold>
                {quoted.price * b.seats >= b.price
                  ? "Supplément simulé"
                  : "Remboursement simulé"}{" "}
                : {euro(Math.abs(quoted.price * b.seats - b.price))}
              </P>
              <P small>
                Conditions d’annulation du nouveau cours :{" "}
                {configFor(s, b.coach).cancelHours} h avant. Si ce délai est
                déjà dépassé, les nouvelles places ne seront plus annulables
                gratuitement.
              </P>
            </Note>
            <Button
              onPress={() =>
                run(() => {
                  setStore(
                    W.transfer(
                      s,
                      b.id,
                      quoted.group,
                      quoted.before,
                      quoted.price,
                    ),
                  );
                  go("bookingDetail");
                })
              }
            >
              Confirmer le transfert
            </Button>
            {s.testMode && (
              <TextButton
                onPress={() => {
                  setQuoted(null);
                  message(
                    "Paiement refusé dans la démo. Votre réservation initiale est conservée.",
                  );
                }}
              >
                Tester un incident de paiement
              </TextButton>
            )}
          </>
        )}
      </>
    );
  }
  if (screen === "proposal-create" && b)
    return (
      <>
        <H1>Proposer un changement.</H1>
        <P muted style={{ marginVertical: 20 }}>
          La réservation initiale reste confirmée jusqu’à l’accord du client.
          Aucun supplément n’est facturé.
        </P>
        {b.kind === "Groupe" ? (
          select(
            "Cours de remplacement",
            "group",
            W.transferCandidates(s, b)
              .filter((g) => g.offer.price * b.seats === b.price)
              .map(
                (g) =>
                  [g.id, `${g.offer.name} · ${g.day} ${g.time}`] as [
                    string,
                    string,
                  ],
              ),
            "",
          )
        ) : (
          <>
            {select("Nouvelle date", "day", dates, b.day)}
            {field("Horaire", "time", b.time)}
            {field("Adresse du rendez-vous", "address", b.address)}
          </>
        )}
        {field("Message au client", "reason", "", true)}
        <Button
          onPress={() =>
            run(() => {
              const g = s.groups?.find((g) => g.id === val("group"));
              if (b.kind === "Groupe" && !g)
                throw Error("Choisissez un cours de remplacement.");
              setStore(
                W.addProposal(
                  s,
                  b.id,
                  g
                    ? {
                        day: g.day,
                        time: g.time,
                        address: g.address,
                        offerId: g.offer.id,
                      }
                    : {
                        day: val("day", b.day),
                        time: val("time", b.time),
                        address: val("address", b.address),
                      },
                  val("reason"),
                ),
              );
              go("bookingDetail");
              message("Proposition envoyée au client.");
            })
          }
        >
          Envoyer la proposition
        </Button>
      </>
    );
  if (screen === "proposal-native") {
    const prop = s.proposals?.find((p) => p.id === focus),
      booking = s.bookings.find((b) => b.id === prop?.booking);
    if (!prop || !booking || !W.canRead(s, booking))
      return <Note>Proposition indisponible.</Note>;
    return (
      <>
        <H1>Un autre moment ?</H1>
        <P style={{ marginVertical: 20 }}>{prop.reason}</P>
        <Note>
          <Eyebrow>RÉSERVATION ACTUELLE</Eyebrow>
          <P bold>
            {dayLabel(booking.day)} · {booking.time}
          </P>
          <P>{booking.address}</P>
          <Rule />
          <Eyebrow>PROPOSITION</Eyebrow>
          <P bold>
            {dayLabel(prop.target.day)} · {prop.target.time}
          </P>
          <P>{prop.target.address}</P>
          <P small style={{ marginTop: 16 }}>
            Prix conservé : {euro(W.net(booking))} · {booking.seats}{" "}
            participant(s)
          </P>
        </Note>
        <P style={{ marginVertical: 20 }}>
          {
            {
              pending: "En attente de réponse",
              accepted: "Acceptée",
              declined: "Refusée",
              withdrawn: "Retirée",
              expired: "Expirée",
            }[prop.status]
          }
        </P>
        {prop.status === "pending" &&
          (me?.role === "coach" ? (
            <Button
              light
              onPress={() =>
                update((x) => W.answerProposal(x, prop.id, "withdrawn"))
              }
            >
              Retirer ma proposition
            </Button>
          ) : (
            <>
              <Button
                onPress={() =>
                  update((x) => W.answerProposal(x, prop.id, "accepted"))
                }
              >
                Accepter le changement
              </Button>
              <TextButton
                onPress={() =>
                  update((x) => W.answerProposal(x, prop.id, "declined"))
                }
              >
                Garder ma séance initiale
              </TextButton>
            </>
          ))}
        <TextButton
          onPress={() => {
            selectBooking(booking.id);
            go("chat");
          }}
        >
          En parler dans la conversation
        </TextButton>
      </>
    );
  }
  if (screen === "checklist-native") {
    const issues = W.publicationIssues(s, active);
    return (
      <>
        <Eyebrow>VOTRE ACTIVITÉ PREND FORME</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>
          Faisons place{"\n"}à vos prochains clients.
        </H1>
        <P muted>Avancez à votre rythme : tout est enregistré.</P>
        {[
          ["profile", "Présentez-vous"],
          ["offers", "Créez votre offre"],
          ["places", "Choisissez vos lieux"],
          ["schedule", "Ouvrez votre planning"],
          ["documents", "Vérifiez votre profil"],
          ["payout", "Activez vos versements"],
        ].map(([id, title], i) => (
          <Setting
            key={id}
            title={`${i + 1} · ${title}`}
            onPress={() => go("config-native", id)}
          />
        ))}
        {!!issues.length && (
          <Note style={{ marginVertical: 20 }}>{issues.join("\n")}</Note>
        )}
        <Button
          disabled={!!issues.length}
          onPress={() =>
            run(() => {
              if (!cfg.published) setStore(W.publish(s, active));
              openCoach(active);
            })
          }
        >
          {cfg.published
            ? "Voir mon profil public"
            : "Publier mon profil de démonstration"}
        </Button>
      </>
    );
  }
  return (
    <Note>
      Ce parcours n’est pas accessible dans cet état. Revenez à votre espace.
    </Note>
  );
}
export function BookingExtras(p: FlowProps) {
  const { store: s, setStore, bookingId, go, message } = p,
    b = s.bookings.find((b) => b.id === bookingId);
  const [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  if (!b || !W.canRead(s, b)) return null;
  const coach = s.account?.role === "coach",
    future = b.status === "confirmed" && instant(b.day, b.time) > now();
  const run = async (fn: () => void | Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      message((e as Error).message);
    }
  };
  return (
    <>
      <Rule />
      {b.preparation && (
        <>
          <H2 style={{ marginBottom: 14 }}>Bien préparer votre séance</H2>
          {Object.entries(b.preparation).map(([key, text]) => (
            <P key={key} style={{ marginBottom: 12 }}>
              {text}
            </P>
          ))}
          {!coach && (
            <Toggle
              label="J’ai préparé mes affaires"
              value={!!b.prepared}
              onChange={(prepared) =>
                setStore({
                  ...s,
                  bookings: s.bookings.map((x) =>
                    x.id === b.id ? { ...x, prepared } : x,
                  ),
                })
              }
            />
          )}
        </>
      )}
      <Button
        light
        onPress={() =>
          run(() =>
            exportFile(
              `partant-${b.id}.ics`,
              W.sessionICS(
                b,
                allCoaches(s).find((c) => c.id === b.coach)?.name ??
                  "Mon coach",
              ),
              "text/calendar",
            ),
          )
        }
      >
        Ajouter à mon calendrier
      </Button>
      {future && coach && (
        <>
          <Button
            light
            style={{ marginTop: 12 }}
            onPress={() => go("proposal-create")}
          >
            Proposer un autre horaire / lieu
          </Button>
          <TextButton onPress={() => setConfirm(!confirm)}>
            Annuler la séance côté coach
          </TextButton>
          {confirm && (
            <>
              <Field
                label="Motif de l’annulation"
                value={reason}
                onChange={setReason}
                multiline
              />
              <Note>
                Le client sera intégralement remboursé dans la simulation.
              </Note>
              <Button
                style={{ marginTop: 16 }}
                onPress={() =>
                  run(() => {
                    setStore(W.cancelSession(s, b.id, reason));
                    setConfirm(false);
                    message("Le client a été prévenu.");
                  })
                }
              >
                Confirmer l’annulation
              </Button>
            </>
          )}
        </>
      )}
      {future && !coach && b.kind === "Groupe" && (
        <>
          <TextButton onPress={() => go("transfer-native")}>
            Changer de cours
          </TextButton>
          {b.seats > 1 && (
            <TextButton onPress={() => go("partial-native")}>
              Annuler certaines places
            </TextButton>
          )}
        </>
      )}
      {!coach &&
        b.status === "completed" &&
        !b.noShow &&
        !s.reviews?.some((r) => r.booking === b.id) && (
          <Button style={{ marginTop: 16 }} onPress={() => go("review-native")}>
            Laisser un avis
          </Button>
        )}
      {s.testMode && coach && b.status === "confirmed" && (
        <>
          <TextButton
            onPress={() =>
              setStore({
                ...s,
                bookings: s.bookings.map((x) =>
                  x.id === b.id ? { ...x, status: "completed" } : x,
                ),
              })
            }
          >
            Simuler une séance terminée
          </TextButton>
          <TextButton
            onPress={() =>
              setStore({
                ...s,
                bookings: s.bookings.map((x) =>
                  x.id === b.id
                    ? { ...x, status: "completed", noShow: true }
                    : x,
                ),
              })
            }
          >
            Signaler une absence · démo
          </TextButton>
        </>
      )}
      {s.proposals
        ?.filter((p) => p.booking === b.id)
        .map((p) => (
          <Setting
            key={p.id}
            title={`${dayLabel(p.target.day, true)} · ${p.target.time}`}
            description={`Proposition du coach · ${p.status}`}
            onPress={() => go("proposal-native", p.id)}
          />
        ))}
      {!!b.changes?.length && (
        <>
          <H2 style={{ marginVertical: 20 }}>Historique des changements</H2>
          {b.changes.map((x, i) => (
            <P small key={i} style={{ marginBottom: 12 }}>
              {x}
            </P>
          ))}
        </>
      )}
      <Rule />
      <Row between>
        <P>Paiements cumulés</P>
        <P bold>{euro(b.paid ?? b.price)}</P>
      </Row>
      <Row between>
        <P>Remboursements cumulés</P>
        <P bold>{euro(b.refunded ?? 0)}</P>
      </Row>
      <Row between>
        <P>Total net</P>
        <P bold>{euro(W.net(b))}</P>
      </Row>
      {s.refunds
        ?.filter((r) => r.booking === b.id)
        .map((r) => (
          <Note key={r.id} style={{ marginTop: 14 }}>
            <P>
              {euro(r.amount)} ·{" "}
              {r.status === "pending"
                ? "En cours de traitement"
                : "Remboursement confirmé"}
            </P>
            {s.testMode && r.status === "pending" && (
              <TextButton
                onPress={() =>
                  setStore({
                    ...s,
                    refunds: s.refunds?.map((x) =>
                      x.id === r.id ? { ...x, status: "settled" } : x,
                    ),
                  })
                }
              >
                Simuler la confirmation bancaire
              </TextButton>
            )}
          </Note>
        ))}
      <TextButton onPress={() => go("report-native", "booking")}>
        Signaler un imprévu
      </TextButton>
    </>
  );
}
