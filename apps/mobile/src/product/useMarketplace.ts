import * as Messaging from "./messaging";
import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { completeAuth, redirectTo } from "../lib/auth";
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
  const identity = useRef<string | undefined>(undefined),
    version = useRef<number | undefined>(undefined),
    active = useRef(true);
  const queue = useRef<Promise<void>>(Promise.resolve()),
    jobs = useRef(0),
    epoch = useRef(0);
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
    return data as { store: Store; version: number; deleted?: boolean };
  };
  async function refresh() {
    if (!live || jobs.current) return;
    const token = epoch.current;
    const data = await invoke({});
    if (token !== epoch.current || jobs.current || !active.current) return;
    version.current = data.version;
    assign(data.store);
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
    const token = epoch.current;
    assign(after);
    jobs.current++;
    setPending(jobs.current);
    queue.current = queue.current
      .then(async () => {
        if (token !== epoch.current) {
          jobs.current = Math.max(0, jobs.current - 1);
          setPending(jobs.current);
          return;
        }
        try {
          const saved = await execute(commands);
          if (jobs.current === 1) assign(saved);
        } catch (e) {
          epoch.current++;
          setError(
            `${(e as Error).message} Actualisez pour vérifier l’état enregistré avant de réessayer.`,
          );
          const data = await invoke({});
          version.current = data.version;
          assign(data.store);
        } finally {
          jobs.current = Math.max(0, jobs.current - 1);
          setPending(jobs.current);
        }
      })
      .catch((e) => setError((e as Error).message));
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
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
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
    const timer = setInterval(
      () => void refresh().catch((e) => setError(e.message)),
      5000,
    );
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
  async function sendCode(email: string, signup: boolean) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: signup, emailRedirectTo: redirectTo() },
    });
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
  }
  async function finishSocial(name: string, role: "client" | "coach") {
    if (!session?.user)
      throw Error("Connectez-vous avant de compléter votre compte.");
    await queue.current;
    assign(await execute([], { name, role }));
    await AsyncStorage.removeItem("partant-auth-intent");
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
    await queue.current;
    epoch.current++;
    if (live) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      assign(connectedInitial());
    } else assign(switchAccount(current.current, null));
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
    remoteSlots: [] as any[],
    counts: {} as Record<string, number>,
  };
}
