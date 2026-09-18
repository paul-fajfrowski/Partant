import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import type { Store } from "./model";
export type Outgoing = {
  id: string;
  text: string;
  booking: string;
  status: "sending" | "failed";
  error?: string;
};
export type MessageDraft = {
  text: string;
  booking?: string;
  outgoing?: Outgoing;
};
type Drafts = Record<string, MessageDraft>;
const empty: MessageDraft = { text: "" };
export function useMessageDrafts(
  store: Store,
  scope: string,
  send: (booking: string, text: string, id: string) => Promise<void>,
) {
  const key = store.account
    ? `partant-messages-v1:${scope}:${store.account.id}`
    : "";
  const identity = useRef(key);
  identity.current = key;
  const current = useRef<Drafts>({}),
    writes = useRef(Promise.resolve()),
    inFlight = useRef(new Set<string>());
  const [state, setState] = useState({ key: "", drafts: {} as Drafts }),
    [loaded, setLoaded] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    current.current = {};
    setLoaded("");
    setError("");
    if (!key) {
      setState({ key, drafts: {} });
      return;
    }
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        let data: Drafts = {};
        try {
          const parsed = JSON.parse(raw ?? "{}");
          for (const [k, v] of Object.entries(parsed) as [
            string,
            MessageDraft,
          ][]) {
            if (!v || typeof v.text !== "string") continue;
            data[k] = {
              ...v,
              outgoing: v.outgoing
                ? {
                    ...v.outgoing,
                    status: "failed",
                    error: "Vérifiez l’envoi puis réessayez si nécessaire.",
                  }
                : undefined,
            };
          }
        } catch {}
        current.current = data;
        setState({ key, drafts: data });
        setLoaded(key);
      })
      .catch(() => {
        if (alive) {
          setState({ key, drafts: {} });
          setLoaded(key);
          setError("Les brouillons ne sont pas enregistrés sur cet appareil.");
        }
      });
    return () => {
      alive = false;
    };
  }, [key]);
  function change(thread: string, fn: (draft: MessageDraft) => MessageDraft) {
    if (identity.current !== key || !key || loaded !== key)
      return Promise.resolve();
    const drafts = {
      ...current.current,
      [thread]: fn(current.current[thread] ?? empty),
    };
    current.current = drafts;
    setState({ key, drafts });
    const payload = JSON.stringify(drafts);
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(key, payload))
      .catch(() => {
        if (identity.current === key)
          setError("Les brouillons ne sont pas enregistrés sur cet appareil.");
      });
    return writes.current;
  }
  // Server acknowledgement also reconciles an uncertain send after navigation/reload.
  useEffect(() => {
    if (loaded !== key) return;
    for (const [thread, d] of Object.entries(current.current))
      if (
        d.outgoing &&
        store.messages[d.outgoing.booking]?.some(
          (m) => m.id === d.outgoing!.id && m.who === store.account?.id,
        )
      )
        void change(thread, (x) => ({ ...x, outgoing: undefined }));
  }, [store.messages, key, loaded]);
  async function submit(thread: string, booking: string, retry = false) {
    if (!key || loaded !== key || identity.current !== key) return;
    const flight = key + thread;
    if (inFlight.current.has(flight)) return;
    const d = current.current[thread] ?? empty;
    if ((!retry && d.outgoing) || (!retry && !d.text.trim())) return;
    const outgoing = retry
      ? d.outgoing
      : {
          id: Crypto.randomUUID(),
          text: d.text.trim(),
          booking,
          status: "sending" as const,
        };
    if (!outgoing) return;
    inFlight.current.add(flight);
    await change(thread, (x) => ({
      ...x,
      text: retry ? x.text : "",
      booking: retry ? x.booking : booking,
      outgoing: { ...outgoing, status: "sending", error: undefined },
    }));
    try {
      if (identity.current !== key) throw Error("Le compte actif a changé.");
      await send(outgoing.booking, outgoing.text, outgoing.id);
      await change(thread, (x) =>
        x.outgoing?.id === outgoing.id ? { ...x, outgoing: undefined } : x,
      );
    } catch {
      await change(thread, (x) =>
        x.outgoing?.id === outgoing.id
          ? {
              ...x,
              outgoing: {
                ...outgoing,
                status: "failed",
                error: "Envoi non confirmé. Votre message est conservé.",
              },
            }
          : x,
      );
    } finally {
      inFlight.current.delete(flight);
    }
  }
  return {
    ready: loaded === key && !!key,
    error,
    drafts: state.key === key ? state.drafts : {},
    edit: (thread: string, text: string, booking: string) =>
      void change(thread, (x) => ({ ...x, text, booking })),
    submit,
  };
}
