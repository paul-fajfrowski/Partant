import React, { useContext, useState } from "react";
import { View, Linking } from "react-native";
import type { Store, Coach } from "./model";
import { configFor, today } from "./model";
import { reviewPractice } from "./workflows";
import {
  filesFor,
  missingProofs,
  practiceState,
  proofFingerprint,
  professionalStatuses,
  proofKinds,
  reviewHint,
  toVerification,
} from "./verification";
import { openDocument } from "./deviceFiles";
import {
  Button,
  Field,
  H2,
  Note,
  P,
  Rule,
  Select,
  TextButton,
  SaveFeedbackContext,
} from "./ui";
export function PracticeReviewPanel({
  store,
  coach,
  setStore,
  message,
}: {
  store: Store;
  coach: Coach;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  message: (s: string) => void;
}) {
  const [practice, setPractice] = useState("");
  const [status, setStatus] = useState<"approved" | "correction" | "rejected">(
    "approved",
  );
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const feedback = useContext(SaveFeedbackContext);
  const v = toVerification(configFor(store, coach.id).dossier, coach, today());
  const pending = v.practices.filter(
    (p) => practiceState(v, p, today()) === "pending",
  );
  const target = pending.includes(practice) ? practice : pending[0];
  if (!target) return <P muted>Aucune pratique en attente.</P>;
  const fingerprint = proofFingerprint(v, target),
    docs = filesFor(v, target);
  const checkItems = [
    "Identité et concordance des justificatifs",
    "Qualification, pratique et publics autorisés",
    "Validité et assurance",
    "Registre officiel ou fondement applicable à cette situation",
  ];
  const allChecked = checkItems.every((item) =>
    checked.includes(fingerprint + item),
  );
  const own = store.connected && store.account?.id === coach.id;
  return (
    <View style={{ paddingVertical: 16 }}>
      {own && (
        <Note>Un autre membre de l’équipe doit vérifier votre dossier.</Note>
      )}
      <Select
        label="Pratique à examiner"
        value={target}
        items={pending}
        onChange={(p) => {
          setPractice(p);
          setReason("");
          setChecked([]);
        }}
      />
      <P bold>
        {
          professionalStatuses.find(
            ([key]) => key === v.professionalStatus,
          )?.[1]
        }
      </P>
      <P muted>{reviewHint(v, target)}</P>
      {!!v.context && <Note style={{ marginVertical: 12 }}>{v.context}</Note>}
      <H2 style={{ marginTop: 18 }}>Justificatifs liés</H2>
      {docs.map((f) => (
        <View key={f.id} style={{ marginVertical: 12 }}>
          <P bold>{f.title}</P>
          <P small muted>
            {proofKinds[f.kind]}
            {f.reference ? " · " + f.reference : ""}
            {f.expires ? " · Validité : " + f.expires : ""}
          </P>
          {store.connected ? (
            <TextButton
              onPress={() =>
                openDocument(f.path).catch((e) => message(e.message))
              }
            >
              Ouvrir · {f.title}
            </TextButton>
          ) : (
            <P small>Fichier fictif : {f.path}</P>
          )}
        </View>
      ))}
      <TextButton
        onPress={() =>
          Linking.openURL("https://recherche-educateur.sports.gouv.fr/")
        }
      >
        Consulter le registre des éducateurs sportifs
      </TextButton>
      <Rule />
      {checkItems.map((item) => (
        <TextButton
          key={item}
          onPress={() => {
            const key = fingerprint + item;
            setChecked(
              checked.includes(key)
                ? checked.filter((x) => x !== key)
                : [...checked, key],
            );
          }}
        >{`${checked.includes(fingerprint + item) ? "✓" : "○"} ${item}`}</TextButton>
      ))}
      <Select
        label="Décision pour cette pratique"
        value={status}
        items={[
          ["approved", "Valider la pratique"],
          ["correction", "Demander un complément"],
          ["rejected", "Refuser cette pratique"],
        ]}
        onChange={(x) => setStatus(x as typeof status)}
      />
      <Field
        label="Motif et éléments vérifiés"
        value={reason}
        onChange={setReason}
        multiline
      />
      <P small muted>
        Expliquez précisément la décision au coach. Pour une situation
        particulière, indiquez le fondement retenu et les éventuelles
        restrictions.
      </P>
      {error && <Note>{error}</Note>}
      <Button
        disabled={
          !!own ||
          feedback.pending > 0 ||
          !reason.trim() ||
          (status === "approved" &&
            (!allChecked || !!missingProofs(v, target, today()).length))
        }
        onPress={() => {
          try {
            setError("");
            setStore(
              reviewPractice(
                store,
                coach.id,
                target,
                status,
                reason,
                fingerprint,
              ),
            );
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Enregistrer la décision
      </Button>
    </View>
  );
}
