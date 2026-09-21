import React, { useEffect, useState } from "react";
import { Platform, Linking, Switch, View } from "react-native";
import { Button, H2, P, Row, Rule, TextButton } from "./ui";
import {
  defaultPushCategories,
  enablePushDevice,
  pushRequest,
  unregisterPushDevice,
  PushStatus,
} from "./pushDevice";
export function PushSettings({
  owner,
  live,
}: {
  owner: string;
  live: boolean;
}) {
  const [status, setStatus] = useState<PushStatus>({
    categories: defaultPushCategories,
    registered: false,
    configured: false,
  });
  const [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    if (live)
      pushRequest("status", {}, owner)
        .then((value) => {
          if (active) {
            setStatus(value);
            setLoaded(true);
          }
        })
        .catch((e) => {
          if (active) setFeedback(e.message);
        });
    return () => {
      active = false;
    };
  }, [owner, live]);
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setFeedback("");
    try {
      await fn();
    } catch (e) {
      setFeedback((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!live) return null;
  return (
    <View style={{ marginVertical: 24 }}>
      <Rule />
      <H2 style={{ marginVertical: 16 }}>Sur votre téléphone</H2>
      <P muted>
        {Platform.OS !== "ios"
          ? "Activez les notifications depuis l’application iPhone. Vos préférences ci-dessous s’appliqueront à vos appareils."
          : status.registered
            ? "Cet iPhone reçoit vos notifications."
            : "Recevez les informations utiles même lorsque Partant est fermée."}
      </P>
      {loaded && !status.configured && (
        <P muted style={{ marginTop: 12 }}>
          L’activation des notifications est en cours de préparation.
        </P>
      )}
      {Platform.OS === "ios" && loaded && status.configured && (
        <Button
          light
          disabled={busy}
          style={{ marginVertical: 16 }}
          onPress={() =>
            run(async () => {
              if (status.registered) {
                await unregisterPushDevice();
                setStatus({ ...status, registered: false });
                setFeedback("Notifications désactivées sur cet iPhone.");
              } else {
                setStatus(await enablePushDevice(owner, true));
                setFeedback("Notifications activées sur cet iPhone.");
              }
            })
          }
        >
          {status.registered
            ? "Désactiver sur cet iPhone"
            : "Activer les notifications"}
        </Button>
      )}
      {Platform.OS === "ios" && (
        <TextButton onPress={() => Linking.openSettings()}>
          Réglages de l’iPhone
        </TextButton>
      )}
      {loaded &&
        (
          [
            ["booking", "Réservations"],
            ["changes", "Modifications et annulations"],
            ["reminder", "Rappels de séance"],
            ["messages", "Messages privés"],
            ["activity", "Avis, assistance et activité"],
          ] as const
        ).map(([key, label]) => (
          <Row
            key={key}
            style={{ justifyContent: "space-between", paddingVertical: 10 }}
          >
            <P style={{ flex: 1, paddingRight: 12 }}>{label}</P>
            <Switch
              accessibilityLabel={label}
              disabled={busy}
              value={status.categories[key]}
              onValueChange={(value) =>
                run(async () => {
                  setStatus(
                    await pushRequest(
                      "preferences",
                      { categories: { [key]: value } },
                      owner,
                    ),
                  );
                })
              }
              trackColor={{ false: "#dedede", true: "#141414" }}
            />
          </Row>
        ))}
      <P small muted style={{ marginTop: 12 }}>
        Les aperçus masquent le contenu des messages et les adresses.
        L’historique reste disponible dans Partant. Vos préférences de rappels
        et de séances restent prioritaires.
      </P>
      {!!feedback && <P style={{ marginTop: 12 }}>{feedback}</P>}
    </View>
  );
}
