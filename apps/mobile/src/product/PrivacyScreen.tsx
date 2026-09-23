import { useLocalBack } from "./BackNavigation";
import React, { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import {
  Button,
  Eyebrow,
  Field,
  H1,
  H2,
  Note,
  P,
  Row,
  Select,
  Setting,
  TextButton,
} from "./ui";
import { FlowProps } from "./CoachConfiguration";
import { accountExport } from "./workflows";
import { exportFile } from "./deviceFiles";
import {
  privacyNotice,
  privacyRequestKinds,
  privacySections,
} from "./privacyContent";

export function PrivacyLinks({
  go,
  role,
  live,
  creation = false,
}: {
  go: FlowProps["go"];
  role: "client" | "coach";
  live: boolean;
  creation?: boolean;
}) {
  return (
    <View style={{ marginVertical: 16 }}>
      <P small muted>
        {live
          ? role === "coach"
            ? "Vos informations servent à gérer votre compte, votre profil coach et vos séances."
            : "Vos informations servent à gérer votre compte et vos réservations."
          : "Démonstration : utilisez des informations fictives. Vos essais restent sur cet appareil."}
      </P>
      <Row wrap style={{ gap: 16 }}>
        <TextButton onPress={() => go("privacy-policy", role)}>
          Confidentialité
        </TextButton>
        <TextButton onPress={() => go("terms-native")}>
          Conditions d’utilisation
        </TextButton>
      </Row>
      {creation && (
        <P small muted>
          Consultez les conditions de cette version de test avant de créer votre
          espace.
        </P>
      )}
    </View>
  );
}

export function PrivacyScreen(
  p: FlowProps & {
    screen: string;
    submitRequest: (kind: string, detail: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
  },
) {
  const { store: s, go, screen } = p;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [kind, setKind] = useState(privacyRequestKinds[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useLocalBack(
    confirmDelete,
    () => {
      if (!busy) setConfirmDelete(false);
    },
    20,
  );
  const coach = (s.account?.role ?? p.focus) === "coach";
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const feedback = error ? (
    <View accessibilityRole="alert" style={{ marginVertical: 16 }}>
      <Note>{error}</Note>
    </View>
  ) : null;
  if (screen === "terms-native")
    return (
      <>
        <Eyebrow>VERSION DE TEST · {privacyNotice.updated}</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>Conditions{"\n"}d’utilisation.</H1>
        <P>
          Partant permet de découvrir des coachs, de préparer des séances et de
          tester la réservation. Cette version est en développement : aucun
          paiement n’est encaissé et les réservations de test ne valent pas
          achat d’une prestation.
        </P>
        <H2 style={{ marginTop: 24, marginBottom: 12 }}>Votre compte</H2>
        <P>
          Choisissez l’espace correspondant à votre usage, protégez votre accès
          et respectez les personnes avec lesquelles vous échangez. Utilisez des
          informations fictives dans la démonstration. Un coach ne doit publier
          que des informations et des visuels qu’il est autorisé à utiliser.
        </P>
        <H2 style={{ marginTop: 24, marginBottom: 12 }}>Vos données</H2>
        <P>
          La confidentialité fait l’objet d’une notice distincte. L’utilisation
          du service n’autorise pas tous les usages de vos données et ne vous
          inscrit pas à des communications publicitaires.
        </P>
        <TextButton
          onPress={() => go("privacy-policy", coach ? "coach" : "client")}
        >
          Lire la notice de confidentialité
        </TextButton>
        <Note style={{ marginTop: 24 }}>
          Ces conditions décrivent les essais actuels. Les mentions de l’éditeur
          et les conditions contractuelles de la marketplace doivent être
          finalisées avant son ouverture au public.
        </Note>
      </>
    );
  if (screen === "privacy-policy")
    return (
      <>
        <Eyebrow>VOS DONNÉES PERSONNELLES</Eyebrow>
        <H1 style={{ marginVertical: 20 }}>En toute{"\n"}transparence.</H1>
        <P muted>Notice de la version de test · {privacyNotice.updated}</P>
        <P small muted style={{ marginTop: 8 }}>
          Version {privacyNotice.version}
        </P>
        <Note style={{ marginVertical: 20 }}>
          {privacyNotice.controller && privacyNotice.contactEmail
            ? `Responsable : ${privacyNotice.controller}. Contact : ${privacyNotice.contactEmail}.`
            : "Partant est en phase de test. L’identité juridique du responsable et son contact dédié restent à renseigner avant l’ouverture publique. Cette notice décrit le fonctionnement actuel ; elle ne constitue pas une validation de conformité."}
        </Note>
        {privacySections(coach).map((section) => (
          <View
            key={section.title}
            style={{ borderBottomWidth: 1, borderBottomColor: "#e8e8e8" }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={section.title}
              aria-expanded={expanded === section.title}
              onPress={() =>
                setExpanded(expanded === section.title ? null : section.title)
              }
              style={{ paddingVertical: 20, minHeight: 48 }}
            >
              <Row between>
                <P bold style={{ flex: 1, paddingRight: 16 }}>
                  {section.title}
                </P>
                <P>{expanded === section.title ? "−" : "+"}</P>
              </Row>
            </Pressable>
            {expanded === section.title && (
              <P style={{ paddingBottom: 20 }}>{section.text}</P>
            )}
          </View>
        ))}
        <TextButton onPress={() => go("privacy-native")}>
          Gérer mes données
        </TextButton>
        <TextButton
          onPress={() =>
            run(() =>
              Linking.openURL("https://www.cnil.fr/fr/plaintes").then(() => {}),
            )
          }
        >
          Mes droits auprès de la CNIL
        </TextButton>
        {feedback}
      </>
    );
  if (screen === "delete-account-native")
    return (
      <>
        <H1 style={{ marginBottom: 20 }}>Supprimer{"\n"}mon compte.</H1>
        <P>
          Votre accès au service sera retiré et votre historique en partie
          anonymisé. Les références des séances restent chez vos interlocuteurs.
          Cette action est irréversible.
        </P>
        <P muted style={{ marginTop: 16 }}>
          Si vous avez des séances confirmées, leur traitement est nécessaire
          avant la suppression en libre-service. Vous pouvez aussi demander
          l’effacement de vos données à l’équipe, même dans ce cas.
        </P>
        <TextButton onPress={() => go("privacy-request")}>
          Faire une demande sur mes données
        </TextButton>
        {feedback}
        {confirmDelete ? (
          <Note style={{ marginTop: 20 }}>
            <P bold>Confirmer la suppression de ce compte ?</P>
            <P>{s.account?.email}</P>
            <Button
              disabled={!s.account || busy}
              style={{ marginTop: 16 }}
              onPress={() =>
                run(async () => {
                  await p.deleteAccount();
                  go("welcome");
                })
              }
            >
              {busy ? "Suppression en cours…" : "Confirmer la suppression"}
            </Button>
            <TextButton
              onPress={() => {
                if (!busy) setConfirmDelete(false);
              }}
            >
              Conserver mon compte
            </TextButton>
          </Note>
        ) : (
          <Button
            disabled={!s.account}
            style={{ marginTop: 24 }}
            onPress={() => setConfirmDelete(true)}
          >
            Supprimer définitivement mon compte
          </Button>
        )}
      </>
    );
  if (screen === "privacy-request") {
    if (!s.account)
      return (
        <>
          <H1>Votre demande.</H1>
          <P>Connectez-vous pour retrouver votre demande dans votre espace.</P>
          <Button onPress={() => go("login")}>Me connecter</Button>
        </>
      );
    return (
      <>
        <H1 style={{ marginBottom: 20 }}>Parlons de{"\n"}vos données.</H1>
        {sent ? (
          <>
            <Note>
              Votre demande est enregistrée
              {s.connected ? " auprès de Partant" : " dans cette démonstration"}
              . Ce n’est pas encore une confirmation de traitement.
            </Note>
            <Button
              style={{ marginTop: 24 }}
              onPress={() => go("support-native")}
            >
              Suivre ma demande
            </Button>
          </>
        ) : (
          <>
            <P muted style={{ marginBottom: 20 }}>
              Choisissez votre demande. Les précisions sont facultatives ;
              n’ajoutez pas de pièce d’identité ni d’informations de santé ici.
            </P>
            <Select
              label="Ma demande concerne"
              value={kind}
              items={privacyRequestKinds}
              onChange={setKind}
            />
            <Field
              label="Précisions (facultatif)"
              value={detail}
              onChange={setDetail}
              multiline
            />
            {feedback}
            <Button
              disabled={busy || detail.length > 2000}
              onPress={() =>
                run(async () => {
                  await p.submitRequest(kind, detail);
                  setSent(true);
                })
              }
            >
              {busy ? "Envoi en cours…" : "Envoyer ma demande"}
            </Button>
            {detail.length > 2000 && (
              <P small muted>
                Limitez les précisions à 2 000 caractères.
              </P>
            )}
          </>
        )}
      </>
    );
  }
  return (
    <>
      <Eyebrow>CONFIDENTIALITÉ</Eyebrow>
      <H1 style={{ marginVertical: 20 }}>Vos données.{"\n"}Vos choix.</H1>
      <P muted style={{ marginBottom: 20 }}>
        Retrouvez les informations utiles et gardez la main sur votre compte.
      </P>
      <Setting
        title="Comment Partant utilise mes données"
        description="Lire la notice de confidentialité"
        onPress={() => go("privacy-policy", coach ? "coach" : "client")}
      />
      <Setting
        title="Conditions d’utilisation"
        onPress={() => go("terms-native")}
      />
      {s.account ? (
        <>
          <H2 style={{ marginTop: 28, marginBottom: 12 }}>Vos réglages</H2>
          <Setting
            title="Modifier mes informations"
            onPress={() => go("account-native")}
          />
          <Setting
            title="Gérer mes notifications"
            onPress={() =>
              go(
                coach ? "config-native" : "account-native",
                coach ? "notifications" : "",
              )
            }
          />
          {coach && (
            <Setting
              title="Gérer mes agendas connectés"
              onPress={() => go("config-native", "calendars")}
            />
          )}
          <H2 style={{ marginTop: 28, marginBottom: 12 }}>Vos données</H2>
          <P small muted>
            L’export rassemble les données disponibles dans votre espace. Il ne
            comprend pas tous les journaux techniques ni les fichiers de
            justificatifs. Pour une demande d’accès complète, contactez-nous
            ci-dessous.
          </P>
          <Button
            light
            style={{ marginTop: 16 }}
            disabled={busy}
            onPress={() =>
              run(async () => {
                const snapshot =
                  s.connected && p.refresh
                    ? ((await p.refresh()) as typeof s | undefined)
                    : s;
                if (s.connected && !snapshot)
                  throw Error(
                    "L’actualisation est en cours. Réessayez dans un instant.",
                  );
                if ((snapshot ?? s).account?.id !== s.account?.id)
                  throw Error("Le compte actif a changé. Reconnectez-vous.");
                await exportFile(
                  "partant-mes-donnees.json",
                  JSON.stringify(
                    {
                      ...accountExport(snapshot ?? s),
                      noticeVersion: privacyNotice.version,
                      scope:
                        "Données disponibles dans l’espace Partant ; hors journaux techniques et fichiers de justificatifs.",
                    },
                    null,
                    2,
                  ),
                  "application/json",
                );
              })
            }
          >
            {busy ? "Préparation…" : "Exporter mes données"}
          </Button>
          {feedback}
          <Setting
            title="Faire une demande sur mes données"
            description="Accès, rectification, effacement ou autre question"
            onPress={() => go("privacy-request")}
          />
          <Setting
            title="Suivre mes demandes"
            onPress={() => go("support-native")}
          />
          <Setting
            title="Supprimer mon compte"
            onPress={() => go("delete-account-native")}
          />
        </>
      ) : (
        <>
          <P style={{ marginTop: 24 }}>
            La notice reste accessible sans compte. Connectez-vous pour gérer
            vos informations et suivre vos demandes.
          </P>
          <Button style={{ marginTop: 20 }} onPress={() => go("login")}>
            Me connecter
          </Button>
        </>
      )}
    </>
  );
}
