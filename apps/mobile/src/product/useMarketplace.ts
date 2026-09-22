import { unregisterPushDevice, clearLocalPushDevice } from "./pushDevice";
import * as Messaging from "./messaging";
import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { completeAuth, redirectTo, withAuthTimeout } from "../lib/auth";
import { Platform, Linking, AppState } from "react-native";
import * as Crypto from "expo-crypto";
import {
  Account,
  Booking,
  Coach,
  initialStore,
  Offer,
  slotsFor,
  Store,
  today,
  switchAccount,
  allCoaches,
  newPreviewStore,
  configFor,
  remaining,
} from "./model";
import { Session } from "@supabase/supabase-js";
import { commandsFrom, commandLog, Command } from "./commands";
const connectedInitial = (): Store => ({
  ...initialStore,
  connected: true,
  offers: [],
  extraCoaches: [],
  bookings: [],
  notices: [],
  groups: [],
  settings: {},
  published: false,
});
export function useMarketplace(live: boolean) {
  // A visible QA replay gets its own demo storage; connected sessions are unaffected.
  const previewKey = useRef(
    (() => {
      const run =
        Platform.OS === "web" && !live
          ? new URLSearchParams(window.location.search).get("recette")
          : null;
      return run && /^[a-zA-Z0-9-]{1,64}$/.test(run)
        ? `partant-native-recette-${run}`
        : "partant-native-preview-v1";
    })(),
  ).current;
  const [store, update] = useState<Store>(() =>
    live ? connectedInitial() : newPreviewStore(),
  );
  const current = useRef(store);
  current.current = store;
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [loadedIdentity, setLoadedIdentity] = useState<
    string | null | undefined
  >(undefined);
  const identity = useRef<string | undefined>(undefined),
    version = useRef<number | undefined>(undefined),
    active = useRef(true);
  const queue = useRef<Promise<void>>(Promise.resolve()),
    jobs = useRef(0),
    epoch = useRef(0),
    queueGeneration = useRef(0);
  const assign = (s: Store) => {
    const clean = { ...s };
    delete (clean as any)[commandLog];
    current.current = clean;
    update(clean);
  };
  const invoke = async (body: object) => {
    const { data, error } = await supabase.functions.invoke("product-api", {
      body,
    });
    if (error) {
      let detail: any;
      try {
        detail = await (error as any).context?.json();
      } catch {}
      const failure = Error(
        detail?.error ?? error.message ?? "Connexion au serveur indisponible.",
      );
      Object.assign(failure, {
        snapshot: detail?.store,
        version: detail?.version,
        retryable:
          (error as any).context?.status >= 500 ||
          error.name === "FunctionsFetchError",
      });
      throw failure;
    }
    return data as {
      store: Store;
      version: number;
      deleted?: boolean;
      unchanged?: boolean;
    };
  };
  const signingOut = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: 0, failure: 0 });
  const refreshing = useRef(false);
  async function refresh() {
    if (!live || signingOut.current || jobs.current || refreshing.current)
      return;
    refreshing.current = true;
    try {
      const token = epoch.current;
      const data = await invoke({
        ifVersion: version.current,
        ifStaff: !!current.current.staff,
        scope: identity.current ?? null,
      });
      if (token !== epoch.current || jobs.current || !active.current) return;
      version.current = data.version;
      if (!data.unchanged) assign(data.store);
      setLoadedIdentity(identity.current ?? null);
      return current.current;
    } finally {
      refreshing.current = false;
    }
  }
  async function execute(
    commands: Command[],
    registration?: { name: string; role: "client" | "coach" },
  ) {
    const token = epoch.current;
    const request = {
      commands,
      register: registration,
      version: registration ? undefined : version.current,
      requestId: Crypto.randomUUID(),
    };
    let data: Awaited<ReturnType<typeof invoke>>;
    try {
      data = await invoke(request);
    } catch (e) {
      const failure = e as Error & {
        snapshot?: Store;
        version?: number;
        retryable?: boolean;
      };
      if (failure.retryable)
        data = await invoke(request); // Same idempotency key after an uncertain network response.
      else {
        if (token === epoch.current && failure.snapshot) {
          version.current = failure.version;
          assign(failure.snapshot);
        }
        throw e;
      }
    }
    if (token !== epoch.current) throw Error("Le compte actif a changé.");
    version.current = data.version;
    if (data.deleted) {
      const owner = current.current.account?.id;
      if (owner)
        await AsyncStorage.removeItem(`partant-messages-v1:connected:${owner}`);
      await supabase.auth.signOut();
    }
    return data.store;
  }
  async function messagingCommand(command: Command) {
    const account = current.current.account?.id;
    const token = epoch.current;
    const generation = queueGeneration.current;
    if (!account) throw Error("Reconnectez-vous pour envoyer un message.");
    if (!live) {
      const next =
        command.name === "message"
          ? Messaging.sendMessage(
              current.current,
              command.args[0],
              command.args[1],
              command.args[2],
            )
          : Messaging.readConversation(
              current.current,
              command.args[0],
              command.args[1],
            );
      assign(next);
      return;
    }
    jobs.current++;
    setPending(jobs.current);
    const job = queue.current
      .then(async () => {
        if (token !== epoch.current || account !== current.current.account?.id)
          throw Error("Le compte actif a changé.");
        try {
          const saved = await execute([command]);
          if (jobs.current === 1) assign(saved);
        } catch (error) {
          // A timeout can follow a committed message. Reconcile its stable ID before retrying.
          if (
            token === epoch.current &&
            account === current.current.account?.id
          ) {
            try {
              const data = await invoke({});
              if (token === epoch.current) {
                version.current = data.version;
                if (jobs.current === 1) assign(data.store);
                if (
                  command.name === "message" &&
                  data.store.messages[command.args[0]]?.some(
                    (m) =>
                      m.id === command.args[2] &&
                      m.who === account &&
                      m.text === command.args[1].trim(),
                  )
                )
                  return;
              }
            } catch {}
          }
          throw error;
        }
      })
      .finally(() => {
        if (generation !== queueGeneration.current) return;
        jobs.current = Math.max(0, jobs.current - 1);
        if (active.current) setPending(jobs.current);
      });
    queue.current = job.catch(() => {});
    return job;
  }
  const sendMessage = (booking: string, text: string, id: string) =>
    messagingCommand({ name: "message", args: [booking, text, id] });
  const readConversation = (booking: string, seen: Messaging.ReadReceipt[]) =>
    messagingCommand({ name: "readConversation", args: [booking, seen] });
  const setStore: Dispatch<SetStateAction<Store>> = (updateValue) => {
    if (signingOut.current) return;
    const before = current.current;
    const after =
      typeof updateValue === "function" ? updateValue(before) : updateValue;
    if (!live) {
      if (before.account && after.deletedAccounts?.includes(before.account.id))
        void AsyncStorage.removeItem(
          `partant-messages-v1:${previewKey}:${before.account.id}`,
        );
      assign(after);
      return;
    }
    if (!before.account) {
      // Guest discovery preferences remain transient until registration.
      assign({
        ...before,
        preferences: after.preferences,
        favorites: after.favorites,
      });
      return;
    }
    const commands = commandsFrom(before, after);
    if (commands.some((c) => c.name === "signOut")) {
      void signOut().catch((e) => setError(e.message));
      return;
    }
    if (!commands.length) return;
    const isSave = commands.some(
      (c) => !["drafts", "readNotice", "readConversation"].includes(c.name),
    );
    const token = epoch.current;
    const generation = queueGeneration.current;
    assign(after);
    jobs.current++;
    setPending(jobs.current);
    queue.current = queue.current
      .then(async () => {
        if (token !== epoch.current) {
          if (generation !== queueGeneration.current) return;
          jobs.current = Math.max(0, jobs.current - 1);
          setPending(jobs.current);
          return;
        }
        try {
          const saved = await execute(commands);
          if (token !== epoch.current) return;
          if (jobs.current === 1) assign(saved);
          if (isSave) setSaveResult((r) => ({ ...r, success: r.success + 1 }));
        } catch (e) {
          if (token !== epoch.current) return;
          if (isSave) setSaveResult((r) => ({ ...r, failure: r.failure + 1 }));
          const recovery = ++epoch.current;
          setError(
            `${(e as Error).message} Actualisez pour vérifier l’état enregistré avant de réessayer.`,
          );
          const data = await invoke({});
          if (recovery !== epoch.current || signingOut.current) return;
          version.current = data.version;
          assign(data.store);
        } finally {
          if (generation === queueGeneration.current) {
            jobs.current = Math.max(0, jobs.current - 1);
            setPending(jobs.current);
          }
        }
      })
      .catch((e) => {
        if (!signingOut.current && token === epoch.current)
          setError((e as Error).message);
      });
  };
  useEffect(() => {
    active.current = true;
    if (live)
      return () => {
        active.current = false;
      };
    AsyncStorage.getItem(previewKey)
      .then((raw) => {
        if (raw) {
          try {
            assign({ ...initialStore, ...JSON.parse(raw) });
          } catch {}
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [live]);
  useEffect(() => {
    if (ready && !live)
      AsyncStorage.setItem(previewKey, JSON.stringify(store)).catch(() =>
        setError("Le stockage local est indisponible."),
      );
  }, [store, ready]);
  useEffect(() => {
    if (!live) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      if (!signingOut.current) setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!signingOut.current || !s) setSession(s);
    });
    if (Platform.OS === "web")
      completeAuth(window.location.href).catch((e) => setError(e.message));
    else
      Linking.getInitialURL()
        .then((url) => {
          if (url) return completeAuth(url);
        })
        .catch((e) => setError(e.message));
    const link = Linking.addEventListener("url", ({ url }) =>
      completeAuth(url).catch((e) => setError(e.message)),
    );
    return () => {
      data.subscription.unsubscribe();
      link.remove();
    };
  }, [live]);
  useEffect(() => {
    if (!live || !ready) return;
    if (identity.current !== session?.user.id) {
      epoch.current++;
      identity.current = session?.user.id;
      version.current = undefined;
      assign(connectedInitial());
    }
    void refresh().catch((e) => setError(e.message));
    let nextPoll = 0;
    let failures = 0;
    const poll = () => {
      const visible =
        Platform.OS === "web"
          ? document.visibilityState !== "hidden"
          : AppState.currentState === "active";
      if (!visible || Date.now() < nextPoll) return;
      void refresh()
        .then(() => {
          failures = 0;
          nextPoll = Date.now() + 10_000;
        })
        .catch((e) => {
          failures++;
          nextPoll = Date.now() + Math.min(60_000, 5000 * 2 ** failures);
          setError(e.message);
        });
    };
    const timer = setInterval(poll, 5000);
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh().catch((e) => setError(e.message));
    });
    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [live, session?.user.id, ready]);
  function times(c: Coach, day: string, offer?: Offer) {
    return offer
      ? slotsFor(c, day, store, offer)
      : [
          ...new Set(
            store.offers
              .filter((o) => o.coach === c.id && o.active)
              .flatMap((o) => slotsFor(c, day, store, o)),
          ),
        ].sort();
  }
  async function sendCode(
    email: string,
    signup: boolean,
    name = "",
    role: "client" | "coach" = "client",
  ) {
    // Keep the selected registration path when the mail link reopens the app.
    await AsyncStorage.setItem(
      "partant-auth-intent",
      JSON.stringify({ name: signup ? name : "", role }),
    );
    const { error } = await withAuthTimeout(
      supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: signup, emailRedirectTo: redirectTo() },
      }),
    );
    if (error) throw error;
  }
  async function verifyCode(
    email: string,
    code: string,
    name: string,
    role: "client" | "coach",
  ) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) throw error;
    if (!data.user) throw Error("Connexion impossible.");
    identity.current = data.user.id;
    setSession(data.session);
    const loaded = await invoke({});
    version.current = loaded.version;
    const saved = await execute([], { name, role });
    assign(saved);
    setLoadedIdentity(data.user.id);
  }
  async function finishSocial(name: string, role: "client" | "coach") {
    if (!session?.user)
      throw Error("Connectez-vous avant de compléter votre compte.");
    await queue.current;
    assign(await execute([], { name, role }));
    setLoadedIdentity(session.user.id);
    await AsyncStorage.removeItem("partant-auth-intent");
  }
  async function submitCoachApplication(body: string) {
    if (current.current.account?.role !== "client")
      throw Error("Cette demande est réservée à votre compte client.");
    if (
      current.current.tickets?.some(
        (t) =>
          t.owner === current.current.account?.id &&
          t.kind === "Assistance" &&
          t.body.startsWith("Candidature coach :") &&
          t.status === "open",
      )
    )
      throw Error(
        "Une demande est déjà en cours. Retrouvez-la dans Aide & mes demandes.",
      );
    await queue.current;
    assign(
      await execute([
        {
          name: "report",
          args: [{ kind: "Assistance", body: "Candidature coach : " + body }],
        },
      ]),
    );
  }
  async function book(draft: Booking) {
    await queue.current;
    const saved = await execute([{ name: "reserve", args: [draft] }]);
    assign(saved);
    return draft.id;
  }
  async function cancelBooking(id: string) {
    await queue.current;
    assign(
      await execute([
        { name: "cancelSession", args: [id, "Annulation par le client"] },
      ]),
    );
  }
  async function signOut() {
    if (signingOut.current) return;
    signingOut.current = true;
    setLeaving(true);
    epoch.current++;
    queueGeneration.current++;
    queue.current = Promise.resolve();
    jobs.current = 0;
    setPending(0);
    refreshing.current = false;
    const owner = current.current.account?.id;
    // Exit the private UI immediately; never wait for queued edits or APNs.
    assign(live ? connectedInitial() : switchAccount(current.current, null));
    setSession(null);
    identity.current = undefined;
    version.current = undefined;
    setLoadedIdentity(null);
    setError("");
    try {
      if (live) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            unregisterPushDevice(false).catch(() => {}),
            new Promise<void>((resolve) => {
              timer = setTimeout(resolve, 800);
            }),
          ]);
        } finally {
          if (timer) clearTimeout(timer);
        }
        await clearLocalPushDevice().catch(() => {});
        await AsyncStorage.multiRemove([
          "partant-auth-intent",
          "partant-auth-journey-v1",
          ...(owner ? [`partant-messages-v1:connected:${owner}`] : []),
        ]);
        // Local scope revokes this session without disconnecting other devices.
        // The SDK clears persisted credentials even when revocation is offline.
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error)
          setError(
            "Vous êtes déconnecté de cet appareil. La révocation serveur n’a pas pu être confirmée hors connexion.",
          );
      }
    } finally {
      signingOut.current = false;
      setLeaving(false);
    }
  }
  const coaches = allCoaches(store).map((c) => {
    const reviews =
        store.reviews?.filter((r) => r.coach === c.id && !r.hidden) ?? [],
      cfg = configFor(store, c.id);
    return {
      ...c,
      price:
        store.offers.find((o) => o.coach === c.id && o.active)?.price ??
        c.price,
      verified:
        cfg.dossier.status === "approved" && cfg.dossier.expires >= today(),
      ...(reviews.length
        ? {
            rating: (reviews.reduce((n, r) => n + r.rating, 0) / reviews.length)
              .toFixed(1)
              .replace(".", ","),
            reviews: reviews.length,
          }
        : {}),
    };
  });
  return {
    store,
    profileReady:
      !live || (ready && loadedIdentity === (session?.user.id ?? null)),
    submitCoachApplication,
    sendMessage,
    readConversation,
    localScope: live ? "connected" : previewKey,
    setStore,
    ready,
    error,
    setError,
    coaches,
    live,
    times,
    refresh,
    sendCode,
    verifyCode,
    finishSocial,
    book,
    cancelBooking,
    signOut,
    session,
    pending,
    leaving,
    saveResult,
    remoteSlots: [] as any[],
    counts: {} as Record<string, number>,
  };
}
