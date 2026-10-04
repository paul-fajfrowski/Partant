import * as Crypto from "expo-crypto";
import React, { useEffect, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { supabase } from "../lib/supabase";
import { allCoaches, configFor, today, Store } from "./model";
import { PracticeReviewPanel } from "./PracticeReviewPanel";
import { toVerification, practiceState, reviewLabels } from "./verification";
import { openDocument } from "./deviceFiles";
import { useLocalBack } from "./BackNavigation";
import {
  Button,
  Chip,
  Field,
  H1,
  H2,
  Note,
  P,
  Row,
  Setting,
  TextButton,
} from "./ui";

type Item = {
  id: string;
  name: string;
  area: string;
  practices: string[];
  assignment: "mine" | "free" | "other";
  status: string;
};
type Queue = { items: Item[]; total: number; page: number };
async function request(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("product-api", {
    body,
  });
  if (error) {
    let text =
      "Impossible de charger cet espace. Vérifiez votre connexion et votre accès équipe.";
    try {
      text = (await error.context?.json())?.error ?? text;
    } catch {}
    throw Object.assign(Error(text), { status: error.context?.status });
  }
  if (data?.error) throw Error(data.error);
  return data;
}
export function ConnectedTeamWorkspace({
  onChanged,
  onNavigate,
  canReleaseOthers = false,
  onSupport,
  message,
}: {
  onChanged: () => Promise<unknown>;
  onNavigate: () => void;
  onSupport?: () => void;
  canReleaseOthers?: boolean;
  message: (s: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("pending"),
    [page, setPage] = useState(0),
    [revision, setRevision] = useState(0);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [historyCount, setHistoryCount] = useState(6),
    [library, setLibrary] = useState(false);
  const [queue, setQueue] = useState<Queue>({ items: [], total: 0, page: 0 }),
    [selected, setSelected] = useState<Item | null>(null);
  const [detail, setDetail] = useState<{
      store: Store;
      version: number;
    } | null>(null),
    [loading, setLoading] = useState(true),
    [detailLoading, setDetailLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const decisionAttempt=useRef<{key:string;id:string}|null>(null);
  const alive = useRef(true),
    detailRequest = useRef(0),
    queueRequest = useRef(0);
  const wide = useWindowDimensions().width >= 1200;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      detailRequest.current++;
      queueRequest.current++;
    };
  }, []);
  function close() {
    detailRequest.current++;
    setConfirmRelease(false);
    setSelected(null);
    onNavigate();
    setDetail(null);
    setError("");
  }
  useLocalBack(!!selected, close, 20);
  useLocalBack(confirmRelease, () => setConfirmRelease(false), 25);
  useEffect(() => {
    const seq = ++queueRequest.current;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      void request({ team: { action: "list", query, filter, page } })
        .then((data) => {
          if (seq !== queueRequest.current || !alive.current) return;
          if (page > 0 && page * 10 >= data.total) {
            setPage(Math.max(0, Math.ceil(data.total / 10) - 1));
            return;
          }
          setQueue(data);
        })
        .catch((e) => {
          if (seq === queueRequest.current && alive.current) {
            setQueue({ items: [], total: 0, page });
            setError(e.message);
            setDetail(null);
          }
        })
        .finally(() => {
          if (seq === queueRequest.current && alive.current) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      queueRequest.current++;
    };
  }, [query, filter, page, revision]);
  async function open(item: Item) {
    const seq = ++detailRequest.current;
    setConfirmRelease(false);
    setHistoryCount(6);
    setLibrary(false);
    setSelected(item);
    onNavigate();
    setDetail(null);
    setDetailLoading(true);
    setError("");
    try {
      const data = await request({
        team: { action: "detail", coach: item.id },
      });
      if (alive.current && seq === detailRequest.current) setDetail(data);
    } catch (e) {
      if (alive.current && seq === detailRequest.current)
        setError((e as Error).message);
    } finally {
      if (alive.current && seq === detailRequest.current)
        setDetailLoading(false);
    }
  }
  async function assign(release = false) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await request({
        team: { action: release ? "release" : "claim", coach: selected.id },
      });
      if (!result.changed)
        throw Error("Ce dossier est déjà pris en charge par un autre membre.");
      if (alive.current) {
        setConfirmRelease(false);
        setSelected({ ...selected, assignment: release ? "free" : "mine" });
        setRevision((x) => x + 1);
      }
    } catch (e) {
      if (alive.current) {
        setError((e as Error).message);
        setDetail(null);
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const coach =
    detail && allCoaches(detail.store).find((c) => c.id === selected?.id);
  const dossier =
    coach && detail ? configFor(detail.store, coach.id).dossier : null;
  const verification =
    coach && dossier ? toVerification(dossier, coach, today()) : null;
  return (
    <View testID="connected-team" style={{ padding: 24, gap: 24 }}>
      <Row between wrap>
        <H1>Les dossiers coachs.</H1>
        {onSupport && (
          <TextButton onPress={onSupport}>Demandes d’assistance</TextButton>
        )}
      </Row>
      {!!error && <Note>{error}</Note>}
      <View style={{ flexDirection: wide ? "row" : "column", gap: 32 }}>
        {(wide || !selected) && (
          <View style={{ width: wide ? 340 : "100%", gap: 12 }}>
            <Field
              label="Rechercher un dossier"
              placeholder="Nom ou pratique"
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(0);
                close();
              }}
            />
            <Row wrap style={{ gap: 8 }}>
              {[
                ["pending", "À examiner"],
                ["mine", "Mes dossiers"],
                ["all", "Tous"],
              ].map(([key, label]) => (
                <Chip
                  key={key}
                  active={filter === key}
                  onPress={() => {
                    setFilter(key);
                    setPage(0);
                    close();
                  }}
                >
                  {label}
                </Chip>
              ))}
            </Row>
            <P muted>
              {loading
                ? "Chargement…"
                : `${queue.total} dossier${queue.total > 1 ? "s" : ""}`}
            </P>
            {!loading && !queue.items.length && !error && (
              <P>Aucun dossier dans cette rubrique.</P>
            )}
            {!loading &&
              queue.items.map((item) => (
                <Setting
                  key={item.id}
                  title={item.name}
                  description={`${item.practices.join(" · ")}\n${item.assignment === "mine" ? "Pris en charge par vous" : item.assignment === "other" ? "En cours dans l’équipe" : "À prendre en charge"}`}
                  onPress={() => void open(item)}
                />
              ))}
            <Row between>
              <TextButton
                disabled={loading || page === 0}
                onPress={() => {
                  setPage(page - 1);
                  close();
                }}
              >
                Précédent
              </TextButton>
              <P small>Page {page + 1}</P>
              <TextButton
                disabled={loading || (page + 1) * 10 >= queue.total}
                onPress={() => {
                  setPage(page + 1);
                  close();
                }}
              >
                Suivant
              </TextButton>
            </Row>
            <TextButton
              onPress={() => {
                setRevision((x) => x + 1);
                if (selected) void open(selected);
              }}
            >
              Actualiser
            </TextButton>
          </View>
        )}
        {!!selected && (
          <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
            <TextButton onPress={close}>← Revenir aux dossiers</TextButton>
            <H2>{selected.name}</H2>
            {detailLoading && <P muted>Ouverture du dossier…</P>}
            {!detail && error && (
              <TextButton onPress={() => void open(selected)}>
                Réessayer
              </TextButton>
            )}
            {!!detail && !!coach && !!verification && !!dossier && (
              <>
                <P muted>
                  {verification.practices
                    .map(
                      (p) =>
                        `${p} · ${reviewLabels[practiceState(verification, p, today())]}`,
                    )
                    .join("\n")}
                </P>
                {selected.assignment === "mine" ? (
                  <TextButton disabled={busy} onPress={() => void assign(true)}>
                    Libérer le dossier
                  </TextButton>
                ) : (
                  <>
                    <P muted>
                      {selected.assignment === "other"
                        ? "Un membre de l’équipe examine ce dossier."
                        : "Prenez ce dossier en charge pour examiner ses justificatifs et enregistrer votre décision."}
                    </P>
                    <Button
                      disabled={busy || selected.assignment === "other"}
                      onPress={() => void assign()}
                    >
                      Prendre en charge
                    </Button>
                  </>
                )}
                {canReleaseOthers &&
                  selected.assignment === "other" &&
                  (confirmRelease ? (
                    <View style={{ gap: 12 }}>
                      <Note>
                        Le membre actuel ne pourra plus enregistrer de décision
                        sur ce dossier. Cette réattribution sera journalisée.
                      </Note>
                      <Button disabled={busy} onPress={() => void assign(true)}>
                        Confirmer la libération
                      </Button>
                      <TextButton onPress={() => setConfirmRelease(false)}>
                        Annuler
                      </TextButton>
                    </View>
                  ) : (
                    <TextButton onPress={() => setConfirmRelease(true)}>
                      Libérer pour réattribution
                    </TextButton>
                  ))}
                {selected.assignment === "mine" && (
                  <PracticeReviewPanel
                    key={coach.id}
                    store={detail.store}
                    coach={coach}
                    setStore={() => {}}
                    message={message}
                    onDecision={async (
                      practice,
                      status,
                      reason,
                      fingerprint,
                    ) => {
                      setBusy(true);
                      const args=[coach.id,practice,status,reason,fingerprint];
                      const key=JSON.stringify(args);
                      if(decisionAttempt.current?.key!==key)decisionAttempt.current={key,id:Crypto.randomUUID()};
                      try {
                        await request({
                          version: detail.version,
                          requestId: decisionAttempt.current.id,
                          commands: [
                            {
                              name: "reviewPractice",
                              args: [
                                coach.id,
                                practice,
                                status,
                                reason,
                                fingerprint,
                              ],
                            },
                          ],
                        });
                      } catch (e) {
                        if ((e as { status?: number }).status === 409) {
                          const fresh = await request({
                            team: { action: "detail", coach: coach.id },
                          });
                          if (alive.current) setDetail(fresh);
                        }
                        throw e;
                      } finally {
                        if (alive.current) setBusy(false);
                      }
                      decisionAttempt.current=null;
                      if (alive.current) {
                        setRevision((x) => x + 1);
                        await open(selected);
                        void onChanged();
                        message("Décision enregistrée.");
                      }
                    }}
                  />
                )}
                <TextButton onPress={() => setLibrary(!library)}>
                  {library
                    ? "Masquer les justificatifs"
                    : "Tous les justificatifs"}
                </TextButton>
                {library &&
                  verification.files.map((file) => (
                    <TextButton
                      key={file.id}
                      onPress={() =>
                        void openDocument(file.path).catch((e) =>
                          message(e.message),
                        )
                      }
                    >
                      Ouvrir · {file.title}
                    </TextButton>
                  ))}
                {library && !verification.files.length && (
                  <P muted>Aucun justificatif ajouté.</P>
                )}
                {!!dossier.history.length && (
                  <>
                    <H2>Historique des décisions</H2>
                    {[...dossier.history]
                      .sort(
                        (a, b) =>
                          (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0),
                      )
                      .slice(0, historyCount)
                      .map((event, i) => (
                        <View key={i} style={{ gap: 6, paddingVertical: 8 }}>
                          <P bold>
                            {event.practice ?? "Dossier"} ·{" "}
                            {reviewLabels[
                              event.status as keyof typeof reviewLabels
                            ] ?? "Mise à jour"}
                          </P>
                          <P small muted>
                            {event.date
                              ? new Date(event.date).toLocaleDateString("fr-FR")
                              : "Date non renseignée"}
                          </P>
                          <P>{event.reason}</P>
                        </View>
                      ))}
                    {dossier.history.length > historyCount && (
                      <TextButton
                        onPress={() => setHistoryCount(historyCount + 6)}
                      >
                        Voir les décisions précédentes
                      </TextButton>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}
        {wide && !selected && (
          <View style={{ flex: 1 }}>
            <H2>Un dossier à la fois.</H2>
            <P muted>Choisissez un coach pour examiner sa demande.</P>
          </View>
        )}
      </View>
    </View>
  );
}
