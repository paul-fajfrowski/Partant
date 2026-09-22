import React, { useEffect, useState } from "react";
import { Platform, Linking, Switch, View, AppState } from "react-native";
import { Button, H2, P, Row, TextButton, SaveFeedbackContext } from "./ui";
import {
  defaultPushCategories,
  enablePushDevice,
  pushRequest,
  unregisterPushDevice,
  PushStatus,
  PushCategories,
} from "./pushDevice";
import { Store, configFor, coachAccountId } from "./model";
import { saveSettings, infoFor } from "./workflows";
export function PushSettings({
  owner,
  live,
  store,
  setStore,
  onSaved,
}: {
  owner: string;
  live: boolean;
  store?: Store;
  setStore?: React.Dispatch<React.SetStateAction<Store>>;
  onSaved?: () => Promise<unknown>;
}) {
  const [status, setStatus] = useState<PushStatus>({
    categories: defaultPushCategories,
    registered: false,
    configured: false,
  });
  const [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(""),
    [loaded, setLoaded] = useState(!live);
  const [osAllowed, setOsAllowed] = useState(true);
  const coach = store?.account?.role === "coach";
  const writeState = React.useContext(SaveFeedbackContext);
  useEffect(() => {
    let active = true;
    async function refresh() {
      if (!live) return;
      try {
        const value = await pushRequest("status", {}, owner);
        if (active) {
          setStatus(value);
          setLoaded(true);
        }
        if (Platform.OS === "ios") {
          const N = await import("expo-notifications");
          const p = await N.getPermissionsAsync();
          if (active) setOsAllowed(p.granted);
        }
      } catch (e) {
        if (active) setFeedback((e as Error).message);
      }
    }
    void refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      active = false;
      sub.remove();
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
  let categories = status.categories;
  if (!live && store) {
    const cfg = configFor(store, coachAccountId(store)),
      info = infoFor(store, owner);
    categories = {
      ...status.categories,
      ...(coach ? cfg.notifications : {}),
      reminder: coach ? cfg.notifications.reminder : info.reminders,
      availability: info.alerts,
    };
  }
  function toggle(key: keyof PushCategories, value: boolean) {
    if (live)
      void run(async () => {
        setStatus(
          await pushRequest(
            "preferences",
            { categories: { [key]: value } },
            owner,
          ),
        );
        await onSaved?.();
      });
    else if (store && setStore) {
      if (coach && ["booking", "changes", "reminder"].includes(key)) {
        const id = coachAccountId(store),
          cfg = configFor(store, id);
        setStore(
          saveSettings(store, id, {
            ...cfg,
            notifications: { ...cfg.notifications, [key]: value },
          }),
        );
      } else {
        setStatus((s) => ({
          ...s,
          categories: { ...s.categories, [key]: value },
        }));
        if (key === "reminder" || key === "availability")
          setStore({
            ...store,
            accountInfo: {
              ...store.accountInfo,
              [owner]: {
                ...infoFor(store, owner),
                [key === "reminder" ? "reminders" : "alerts"]: value,
              },
            },
          });
      }
    }
  }
  const groups: { title: string; items: [keyof PushCategories, string][] }[] = [
    {
      title: "Vos séances",
      items: [
        [
          "booking",
          coach ? "Nouvelles réservations" : "Confirmations de réservation",
        ],
        ["changes", "Modifications et annulations"],
        ["reminder", "Rappels de séance"],
      ],
    },
    {
      title: "Vos échanges",
      items: [
        ["messages", "Messages privés"],
        ["activity", "Avis et suivi de vos demandes"],
        ...(!coach
          ? [
              ["availability", "Alertes de disponibilité"] as [
                keyof PushCategories,
                string,
              ],
            ]
          : []),
      ],
    },
  ];
  return (
    <View style={{ marginVertical: 12 }}>
      <H2 style={{ marginBottom: 12 }}>Sur votre téléphone</H2>
      <P muted>
        {!live
          ? "Aucun envoi externe en démonstration."
          : Platform.OS !== "ios"
            ? "Activez les notifications depuis l’application iPhone."
            : status.registered && osAllowed
              ? "Les notifications sont activées sur cet iPhone."
              : "Recevez vos informations même lorsque Partant est fermée."}
      </P>
      {live && Platform.OS === "ios" && !status.registered && (
        <P small muted style={{ marginTop: 8 }}>
          Facultatif. L’activation associe cet iPhone à votre compte pour
          recevoir vos alertes. Vous pourrez la retirer ici ; aucune publicité
          n’est activée.
        </P>
      )}
      {live && loaded && !status.configured && (
        <P small muted>
          L’activation des notifications est en cours de préparation.
        </P>
      )}
      {live && Platform.OS === "ios" && loaded && status.configured && (
        <>
          <Button
            light
            disabled={busy}
            style={{ marginTop: 16 }}
            onPress={() =>
              run(async () => {
                if (status.registered) {
                  await unregisterPushDevice();
                  setStatus({ ...status, registered: false });
                } else {
                  setStatus(await enablePushDevice(owner, true));
                  setOsAllowed(true);
                }
              })
            }
          >
            {busy
              ? "Mise à jour…"
              : status.registered
                ? "Désactiver sur cet iPhone"
                : "Activer les notifications"}
          </Button>
          {!osAllowed && (
            <TextButton onPress={() => Linking.openSettings()}>
              Autoriser dans les réglages de l’iPhone
            </TextButton>
          )}
        </>
      )}
      {!loaded && live && !feedback && (
        <P small muted style={{ marginTop: 16 }}>
          Chargement de vos préférences…
        </P>
      )}
      {loaded &&
        groups.map((group) => (
          <View key={group.title} style={{ marginTop: 24 }}>
            <H2 style={{ marginBottom: 8 }}>{group.title}</H2>
            {group.items.map(([key, label]) => (
              <Row
                key={key}
                style={{
                  minHeight: 58,
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <P style={{ flex: 1 }}>{label}</P>
                <Switch
                  accessibilityLabel={label}
                  disabled={busy || writeState.pending > 0}
                  value={!!categories[key]}
                  onValueChange={(v) => toggle(key, v)}
                  trackColor={{ false: "#dedede", true: "#141414" }}
                  thumbColor="#fff"
                />
              </Row>
            ))}
          </View>
        ))}
      <P small muted style={{ marginTop: 20 }}>
        {busy
          ? "Mise à jour…"
          : "Vos préférences sont enregistrées automatiquement. L’historique reste disponible dans Partant."}
      </P>
      {!!feedback && (
        <View accessibilityLiveRegion="polite" style={{ marginTop: 12 }}>
          <P>{feedback}</P>
          {!loaded && (
            <Button
              light
              onPress={() =>
                run(async () => {
                  setStatus(await pushRequest("status", {}, owner));
                  setLoaded(true);
                })
              }
            >
              Réessayer
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
