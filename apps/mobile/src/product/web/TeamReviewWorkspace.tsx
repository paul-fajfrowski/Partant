import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { Store } from "../model";
import { allCoaches, configFor, today } from "../model";
import { PracticeReviewPanel } from "../PracticeReviewPanel";
import { openDocument } from "../deviceFiles";
import {
  practiceState,
  professionalStatuses,
  proofKinds,
  reviewLabels,
  toVerification,
} from "../verification";
import { Chip, Field, H1, H2, Note, P, Row, TextButton } from "../ui";
import { tokens as t } from "../tokens";

export type TeamReviewWorkspaceProps = {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  message: (text: string) => void;
  coachId?: string;
  onSupport?: () => void;
};

type QueueFilter = "pending" | "followup" | "reviewed" | "all";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
const dateLabel = (value?: string) => {
  if (!value || Number.isNaN(Date.parse(value))) return "Date non renseignée";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Desktop presentation only; permissions, files and decisions use the shared domain. */
export function TeamReviewWorkspace({
  store,
  setStore,
  message,
  coachId,
  onSupport,
}: TeamReviewWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [selected, setSelected] = useState(coachId ?? "");
  const [page, setPage] = useState(0);
  const [historyCount, setHistoryCount] = useState(6);
  const [showLibrary, setShowLibrary] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 1380;
  const date = today();
  const entries = useMemo(
    () =>
      allCoaches(store).map((coach) => {
        const dossier = configFor(store, coach.id).dossier;
        const verification = toVerification(dossier, coach, date);
        const practices = verification.practices.map((name) => ({
          name,
          status: practiceState(verification, name, date),
        }));
        const pending = practices.filter((p) => p.status === "pending");
        const submitted = pending
          .map((p) => verification.reviews[p.name]?.at)
          .filter((at): at is string => !!at && !Number.isNaN(Date.parse(at)))
          .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
        return { coach, dossier, verification, practices, pending, submitted };
      }),
    [store, date],
  );
  const counts = {
    pending: entries.filter((e) => e.pending.length).length,
    followup: entries.filter((e) =>
      e.practices.some((p) => ["correction", "expired"].includes(p.status)),
    ).length,
    reviewed: entries.filter((e) =>
      e.practices.some((p) => ["approved", "rejected"].includes(p.status)),
    ).length,
    all: entries.length,
  };
  const matching = entries
    .filter((entry) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "pending"
          ? !!entry.pending.length
          : entry.practices.some((p) =>
              (filter === "followup"
                ? ["correction", "expired"]
                : ["approved", "rejected"]
              ).includes(p.status),
            ));
      return (
        matchesFilter &&
        normalize(
          `${entry.coach.name} ${entry.coach.area} ${entry.practices.map((p) => p.name).join(" ")}`,
        ).includes(normalize(query.trim()))
      );
    })
    .sort((a, b) => {
      if (filter === "pending") {
        const aDate = a.submitted ? Date.parse(a.submitted) : Infinity;
        const bDate = b.submitted ? Date.parse(b.submitted) : Infinity;
        if (aDate !== bDate) return aDate - bDate;
      }
      return a.coach.name.localeCompare(b.coach.name, "fr");
    });
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(matching.length / 10) - 1),
  );
  const shown = matching.slice(currentPage * 10, currentPage * 10 + 10);
  const entry = entries.find((e) => e.coach.id === selected) ?? shown[0];
  const changeSelection = (id: string) => {
    setSelected(id);
    setHistoryCount(6);
    setShowLibrary(false);
  };

  if (!store.staff)
    return <Note>Cet espace est réservé à l’équipe Partant habilitée.</Note>;

  return (
    <View testID="web-team-review" style={s.workspace}>
      <Row between wrap style={{ gap: 16, marginBottom: 24 }}>
        <View style={{ flex: 1, minWidth: 240 }}>
          <H1>Les prochains coachs Partant.</H1>
          <P muted style={{ marginTop: 8 }}>
            Une décision par pratique. Un suivi clair pour chaque coach.
          </P>
        </View>
        {onSupport && (
          <TextButton onPress={onSupport}>Demandes d’assistance</TextButton>
        )}
      </Row>
      {!store.connected && (
        <Note style={{ marginBottom: 20 }}>
          Simulation équipe · les justificatifs et les décisions sont fictifs.
        </Note>
      )}
      <View style={[s.columns, !wide && { flexDirection: "column" }]}>
        <View
          style={[
            s.queue,
            !wide && { width: "100%", borderRightWidth: 0, paddingRight: 0 },
          ]}
        >
          <Field
            label="Rechercher un dossier"
            placeholder="Coach, pratique ou secteur"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(0);
              setSelected("");
            }}
          />
          <Row wrap style={{ gap: 8, marginBottom: 18 }}>
            {(
              [
                ["pending", "À examiner"],
                ["followup", "À compléter"],
                ["reviewed", "Traités"],
                ["all", "Tous"],
              ] as [QueueFilter, string][]
            ).map(([key, label]) => (
              <Chip
                key={key}
                active={filter === key}
                onPress={() => {
                  setFilter(key);
                  setPage(0);
                  setSelected("");
                  setHistoryCount(6);
                  setShowLibrary(false);
                }}
              >
                {`${label} · ${counts[key]}`}
              </Chip>
            ))}
          </Row>
          <P small muted style={{ marginBottom: 12 }}>
            {matching.length} dossier{matching.length !== 1 ? "s" : ""}
            {filter === "pending" ? " · les plus anciens d’abord" : ""}
          </P>
          {!shown.length && (
            <View style={s.empty}>
              <H2>{query ? "Aucun résultat" : "Tout est à jour"}</H2>
              <P muted style={{ marginTop: 8 }}>
                {query
                  ? "Essayez un autre nom ou une autre pratique."
                  : "Aucun dossier dans cette rubrique."}
              </P>
            </View>
          )}
          {shown.map((item) => (
            <Pressable
              key={item.coach.id}
              accessibilityRole="button"
              accessibilityState={{
                selected: entry?.coach.id === item.coach.id,
              }}
              accessibilityLabel={`Examiner le dossier de ${item.coach.name}`}
              onPress={() => changeSelection(item.coach.id)}
              style={({ pressed }) => [
                s.queueItem,
                entry?.coach.id === item.coach.id && s.selected,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Row between style={{ gap: 12 }}>
                <P bold style={{ flex: 1 }}>
                  {item.coach.name}
                </P>
                {!!item.pending.length && (
                  <View style={s.count}>
                    <P small bold>
                      {item.pending.length}
                    </P>
                  </View>
                )}
              </Row>
              <P small muted numberOfLines={2} style={{ marginTop: 5 }}>
                {item.practices.map((p) => p.name).join(" · ")}
              </P>
              <P small muted style={{ marginTop: 12 }}>
                {item.pending.length
                  ? `En attente · ${dateLabel(item.submitted)}`
                  : item.coach.area}
              </P>
            </Pressable>
          ))}
          {matching.length > 10 && (
            <Row between style={{ gap: 12, marginTop: 16 }}>
              <Pager
                label="Précédent"
                disabled={currentPage === 0}
                onPress={() => {
                  setPage(currentPage - 1);
                  setSelected("");
                }}
              />
              <P small muted>
                {currentPage + 1} / {Math.ceil(matching.length / 10)}
              </P>
              <Pager
                label="Suivant"
                disabled={(currentPage + 1) * 10 >= matching.length}
                onPress={() => {
                  setPage(currentPage + 1);
                  setSelected("");
                }}
              />
            </Row>
          )}
        </View>
        <View style={s.detail}>
          {!entry ? (
            <View style={s.empty}>
              <H2>Le prochain dossier apparaîtra ici.</H2>
              <P muted style={{ marginTop: 8 }}>
                Les justificatifs sont accessibles uniquement à l’équipe
                habilitée.
              </P>
            </View>
          ) : (
            <>
              <View style={s.detailHeader}>
                <P small muted>
                  DOSSIER COACH
                </P>
                <H2 style={{ fontSize: 28, lineHeight: 34, marginTop: 8 }}>
                  {entry.coach.name}
                </H2>
                <P muted style={{ marginTop: 5 }}>
                  {entry.coach.area} ·{" "}
                  {
                    professionalStatuses.find(
                      ([key]) => key === entry.verification.professionalStatus,
                    )?.[1]
                  }
                </P>
                <Row wrap style={{ gap: 8, marginTop: 18 }}>
                  {entry.practices.map((practice) => (
                    <View key={practice.name} style={s.status}>
                      <P small>
                        {practice.name} · {reviewLabels[practice.status]}
                      </P>
                    </View>
                  ))}
                </Row>
              </View>
              {!!entry.pending.length ? (
                <PracticeReviewPanel
                  key={entry.coach.id}
                  store={store}
                  coach={entry.coach}
                  setStore={setStore}
                  message={message}
                />
              ) : (
                <Note style={{ marginVertical: 22 }}>
                  Aucune pratique en attente pour ce coach. Les décisions et
                  leurs motifs restent consultables ci-dessous.
                </Note>
              )}
              <View style={s.history}>
                <Row between wrap style={{ gap: 12 }}>
                  <H2>Suivi du dossier</H2>
                  <TextButton onPress={() => setShowLibrary(!showLibrary)}>
                    {showLibrary
                      ? "Masquer les justificatifs"
                      : `Voir les justificatifs (${entry.verification.files.length})`}
                  </TextButton>
                </Row>
                {showLibrary && (
                  <View style={{ marginVertical: 12 }}>
                    {entry.verification.files.map((file) => (
                      <View key={file.id} style={s.libraryItem}>
                        <P bold>{file.title}</P>
                        <P small muted>
                          {proofKinds[file.kind]}
                          {file.expires
                            ? ` · Valable jusqu’au ${dateLabel(file.expires)}`
                            : ""}
                        </P>
                        {store.connected ? (
                          <TextButton
                            onPress={() =>
                              openDocument(file.path).catch((error) =>
                                message(
                                  error instanceof Error
                                    ? error.message
                                    : "Impossible d’ouvrir ce document.",
                                ),
                              )
                            }
                          >
                            Ouvrir · {file.title}
                          </TextButton>
                        ) : (
                          <P small muted style={{ marginTop: 8 }}>
                            Justificatif fictif
                          </P>
                        )}
                      </View>
                    ))}
                    {!entry.verification.files.length && (
                      <P muted>Aucun justificatif ajouté.</P>
                    )}
                  </View>
                )}
                {[...entry.dossier.history]
                  .sort(
                    (a, b) =>
                      (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0),
                  )
                  .slice(0, historyCount)
                  .map((event, index) => (
                    <View key={`${event.date}:${index}`} style={s.historyItem}>
                      <Row between wrap style={{ gap: 8 }}>
                        <P bold>
                          {event.practice ?? "Dossier"} ·{" "}
                          {reviewLabels[
                            event.status as keyof typeof reviewLabels
                          ] ?? "Mise à jour"}
                        </P>
                        <P small muted>
                          {dateLabel(event.date)}
                        </P>
                      </Row>
                      {!!event.reason && (
                        <P style={{ marginTop: 6 }}>{event.reason}</P>
                      )}
                      {!!event.by && (
                        <P small muted style={{ marginTop: 5 }}>
                          Auteur :{" "}
                          {event.by === store.account?.id
                            ? "vous"
                            : "Équipe Partant"}
                        </P>
                      )}
                    </View>
                  ))}
                {!entry.dossier.history.length && (
                  <P muted style={{ marginTop: 14 }}>
                    Aucune décision enregistrée.
                  </P>
                )}
                {entry.dossier.history.length > historyCount && (
                  <TextButton onPress={() => setHistoryCount(historyCount + 6)}>
                    Voir les événements précédents
                  </TextButton>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function Pager({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.pager, disabled && { opacity: 0.35 }]}
    >
      <P small bold>
        {label}
      </P>
    </Pressable>
  );
}

const s = StyleSheet.create({
  workspace: { padding: 28 },
  columns: { flexDirection: "row", gap: 32, alignItems: "flex-start" },
  queue: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: t.border,
    paddingRight: 24,
  },
  queueItem: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 8,
    minHeight: 100,
  },
  selected: { backgroundColor: t.fog, borderColor: t.border },
  count: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  detail: { flex: 1, minWidth: 0, width: "100%", maxWidth: 820 },
  detailHeader: {
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  status: {
    borderRadius: 99,
    backgroundColor: t.fog,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  history: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: t.border,
    paddingTop: 20,
  },
  historyItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  libraryItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  empty: { paddingVertical: 28 },
  pager: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 99,
    backgroundColor: t.fog,
  },
});
