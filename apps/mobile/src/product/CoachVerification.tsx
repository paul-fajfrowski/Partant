import React, { useContext, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { FlowProps } from "./CoachConfiguration";
import { allCoaches, configFor, coachAccountId, today } from "./model";
import { saveVerification, uid } from "./workflows";
import { chooseDocument, openDocument } from "./deviceFiles";
import {
  Button,
  Dialog,
  Chip,
  Eyebrow,
  Field,
  H1,
  H2,
  Note,
  P,
  Row,
  Rule,
  Select,
  Setting,
  TextButton,
  SaveFeedbackContext,
} from "./ui";
import {
  filesFor,
  missingProofs,
  practiceOptions,
  practiceState,
  professionalStatuses,
  proofKinds,
  requirements,
  reviewHint,
  reviewLabels,
  toVerification,
  type Proof,
  type ProofKind,
  type Verification,
} from "./verification";

export function CoachVerification({ store, setStore, go, message }: FlowProps) {
  const id = coachAccountId(store),
    c = allCoaches(store).find((c) => c.id === id)!;
  const cfg = configFor(store, id),
    key = `${id}:documents-v2`;
  const [v, setV] = useState<Verification>(
    () =>
      store.coachDrafts?.[key]?.cfg.dossier?.verification ??
      toVerification(cfg.dossier, c, today()),
  );
  const [editingPractices, setEditingPractices] = useState(!v.practices.length);
  const [expanded, setExpanded] = useState(() =>
    v.practices.length === 1 ? v.practices[0] : "",
  );
  const [editor, setEditor] = useState<Proof | null>(null);
  const [remove, setRemove] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(false);
  const [library, setLibrary] = useState(false);
  const feedback = useContext(SaveFeedbackContext);
  const request = useRef<{ success: number; failure: number } | null>(null);
  const initial = useRef(JSON.stringify(v));
  const flush = useRef(() => {});
  const dirty = JSON.stringify(v) !== initial.current;
  useEffect(() => () => flush.current(), []);
  useEffect(() => {
    const persist = () => {
      if (JSON.stringify(v) === initial.current || request.current) return;
      setStore((s) => ({
        ...s,
        coachDrafts: {
          ...s.coachDrafts,
          [key]: {
            cfg: { dossier: { ...configFor(s, id).dossier, verification: v } },
          },
        },
      }));
    };
    flush.current = persist;
    const timer = setTimeout(persist, 600);
    return () => clearTimeout(timer);
  }, [v]);
  useEffect(() => {
    if (!request.current || feedback.pending) return;
    if (feedback.failure !== request.current.failure) {
      request.current = null;
      setError(
        "L’enregistrement n’a pas abouti. Vos modifications sont conservées ; vous pouvez réessayer.",
      );
      flush.current();
    } else if (feedback.success > request.current.success) {
      request.current = null;
      const saved = toVerification(configFor(store, id).dossier, c, today());
      initial.current = JSON.stringify(saved);
      setV(saved);
      setEditor(null);
      setRemove(false);
      setEditingPractices(false);
    }
  }, [feedback.pending, feedback.success, feedback.failure]);
  // Pick up a team decision on refresh without overwriting local edits.
  useEffect(() => {
    if (!dirty && !request.current) {
      const saved = toVerification(cfg.dossier, c, today());
      initial.current = JSON.stringify(saved);
      setV(saved);
    }
  }, [JSON.stringify(cfg.dossier)]);
  function save(next = v, submit: string[] = []) {
    try {
      setError("");
      const result = saveVerification(store, id, next, submit);
      const drafts = { ...result.coachDrafts };
      delete drafts[key];
      delete drafts[`${id}:documents`];
      if (store.connected)
        request.current = {
          success: feedback.success,
          failure: feedback.failure,
        };
      setStore({ ...result, coachDrafts: drafts });
      if (!store.connected) {
        const saved = toVerification(
          configFor(result, id).dossier,
          allCoaches(result).find((c) => c.id === id)!,
          today(),
        );
        initial.current = JSON.stringify(saved);
        setV(saved);
        setEditor(null);
        setEditingPractices(false);
        setRemove(false);
        message(
          submit.length
            ? "Pratique soumise · simulation"
            : "Dossier enregistré · simulation",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const change = (patch: Partial<Verification>) =>
    setV((x) => ({ ...x, ...patch }));
  const addFile = (kind: ProofKind = "qualification", practice = "") => {
    setEditor({
      id: uid(),
      kind,
      title: proofKinds[kind],
      path: "",
      expires: "",
      reference: "",
      practices: practice ? [practice] : [...v.practices],
    });
    setRemove(false);
  };
  const approved = v.practices.filter(
    (p) => practiceState(v, p, today()) === "approved",
  ).length;
  const pending = v.practices.filter(
    (p) => practiceState(v, p, today()) === "pending",
  ).length;
  const busy = uploading || feedback.pending > 0;
  const commonKinds: ProofKind[] = ["identity", "insurance"];
  const commonMissing = commonKinds.filter(
    (kind) =>
      !v.files.some(
        (f) =>
          f.kind === kind &&
          f.path.trim() &&
          (!f.expires || f.expires >= today()),
      ),
  );
  const specificMissing = v.practices.flatMap((practice) =>
    missingProofs(v, practice, today())
      .filter((kind) => !commonKinds.includes(kind))
      .map((kind) => ({ practice, kind })),
  );
  const expiredProof = v.files.find((f) => f.expires && f.expires < today());
  const needsContext = (p: string) =>
    (v.professionalStatus !== "qualified" ||
      ["Yoga", "Récupération"].includes(p)) &&
    v.context.trim().length < 20;
  const contextMissing = v.practices.some(needsContext);
  const nextProof = commonMissing.length
    ? { kind: commonMissing[0], practice: "" }
    : (specificMissing[0] ??
      (expiredProof
        ? { kind: expiredProof.kind, practice: expiredProof.practices[0] ?? "" }
        : undefined));
  const readyPractices = v.practices.filter(
    (p) =>
      !missingProofs(v, p, today()).length &&
      !needsContext(p) &&
      !filesFor(v, p).some((f) => f.expires && f.expires < today()) &&
      !["approved", "pending"].includes(practiceState(v, p, today())),
  );

  return (
    <>
      <Eyebrow>DOCUMENTS & VÉRIFICATIONS</Eyebrow>
      <H1 style={{ marginTop: 16, marginBottom: 12 }}>Votre dossier coach.</H1>
      <P muted>
        Ajoutez vos pièces, puis envoyez vos pratiques à l’équipe pour
        vérification.
      </P>
      {error && !editor ? (
        <Note style={{ marginVertical: 16 }}>{error}</Note>
      ) : null}
      {!store.connected && (
        <P small muted>
          Simulation : utilisez uniquement des références fictives.
        </P>
      )}
      <View
        style={{
          backgroundColor: "#f5f5f3",
          borderRadius: 24,
          padding: 20,
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        <P bold>
          {!v.practices.length
            ? "Commençons par vos pratiques"
            : nextProof
              ? "Votre prochaine étape"
              : contextMissing
                ? "Précisons votre activité"
                : readyPractices.length
                  ? "Prêt à envoyer"
                  : pending
                    ? "Votre dossier est en cours d’examen"
                    : "Vos pratiques sont validées"}
        </P>
        <P small muted style={{ marginTop: 6 }}>
          {!v.practices.length
            ? "Choisissez ce que vous souhaitez enseigner. Nous adapterons votre dossier."
            : nextProof
              ? "Les pièces communes sont demandées une seule fois. Vos qualifications sont ensuite associées aux pratiques concernées."
              : contextMissing
                ? "Décrivez vos séances et votre encadrement en quelques mots pour que l’équipe puisse examiner votre situation."
                : readyPractices.length
                  ? "Vos pièces sont ajoutées. L’équipe doit encore les vérifier avant d’autoriser vos pratiques."
                  : pending
                    ? "Vous recevrez une notification après vérification. Aucune nouvelle pièce n’est attendue pour le moment."
                    : "Vous pouvez retrouver vos justificatifs et leur validité ci-dessous."}
        </P>
        {!!v.practices.length && (
          <P small style={{ marginTop: 10 }}>
            {approved} validée{approved > 1 ? "s" : ""} · {pending} en
            vérification · {v.practices.length - approved - pending} à préparer
          </P>
        )}
        {nextProof && !!v.practices.length && (
          <Button
            style={{ marginTop: 16 }}
            disabled={busy}
            onPress={() => {
              const candidates = (
                nextProof.practice ? filesFor(v, nextProof.practice) : v.files
              ).filter((f) => f.kind === nextProof.kind);
              const existing =
                candidates.find((f) => f.expires && f.expires < today()) ??
                candidates[0];
              if (existing) {
                setEditor({ ...existing });
                setRemove(false);
              } else addFile(nextProof.kind, nextProof.practice);
            }}
          >{`Compléter · ${proofKinds[nextProof.kind]}`}</Button>
        )}
        {!nextProof && contextMissing && (
          <Button
            style={{ marginTop: 16 }}
            disabled={busy}
            onPress={() => setEditingPractices(true)}
          >
            Compléter ma situation
          </Button>
        )}
        {!nextProof && !contextMissing && !!readyPractices.length && (
          <Button
            style={{ marginTop: 16 }}
            disabled={busy}
            onPress={() => save(v, readyPractices)}
          >
            {readyPractices.length === 1
              ? `Envoyer ${readyPractices[0]} à vérifier`
              : `Envoyer ${readyPractices.length} pratiques à vérifier`}
          </Button>
        )}
      </View>
      <Setting
        title="Vos pratiques et votre statut"
        description={
          v.practices.length ? v.practices.join(" · ") : "Commencez ici"
        }
        onPress={() => setEditingPractices(!editingPractices)}
      />
      {editingPractices && (
        <>
          <P small muted>
            Sélectionnez les pratiques réellement enseignées. Vous pourrez en
            ajouter plus tard.
          </P>
          <Row wrap style={{ marginVertical: 16, gap: 8 }}>
            {practiceOptions.map((p) => (
              <Chip
                key={p}
                active={v.practices.includes(p)}
                onPress={() => {
                  if (busy) return;
                  const practices = v.practices.includes(p)
                    ? v.practices.filter((x) => x !== p)
                    : [...v.practices, p];
                  change({
                    practices,
                    files: v.files.map((f) => ({
                      ...f,
                      practices: f.practices.filter((x) =>
                        practices.includes(x),
                      ),
                    })),
                  });
                }}
              >
                {p}
              </Chip>
            ))}
          </Row>
          <Select
            label="Votre situation professionnelle"
            value={v.professionalStatus}
            items={professionalStatuses.map(([a, b]) => [a, b])}
            onChange={(value) =>
              change({
                professionalStatus: value as Verification["professionalStatus"],
              })
            }
          />
          {(v.professionalStatus !== "qualified" ||
            v.practices.some((p) => ["Yoga", "Récupération"].includes(p))) && (
            <Field
              label="Votre situation et votre encadrement"
              value={v.context}
              onChange={(context) => change({ context })}
              multiline
            />
          )}
          <Button disabled={busy || !v.practices.length} onPress={() => save()}>
            Enregistrer mes pratiques
          </Button>
          <P small muted style={{ marginTop: 12 }}>
            Une nouvelle pratique est vérifiée séparément. Les autres restent
            autorisées si leurs justificatifs sont inchangés et valides.
          </P>
        </>
      )}
      {!!v.practices.length && (
        <>
          <Rule />
          <H2>1. Vos pièces communes</H2>
          <P small muted style={{ marginTop: 8 }}>
            Identité et assurance · {2 - commonMissing.length} sur 2 ajoutées.
            Un seul dépôt pour toutes vos pratiques.
          </P>
          {(["identity", "insurance"] as ProofKind[]).map((kind) => {
            const file =
              v.files.find(
                (f) =>
                  f.kind === kind &&
                  f.path &&
                  (!f.expires || f.expires >= today()),
              ) ?? v.files.find((f) => f.kind === kind);
            return (
              <Setting
                key={kind}
                title={proofKinds[kind]}
                description={
                  file?.path
                    ? file.expires && file.expires < today()
                      ? "À renouveler"
                      : "Document ajouté · privé"
                    : "À ajouter"
                }
                onPress={() =>
                  file
                    ? (setEditor({ ...file }), setRemove(false))
                    : addFile(kind)
                }
              />
            );
          })}
          <Rule />
          <H2>2. Vos qualifications par pratique</H2>
          <P small muted style={{ marginTop: 8 }}>
            Un document peut couvrir plusieurs pratiques. Ouvrez une pratique
            pour compléter ou consulter ses pièces.
          </P>
          {v.practices.map((practice) => {
            const state = practiceState(v, practice, today()),
              missing = missingProofs(v, practice, today()),
              specific = missing.filter((kind) => !commonKinds.includes(kind));
            return (
              <View
                key={practice}
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: "#e7e7e7",
                  borderRadius: 20,
                  paddingHorizontal: 16,
                }}
              >
                <Setting
                  title={practice}
                  description={`${state === "draft" && !missing.length && !needsContext(practice) ? "Prête à envoyer" : reviewLabels[state]}${specific.length ? ` · ${specific.length} pièce${specific.length > 1 ? "s" : ""} spécifique${specific.length > 1 ? "s" : ""} à ajouter` : ""}`}
                  onPress={() =>
                    setExpanded(expanded === practice ? "" : practice)
                  }
                />
                {expanded === practice && (
                  <View style={{ paddingBottom: 20 }}>
                    <P muted>{reviewHint(v, practice)}</P>
                    {v.reviews[practice]?.reason && (
                      <Note style={{ marginVertical: 12 }}>
                        {v.reviews[practice].reason}
                      </Note>
                    )}
                    {requirements(v, practice)
                      .filter(
                        (kind) => !["identity", "insurance"].includes(kind),
                      )
                      .map((kind) => {
                        const docs = filesFor(v, practice).filter(
                          (f) => f.kind === kind,
                        );
                        const reusable = v.files.filter(
                          (f) =>
                            f.kind === kind && !docs.some((d) => d.id === f.id),
                        );
                        return (
                          <View key={kind}>
                            {docs.length ? (
                              docs.map((f) => (
                                <Setting
                                  key={f.id}
                                  title={proofKinds[kind]}
                                  description={`${f.title} · ${f.expires && f.expires < today() ? "À renouveler" : "Pièce ajoutée"}`}
                                  onPress={() => {
                                    setEditor({ ...f });
                                    setRemove(false);
                                  }}
                                />
                              ))
                            ) : (
                              <Setting
                                title={`Ajouter · ${proofKinds[kind]}`}
                                description="À ajouter"
                                onPress={() => addFile(kind, practice)}
                              />
                            )}
                            {reusable.map((f) => (
                              <TextButton
                                key={f.id}
                                onPress={() =>
                                  change({
                                    files: v.files.map((x) =>
                                      x.id === f.id
                                        ? {
                                            ...x,
                                            practices: [
                                              ...x.practices,
                                              practice,
                                            ],
                                          }
                                        : x,
                                    ),
                                  })
                                }
                              >
                                Utiliser « {f.title} » pour {practice}
                              </TextButton>
                            ))}
                          </View>
                        );
                      })}
                    {["Yoga", "Récupération"].includes(practice) &&
                      v.professionalStatus === "qualified" && (
                        <Field
                          label="Vos séances et les publics accompagnés"
                          value={v.context}
                          onChange={(context) => change({ context })}
                          multiline
                        />
                      )}
                    {practice === "Natation" && (
                      <TextButton onPress={() => addFile("renewal", practice)}>
                        Ajouter un recyclage si applicable
                      </TextButton>
                    )}
                    {missing.some((kind) =>
                      ["identity", "insurance"].includes(kind),
                    ) && (
                      <P small muted style={{ marginTop: 12 }}>
                        Les pièces communes sont encore à compléter dans la
                        première section.
                      </P>
                    )}
                    {!["approved", "pending"].includes(state) && (
                      <Button
                        style={{ marginTop: 16 }}
                        disabled={
                          busy ||
                          !!missing.length ||
                          needsContext(practice) ||
                          filesFor(v, practice).some(
                            (f) => f.expires && f.expires < today(),
                          )
                        }
                        onPress={() => save(v, [practice])}
                      >{`Soumettre ${practice}`}</Button>
                    )}
                    {state === "pending" && (
                      <P small muted style={{ marginTop: 12 }}>
                        Vous recevrez une notification après examen. Modifier un
                        justificatif remet les pratiques concernées à vérifier.
                      </P>
                    )}
                    {state === "approved" && (
                      <P small muted style={{ marginTop: 12 }}>
                        Cette pratique peut être proposée une fois votre profil
                        publié et vos créneaux ouverts.
                      </P>
                    )}
                  </View>
                )}
              </View>
            );
          })}
          <Rule />
          <Setting
            title="Tous mes documents"
            description={`${v.files.length} document${v.files.length > 1 ? "s" : ""} · consulter, réutiliser ou remplacer`}
            onPress={() => setLibrary(!library)}
          />
          {library && (
            <>
              {v.files.map((f) => (
                <Setting
                  key={f.id}
                  title={f.title}
                  description={`${commonKinds.includes(f.kind) ? "Pièce commune" : f.practices.join(" · ") || "Aucune pratique associée"}${f.expires ? ` · ${f.expires < today() ? "Expiré le" : "Valable jusqu’au"} ${new Date(f.expires + "T12:00:00").toLocaleDateString("fr-FR")}` : ""}`}
                  onPress={() => {
                    setEditor({ ...f });
                    setRemove(false);
                  }}
                />
              ))}
              <TextButton onPress={() => addFile()}>
                Ajouter un document
              </TextButton>
            </>
          )}
          {editor && (
            <Dialog
              title={
                v.files.some((f) => f.id === editor.id)
                  ? "Modifier un document"
                  : proofKinds[editor.kind]
              }
              open
              onBack={() => {
                if (busy) return;
                if (remove) setRemove(false);
                else setEditor(null);
              }}
              onClose={() => {
                if (!busy) {
                  setEditor(null);
                  setRemove(false);
                }
              }}
            >
              {error ? <Note>{error}</Note> : null}
              {!v.files.some((f) => f.id === editor.id) &&
                !commonKinds.includes(editor.kind) &&
                v.files
                  .filter(
                    (f) =>
                      f.kind === editor.kind &&
                      f.path &&
                      (!f.expires || f.expires >= today()),
                  )
                  .map((f) => (
                    <Setting
                      key={f.id}
                      title={`Réutiliser ${f.title}`}
                      description="Déjà dans votre dossier · aucun nouveau dépôt"
                      onPress={() => {
                        if (!busy)
                          save({
                            ...v,
                            files: v.files.map((x) =>
                              x.id === f.id
                                ? {
                                    ...x,
                                    practices: [
                                      ...new Set([
                                        ...x.practices,
                                        ...editor.practices,
                                      ]),
                                    ],
                                  }
                                : x,
                            ),
                          });
                      }}
                    />
                  ))}
              <Select
                label="Type de justificatif"
                value={editor.kind}
                items={Object.entries(proofKinds)}
                onChange={(kind) =>
                  setEditor({
                    ...editor,
                    kind: kind as ProofKind,
                    title: proofKinds[kind as ProofKind],
                  })
                }
              />
              <Field
                label="Nom du document"
                value={editor.title}
                onChange={(title) => setEditor({ ...editor, title })}
              />
              {store.connected ? (
                <>
                  <P small muted>
                    {editor.path
                      ? "Fichier ajouté · privé"
                      : "PDF, JPEG, PNG ou WebP · 10 Mo maximum"}
                  </P>
                  <Button
                    light
                    disabled={busy}
                    onPress={async () => {
                      setUploading(true);
                      setError("");
                      try {
                        const path = await chooseDocument(id);
                        if (path)
                          setEditor((current) =>
                            current ? { ...current, path } : current,
                          );
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  >
                    {uploading
                      ? "Import en cours…"
                      : editor.path
                        ? "Remplacer le fichier"
                        : "Importer le fichier"}
                  </Button>
                  {!!editor.path && (
                    <TextButton
                      onPress={() =>
                        openDocument(editor.path).catch((e) =>
                          setError(e.message),
                        )
                      }
                    >
                      Ouvrir le fichier privé
                    </TextButton>
                  )}
                </>
              ) : (
                <Field
                  label="Référence du fichier fictif"
                  value={editor.path}
                  onChange={(path) => setEditor({ ...editor, path })}
                />
              )}
              {["card", "trainee", "recognition"].includes(editor.kind) && (
                <Field
                  label="Numéro ou référence (facultatif)"
                  value={editor.reference}
                  onChange={(reference) => setEditor({ ...editor, reference })}
                />
              )}
              <Field
                label={
                  ["card", "insurance", "trainee", "renewal"].includes(
                    editor.kind,
                  )
                    ? "Fin de validité (AAAA-MM-JJ)"
                    : "Fin de validité si indiquée (AAAA-MM-JJ)"
                }
                value={editor.expires}
                onChange={(expires) => setEditor({ ...editor, expires })}
              />
              {!["identity", "insurance"].includes(editor.kind) && (
                <>
                  <P bold>Pratiques couvertes par ce document</P>
                  <Row wrap style={{ gap: 8, marginVertical: 14 }}>
                    {v.practices.map((p) => (
                      <Chip
                        key={p}
                        active={editor.practices.includes(p)}
                        onPress={() =>
                          setEditor({
                            ...editor,
                            practices: editor.practices.includes(p)
                              ? editor.practices.filter((x) => x !== p)
                              : [...editor.practices, p],
                          })
                        }
                      >
                        {p}
                      </Chip>
                    ))}
                  </Row>
                </>
              )}
              {v.files.some((f) => f.id === editor.id) && (
                <P small muted style={{ marginBottom: 12 }}>
                  Une modification du justificatif remet les pratiques
                  concernées à vérifier.
                </P>
              )}
              <Button
                disabled={busy}
                onPress={() => {
                  const next = {
                    ...v,
                    files: v.files.some((f) => f.id === editor.id)
                      ? v.files.map((f) => (f.id === editor.id ? editor : f))
                      : [...v.files, editor],
                  };
                  save(next);
                }}
              >
                Enregistrer le document
              </Button>
              <TextButton
                onPress={() => {
                  setEditor(null);
                  setRemove(false);
                }}
              >
                Fermer sans modifier
              </TextButton>
              {v.files.some((f) => f.id === editor.id) && (
                <TextButton onPress={() => setRemove(true)}>
                  Retirer du dossier
                </TextButton>
              )}
              {remove && (
                <Note>
                  Les pratiques qui dépendent de ce document devront être
                  vérifiées à nouveau.
                  <TextButton
                    onPress={() =>
                      save({
                        ...v,
                        files: v.files.filter((f) => f.id !== editor.id),
                      })
                    }
                  >
                    Confirmer le retrait
                  </TextButton>
                  <TextButton onPress={() => setRemove(false)}>
                    Conserver le document
                  </TextButton>
                </Note>
              )}
            </Dialog>
          )}
          {dirty && !editor && !editingPractices && (
            <Button disabled={busy} onPress={() => save()}>
              Enregistrer les modifications
            </Button>
          )}
        </>
      )}
      <Rule />
      <P small muted>
        Vos justificatifs restent privés. Seuls vous et l’équipe habilitée
        pouvez les consulter.
      </P>
      <TextButton onPress={() => go("privacy-policy", "coach")}>
        Confidentialité de mes documents
      </TextButton>
      <TextButton onPress={() => go("support-native")}>
        Besoin d’aide pour mon dossier
      </TextButton>
      {store.staff && (
        <TextButton onPress={() => go("team")}>
          Ouvrir l’espace équipe
        </TextButton>
      )}
      {!!cfg.dossier.history.length && (
        <TextButton onPress={() => setHistory(!history)}>
          {history
            ? "Masquer l’historique"
            : "Voir l’historique des vérifications"}
        </TextButton>
      )}
      {history &&
        [...cfg.dossier.history]
          .reverse()
          .slice(0, 10)
          .map((h, i) => (
            <View key={i} style={{ marginVertical: 8 }}>
              <P small bold>
                {h.practice ? h.practice + " · " : ""}
                {reviewLabels[h.status as keyof typeof reviewLabels] ??
                  h.status}
              </P>
              <P small muted>
                {h.date.slice(0, 10)} · {h.reason}
              </P>
            </View>
          ))}
    </>
  );
}
