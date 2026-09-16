import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { completeAuth, redirectTo } from "../lib/auth";
import { Platform, Linking } from "react-native";
import {
  Account,
  Booking,
  Coach,
  initialStore,
  Offer,
  seedCoaches,
  slotsFor,
  Store,
  today,
  switchAccount,
  allCoaches,
  newPreviewStore,
  configFor,
} from "./model";
import { Session } from "@supabase/supabase-js";
export function useMarketplace(live: boolean) {
  const [store, setStore] = useState<Store>(() =>
    live ? initialStore : newPreviewStore(),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [coaches, setCoaches] = useState<Coach[]>(live ? [] : seedCoaches);
  const [session, setSession] = useState<Session | null>(null);
  const [remoteSlots, setRemoteSlots] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [revision, setRevision] = useState(0);
  const identity = useRef<string | undefined>(undefined);
  identity.current = session?.user.id;
  const key = live
    ? "partant-native-live-preferences"
    : "partant-native-preview-v1";
  useEffect(() => {
    if (live) {
      setReady(true);
      return;
    }
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          try {
            setStore({ ...initialStore, ...JSON.parse(raw) });
          } catch {}
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [live]);
  useEffect(() => {
    if (ready && !live)
      AsyncStorage.setItem(key, JSON.stringify(store)).catch(() =>
        setError(
          "Vos changements restent valides pour cette visite ; le stockage local est indisponible.",
        ),
      );
  }, [store, ready]);
  async function refresh() {
    if (!live) return;
    const uid = identity.current;
    const [cs, os, ss, bs, ns, ps] = await Promise.all([
      supabase.from("coaches").select("*"),
      supabase.from("offers").select("*"),
      supabase.from("slots").select("*").order("starts_at"),
      uid
        ? supabase.from("bookings").select("*")
        : Promise.resolve({ data: [], error: null }),
      uid
        ? supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      uid
        ? supabase.from("profiles").select("*").eq("id", uid).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    for (const r of [cs, os, ss, bs, ns, ps]) if (r.error) throw r.error;
    if (identity.current !== uid) return;
    const offers: Offer[] = (os.data ?? []).map((o) => ({
      id: o.id,
      coach: o.coach_id,
      name: o.title,
      kind:
        o.format === "group"
          ? "Groupe"
          : o.format === "duo"
            ? "Duo"
            : "Individuel",
      duration: o.duration_minutes,
      price: o.price_cents / 100,
      capacity: o.capacity,
      active: o.active,
    }));
    const coaches: Coach[] = (cs.data ?? []).map((c) => ({
      id: c.id,
      photo: null,
      name: c.display_name,
      sport: c.sports[0] ?? "Coaching sportif",
      tags: c.sports,
      price: offers.find((o) => o.coach === c.id)?.price ?? 0,
      rating: null,
      reviews: 0,
      sessions: 0,
      years: 0,
      area: c.city,
      dist: null,
      formats: ["Parc"],
      place: "Lieu précisé lors de la réservation",
      address: "",
      cert: "",
      langs: "",
      quote: "",
      bio: c.bio,
      method: "",
      verified: false,
    }));
    const day = (str: string) =>
      new Intl.DateTimeFormat("fr-CA", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(str));
    const time = (str: string) =>
      new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(str));
    const bookings: Booking[] = (bs.data ?? []).flatMap((b) => {
      const s = ss.data?.find((s) => s.id === b.slot_id);
      if (!s) return [];
      const o = offers.find((o) => o.id === s.offer_id);
      return [
        {
          id: b.id,
          slotId: s.id,
          coach: b.coach_id,
          clientId: b.client_id,
          clientName:
            b.client_id === uid
              ? (ps.data?.full_name ?? "Participant")
              : "Participant",
          day: day(s.starts_at),
          time: time(s.starts_at),
          duration: o?.duration ?? 60,
          offerId: s.offer_id,
          serviceName: o?.name ?? "Séance",
          kind: o?.kind ?? "Individuel",
          format: "Parc",
          seats: b.seats,
          price: b.total_cents / 100,
          goal: "",
          address: s.location,
          status: b.status as "confirmed" | "cancelled",
        },
      ];
    });
    const mapped = (ss.data ?? []).map((s) => ({
      ...s,
      day: day(s.starts_at),
      time: time(s.starts_at),
    }));
    const inventory: Record<string, number> = {};
    for (let i = 0; i < mapped.length; i += 200) {
      const r = await supabase.rpc("slot_inventory", {
        p_slots: mapped.slice(i, i + 200).map((s) => s.id),
      });
      if (r.error) throw r.error;
      for (const row of r.data ?? []) inventory[row.slot_id] = row.remaining;
    }
    if (identity.current !== uid) return;
    setCoaches(coaches);
    setRemoteSlots(mapped);
    setCounts(inventory);
    setStore((s) => ({
      ...s,
      offers,
      bookings,
      account: uid
        ? {
            id: uid,
            name: ps.data?.full_name ?? "",
            email: session?.user.email ?? "",
            role: s.account?.role ?? "client",
          }
        : null,
      notices: (ns.data ?? []).map((n) => ({
        id: n.id,
        recipient: n.recipient_id,
        body: n.body,
        read: !!n.read_at,
        booking: n.booking_id ?? "",
      })),
      preferences:
        ps.data?.preferences && typeof ps.data.preferences === "object"
          ? { ...s.preferences, ...ps.data.preferences }
          : s.preferences,
    }));
  }
  useEffect(() => {
    if (!live) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      else setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
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
    if (!live) return;
    setStore((s) => ({ ...s, account: null, bookings: [], notices: [] }));
    refresh().catch((e) => setError(e.message));
    const timer = setInterval(() => setRevision((n) => n + 1), 30000);
    const channel = session?.user.id
      ? supabase
          .channel("product-notifications")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${session.user.id}`,
            },
            () => setRevision((n) => n + 1),
          )
          .subscribe()
      : null;
    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [live, session?.user.id]);
  useEffect(() => {
    if (live && revision) refresh().catch((e) => setError(e.message));
  }, [revision]);
  function times(c: Coach, day: string, offer?: Offer) {
    return live
      ? remoteSlots
          .filter(
            (s) =>
              s.coach_id === c.id &&
              s.day === day &&
              s.open &&
              (!offer || s.offer_id === offer.id) &&
              Date.parse(s.starts_at) > Date.now() + 3600000 &&
              (counts[s.id] ?? 0) > 0,
          )
          .map((s) => s.time)
          .filter((v, i, a) => a.indexOf(v) === i)
      : offer
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
    token: string,
    name: string,
    role: "client" | "coach",
  ) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    if (!data.user) throw Error("Connexion impossible.");
    const p = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (p.error) throw p.error;
    if (!p.data) {
      if (!name.trim())
        throw Error("Indiquez votre nom pour compléter le profil.");
      const { error } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, full_name: name.trim() });
      if (error) throw error;
    }
    if (role === "coach") {
      const c = await supabase
        .from("coaches")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (c.error) throw c.error;
      if (!c.data) {
        const { error } = await supabase.from("coaches").insert({
          id: data.user.id,
          display_name: p.data?.full_name ?? name,
        });
        if (error) throw error;
      }
    }
    setStore((s) => ({
      ...s,
      account: {
        id: data.user!.id,
        email,
        name: p.data?.full_name ?? name,
        role,
      },
    }));
    setRevision((n) => n + 1);
  }
  async function book(draft: Booking) {
    const s = remoteSlots.find(
      (s) =>
        s.coach_id === draft.coach &&
        s.offer_id === draft.offerId &&
        s.day === draft.day &&
        s.time === draft.time,
    );
    if (!s) throw Error("Ce créneau n’est plus disponible.");
    const { data, error } = await supabase.rpc("reserve_slot", {
      p_slot: s.id,
      p_seats: draft.seats,
      p_request: draft.id,
    });
    if (error) throw error;
    await refresh();
    return data.id;
  }
  async function cancelBooking(id: string) {
    const { error } = await supabase.rpc("change_booking", { p_booking: id });
    if (error) throw error;
    await refresh();
  }
  async function signOut() {
    if (live) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setStore((s) => switchAccount(s, null));
  }
  return {
    store,
    setStore,
    ready,
    error,
    setError,
    coaches: live
      ? coaches
      : allCoaches(store).map((c) => {
          const reviews =
            store.reviews?.filter((r) => r.coach === c.id && !r.hidden) ?? [];
          const cfg = configFor(store, c.id);
          return {
            ...c,
            price:
              store.offers.find((o) => o.coach === c.id && o.active)?.price ??
              c.price,
            verified:
              cfg.dossier.status === "approved" &&
              cfg.dossier.expires >= today(),
            ...(reviews.length
              ? {
                  rating: (
                    reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
                  )
                    .toFixed(1)
                    .replace(".", ","),
                  reviews: reviews.length,
                }
              : {}),
          };
        }),
    live,
    times,
    refresh,
    sendCode,
    verifyCode,
    book,
    cancelBooking,
    signOut,
    remoteSlots,
    counts,
    session,
  };
}
