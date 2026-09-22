import React, { useEffect, useState } from "react";
import { Platform, View, AppState } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { Button, Chip, H2, Note, P, Row, Select, TextButton } from "./ui";
export async function calendarCall(action: string, extra: object = {}) {
  const { data, error } = await supabase.functions.invoke("google-calendar", {
    body: { action, ...extra },
  });
  if (error) {
    let body;
    try {
      body = await (error as any).context?.json();
    } catch {}
    throw Error(body?.error ?? "Connexion au calendrier indisponible.");
  }
  return data;
}
export function CalendarConnections({ live }: { live: boolean }) {
  const [status, setStatus] = useState<any>(null),
    [rows, setRows] = useState<any[]>([]),
    [read, setRead] = useState<string[]>([]),
    [write, setWrite] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  async function refresh() {
    const s = await calendarCall("status");
    setStatus(s);
    setRead(s.read);
    setWrite(s.write);
    if (s.connected) {
      const c = await calendarCall("calendars");
      setRows(c.calendars);
    }
  }
  async function run(fn: () => Promise<void>) {
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
  }
  useEffect(() => {
    if (live) void run(refresh);
    const sub = AppState.addEventListener("change", (s) => {
      if (live && s === "active") void run(refresh);
    });
    return () => sub.remove();
  }, [live]);
  return (
    <View style={{ gap: 16, marginBottom: 28 }}>
      <H2>Google Calendar</H2>
      {!live ? (
        <Note>
          Disponible avec un compte coach connecté. Les événements de
          démonstration ci-dessous restent locaux.
        </Note>
      ) : (
        <>
          {error ? <Note>{error}</Note> : null}
          {status?.error ? <Note>{status.error}</Note> : null}
          <P small muted>
            {!status
              ? "Vérification de la connexion…"
              : !status.configured
                ? "Configuration Google en attente"
                : status.connected
                  ? "Agenda associé"
                  : "Aucun agenda associé"}
          </P>
          {status?.lastSync ? (
            <P small muted>
              Dernière synchronisation :{" "}
              {new Date(status.lastSync).toLocaleString("fr-FR")}
            </P>
          ) : null}
          {status?.configured && (
            <Button
              light
              disabled={busy}
              onPress={() =>
                run(async () => {
                  const redirect =
                    Platform.OS === "web"
                      ? `${window.location.origin}/?data=connected`
                      : "partant://calendar/callback";
                  const r = await calendarCall("connect", { redirect });
                  if (Platform.OS === "web") window.location.assign(r.url);
                  else {
                    await WebBrowser.openAuthSessionAsync(r.url, redirect);
                    await refresh();
                  }
                })
              }
            >
              {status.connected
                ? "Reconnecter Google"
                : "Connecter Google Calendar"}
            </Button>
          )}
          {status?.connected && (
            <>
              <H2>Agendas qui vous occupent</H2>
              <Row wrap>
                {rows.map((c) => (
                  <Chip
                    key={c.id}
                    active={read.includes(c.id)}
                    onPress={() =>
                      setRead(
                        read.includes(c.id)
                          ? read.filter((id) => id !== c.id)
                          : [...read, c.id],
                      )
                    }
                  >
                    {c.name}
                  </Chip>
                ))}
              </Row>
              <Select
                label="Ajouter les séances Partant dans"
                value={write}
                items={[
                  ["", "Choisir un agenda"],
                  ...rows
                    .filter((c) => c.write)
                    .map((c) => [c.id, c.name] as [string, string]),
                ]}
                onChange={setWrite}
              />
              <Button
                disabled={busy || !read.length || !write}
                onPress={() =>
                  run(async () => {
                    await calendarCall("select", { read, write });
                    await refresh();
                  })
                }
              >
                Enregistrer et synchroniser
              </Button>
              <TextButton
                onPress={() =>
                  run(async () => {
                    await calendarCall("sync");
                    await refresh();
                  })
                }
              >
                Synchroniser maintenant
              </TextButton>
              <TextButton onPress={() => setConfirm(true)}>
                Déconnecter cet agenda
              </TextButton>
              {confirm && (
                <Note>
                  <P>
                    Les disponibilités ne tiendront plus compte de Google. Les
                    événements déjà exportés resteront dans votre agenda Google.
                  </P>
                  <Button
                    light
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        await calendarCall("disconnect");
                        setConfirm(false);
                        setRows([]);
                        await refresh();
                      })
                    }
                  >
                    Confirmer la déconnexion
                  </Button>
                  <TextButton onPress={() => setConfirm(false)}>
                    Conserver la connexion
                  </TextButton>
                </Note>
              )}
            </>
          )}
        </>
      )}
      <H2>Apple Calendar</H2>
      <P muted>Dans le détail d’une séance, touchez « Ajouter au calendrier », puis confirmez l’ajout dans votre calendrier Apple.</P>
      <P small muted>L’ajout est à votre initiative ; les changements ultérieurs ne sont pas synchronisés avec iCloud.</P>
      <H2>Outlook</H2>
      <P muted>Branchement prévu dans une prochaine étape.</P>
    </View>
  );
}
