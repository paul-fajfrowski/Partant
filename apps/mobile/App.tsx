import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as Crypto from "expo-crypto";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";
import { completeAuth, redirectTo, signInSocial } from "./src/lib/auth";
import { Place, searchAddresses, distanceKm } from "./src/lib/geo";
import { errorMessage } from "./src/lib/errors";
import PlaceMap from "./src/components/PlaceMap";
import type { Database } from "./src/lib/database.types";
type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n / 100,
  );
const date = (s: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(s));
const formatName = { individual: "Individuel", duo: "Duo", group: "Groupe" };
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        st.button,
        secondary && st.secondary,
        (disabled || pressed) && { opacity: 0.5 },
      ]}
    >
      <Text style={[st.buttonText, secondary && { color: "#141414" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  onChange,
  secure = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.small}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize="none"
        keyboardType={numeric ? "numeric" : "default"}
        style={st.input}
      />
    </View>
  );
}
function AddressPicker({
  onChoose,
  label = "Adresse ou quartier",
}: {
  onChoose: (p: Place) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchAddresses(query, controller.signal)
        .then((x) => {
          setItems(x);
          setError("");
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <View style={{ gap: 8 }}>
      <Field label={label} value={query} onChange={setQuery} />
      {error && <Text>{error}</Text>}
      {items.map((p) => (
        <Pressable
          accessibilityRole="button"
          key={p.label}
          style={st.address}
          onPress={() => {
            onChoose(p);
            setItems([]);
            setQuery("");
          }}
        >
          <Text style={st.text}>{p.label}</Text>
        </Pressable>
      ))}
      <Text style={st.muted}>Adresses : IGN · Base Adresse Nationale</Text>
    </View>
  );
}
export default function App() {
  const [fonts] = useFonts({
    Hanken: require("./assets/hanken.ttf"),
    HankenBold: require("./assets/hanken-800.ttf"),
  });
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState("explore");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Row<"profiles"> | null>(null);
  const [coaches, setCoaches] = useState<Row<"coaches">[]>([]);
  const [offers, setOffers] = useState<Row<"offers">[]>([]);
  const [slots, setSlots] = useState<Row<"slots">[]>([]);
  const [bookings, setBookings] = useState<Row<"bookings">[]>([]);
  const [notes, setNotes] = useState<Row<"notifications">[]>([]);
  const [calendars, setCalendars] = useState<Row<"calendar_connections">[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Running");
  const [format, setFormat] = useState<"individual" | "duo" | "group">(
    "individual",
  );
  const [price, setPrice] = useState("45");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("6");
  const [chosenOffer, setChosenOffer] = useState("");
  const [starts, setStarts] = useState("");
  const [venue, setVenue] = useState<Place | null>(null);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [radius, setRadius] = useState("10");
  const [selected, setSelected] = useState<Row<"slots"> | null>(null);
  const [seats, setSeats] = useState("1");
  const [moving, setMoving] = useState<Row<"bookings"> | null>(null);
  const requestId = useRef(Crypto.randomUUID());
  const [generation, setGeneration] = useState(0);
  const uid = session?.user.id;
  const currentUser = useRef(uid);
  currentUser.current = uid;
  const ownCoach = coaches.find((c) => c.id === uid);
  const ownOffers = offers.filter((o) => o.coach_id === uid);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function refresh(userId = uid) {
    const results = await Promise.all([
      supabase.from("coaches").select("*"),
      supabase.from("offers").select("*"),
      supabase.from("slots").select("*").order("starts_at"),
      userId
        ? supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      userId
        ? supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase.from("calendar_connections").select("*")
        : Promise.resolve({ data: [], error: null }),
    ]);
    for (const r of results) if (r.error) throw r.error;
    if (currentUser.current !== userId) return;
    setCoaches(results[0].data ?? []);
    setOffers(results[1].data ?? []);
    setSlots(results[2].data ?? []);
    setProfile(results[3].data);
    setBookings(results[4].data ?? []);
    setNotes(results[5].data ?? []);
    setCalendars(results[6].data ?? []);
    const ids = (results[2].data ?? []).map((s) => s.id);
    const counts: Record<string, number> = {};
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await supabase.rpc("slot_inventory", {
        p_slots: ids.slice(i, i + 200),
      });
      if (error) throw error;
      for (const x of data ?? []) counts[x.slot_id] = x.remaining;
    }
    if (currentUser.current === userId) setInventory(counts);
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setMessage(error.message);
      else setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
        setTab("account");
      }
    });
    if (Platform.OS === "web")
      completeAuth(window.location.href).catch((e) =>
        setMessage(errorMessage(e)),
      );
    else
      Linking.getInitialURL()
        .then((url) => {
          if (url) return completeAuth(url);
        })
        .catch((e) => setMessage(errorMessage(e)));
    const link = Linking.addEventListener("url", ({ url }) =>
      completeAuth(url).catch((e) => setMessage(errorMessage(e))),
    );
    return () => {
      data.subscription.unsubscribe();
      link.remove();
    };
  }, []);
  useEffect(() => {
    setProfile(null);
    setBookings([]);
    setNotes([]);
    setCalendars([]);
    setSelected(null);
    setMoving(null);
    refresh(uid).catch((e) => setMessage(errorMessage(e)));
    const timer = setInterval(() => refresh(uid).catch(() => {}), 30000);
    const channel = uid
      ? supabase
          .channel(`partant-${uid}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${uid}`,
            },
            () => setGeneration((x) => x + 1),
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "bookings" },
            () => setGeneration((x) => x + 1),
          )
          .subscribe()
      : null;
    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [uid]);
  useEffect(() => {
    if (generation) refresh(uid).catch((e) => setMessage(errorMessage(e)));
  }, [generation]);
  async function saveProfile() {
    if (!uid) throw new Error("Connectez-vous d’abord.");
    if (!name.trim()) throw new Error("Indiquez votre prénom et nom.");
    const fullName = (name || profile?.full_name || "").trim();
    const { error } = profile
      ? await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", uid)
      : await supabase
          .from("profiles")
          .insert({ id: uid, full_name: fullName });
    if (error) throw error;
    await refresh();
  }
  async function createCoach() {
    if (!uid || !profile) throw new Error("Enregistrez d’abord votre profil.");
    const { error } = await supabase
      .from("coaches")
      .insert({ id: uid, display_name: profile.full_name, sports: [sport] });
    if (error) throw error;
    await refresh();
  }
  async function publish() {
    if (!ownCoach) return;
    const { error } = await supabase
      .from("coaches")
      .update({ published: !ownCoach.published })
      .eq("id", ownCoach.id);
    if (error) throw error;
    await refresh();
  }
  async function createOffer() {
    if (!uid) return;
    const amount = Math.round(Number(price.replace(",", ".")) * 100);
    const count =
      format === "individual" ? 1 : format === "duo" ? 2 : Number(capacity);
    if (
      !title.trim() ||
      !sport.trim() ||
      !Number.isFinite(amount) ||
      !Number.isInteger(Number(duration)) ||
      !Number.isInteger(count)
    )
      throw new Error("Vérifiez les informations de l’offre.");
    const { data, error } = await supabase
      .from("offers")
      .insert({
        coach_id: uid,
        title: title.trim(),
        sport: sport.trim(),
        format,
        duration_minutes: Number(duration),
        price_cents: amount,
        capacity: count,
      })
      .select()
      .single();
    if (error) throw error;
    setChosenOffer(data.id);
    setTitle("");
    await refresh();
    setMessage("Offre enregistrée. Ouvrez maintenant un créneau.");
  }
  async function openSlot() {
    if (!venue) throw new Error("Choisissez une adresse dans les résultats.");
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(starts) ||
      Number.isNaN(Date.parse(starts))
    )
      throw new Error(
        "Utilisez une date ISO avec son fuseau, par exemple 2026-09-25T19:00+02:00.",
      );
    const { error } = await supabase.rpc("open_slot", {
      p_offer: chosenOffer,
      p_start: starts,
      p_location: venue.label,
      p_lat: venue.latitude,
      p_lng: venue.longitude,
    });
    if (error) throw error;
    await refresh();
    setMessage("Créneau ouvert et partagé.");
  }
  async function confirm() {
    if (!uid || !profile) {
      setTab("account");
      throw new Error(
        "Connectez-vous et complétez votre profil avant de réserver.",
      );
    }
    if (!selected) return;
    const { error } = await supabase.rpc("reserve_slot", {
      p_slot: selected.id,
      p_seats: Number(seats),
      p_request: requestId.current,
    });
    if (error) throw error;
    setSelected(null);
    await refresh();
    setTab("bookings");
    setMessage(
      "Séance réservée dans la base de développement. Aucun paiement encaissé.",
    );
  }
  useEffect(() => {
    setName(profile?.full_name ?? "");
  }, [profile?.id]);
  const visibleSlots = slots
    .filter(
      (s) =>
        s.open &&
        Date.parse(s.starts_at) > Date.now() + 3600000 &&
        offers.some((o) => o.id === s.offer_id && o.active) &&
        coaches.some((c) => c.id === s.coach_id && c.published),
    )
    .filter(
      (s) =>
        !origin ||
        (s.latitude !== null &&
          s.longitude !== null &&
          distanceKm(origin, {
            latitude: s.latitude,
            longitude: s.longitude,
          }) <= Number(radius)),
    );
  if (!fonts) return <ActivityIndicator />;
  return (
    <View style={st.page}>
      <StatusBar style="dark" />
      <View style={st.shell}>
        <View style={st.header}>
          <Text style={st.brand}>partant</Text>
          <Text style={st.muted}>Développement · données partagées</Text>
        </View>
        <View style={st.tabs}>
          {[
            ["explore", "Découvrir"],
            ["bookings", "Séances"],
            ["coach", "Coach"],
            ["account", "Compte"],
          ].map(([key, label]) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              key={key}
              onPress={() => {
                setTab(key);
                setMessage("");
              }}
              style={[st.tab, tab === key && st.activeTab]}
            >
              <Text style={[st.small, tab === key && { color: "#fff" }]}>
                {label}
                {key === "coach" && notes.some((n) => !n.read_at) ? " ·" : ""}
              </Text>
            </Pressable>
          ))}
        </View>
        {busy && <ActivityIndicator style={{ margin: 8 }} />}
        {!!message && (
          <Text accessibilityRole="alert" style={st.notice}>
            {message}
          </Text>
        )}
        <ScrollView
          contentContainerStyle={st.content}
          keyboardShouldPersistTaps="handled"
        >
          {tab === "explore" && (
            <>
              <Text style={st.eyebrow}>UN MOMENT POUR VOUS</Text>
              <Text style={st.h1}>On se retrouve{"\n"}sur le terrain.</Text>
              <Text style={st.muted}>
                Des séances près de vous. Des disponibilités partagées.
              </Text>
              <AddressPicker
                onChoose={setOrigin}
                label="Autour de quelle adresse ?"
              />
              {origin && (
                <>
                  <Text style={st.text}>{origin.label}</Text>
                  <Field
                    label="Rayon de recherche (km à vol d’oiseau)"
                    value={radius}
                    onChange={setRadius}
                    numeric
                  />
                  <PlaceMap place={origin} />
                  <Button
                    title="Retirer le secteur"
                    secondary
                    onPress={() => setOrigin(null)}
                  />
                </>
              )}
              <View style={st.row}>
                <Text style={st.h2}>Les prochaines séances</Text>
                <Button
                  title="Actualiser"
                  secondary
                  disabled={busy}
                  onPress={() => run(() => refresh())}
                />
              </View>
              {!visibleSlots.length && (
                <View style={st.surface}>
                  <Text style={st.h2}>Le terrain est encore libre.</Text>
                  <Text style={st.text}>
                    Aucune séance dans ce secteur pour l’instant. Un coach peut
                    créer une offre et ouvrir ses premiers créneaux dans son
                    espace.
                  </Text>
                </View>
              )}
              {visibleSlots.map((s) => {
                const o = offers.find((o) => o.id === s.offer_id)!;
                const c = coaches.find((c) => c.id === s.coach_id)!;
                return (
                  <View key={s.id} style={st.item}>
                    <Text style={st.eyebrow}>
                      {o.sport} ·{" "}
                      {formatName[o.format as keyof typeof formatName]}
                    </Text>
                    <Text style={st.h2}>{o.title}</Text>
                    <Text style={st.text}>
                      {c.display_name} · {o.duration_minutes} min
                    </Text>
                    <Text style={st.text}>{date(s.starts_at)}</Text>
                    <Text style={st.muted}>{s.location}</Text>
                    <Text style={st.text}>
                      {money(s.price_cents)}
                      {o.format === "group"
                        ? " / personne"
                        : " / séance"} · {inventory[s.id] ?? "…"} place(s)
                    </Text>
                    {origin && s.latitude !== null && s.longitude !== null && (
                      <Text style={st.muted}>
                        {distanceKm(origin, {
                          latitude: s.latitude,
                          longitude: s.longitude,
                        }).toFixed(1)}{" "}
                        km à vol d’oiseau
                      </Text>
                    )}
                    <Button
                      title={
                        s.coach_id === uid
                          ? "Votre séance"
                          : "Choisir ce créneau"
                      }
                      disabled={
                        busy || s.coach_id === uid || inventory[s.id] === 0
                      }
                      onPress={() => {
                        setSelected(s);
                        setSeats(o.format === "duo" ? "2" : "1");
                        requestId.current = Crypto.randomUUID();
                      }}
                    />
                    {selected?.id === s.id && (
                      <View style={st.surface}>
                        <Text style={st.h2}>Votre séance</Text>
                        {o.format === "group" && (
                          <Field
                            label="Nombre de places"
                            value={seats}
                            onChange={setSeats}
                            numeric
                          />
                        )}
                        <Text style={st.text}>
                          Total :{" "}
                          {money(
                            s.price_cents *
                              (o.format === "group" ? Number(seats) || 0 : 1),
                          )}
                        </Text>
                        <Text style={st.muted}>
                          Réservation de développement sans paiement.
                          Modification et annulation jusqu’à 24 h avant.
                        </Text>
                        {s.latitude !== null && s.longitude !== null && (
                          <PlaceMap
                            place={{
                              label: s.location,
                              city: "",
                              latitude: s.latitude,
                              longitude: s.longitude,
                            }}
                          />
                        )}
                        <Button
                          title="Confirmer la réservation de test"
                          disabled={busy}
                          onPress={() => run(confirm)}
                        />
                        <Button
                          title="Revenir"
                          secondary
                          onPress={() => setSelected(null)}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
          {tab === "account" && (
            <>
              <Text style={st.h1}>
                {session ? "Votre espace." : "Bienvenue chez vous."}
              </Text>
              <Text style={st.muted}>
                Les comptes sont réels. Les séances restent des essais sans
                paiement.
              </Text>
              {!session ? (
                <>
                  <Field
                    label="Adresse e-mail"
                    value={email}
                    onChange={setEmail}
                  />
                  <Field
                    label="Mot de passe"
                    value={password}
                    onChange={setPassword}
                    secure
                  />
                  <Button
                    title="Se connecter"
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        const { error } =
                          await supabase.auth.signInWithPassword({
                            email: email.trim(),
                            password,
                          });
                        if (error) throw error;
                      })
                    }
                  />
                  <Button
                    title="Créer mon compte"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        const { data, error } = await supabase.auth.signUp({
                          email: email.trim(),
                          password,
                          options: { emailRedirectTo: redirectTo() },
                        });
                        if (error) throw error;
                        setMessage(
                          data.session
                            ? "Compte créé."
                            : "Vérifiez votre e-mail. L’envoi de développement Supabase est limité aux adresses autorisées.",
                        );
                      })
                    }
                  />
                  <Button
                    title="Mot de passe oublié"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        const { error } =
                          await supabase.auth.resetPasswordForEmail(
                            email.trim(),
                            { redirectTo: redirectTo() },
                          );
                        if (error) throw error;
                        setMessage(
                          "Si cette adresse est autorisée et possède un compte, un lien de récupération sera envoyé.",
                        );
                      })
                    }
                  />
                  {(["google", "apple"] as const).map((p) => (
                    <Button
                      key={p}
                      title={`Continuer avec ${p === "google" ? "Google" : "Apple"} · en préparation`}
                      secondary
                      disabled={busy}
                      onPress={() => run(() => signInSocial(p))}
                    />
                  ))}
                </>
              ) : (
                <>
                  <Text style={st.text}>{session.user.email}</Text>
                  {recovering && (
                    <>
                      <Field
                        label="Nouveau mot de passe"
                        value={password}
                        onChange={setPassword}
                        secure
                      />
                      <Button
                        title="Enregistrer le mot de passe"
                        disabled={busy}
                        onPress={() =>
                          run(async () => {
                            const { error } = await supabase.auth.updateUser({
                              password,
                            });
                            if (error) throw error;
                            setRecovering(false);
                            setPassword("");
                            setMessage("Mot de passe mis à jour.");
                          })
                        }
                      />
                    </>
                  )}
                  <Field
                    label="Prénom et nom"
                    value={name}
                    onChange={setName}
                  />
                  <Button
                    title="Enregistrer mon profil"
                    disabled={busy}
                    onPress={() => run(saveProfile)}
                  />
                  <Button
                    title="Me déconnecter"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        setName("");
                        setEmail("");
                        setPassword("");
                      })
                    }
                  />
                </>
              )}
              <View style={st.surface}>
                <Text style={st.h2}>Le prototype reste votre référence.</Text>
                <Text style={st.text}>
                  Cette première version React Native valide les branchements.
                  Les écrans premium du prototype seront intégrés
                  progressivement.
                </Text>
                <Button
                  title="Ouvrir le prototype validé"
                  secondary
                  onPress={() =>
                    Linking.openURL(
                      "http://127.0.0.1:8766/partant.html?version=a1-a9",
                    )
                  }
                />
              </View>
            </>
          )}
          {tab === "coach" && (
            <>
              <Text style={st.h1}>À vous de jouer.</Text>
              {!session ? (
                <Button
                  title="Me connecter"
                  onPress={() => setTab("account")}
                />
              ) : !ownCoach ? (
                <>
                  <Text style={st.text}>
                    Créez votre profil coach pour proposer vos premières
                    séances.
                  </Text>
                  <Button
                    title="Activer mon espace coach"
                    disabled={busy}
                    onPress={() => run(createCoach)}
                  />
                </>
              ) : (
                <>
                  <Text style={st.text}>
                    {ownCoach.display_name} ·{" "}
                    {ownCoach.published ? "Profil visible" : "Brouillon"}
                  </Text>
                  <Button
                    title={
                      ownCoach.published
                        ? "Mettre le profil en pause"
                        : "Rendre mon profil visible"
                    }
                    secondary
                    disabled={busy}
                    onPress={() => run(publish)}
                  />
                  <Text style={st.h2}>Votre offre</Text>
                  <Field
                    label="Nom de la séance"
                    value={title}
                    onChange={setTitle}
                  />
                  <Field label="Pratique" value={sport} onChange={setSport} />
                  <View style={st.row}>
                    {(["individual", "duo", "group"] as const).map((f) => (
                      <Button
                        key={f}
                        title={formatName[f]}
                        secondary={f !== format}
                        onPress={() => setFormat(f)}
                      />
                    ))}
                  </View>
                  <Field
                    label={
                      format === "group"
                        ? "Prix par personne (€)"
                        : "Prix de la séance (€)"
                    }
                    value={price}
                    onChange={setPrice}
                    numeric
                  />
                  <Field
                    label="Durée (minutes)"
                    value={duration}
                    onChange={setDuration}
                    numeric
                  />
                  {format === "group" && (
                    <Field
                      label="Maximum de participants (2–20)"
                      value={capacity}
                      onChange={setCapacity}
                      numeric
                    />
                  )}
                  <Button
                    title="Créer cette offre"
                    disabled={busy}
                    onPress={() => run(createOffer)}
                  />
                  <Text style={st.h2}>Ouvrir un créneau</Text>
                  {ownOffers.map((o) => (
                    <Button
                      key={o.id}
                      title={`${o.title} · ${money(o.price_cents)}`}
                      secondary={chosenOffer !== o.id}
                      onPress={() => setChosenOffer(o.id)}
                    />
                  ))}
                  <Field
                    label="Date ISO avec fuseau · ex. 2026-09-25T19:00+02:00"
                    value={starts}
                    onChange={setStarts}
                  />
                  <Text style={st.muted}>
                    Champ technique provisoire. +02:00 en été, +01:00 en hiver à
                    Paris.
                  </Text>
                  <AddressPicker
                    label="Lieu public de la séance (parc ou studio)"
                    onChoose={setVenue}
                  />
                  {venue && (
                    <>
                      <Text style={st.text}>{venue.label}</Text>
                      <PlaceMap place={venue} />
                    </>
                  )}
                  <Button
                    title="Ouvrir ce créneau"
                    disabled={busy || !chosenOffer}
                    onPress={() => run(openSlot)}
                  />
                  <Text style={st.h2}>Vos agendas</Text>
                  {["google", "outlook"].map((provider) => {
                    const c = calendars.find((c) => c.provider === provider);
                    return (
                      <View style={st.surface} key={provider}>
                        <Text style={st.text}>
                          {provider === "google"
                            ? "Google Calendar"
                            : "Outlook"}
                        </Text>
                        <Text style={st.muted}>
                          {c
                            ? `${c.status} · ${c.synced_at ? date(c.synced_at) : "Jamais synchronisé"}`
                            : "Configuration développeur nécessaire"}
                        </Text>
                      </View>
                    );
                  })}
                  <Text style={st.muted}>
                    Aucun agenda externe n’est encore synchronisé. Vos créneaux
                    Partant doivent être tenus à jour manuellement pendant cette
                    étape.
                  </Text>
                </>
              )}
              <Text style={st.h2}>Les dernières nouvelles</Text>
              {!notes.length && (
                <Text style={st.muted}>
                  Vos réservations et leurs modifications apparaîtront ici.
                </Text>
              )}
              {notes.map((n) => (
                <View key={n.id} style={st.item}>
                  <Text style={st.text}>{n.body}</Text>
                  <Text style={st.muted}>
                    {date(n.created_at)}
                    {n.read_at ? " · Lu" : " · Nouveau"}
                  </Text>
                  {!n.read_at && (
                    <Button
                      title="Marquer comme lu"
                      secondary
                      disabled={busy}
                      onPress={() =>
                        run(async () => {
                          const { error } = await supabase
                            .from("notifications")
                            .update({ read_at: new Date().toISOString() })
                            .eq("id", n.id);
                          if (error) throw error;
                          await refresh();
                        })
                      }
                    />
                  )}
                </View>
              ))}
            </>
          )}
          {tab === "bookings" && (
            <>
              <Text style={st.h1}>Vos rendez-vous.</Text>
              <Button
                title="Actualiser"
                secondary
                disabled={busy}
                onPress={() => run(() => refresh())}
              />
              {!session ? (
                <Button
                  title="Me connecter"
                  onPress={() => setTab("account")}
                />
              ) : !bookings.length ? (
                <Text style={st.text}>
                  Votre prochaine séance commence par une rencontre.
                </Text>
              ) : (
                bookings.map((b) => {
                  const s = slots.find((s) => s.id === b.slot_id);
                  const o = offers.find((o) => o.id === s?.offer_id);
                  return (
                    <View style={st.item} key={b.id}>
                      <Text style={st.eyebrow}>
                        {b.coach_id === uid
                          ? "En tant que coach"
                          : "En tant que participant"}{" "}
                        · {b.status === "cancelled" ? "Annulée" : "Confirmée"}
                      </Text>
                      <Text style={st.h2}>{o?.title ?? "Séance"}</Text>
                      <Text style={st.text}>
                        {s ? date(s.starts_at) : "Créneau indisponible"}
                      </Text>
                      <Text style={st.muted}>{s?.location}</Text>
                      <Text style={st.text}>
                        {b.seats} participant(s) · {money(b.total_cents)} · non
                        encaissé
                      </Text>
                      {b.client_id === uid && b.status === "confirmed" && (
                        <>
                          <Button
                            title="Changer de créneau"
                            secondary
                            disabled={busy}
                            onPress={() =>
                              setMoving(moving?.id === b.id ? null : b)
                            }
                          />
                          {moving?.id === b.id && (
                            <View style={st.surface}>
                              <Text style={st.muted}>
                                Créneaux de la même offre, au même tarif. La
                                place est revérifiée à la confirmation.
                              </Text>
                              {slots
                                .filter(
                                  (x) =>
                                    x.offer_id === s?.offer_id &&
                                    x.id !== s.id &&
                                    x.open &&
                                    Date.parse(x.starts_at) >
                                      Date.now() + 3600000 &&
                                    x.price_cents === s.price_cents,
                                )
                                .map((x) => (
                                  <Button
                                    key={x.id}
                                    title={date(x.starts_at)}
                                    disabled={busy}
                                    onPress={() =>
                                      run(async () => {
                                        const { error } = await supabase.rpc(
                                          "change_booking",
                                          { p_booking: b.id, p_target: x.id },
                                        );
                                        if (error) throw error;
                                        setMoving(null);
                                        await refresh();
                                        setMessage(
                                          "Séance modifiée. Le coach a reçu une notification.",
                                        );
                                      })
                                    }
                                  />
                                ))}
                            </View>
                          )}
                          <Button
                            title="Annuler ma séance de test"
                            secondary
                            disabled={busy}
                            onPress={() =>
                              run(async () => {
                                const { error } = await supabase.rpc(
                                  "change_booking",
                                  { p_booking: b.id },
                                );
                                if (error) throw error;
                                await refresh();
                                setMessage(
                                  "Réservation annulée, places libérées.",
                                );
                              })
                            }
                          />
                        </>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
          <Text style={st.footer}>
            Partant · version de développement React Native{"\n"}Aucun paiement
            ni SMS. Google, Apple et agendas en configuration.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f1f0ec" },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 24 : 58,
    paddingBottom: 18,
    gap: 4,
  },
  brand: {
    fontFamily: "HankenBold",
    fontSize: 36,
    letterSpacing: -2,
    color: "#141414",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: "center" },
  activeTab: { backgroundColor: "#141414" },
  content: { padding: 24, gap: 18, paddingBottom: 56 },
  h1: {
    fontFamily: "HankenBold",
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.6,
    color: "#141414",
  },
  h2: {
    fontFamily: "HankenBold",
    fontSize: 22,
    letterSpacing: -0.5,
    color: "#141414",
  },
  text: {
    fontFamily: "Hanken",
    fontSize: 16,
    lineHeight: 23,
    color: "#141414",
  },
  small: { fontFamily: "Hanken", fontSize: 14, color: "#141414" },
  muted: {
    fontFamily: "Hanken",
    fontSize: 14,
    lineHeight: 21,
    color: "#626262",
  },
  eyebrow: {
    fontFamily: "HankenBold",
    fontSize: 11,
    letterSpacing: 1.3,
    color: "#626262",
  },
  button: {
    backgroundColor: "#141414",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    minHeight: 48,
  },
  secondary: { backgroundColor: "#f0f0ee" },
  buttonText: { fontFamily: "HankenBold", fontSize: 14, color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 18,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Hanken",
    fontSize: 16,
    color: "#141414",
  },
  surface: {
    backgroundColor: "#f5f5f2",
    padding: 20,
    borderRadius: 24,
    gap: 14,
  },
  item: {
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderColor: "#e8e8e8",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  address: { padding: 14, backgroundColor: "#f5f5f2", borderRadius: 16 },
  notice: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#eee",
    fontFamily: "Hanken",
    fontSize: 15,
    color: "#141414",
  },
  footer: {
    fontFamily: "Hanken",
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
    marginTop: 20,
  },
});
