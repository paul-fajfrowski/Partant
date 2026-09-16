import Slider from "@react-native-community/slider";
import * as W from "./workflows";
import { CompleteFlows, BookingExtras } from "./CompleteFlows";
import { CoachConfiguration } from "./CoachConfiguration";
import { exportFile } from "./deviceFiles";
import { SvgXml } from "react-native-svg";
import { referenceMap } from "./referenceMap";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import reference from "../reference/prototype.json";
import communes from "../reference/communes-idf.json";
import { supabase } from "../lib/supabase";
import { errorMessage } from "../lib/errors";
import { tokens as t } from "./tokens";
import {
  Account,
  addDays,
  Booking,
  cancel,
  changeSport,
  Coach,
  dayLabel,
  endTime,
  fold,
  goalsFor,
  initialPreferences,
  initialStore,
  configFor,
  coachAccountId,
  allCoaches,
  now,
  setDemoClock,
  quotePrice,
  openGroup,
  switchAccount,
  instant,
  Offer,
  remaining,
  reserve,
  today,
} from "./model";
import { useMarketplace } from "./useMarketplace";
import {
  Button,
  Chip,
  Choice,
  Dialog,
  Eyebrow,
  Field,
  H1,
  H2,
  Icon,
  IconButton,
  Note,
  P,
  Pagebar,
  Photo,
  Row,
  Rule,
  Section,
  Select,
  Setting,
  TextButton,
  Wordmark,
} from "./ui";
const departments: Record<string, string> = {
  "75": "Paris",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d’Oise",
};
const sectors = [
  ...Array.from({ length: 20 }, (_, i) => ({
    nom: `Paris ${i + 1}${i ? "e" : "er"}`,
    code: String(75101 + i),
    codeDepartement: "75",
    codesPostaux: [String(75001 + i)],
  })),
  ...communes,
];
const navItems = [
  ["explore", "search", "Explorer"],
  ["favorites", "heart", "Favoris"],
  ["bookings", "calendar", "Séances"],
  ["account", "user", "Mon espace"],
];
const coachTabs = [
  ["agenda", "calendar", "Agenda"],
  ["clients", "user", "Clients"],
  ["activity", "wallet", "Activité"],
  ["settings", "filter", "Réglages"],
];
const sportItems = [
  ["Tout", "all"],
  ["Running", "run"],
  ["Pilates", "pilates"],
  ["Musculation", "strength"],
  ["Boxe", "boxing"],
  ["Yoga", "yoga"],
  ["Autres", "plus"],
];
const euro = (n: number) =>
  `${Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")} €`;
export default function ProductApp({ live = false }: { live?: boolean }) {
  const market = useMarketplace(live);
  const { store, setStore, coaches } = market;
  const { width, height } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width > 740;
  const pageWidth = desktop ? (width > 900 ? 430 : 410) : Math.min(width, 740);
  const [screen, setScreen] = useState("welcome");
  const history = useRef<{ screen: string; focus: string }[]>([]);
  const [focus, setFocus] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [sessionKind, setSessionKind] = useState("Tous");
  const [mapCoach, setMapCoach] = useState("0");
  const scroll = useRef<ScrollView>(null);
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const initial = useRef(false);
  const [role, setRole] = useState<"client" | "coach">("client");
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState(live ? "" : "alex@example.test");
  const [name, setName] = useState(live ? "" : "Alex");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(today());
  const [week, setWeek] = useState(0);
  const [period, setPeriod] = useState("all");
  const [hour, setHour] = useState("");
  const [sport, setSport] = useState("Tout");
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(300);
  const [distance, setDistance] = useState(10);
  const [format, setFormat] = useState("Tous");
  const [sort, setSort] = useState("recommended");
  const [map, setMap] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [coachId, setCoachId] = useState("0");
  const [offerId, setOfferId] = useState("");
  const [draft, setDraft] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [sectorQuery, setSectorQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [sectorLimit, setSectorLimit] = useState(15);
  const [coachTab, setCoachTab] = useState("agenda");
  const [agendaOfferId, setAgendaOfferId] = useState("");
  const [config, setConfig] = useState("profile");
  const [message, setMessage] = useState("");
  const [configName, setConfigName] = useState("Thomas Martin");
  const [configBio, setConfigBio] = useState(reference.coaches[0].bio);
  const [offerName, setOfferName] = useState("");
  const [offerPrice, setOfferPrice] = useState("50");
  const [offerDuration, setOfferDuration] = useState("60");
  const [offerKind, setOfferKind] = useState("Individuel");
  const [offerCapacity, setOfferCapacity] = useState("6");
  const [paymentMethod, setPaymentMethod] = useState("Apple Pay");
  const [paymentResult, setPaymentResult] = useState("");
  const [groupOffer, setGroupOffer] = useState("");
  const [groupDay, setGroupDay] = useState(addDays(today(), 1));
  const [groupTime, setGroupTime] = useState("18:00");
  const [groupAddress, setGroupAddress] = useState(
    reference.coaches[0].address,
  );
  const pref = store.preferences;
  const coach = coaches.find((c) => c.id === coachId) ?? coaches[0];
  const offers = store.offers.filter((o) => o.coach === coach?.id && o.active);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const booked = store.bookings.find(
    (b) => b.id === selectedBooking && (live || W.canRead(store, b)),
  );
  const activeCoach = live ? store.account?.id : coachAccountId(store);
  const notifications = store.notices.filter(
    (n) => n.recipient === store.account?.id,
  );
  const unread = notifications.filter(
    (n) =>
      !n.read &&
      (live ||
        store.account?.role !== "coach" ||
        configFor(store, activeCoach ?? "0").notifications[
          n.category === "booking"
            ? "booking"
            : n.category === "reminder"
              ? "reminder"
              : "changes"
        ]),
  ).length;
  const conversations = store.bookings.filter(
    (b) =>
      b.clientId === store.account?.id ||
      (store.account?.role === "coach" && b.coach === activeCoach),
  );
  const unreadMessages = live
    ? 0
    : conversations.reduce(
        (total, b) =>
          total +
          (store.messages[b.id] ?? []).filter(
            (m) =>
              m.who !== store.account?.id &&
              !m.readBy?.includes(store.account?.id ?? ""),
          ).length,
        0,
      );
  const lastIdentity = useRef(store.account?.id);
  useEffect(() => {
    if (lastIdentity.current !== store.account?.id) {
      history.current = [];
      resetFilters();
      lastIdentity.current = store.account?.id;
    }
  }, [store.account?.id]);
  useEffect(() => {
    if (market.ready && !initial.current) {
      initial.current = true;
      if (store.account)
        setScreen(store.account.role === "coach" ? "coach" : "explore");
    }
  }, [market.ready]);
  useEffect(() => {
    if (market.error) {
      setNotice(market.error);
      market.setError("");
    }
  }, [market.error]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 5500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [screen, step]);
  useEffect(() => {
    setDemoClock(live ? 0 : (store.clockHours ?? 0));
    if (!live && market.ready) setStore((s) => W.maintain(s));
  }, [screen, store.clockHours, market.ready]);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (modal) {
        setModal("");
        return true;
      }
      if (history.current.length) {
        back();
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [screen, modal, step]);
  useEffect(() => {
    if (screen === "chat" && booked && !live && W.canRead(store, booked)) {
      setStore((s) => ({
        ...s,
        messages: {
          ...s.messages,
          [booked.id]: (s.messages[booked.id] ?? []).map((m) => ({
            ...m,
            readBy: [...new Set([...(m.readBy ?? []), s.account!.id])],
          })),
        },
      }));
    }
  }, [screen, selectedBooking]);
  function go(next: string, target = "") {
    if (next === "config-native") {
      setConfig(target);
      next = "config";
    }
    history.current.push({ screen, focus });
    setFocus(target);
    setScreen(next);
    setModal("");
  }
  function back() {
    if (screen === "onboarding" && step > 0) {
      setStep(step - 1);
      return;
    }
    const previous = history.current.pop();
    setScreen(previous?.screen ?? "explore");
    setFocus(previous?.focus ?? "");
    setModal("");
  }
  async function run(fn: () => Promise<void> | void) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function preference(p: Partial<typeof pref>) {
    setStore((s) => ({ ...s, preferences: { ...s.preferences, ...p } }));
  }
  function favorite(id: string) {
    setStore((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  }
  function openProfile(c: Coach) {
    setCoachId(c.id);
    setOfferId("");
    go("profile");
  }
  function primary(c: Coach) {
    const candidates = store.offers.filter(
      (o) =>
        o.coach === c.id &&
        o.active &&
        (sessionKind === "Tous" || o.kind === sessionKind),
    );
    return (
      candidates.find(
        (o) =>
          o.price <= budget &&
          market
            .times(c, day, o)
            .some(
              (time) =>
                (period !== "evening" || time >= "18:00") &&
                (!hour || time === hour),
            ),
      ) ?? candidates[0]
    );
  }
  function available(c: Coach, o?: Offer) {
    const selected = o ?? primary(c);
    if (!selected) return [];
    return market
      .times(c, day, selected)
      .filter(
        (time) =>
          (period !== "evening" || time >= "18:00") && (!hour || time === hour),
      );
  }
  // Preferences rank suggestions; only explicit Explorer controls filter them.
  function preferenceScore(c: Coach) {
    return (
      (pref.sport !== "Tout" && [c.sport, ...c.tags].includes(pref.sport)
        ? 4
        : 0) +
      ((primary(c)?.price ?? c.price) <= pref.budget ? 2 : 0) +
      (pref.format !== "Tous" && c.formats.includes(pref.format) ? 1 : 0) +
      (c.dist !== null && c.dist <= pref.distance ? 1 : 0)
    );
  }
  const results = coaches
    .filter(
      (c) =>
        (live || pref.city.startsWith("Paris") || format === "Visio") &&
        (sport === "Tout" || [c.sport, ...c.tags].includes(sport)) &&
        fold([c.name, c.sport, c.area, ...c.tags].join(" ")).includes(
          fold(query),
        ) &&
        (primary(c)?.price ?? c.price) <= budget &&
        (format === "Visio" || c.dist === null || c.dist <= distance) &&
        (format === "Tous" || c.formats.includes(format)) &&
        available(c).length,
    )
    .sort((a, b) =>
      sort === "recommended"
        ? preferenceScore(b) - preferenceScore(a) ||
          (a.dist ?? 999) - (b.dist ?? 999)
        : sort === "price"
          ? (primary(a)?.price ?? a.price) - (primary(b)?.price ?? b.price)
          : sort === "rating"
            ? parseFloat((b.rating ?? "0").replace(",", ".")) -
              parseFloat((a.rating ?? "0").replace(",", "."))
            : (a.dist ?? 999) - (b.dist ?? 999),
    );
  function chooseTime(c: Coach, time: string, o?: Offer, selectedDay = day) {
    const selected =
      o ??
      store.offers.find(
        (o) =>
          o.coach === c.id &&
          o.active &&
          market.times(c, selectedDay, o).includes(time),
      );
    if (!selected) return;
    const real = market.remoteSlots.find(
      (s) =>
        s.coach_id === c.id &&
        s.offer_id === selected.id &&
        s.day === selectedDay &&
        s.time === time,
    );
    const group = (store.groups ?? []).find(
      (g) =>
        g.offer.id === selected.id && g.day === selectedDay && g.time === time,
    );
    setCoachId(c.id);
    setOfferId(selected.id);
    setDraft({
      id: Crypto.randomUUID(),
      coach: c.id,
      clientId: store.account?.id ?? "",
      clientName: store.account?.name ?? "",
      day: selectedDay,
      time,
      duration: group?.offer.duration ?? selected.duration,
      offerId: selected.id,
      serviceName: selected.name,
      kind: selected.kind,
      format: c.formats[0] ?? "Parc",
      seats: selected.kind === "Duo" ? 2 : 1,
      price: group?.offer.price ?? selected.price,
      goal: pref.goal,
      address: real?.location ?? group?.address ?? c.address,
      status: "confirmed",
      slotId: real?.id,
    });
    go("setup");
  }
  function chooseOffer(o: Offer) {
    setOfferId(o.id);
    if (draft)
      setDraft({
        ...draft,
        offerId: o.id,
        serviceName: o.name,
        kind: o.kind,
        duration: o.duration,
        price: o.price,
        seats: o.kind === "Duo" ? 2 : 1,
        time: market.times(coach, draft.day, o).includes(draft.time)
          ? draft.time
          : "",
      });
  }
  async function toCheckout() {
    if (!draft?.time) {
      setModal("date");
      return;
    }
    if (!store.account || store.account.role !== "client") {
      setPendingCheckout(true);
      setRole("client");
      if (!live) setEmail("alex@example.test");
      setSignup(false);
      go("login");
      return;
    }
    if (!live && draft) {
      const o = store.offers.find((o) => o.id === draft.offerId);
      if (o) {
        const g = store.groups?.find(
          (g) =>
            g.offer.id === o.id && g.day === draft.day && g.time === draft.time,
        );
        const cfg = configFor(store, draft.coach);
        if (draft.format === "Domicile" && !draft.address.trim())
          throw Error("Indiquez votre adresse de rendez-vous.");
        setDraft({
          ...draft,
          price: quotePrice(store, draft, g?.offer ?? o),
          cancelHours: cfg.cancelHours,
          preparation: { ...cfg.preparation },
        });
      }
    }
    go("checkout");
  }
  function startAttempt() {
    if (!draft) return;
    const next = W.beginPayment(store, draft, paymentMethod);
    setAttemptId(next.attempts!.at(-1)!.id);
    setStore(next);
    go("payment");
  }
  async function finish() {
    if (!draft) return;
    let id = draft.id;
    if (live) id = await market.book(draft);
    else setStore(W.paymentResult(store, attemptId, "success"));
    setSelectedBooking(id);
    go("confirmation");
  }
  async function verify() {
    if (live)
      await market.verifyCode(email.trim(), code.trim(), name.trim(), role);
    else {
      if (code !== "123456")
        throw Error("Utilisez le code de démonstration 123456.");
      setStore(W.loginDemo(store, email, name, role, signup));
    }
    setCode("");
    if (pendingCheckout) {
      setPendingCheckout(false);
      go("checkout");
    } else if (role === "coach") go("coach");
    else if (signup) {
      setStep(0);
      go("onboarding");
    } else go("explore");
  }
  function resetFilters() {
    setSessionKind("Tous");
    setSort("recommended");
    setWeek(0);
    setSport("Tout");
    setQuery("");
    setBudget(300);
    setDistance(10);
    setFormat("Tous");
    setPeriod("all");
    setHour("");
    setDay(today());
  }
  function dateStrip(onSelect: (d: string) => void = (next) => setDay(next)) {
    const start = addDays(today(), week * 7);
    return (
      <View style={{ gap: 12 }}>
        <Row between>
          <IconButton
            name="back"
            light
            label="Semaine précédente"
            onPress={() => setWeek(Math.max(0, week - 1))}
          />
          <P small bold>
            {new Intl.DateTimeFormat("fr-FR", {
              month: "long",
              year: "numeric",
            }).format(new Date(start + "T12:00:00"))}
          </P>
          <IconButton
            name="arrow"
            light
            label="Semaine suivante"
            onPress={() => setWeek(Math.min(12, week + 1))}
          />
        </Row>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(start, i),
              selected = d === day;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={dayLabel(d)}
                accessibilityState={{ selected }}
                key={d}
                onPress={() => onSelect(d)}
                style={[
                  styles.dateButton,
                  selected && { backgroundColor: t.ink },
                ]}
              >
                <P small style={{ color: selected ? "#fff" : t.ink }}>
                  {new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
                    .format(new Date(d + "T12:00:00"))
                    .replace(".", "")}
                </P>
                <P
                  bold
                  style={{ fontSize: 18, color: selected ? "#fff" : t.ink }}
                >
                  {d.slice(-2)}
                </P>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  function slots(c: Coach, o?: Offer) {
    return (
      <Row wrap style={{ gap: 7 }}>
        {market.times(c, day, o).map((time) => (
          <Pressable
            accessibilityRole="button"
            key={time}
            onPress={() => chooseTime(c, time, o)}
            style={styles.slot}
          >
            <P style={{ fontFamily: t.medium, fontSize: 15 }}>{time}</P>
          </Pressable>
        ))}
        {!market.times(c, day, o).length && (
          <P muted>Pas de créneau ce jour. Choisissez une autre date.</P>
        )}
      </Row>
    );
  }
  function summary(b: Booking) {
    const c = coaches.find((c) => c.id === b.coach);
    return (
      <Row style={{ gap: 14 }}>
        <Photo
          uri={c?.photoUri}
          index={c?.photo ?? null}
          height={54}
          style={{ width: 70, borderRadius: 8 }}
        />
        <View style={{ flex: 1 }}>
          <P bold>{c?.name ?? "Votre coach"}</P>
          <P muted style={{ fontSize: 14 }}>
            {b.serviceName} · {b.duration} min
          </P>
        </View>
      </Row>
    );
  }
  function card(c: Coach) {
    const times = available(c);
    const shown = primary(c);
    return (
      <View key={c.id} style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${c.name}`}
          onPress={() => openProfile(c)}
        >
          <Photo
            uri={c.photoUri}
            index={c.photo}
            height={desktop ? 164 : (pageWidth - 48) / 2.6}
            style={{ borderRadius: 12 }}
            label={`Portrait de ${c.name}`}
          >
            <View style={{ position: "absolute", top: 10, right: 10 }}>
              <IconButton
                name="heart"
                white
                filled={store.favorites.includes(c.id)}
                label={
                  store.favorites.includes(c.id)
                    ? `Retirer ${c.name} des favoris`
                    : `Ajouter ${c.name} aux favoris`
                }
                onPress={() => favorite(c.id)}
              />
            </View>
            {c.verified && (
              <View style={styles.photoBadge}>
                <Icon name="shield" size={17} />
                <P small style={{ fontFamily: t.medium }}>
                  Profil vérifié
                </P>
              </View>
            )}
          </Photo>
        </Pressable>
        <Row between style={{ marginTop: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openProfile(c)}
            style={{ minHeight: 44, justifyContent: "center", flex: 1 }}
          >
            <H2 style={{ fontSize: 18 }}>{c.name}</H2>
          </Pressable>
          {c.rating && (
            <P small>
              ★ {c.rating}{" "}
              <P small muted>
                ({c.reviews})
              </P>
            </P>
          )}
        </Row>
        <Row between>
          <P muted style={{ fontSize: 14, flex: 1 }}>
            {c.sport}
          </P>
          <P bold style={{ fontSize: 20 }}>
            {euro(shown?.price ?? c.price)}{" "}
            <P small muted>
              /{" "}
              {shown?.kind === "Groupe"
                ? "pers."
                : `${shown?.duration ?? 60} min`}
            </P>
          </P>
        </Row>
        <P muted style={{ fontSize: 14, marginTop: 4 }}>
          {shown ? `${shown.name} · ` : ""}
          {c.area}
          {c.dist !== null ? ` · ${String(c.dist).replace(".", ",")} km` : ""}
        </P>
        <Row style={{ marginTop: 12, marginBottom: 8, gap: 6 }}>
          <Icon name="clock" size={17} />
          <P small style={{ fontSize: 12, fontFamily: t.medium }}>
            {day === today()
              ? "Aujourd’hui"
              : day === addDays(today(), 1)
                ? "Demain"
                : dayLabel(day, true)}{" "}
            <P small muted style={{ fontSize: 12 }}>
              · Réservation immédiate
            </P>
          </P>
        </Row>
        <Row style={{ gap: 7 }}>
          {times.slice(0, 3).map((time) => (
            <Pressable
              accessibilityRole="button"
              key={time}
              onPress={() => chooseTime(c, time, shown)}
              style={styles.slot}
            >
              <P style={{ fontFamily: t.medium, fontSize: 15 }}>{time}</P>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Toutes les disponibilités de ${c.name}`}
            onPress={() => openProfile(c)}
            style={[styles.slot, { paddingHorizontal: 11 }]}
          >
            <Icon name="arrow" size={17} />
          </Pressable>
        </Row>
        <Row between style={{ marginTop: 10 }}>
          <P small muted>
            {c.formats.slice(0, 2).join(" · ")} · Tout compris
          </P>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (comparison.includes(c.id))
                setComparison(comparison.filter((x) => x !== c.id));
              else if (comparison.length < 2)
                setComparison([...comparison, c.id]);
              else setNotice("Deux coachs maximum pour comparer.");
            }}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <P small muted style={{ fontSize: 12 }}>
              {comparison.includes(c.id) ? "✓ Sélectionné" : "+ Comparer"}
            </P>
          </Pressable>
        </Row>
      </View>
    );
  }
  function empty(
    title: string,
    copy: string,
    label = "Explorer les coachs",
    action = () => go("explore"),
  ) {
    return (
      <View style={styles.empty}>
        <Icon name="search" />
        <H2 style={{ textAlign: "center" }}>{title}</H2>
        <P muted style={{ fontSize: 14, textAlign: "center", maxWidth: 310 }}>
          {copy}
        </P>
        <Button onPress={action}>{label}</Button>
      </View>
    );
  }
  const bottom = ["explore", "favorites", "bookings", "account"].includes(
    screen,
  );
  const coachBottom =
    screen === "coach" ||
    (store.account?.role === "coach" &&
      ["messages", "notifications", "chat"].includes(screen));
  const barTitle: Record<string, string> = {
    login: role === "coach" ? "Espace coach" : "Espace particulier",
    code: "Connexion",
    onboarding: "Votre rythme",
    profile: "Votre coach",
    setup: "Votre séance",
    checkout: "Récapitulatif",
    payment: "Votre paiement",
    bookingDetail: "Votre séance",
    config:
      config === "groups"
        ? "Mes cours en groupe"
        : (reference.coachSections.find((x) => x[0] === config)?.[2] ??
          "Réglages"),
    notifications: "Vos notifications",
    messages: "Mes messages",
    chat: "Votre conversation",
  };
  let content: React.ReactNode = null;
  let sticky: React.ReactNode = null;
  if (screen === "welcome")
    content = (
      <>
        <View style={styles.entryHero}>
          <View style={{ marginBottom: 36 }}>
            <Wordmark light />
          </View>
          <Eyebrow light style={{ fontSize: 11 }}>
            LE SPORT COMMENCE PAR UNE RENCONTRE.
          </Eyebrow>
          <H1
            style={{
              color: "#fff",
              fontSize: 34,
              lineHeight: 35.7,
              marginTop: 18,
              marginBottom: 14,
            }}
          >
            Un coach.{"\n"}Votre rythme.
          </H1>
          <Row style={{ gap: 9, marginTop: 20 }}>
            {[0, 1, 2].map((i) => (
              <Photo
                key={i}
                index={i}
                height={80}
                style={{
                  flex: 1,
                  borderTopLeftRadius: 60,
                  borderTopRightRadius: 60,
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  transform: [{ translateY: i === 1 ? -12 : 0 }],
                }}
              />
            ))}
          </Row>
        </View>
        <Section style={styles.sheet}>
          <H2 style={{ marginBottom: 16 }}>Bienvenue chez Partant.</H2>
          <P muted style={{ marginBottom: 14 }}>
            Comment voulez-vous nous rejoindre ?
          </P>
          <Choice
            title="Je veux bouger"
            description="Trouver un coach et réserver mes séances"
            active={role === "client"}
            onPress={() => {
              setRole("client");
              if (!live) setEmail("alex@example.test");
            }}
          />
          <Choice
            title="Je suis coach"
            description="Développer mon activité, simplement"
            active={role === "coach"}
            onPress={() => {
              setRole("coach");
              if (!live) setEmail("thomas@example.test");
            }}
          />
          <Button
            icon="arrow"
            style={{ marginTop: 24 }}
            onPress={() => {
              setSignup(false);
              go("login");
            }}
          >
            Me connecter
          </Button>
          <TextButton
            onPress={() => {
              setSignup(true);
              go("login");
            }}
          >
            Créer mon compte
          </TextButton>
          <TextButton muted onPress={() => go("explore")}>
            Explorer d’abord
          </TextButton>
          <P small muted style={{ textAlign: "center", marginTop: 12 }}>
            {live
              ? "Environnement de développement · Supabase"
              : "Prototype · aucune authentification réelle"}
          </P>
        </Section>
      </>
    );
  if (screen === "login")
    content = (
      <Section>
        <Wordmark />
        <H1 style={{ marginTop: 40, marginBottom: 12 }}>
          {signup ? "Votre prochaine étape." : "Heureux de vous revoir."}
        </H1>
        <P muted>
          Un code pour vous connecter.{"\n"}Un compte pour retrouver vos
          séances.
        </P>
        <View style={{ marginTop: 24 }}>
          {signup && (
            <Field
              label="Votre prénom et nom"
              value={name}
              onChange={setName}
            />
          )}
          <Field
            label={live ? "Adresse e-mail" : "Adresse e-mail de démonstration"}
            value={email}
            onChange={setEmail}
          />
          <Button
            disabled={busy}
            onPress={() =>
              run(async () => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                  throw Error("Indiquez une adresse e-mail valide.");
                if (live) await market.sendCode(email.trim(), signup);
                go("code");
              })
            }
          >
            Continuer avec mon e-mail
          </Button>
        </View>
        <Note style={{ marginTop: 24 }}>
          {live ? (
            "Vous recevrez un lien ou un code selon le modèle d’e-mail configuré dans Supabase. En développement, l’envoi est limité aux adresses autorisées."
          ) : (
            <P style={{ fontSize: 14 }}>
              Démo : aucun e-mail ne sera envoyé. Le code à saisir à l’étape
              suivante est{" "}
              <P bold style={{ fontSize: 14 }}>
                123456
              </P>
              . N’utilisez pas de mot de passe réel.
            </P>
          )}
        </Note>
        <TextButton style={{ marginTop: 24 }} onPress={() => go("explore")}>
          Continuer sans compte
        </TextButton>
        <P small muted style={{ marginTop: 24 }}>
          {live
            ? "Connexion sécurisée par Supabase. Aucun paiement ne sera effectué."
            : "Vos essais restent sur cet appareil. Aucun compte n’est créé auprès d’un service externe."}
        </P>
      </Section>
    );
  if (screen === "code")
    content = (
      <Section>
        <Eyebrow>UNE DERNIÈRE ÉTAPE</Eyebrow>
        <H1 style={{ marginTop: 20, marginBottom: 12 }}>C’est bien vous.</H1>
        <P muted>
          {live
            ? `Consultez votre boîte e-mail : ${email}.`
            : "Dans la version réelle, un code serait envoyé à votre adresse e-mail."}
        </P>
        <View style={{ marginTop: 24 }}>
          <Field
            label={live ? "Code reçu par e-mail" : "Code de démonstration"}
            value={code}
            onChange={setCode}
            numeric
          />
          <Button disabled={busy} onPress={() => run(verify)}>
            Me connecter
          </Button>
        </View>
        {!live && (
          <Note style={{ marginTop: 24 }}>Code de démonstration : 123456</Note>
        )}
      </Section>
    );
  if (screen === "onboarding")
    content = (
      <Section>
        <Row style={{ gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 4,
                borderRadius: 99,
                flex: 1,
                backgroundColor: i <= step ? t.ink : "#e9e9e9",
              }}
            />
          ))}
        </Row>
        <Eyebrow style={{ marginVertical: 20 }}>
          {step + 1} / 3 · {["VOS ENVIES", "VOS REPÈRES", "VOTRE MOMENT"][step]}
        </Eyebrow>
        {step === 0 ? (
          <>
            <H1>Qu’est-ce qui{"\n"}vous met en mouvement ?</H1>
            <P muted style={{ marginTop: 24, marginBottom: 14 }}>
              Un point de départ, pas une case.
            </P>
            <Select
              label="Votre pratique"
              value={pref.sport}
              items={Object.keys(reference.sportGoals)}
              onChange={(s) =>
                setStore((x) => ({
                  ...x,
                  preferences: changeSport(x.preferences, s),
                }))
              }
            />
            <Select
              label="Votre objectif"
              value={pref.goal}
              items={goalsFor(pref.sport)}
              onChange={(goal) => preference({ goal })}
            />
            <P small muted style={{ marginBottom: 14 }}>
              Des objectifs adaptés à votre pratique.
            </P>
            <Select
              label="Vous en êtes où ?"
              value={pref.level}
              items={["Je débute", "Je reprends", "Je pratique régulièrement"]}
              onChange={(level) => preference({ level })}
            />
          </>
        ) : step === 1 ? (
          <>
            <H1>Près de vous.{"\n"}Dans votre budget.</H1>
            <P muted style={{ marginTop: 24, marginBottom: 14 }}>
              Vous pourrez tout ajuster ensuite.
            </P>
            <P small bold style={{ marginBottom: 8 }}>
              Votre secteur
            </P>
            <Button light icon="pin" onPress={() => setModal("location")}>
              {pref.city}
            </Button>
            <P small muted style={{ marginTop: 8, marginBottom: 18 }}>
              Commune, arrondissement ou code postal · Île-de-France
            </P>
            <Select
              label="Votre budget maximum par séance"
              value={String(pref.budget)}
              items={[40, 50, 60, 80, 150, 300].map((v) => [
                String(v),
                `Jusqu’à ${v} €`,
              ])}
              onChange={(budget) => preference({ budget: Number(budget) })}
            />
            <Select
              label="Distance maximale"
              value={String(pref.distance)}
              items={[1, 2, 5, 10].map((v) => [String(v), `${v} km`])}
              onChange={(distance) =>
                preference({ distance: Number(distance) })
              }
            />
            <P small muted>
              Tous les secteurs franciliens sont sélectionnables. Les coachs
              fictifs sont à Paris ; ailleurs, essayez la visio.
            </P>
          </>
        ) : (
          <>
            <H1>Et dans votre{"\n"}quotidien ?</H1>
            <P muted style={{ marginTop: 24, marginBottom: 14 }}>
              On s’adapte à vous, pas l’inverse.
            </P>
            <Select
              label="Le lieu qui vous convient"
              value={pref.format}
              items={[
                ["Tous", "Je suis flexible"],
                ["Parc", "En extérieur"],
                ["Studio", "Au studio"],
                ["Domicile", "Chez moi"],
                ["Visio", "En visio"],
              ]}
              onChange={(format) => preference({ format })}
            />
            <Select
              label="Votre prochain moment"
              value={pref.moment}
              items={["Libre", "Le soir", "Demain"]}
              onChange={(moment) => preference({ moment })}
            />
            <Note>
              <P bold>Votre point de départ</P>
              <P>
                {pref.sport === "Tout" ? "Toutes les pratiques" : pref.sport} ·{" "}
                {pref.goal}
                {"\n"}
                {pref.city} · jusqu’à {pref.budget} €
              </P>
            </Note>
          </>
        )}
        <Button
          icon="arrow"
          style={{ marginTop: 24 }}
          onPress={() =>
            run(async () => {
              if (step < 2) {
                setStep(step + 1);
                return;
              }
              if (live && store.account) {
                const { error } = await supabase
                  .from("profiles")
                  .update({ preferences: { ...pref } })
                  .eq("id", store.account.id);
                if (error) throw error;
              }
              resetFilters();
              go("explore");
            })
          }
        >
          {step === 2 ? "Découvrir mes coachs" : "Continuer"}
        </Button>
        <TextButton
          onPress={() => {
            resetFilters();
            go("explore");
          }}
        >
          Passer pour le moment
        </TextButton>
      </Section>
    );
  if (screen === "explore")
    content = (
      <>
        <View style={[styles.top, { paddingTop: desktop ? 16 : 20 }]}>
          <Row between>
            <Wordmark light />
            <Pressable
              accessibilityRole="button"
              onPress={() => setModal("location")}
              style={{
                maxWidth: "65%",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Row style={{ gap: 5 }}>
                <Icon name="pin" size={17} color="#fff" />
                <P style={{ color: "#fff", fontSize: 14, flexShrink: 1 }}>
                  {pref.city}
                </P>
                <Icon name="down" size={17} color="#fff" />
              </Row>
            </Pressable>
          </Row>
          <H1
            style={{
              color: "#fff",
              marginTop: desktop ? 14 : 8,
              marginBottom: 8,
            }}
          >
            On bouge quand ?
          </H1>
          <P style={{ color: "#c6c6c6", fontSize: 14 }}>
            Trouvez votre coach. Réservez votre moment.
          </P>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: desktop ? 16 : 12, marginRight: -24 }}
            contentContainerStyle={{ gap: 8, paddingRight: 24 }}
          >
            <Chip
              dark
              active={day === today() && period === "all" && !hour}
              onPress={() => {
                setDay(today());
                setPeriod("all");
                setHour("");
              }}
            >
              Aujourd’hui
            </Chip>
            <Chip
              dark
              active={day === today() && period === "evening"}
              onPress={() => {
                setDay(today());
                setPeriod("evening");
                setHour("");
              }}
            >
              Ce soir
            </Chip>
            <Chip
              dark
              active={day === addDays(today(), 1) && !hour}
              onPress={() => {
                setDay(addDays(today(), 1));
                setPeriod("all");
                setHour("");
              }}
            >
              Demain
            </Chip>
            <Chip
              dark
              icon="calendar"
              active={!!hour || day > addDays(today(), 1)}
              onPress={() => setModal("date")}
            >
              {hour || day > addDays(today(), 1)
                ? dayLabel(day, true) + (hour ? " · " + hour : "")
                : "Date & heure"}
            </Chip>
          </ScrollView>
        </View>
        <View style={styles.sheet}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: desktop ? 12 : 8,
              gap: 22,
            }}
          >
            {sportItems.map(([label, icon]) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: sport === label }}
                aria-pressed={sport === label}
                key={label}
                onPress={() =>
                  label === "Autres" ? setModal("sports") : setSport(label)
                }
                style={{
                  minWidth: 50,
                  alignItems: "center",
                  gap: 4,
                  paddingTop: 6,
                  paddingBottom: desktop ? 12 : 8,
                  borderBottomWidth: sport === label ? 3 : 0,
                  borderColor: t.ink,
                }}
              >
                <Icon
                  name={icon}
                  size={28}
                  color={sport === label ? t.ink : t.muted}
                />
                <P
                  style={{
                    fontSize: 13,
                    color: sport === label ? t.ink : t.muted,
                    fontFamily: sport === label ? t.bold : t.font,
                  }}
                >
                  {label}
                </P>
              </Pressable>
            ))}
          </ScrollView>
          <Row
            style={{
              marginHorizontal: 24,
              marginTop: desktop ? 14 : 10,
              paddingLeft: 16,
              paddingRight: 6,
              paddingVertical: 2,
              borderRadius: 99,
              backgroundColor: t.fog,
              gap: 10,
            }}
          >
            <Icon name="search" size={17} />
            <TextInput
              accessibilityLabel="Rechercher un sport, un coach ou un quartier"
              value={query}
              onChangeText={setQuery}
              placeholder="Un sport, un coach, un quartier"
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                fontFamily: t.font,
                fontSize: 14,
                color: t.ink,
              }}
            />
            <IconButton
              name="filter"
              label="Filtres"
              onPress={() => setModal("filters")}
            />
          </Row>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 24,
              paddingTop: 12,
            }}
          >
            {["Tous", "Individuel", "Duo", "Groupe"].map((kind) => (
              <Chip
                key={kind}
                active={sessionKind === kind}
                onPress={() => setSessionKind(kind)}
              >
                {kind}
              </Chip>
            ))}
          </ScrollView>
          {(budget < 300 || distance < 10 || format !== "Tous") && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                paddingHorizontal: 24,
                paddingTop: 12,
              }}
            >
              {budget < 300 && (
                <Chip onPress={() => setBudget(300)}>Jusqu’à {budget} € ×</Chip>
              )}
              {distance < 10 && (
                <Chip onPress={() => setDistance(10)}>
                  {distance} km max. ×
                </Chip>
              )}
              {format !== "Tous" && (
                <Chip onPress={() => setFormat("Tous")}>{format} ×</Chip>
              )}
            </ScrollView>
          )}
          <Row
            between
            style={{
              paddingHorizontal: 24,
              paddingTop: desktop ? 16 : 12,
              paddingBottom: desktop ? 14 : 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <H2 style={{ fontSize: 18 }}>
                {period === "evening"
                  ? "Votre séance de ce soir"
                  : "Des coachs, tout près."}
              </H2>
              <P small style={{ marginTop: 3 }}>
                {results.length} disponible{results.length === 1 ? "" : "s"} ·{" "}
                {dayLabel(day, true)}
              </P>
            </View>
            <Row>
              <TextButton onPress={() => setModal("sort")}>Trier</TextButton>
              <IconButton
                name={map ? "all" : "map"}
                light
                label={map ? "Voir la liste" : "Voir la carte"}
                onPress={() => setMap(!map)}
              />
            </Row>
          </Row>
          {comparison.length > 0 && (
            <Row
              between
              style={{
                marginHorizontal: 24,
                marginBottom: 16,
                padding: 12,
                backgroundColor: t.ink,
                borderRadius: 12,
              }}
            >
              <P small style={{ color: "#fff" }}>
                {comparison.length}/2 coachs sélectionnés
              </P>
              <Pressable
                accessibilityRole="button"
                disabled={comparison.length < 2}
                onPress={() => setModal("compare")}
              >
                <P
                  style={{
                    fontSize: 14,
                    color: "#fff",
                    opacity: comparison.length < 2 ? 0.35 : 1,
                  }}
                >
                  Comparer →
                </P>
              </Pressable>
            </Row>
          )}
          {map && live ? (
            <Section>
              <Note>
                La carte des coachs connectés reste à raccorder. Les résultats
                disponibles figurent dans la liste.
              </Note>
              <Button
                light
                onPress={() => setMap(false)}
                style={{ marginTop: 16 }}
              >
                Voir la liste
              </Button>
            </Section>
          ) : map ? (
            <>
              <View
                style={{
                  marginHorizontal: 16,
                  height: 360,
                  backgroundColor: "#e8e8e8",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <SvgXml xml={referenceMap} width="100%" height="100%" />
                {results.map((c, i) => (
                  <Pressable
                    accessibilityRole="button"
                    key={c.id}
                    onPress={() => setMapCoach(c.id)}
                    style={{
                      position: "absolute",
                      left: ((reference.coaches[Number(c.id)]?.xy[0] ?? 30) +
                        "%") as any,
                      top: ((reference.coaches[Number(c.id)]?.xy[1] ?? 30) +
                        "%") as any,
                      backgroundColor: "#fff",
                      padding: 10,
                      borderRadius: 99,
                    }}
                  >
                    <P bold style={{ fontSize: 14 }}>
                      {euro(primary(c)?.price ?? c.price)}
                    </P>
                  </Pressable>
                ))}
                <P
                  small
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 10,
                    backgroundColor: "#ffffffd9",
                    padding: 4,
                    fontSize: 11,
                  }}
                >
                  Carte schématique · prototype
                </P>
              </View>
              {results.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  {card(results.find((c) => c.id === mapCoach) ?? results[0])}
                </View>
              )}
            </>
          ) : results.length ? (
            results.map(card)
          ) : (
            empty(
              !pref.city.startsWith("Paris")
                ? "Pas encore de coach dans ce secteur"
                : "Aucun coach sur ce créneau",
              !pref.city.startsWith("Paris")
                ? "Les profils fictifs de la démo sont à Paris. Votre secteur est enregistré ; vous pouvez rechercher une séance en visio."
                : "Essayez une autre heure, un budget plus large ou une séance en visio.",
              "Élargir ma recherche",
              resetFilters,
            )
          )}
          <P
            small
            muted
            style={{
              textAlign: "center",
              paddingHorizontal: 24,
              paddingTop: 5,
              paddingBottom: 60,
              fontSize: 12,
            }}
          >
            Des coachs indépendants. Du temps pour vous.{"\n\n"}
            {live
              ? "Développement · disponibilités Supabase"
              : "Démo · profils et créneaux fictifs"}
          </P>
        </View>
      </>
    );
  if (screen === "profile" && coach) {
    content = (
      <>
        <Photo
          uri={coach.photoUri}
          index={coach.photo}
          height={desktop ? 264 : pageWidth / 1.5}
          label={`Portrait de ${coach.name}`}
        />
        <Section style={styles.sheet}>
          <Row between>
            {coach.verified ? (
              <Row style={styles.badge}>
                <Icon name="shield" size={17} />
                <P small bold>
                  Profil vérifié
                </P>
              </Row>
            ) : (
              <P small muted>
                Profil en développement
              </P>
            )}
            {coach.rating && (
              <TextButton
                onPress={() =>
                  live ? setModal("reviews") : go("reviews-native", coach.id)
                }
              >
                ★ {coach.rating} · {coach.reviews} avis
              </TextButton>
            )}
          </Row>
          <H1 style={{ marginTop: 16, marginBottom: 6 }}>{coach.name}</H1>
          <P muted>
            {coach.sport} · {coach.area}
          </P>
          {!!coach.quote && (
            <H2 style={{ fontSize: 22, marginTop: 22, marginBottom: 12 }}>
              « {coach.quote} »
            </H2>
          )}
          <Row wrap>
            {coach.tags.map((tag) => (
              <View style={styles.badge} key={tag}>
                <P small bold>
                  {tag}
                </P>
              </View>
            ))}
          </Row>
          <Row between style={{ marginVertical: 24 }}>
            {!live && (
              <>
                <View>
                  <H2>{coach.years} ans</H2>
                  <P small muted>
                    d’expérience
                  </P>
                </View>
                <View>
                  <H2>{coach.sessions}</H2>
                  <P small muted>
                    séances réalisées
                  </P>
                </View>
              </>
            )}
            <View>
              <H2>{euro(offer?.price ?? coach.price)}</H2>
              <P small muted>
                les {offer?.duration ?? 60} minutes
              </P>
            </View>
          </Row>
          <Note>
            <Row>
              <Icon name="check" />
              <P style={{ fontSize: 14, flex: 1 }}>
                Tous niveaux bienvenus.{"\n"}Première séance adaptée à votre
                objectif.
              </P>
            </Row>
          </Note>
          <H2 style={{ marginTop: 24 }}>Votre accompagnement</H2>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 24 }}
          >
            {offers.map((o) => (
              <Chip
                key={o.id}
                active={offer?.id === o.id}
                onPress={() => setOfferId(o.id)}
              >
                {o.name} · {euro(o.price)}
              </Chip>
            ))}
          </ScrollView>
          {!live &&
            (store.groups ?? [])
              .filter(
                (g) =>
                  g.offer.coach === coach.id &&
                  !g.cancelled &&
                  instant(g.day, g.time) > now(),
              )
              .map((g) => (
                <Setting
                  key={g.id}
                  title={g.offer.name}
                  description={`${dayLabel(g.day, true)} · ${g.time} · ${remaining(g.offer, g.day, g.time, store)} places restantes · ${euro(g.offer.price)}/pers.`}
                  onPress={() => go("group-details-native", g.id)}
                />
              ))}
          <H2>Votre prochain moment</H2>
          <View style={{ marginTop: 22 }}>{dateStrip()}</View>
          <P small muted style={{ marginTop: 16, marginBottom: 10 }}>
            {dayLabel(day)} · {offer?.duration ?? 60} min · Heure de Paris
          </P>
          {slots(coach, offer)}
          <Rule />
          <H2 style={{ marginBottom: 14 }}>Faire connaissance</H2>
          <P>{coach.bio || "Ce coach complète sa présentation."}</P>
          {!!coach.method && (
            <>
              <H2 style={{ fontSize: 18, marginTop: 22, marginBottom: 10 }}>
                Une séance avec {coach.name.split(" ")[0]}
              </H2>
              <P muted>{coach.method}</P>
            </>
          )}
          <Rule />
          <H2 style={{ marginBottom: 14 }}>Où on se retrouve</H2>
          <Row>
            <Icon name="pin" />
            <View style={{ flex: 1 }}>
              <P bold>{coach.place}</P>
              <P small muted>
                {coach.address}
              </P>
            </View>
          </Row>
          <Row wrap style={{ marginTop: 24 }}>
            {coach.formats.map((f) => (
              <View
                key={f}
                style={{
                  borderRadius: 999,
                  backgroundColor: "#f3f3f3",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <P small>{f}</P>
              </View>
            ))}
          </Row>
          {!live && (
            <>
              <Rule />
              <H2 style={{ marginBottom: 14 }}>Entre de bonnes mains</H2>
              <Row>
                <Icon name="shield" />
                <View style={{ flex: 1 }}>
                  <P bold>Identité et justificatifs vérifiés</P>
                  <P small muted>
                    {coach.cert}
                  </P>
                </View>
              </Row>
              <P small muted style={{ marginTop: 16 }}>
                Langues : {coach.langs}
              </P>
              <P small muted style={{ marginTop: 16 }}>
                Les vérifications et avis de ce prototype sont fictifs.
              </P>
            </>
          )}
          <Rule />
          <H2 style={{ marginBottom: 14 }}>Réserver l’esprit libre</H2>
          <P muted>
            Annulation gratuite jusqu’à{" "}
            {live ? 24 : configFor(store, coach.id).cancelHours} h avant la
            séance.
          </P>
        </Section>
      </>
    );
    sticky = (
      <Row style={styles.sticky}>
        <View>
          <P bold style={{ fontSize: 22 }}>
            {euro(offer?.price ?? coach.price)}
          </P>
          <P small muted>
            la séance
          </P>
        </View>
        <Button
          style={{ flex: 1 }}
          onPress={() => {
            const next = market.times(coach, day, offer)[0];
            if (next) chooseTime(coach, next, offer);
            else setModal("date");
          }}
        >
          Choisir mon créneau
        </Button>
      </Row>
    );
  }
  if (screen === "setup" && draft && coach) {
    content = (
      <Section>
        <Eyebrow>01 — VOTRE SÉANCE</Eyebrow>
        <H1 style={{ marginTop: 12, marginBottom: 24 }}>
          Un moment pour vous.
        </H1>
        {summary(draft)}
        <H2 style={{ marginTop: 24, marginBottom: 14 }}>
          Votre accompagnement
        </H2>
        {offers.map((o) => (
          <Choice
            key={o.id}
            active={draft.offerId === o.id}
            title={o.name}
            description={`${o.kind} · ${o.duration} minutes`}
            price={euro(o.price)}
            onPress={() => chooseOffer(o)}
          />
        ))}
        <Setting
          title={draft.time ? dayLabel(draft.day) : "Choisir un créneau"}
          description={`${draft.time ? draft.time + " – " + endTime(draft.time, draft.duration) : "La durée a changé : choisissez votre heure"} · ${draft.duration} min`}
          icon="calendar"
          onPress={() => setModal("booking-date")}
        />
        <H2 style={{ marginTop: 24, marginBottom: 14 }}>Où on se retrouve ?</H2>
        {draft.kind === "Groupe" && <Note>{draft.address}</Note>}
        {(draft.kind === "Groupe" ? [] : coach.formats).map((f) => (
          <Choice
            key={f}
            active={draft.format === f}
            title={
              f === "Domicile"
                ? "Chez vous"
                : f === "Visio"
                  ? "En visio"
                  : f === "Parc"
                    ? "En extérieur"
                    : "Au studio"
            }
            description={
              f === "Domicile"
                ? `Rayon de ${configFor(store, coach.id).radius} km · ${configFor(store, coach.id).travelFee ? euro(configFor(store, coach.id).travelFee) + " de déplacement" : "déplacement inclus"}`
                : coach.place
            }
            onPress={() => {
              const cfg = configFor(store, draft.coach);
              setDraft({
                ...draft,
                format: f,
                address:
                  f === "Studio"
                    ? cfg.studioAddress
                    : f === "Parc"
                      ? coach.address
                      : f === "Visio"
                        ? "Lien de visioconférence transmis dans la conversation"
                        : "",
                price: offer
                  ? quotePrice(store, { ...draft, format: f }, offer)
                  : draft.price,
              });
            }}
          />
        ))}
        {draft.format === "Domicile" && (
          <Field
            label="Adresse fictive du rendez-vous"
            value={draft.address}
            onChange={(address) => setDraft({ ...draft, address })}
          />
        )}{" "}
        {draft.kind === "Groupe" && (
          <Select
            label="Nombre de participants"
            value={String(draft.seats)}
            items={Array.from(
              {
                length: offer
                  ? live
                    ? (market.counts[draft.slotId ?? ""] ?? 0)
                    : remaining(offer, draft.day, draft.time, store)
                  : 1,
              },
              (_, i) => String(i + 1),
            )}
            onChange={(s) =>
              setDraft({
                ...draft,
                seats: Number(s),
                price:
                  ((store.groups ?? []).find(
                    (g) =>
                      g.offer.id === draft.offerId &&
                      g.day === draft.day &&
                      g.time === draft.time,
                  )?.offer.price ??
                    offer?.price ??
                    0) * Number(s),
              })
            }
          />
        )}
        <View style={{ marginTop: 24 }}>
          <Field
            label="Votre objectif pour cette séance"
            value={draft.goal}
            onChange={(goal) => setDraft({ ...draft, goal })}
            multiline
          />
        </View>
        <P small muted>
          Quelques mots suffisent. Évitez les informations médicales ou
          sensibles dans ce prototype.
        </P>
        <Note style={{ marginTop: 24 }}>
          Annulation gratuite jusqu’à{" "}
          {live ? 24 : configFor(store, draft.coach).cancelHours} h avant.
        </Note>
      </Section>
    );
    sticky = (
      <Row style={styles.sticky}>
        <View>
          <P bold style={{ fontSize: 22 }}>
            {euro(draft.price)}
          </P>
          <P small muted>
            Prix total{draft.kind === "Duo" ? " pour deux" : ""}
          </P>
        </View>
        <Button
          icon="arrow"
          style={{ flex: 1 }}
          disabled={!draft.time || busy}
          onPress={() => run(toCheckout)}
        >
          Continuer
        </Button>
      </Row>
    );
  }
  if (screen === "checkout" && draft) {
    content = (
      <Section>
        <Eyebrow>02 — CONFIRMATION & PAIEMENT</Eyebrow>
        <H1 style={{ marginTop: 12, marginBottom: 24 }}>
          Vous y êtes presque.
        </H1>
        {summary(draft)}
        <Rule />
        <Row>
          <Icon name="calendar" />
          <P>
            {dayLabel(draft.day)}
            {"\n"}
            {draft.time} – {endTime(draft.time, draft.duration)}
          </P>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Icon name="pin" />
          <P style={{ flex: 1 }}>{draft.address}</P>
        </Row>
        <View style={{ gap: 12, marginVertical: 24 }}>
          <Row between>
            <P>{draft.serviceName}</P>
            <P bold>{euro(draft.price)}</P>
          </Row>
          <Row between>
            <P>Frais de réservation</P>
            <P bold>0 €</P>
          </Row>
          <Row
            between
            style={{ borderTopWidth: 1, borderColor: "#ddd", paddingTop: 16 }}
          >
            <H2>Total à payer</H2>
            <H2>{euro(draft.price)}</H2>
          </Row>
        </View>
        <H2 style={{ marginBottom: 14 }}>Votre moyen de paiement</H2>
        {live ? (
          <Choice
            title="Réservation de développement"
            description="Aucun paiement n’est encaissé"
            active
            onPress={() => {}}
          />
        ) : (
          <>
            {["Apple Pay", "Carte bancaire"].map((method) => (
              <Choice
                key={method}
                title={method}
                description={
                  method === "Apple Pay"
                    ? "Simulation en un geste"
                    : "Carte de démonstration · •••• 4242"
                }
                active={paymentMethod === method}
                onPress={() => setPaymentMethod(method)}
              />
            ))}
          </>
        )}
        <Note style={{ marginTop: 24 }}>
          {live
            ? "Cette réservation est un test sans paiement. Le branchement Stripe reste reporté."
            : "Paiement simulé : aucun débit ne sera effectué."}
        </Note>
        <P small muted style={{ marginTop: 24 }}>
          Annulation gratuite jusqu’à {draft.cancelHours ?? 24} h avant votre
          séance.
        </P>
      </Section>
    );
    sticky = (
      <View style={styles.sticky}>
        <Button
          icon="shield"
          disabled={busy}
          style={{ flex: 1 }}
          onPress={() => (live ? run(finish) : run(startAttempt))}
        >
          {live
            ? "Confirmer ma réservation de test"
            : `Réserver · ${euro(draft.price)}`}
        </Button>
      </View>
    );
  }
  if (screen === "payment" && draft) {
    const attempt = store.attempts?.find((p) => p.id === attemptId),
      status = attempt?.status ?? "expired";
    content = (
      <Section>
        <Eyebrow>
          {status === "pending"
            ? "EN ATTENTE DE CONFIRMATION"
            : "AUCUN DÉBIT EFFECTUÉ"}
        </Eyebrow>
        <H1 style={{ marginVertical: 20 }}>
          {
            {
              pending: "Un dernier geste.",
              refused: "Paiement refusé.",
              interrupted: "Paiement interrompu.",
              expired: "Votre tentative a expiré.",
              success: "Vous êtes partant.",
            }[status]
          }
        </H1>
        {summary(draft)}
        <Note style={{ marginVertical: 24 }}>
          <P bold>
            {dayLabel(draft.day)} · {draft.time}
          </P>
          <P>
            {draft.seats} participant(s) · {euro(draft.price)} au total
          </P>
        </Note>
        <Note>
          {status === "pending"
            ? "Votre séance est confirmée uniquement après validation. Le créneau reste disponible pour les autres utilisateurs."
            : "Aucune réservation n’a été créée. Votre sélection est conservée pour une nouvelle tentative."}
        </Note>
        {status === "pending" ? (
          <>
            <Button
              style={{ marginTop: 20 }}
              disabled={busy}
              onPress={() => run(finish)}
            >
              Valider le paiement simulé
            </Button>
            <TextButton
              onPress={() =>
                run(() => {
                  setStore(W.paymentResult(store, attemptId, "interrupted"));
                })
              }
            >
              Interrompre et revenir plus tard
            </TextButton>
            {store.testMode && (
              <Button
                light
                onPress={() =>
                  run(() => {
                    setStore(W.paymentResult(store, attemptId, "refused"));
                  })
                }
              >
                Tester un refus bancaire
              </Button>
            )}
          </>
        ) : (
          <Button style={{ marginTop: 20 }} onPress={() => run(startAttempt)}>
            Réessayer avec ma sélection
          </Button>
        )}
        <TextButton onPress={() => go("checkout")}>
          Revoir le récapitulatif
        </TextButton>
        <P small muted>
          Aucun service bancaire connecté. Ne saisissez aucune donnée bancaire
          réelle.
        </P>
      </Section>
    );
  }
  if (screen === "confirmation") {
    const b = booked ?? draft;
    content = (
      <Section>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              height: 76,
              width: 76,
              borderRadius: 38,
              backgroundColor: t.ink,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 18,
              marginBottom: 22,
            }}
          >
            <Icon name="check" color="#fff" size={34} />
          </View>
          <Eyebrow>C’EST DANS L’AGENDA.</Eyebrow>
          <H1 style={{ textAlign: "center", marginVertical: 12 }}>
            Vous êtes partant.
          </H1>
          <P muted style={{ textAlign: "center", marginTop: 12 }}>
            {coaches.find((c) => c.id === b?.coach)?.name.split(" ")[0] ??
              "Votre coach"}{" "}
            vous attend.{"\n"}Votre séance est confirmée.
          </P>
        </View>
        {b && (
          <View
            style={{
              backgroundColor: t.fog,
              padding: 22,
              borderRadius: 14,
              marginVertical: 24,
            }}
          >
            <Eyebrow>VOTRE SÉANCE</Eyebrow>
            <P
              bold
              style={{
                fontSize: 30,
                lineHeight: 36,
                letterSpacing: -1,
                marginVertical: 10,
              }}
            >
              {dayLabel(b.day, true)} · {b.time}
            </P>
            {summary(b)}
            <Rule />
            <P>{b.address}</P>
          </View>
        )}
        <Button onPress={() => go("bookingDetail")}>Voir ma séance</Button>
        {b && (
          <>
            <Button
              light
              style={{ marginTop: 10 }}
              onPress={() =>
                run(() =>
                  exportFile(
                    `partant-${b.id}.ics`,
                    W.sessionICS(
                      b,
                      coaches.find((c) => c.id === b.coach)?.name ??
                        "Mon coach",
                    ),
                    "text/calendar",
                  ),
                )
              }
            >
              Ajouter au calendrier
            </Button>
            <TextButton onPress={() => favorite(b.coach)}>
              {store.favorites.includes(b.coach)
                ? "Coach dans vos favoris"
                : `Garder ${coaches.find((c) => c.id === b.coach)?.name.split(" ")[0]} dans mes favoris`}
            </TextButton>
          </>
        )}
        <TextButton onPress={() => go("bookings")}>
          Retrouver mes séances
        </TextButton>
        <P small muted style={{ marginTop: 24, textAlign: "center" }}>
          {live
            ? "Réservation enregistrée dans Supabase · aucun paiement encaissé"
            : "Confirmation de démonstration · aucun débit réel"}
        </P>
      </Section>
    );
  }
  if (screen === "favorites")
    content = (
      <>
        <Section>
          <Wordmark />
          <H1 style={{ marginTop: 26, marginBottom: 8 }}>
            Les bons liens{"\n"}se gardent.
          </H1>
          <P muted>Vos coachs, leurs prochains créneaux.</P>
        </Section>
        {coaches.some((c) => store.favorites.includes(c.id))
          ? coaches
              .filter((c) => store.favorites.includes(c.id))
              .map((c) => {
                let d = today(),
                  times: string[] = [];
                for (let i = 0; i < 90; i++) {
                  d = addDays(today(), i);
                  times = market.times(c, d);
                  if (times.length) break;
                }
                return (
                  <View key={c.id} style={styles.card}>
                    <Row>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Voir le profil de ${c.name}`}
                        onPress={() => openProfile(c)}
                      >
                        <Photo
                          uri={c.photoUri}
                          index={c.photo}
                          height={72}
                          style={{ width: 95, borderRadius: 8 }}
                        />
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <H2 style={{ fontSize: 17 }}>{c.name}</H2>
                        <P small muted>
                          {c.sport}
                        </P>
                        <P small>
                          {c.rating ? `★ ${c.rating} · ` : ""}
                          {euro(c.price)}
                        </P>
                      </View>
                      <IconButton
                        name="heart"
                        filled
                        label={`Retirer ${c.name} des favoris`}
                        onPress={() => favorite(c.id)}
                      />
                    </Row>
                    <P small muted style={{ marginTop: 16, marginBottom: 8 }}>
                      {times.length
                        ? dayLabel(d, true)
                        : "Aucun créneau pour le moment"}
                    </P>
                    <Row wrap>
                      {times.slice(0, 3).map((time) => (
                        <Chip
                          key={time}
                          onPress={() => {
                            setDay(d);
                            chooseTime(c, time, undefined, d);
                          }}
                        >
                          {time}
                        </Chip>
                      ))}
                    </Row>
                  </View>
                );
              })
          : empty(
              "Votre équipe commence ici",
              "Un coach vous plaît ? Touchez le cœur pour le retrouver ici, avec ses prochaines disponibilités.",
            )}
      </>
    );
  if (screen === "bookings") {
    const mine = store.bookings
      .filter((b) => b.clientId === store.account?.id)
      .filter((b) =>
        bookingTab === "upcoming"
          ? b.status === "confirmed" && instant(b.day, b.time) > now()
          : b.status !== "confirmed" || instant(b.day, b.time) <= now(),
      );
    content = (
      <Section>
        <Wordmark />
        <H1 style={{ marginTop: 28, marginBottom: 12 }}>
          Vos rendez-vous{"\n"}avec vous-même.
        </H1>
        <P muted>On garde le rythme.</P>
        <Row style={{ marginVertical: 24 }}>
          <Chip
            active={bookingTab === "upcoming"}
            onPress={() => setBookingTab("upcoming")}
          >
            À venir
          </Chip>
          <Chip
            active={bookingTab === "past"}
            onPress={() => setBookingTab("past")}
          >
            Passées
          </Chip>
        </Row>
        {mine.length
          ? mine.map((b) => (
              <Pressable
                accessibilityRole="button"
                key={b.id}
                onPress={() => {
                  setSelectedBooking(b.id);
                  go("bookingDetail");
                }}
                style={{
                  backgroundColor: t.fog,
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <Row between>
                  <P small bold>
                    {dayLabel(b.day, true)} · {b.time}
                  </P>
                  <P small>
                    {b.status === "cancelled"
                      ? "Annulée"
                      : b.status === "completed"
                        ? "Terminée"
                        : "Confirmée"}
                  </P>
                </Row>
                <View style={{ marginVertical: 16 }}>{summary(b)}</View>
                <Row between>
                  <P small muted>
                    {b.format} · {b.duration} min
                  </P>
                  <P bold>{euro(b.price)}</P>
                </Row>
              </Pressable>
            ))
          : empty(
              "Votre prochain moment vous attend.",
              "Trouvez un coach qui vous correspond et réservez votre séance.",
            )}
      </Section>
    );
  }
  if (screen === "bookingDetail" && booked) {
    const b = booked;
    content = (
      <Section>
        <Eyebrow>
          {b.status === "cancelled"
            ? "SÉANCE ANNULÉE"
            : "VOTRE PROCHAIN RENDEZ-VOUS"}
        </Eyebrow>
        <H1 style={{ marginTop: 12, marginBottom: 24 }}>
          {dayLabel(b.day, true)}
          {"\n"}à {b.time}.
        </H1>
        {summary(b)}
        <Rule />
        <Setting
          title="Date & heure"
          description={`${dayLabel(b.day)} · ${b.time} – ${endTime(b.time, b.duration)}`}
          icon="calendar"
          onPress={() =>
            !live && b.kind === "Groupe" && b.clientId === store.account?.id
              ? go("transfer-native")
              : setModal(
                  b.clientId === store.account?.id
                    ? "change-booking"
                    : "booking-info",
                )
          }
        />
        <Setting
          title="Lieu de rendez-vous"
          description={b.address}
          icon="pin"
          onPress={() => setModal("address")}
        />
        <Setting
          title="Votre séance"
          description={`${b.serviceName} · ${b.seats} participant(s)`}
          icon="strength"
          onPress={() => setModal("booking-info")}
        />
        <P style={{ marginTop: 24 }}>
          Votre objectif : {b.goal || "À préciser avec votre coach"}
        </P>
        <Row between style={{ marginVertical: 24 }}>
          <P>Total de la séance</P>
          <P bold>{euro(b.price)}</P>
        </Row>
        <Button icon="message" onPress={() => go("chat")}>
          {store.account?.role === "coach"
            ? "Contacter le participant"
            : "Contacter mon coach"}
        </Button>
        <TextButton
          onPress={() => {
            if (!live && store.account?.role === "client") {
              go("repeat-native");
              return;
            }
            const c = coaches.find((c) => c.id === b.coach);
            if (c) {
              setDay(addDays(today(), 1));
              openProfile(c);
            }
          }}
        >
          {store.account?.role === "coach"
            ? "Voir le profil public"
            : "Réserver à nouveau"}
        </TextButton>
        {b.status === "confirmed" && b.clientId === store.account?.id && (
          <>
            <TextButton
              onPress={() =>
                !live && b.kind === "Groupe"
                  ? go("transfer-native")
                  : setModal("change-booking")
              }
            >
              Modifier ma séance
            </TextButton>
            <TextButton muted onPress={() => setModal("cancel")}>
              Annuler ma séance
            </TextButton>
          </>
        )}
        <P small muted style={{ marginTop: 24 }}>
          Annulation gratuite jusqu’à {b.cancelHours ?? 24} h avant.{" "}
          {live
            ? "Aucun paiement encaissé."
            : "Paiement et remboursement simulés."}
        </P>
      </Section>
    );
  }
  if (screen === "account")
    content = (
      <Section>
        <Wordmark />
        <H1 style={{ marginTop: 28, marginBottom: 18 }}>
          Bonjour, {store.account?.name.split(" ")[0] || "Invité"}.
        </H1>
        <P muted>Vos envies évoluent. Partant aussi.</P>
        <Eyebrow style={{ marginTop: 28, marginBottom: 6 }}>
          MES ÉCHANGES
        </Eyebrow>
        <Setting
          title="Mes messages"
          icon="message"
          description={
            unreadMessages
              ? `${unreadMessages} non lu${unreadMessages > 1 ? "s" : ""}`
              : undefined
          }
          onPress={() => go("messages")}
        />
        <Setting
          title="Mes notifications"
          icon="bell"
          description={
            unread ? `${unread} nouvelle${unread > 1 ? "s" : ""}` : undefined
          }
          onPress={() => go("notifications")}
        />
        <Eyebrow style={{ marginTop: 28, marginBottom: 6 }}>
          MES PRÉFÉRENCES
        </Eyebrow>
        <View
          style={{
            borderRadius: 16,
            backgroundColor: t.fog,
            padding: 20,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          <Eyebrow>VOTRE POINT DE DÉPART</Eyebrow>
          <H2 style={{ fontSize: 18, marginVertical: 12 }}>{pref.goal}</H2>
          <P style={{ fontSize: 14, color: t.muted }}>
            {pref.sport === "Tout" ? "Toutes les pratiques" : pref.sport} ·{" "}
            {pref.city}
            {"\n"}Jusqu’à {pref.budget} € · {pref.distance} km
          </P>
          <TextButton
            style={{ alignItems: "flex-start", marginTop: 10 }}
            onPress={() => {
              setStep(0);
              go("onboarding");
            }}
          >
            Ajuster mes préférences
          </TextButton>
        </View>
        {!live && (
          <Setting
            title="Mes alertes de disponibilité"
            icon="calendar"
            description="Les créneaux que vous souhaitez retrouver"
            onPress={() => go("alerts-native")}
          />
        )}
        <Setting
          title="Compte & notifications"
          icon="user"
          description="Coordonnées, rappels et données personnelles"
          onPress={() =>
            live ? setModal("account-settings") : go("account-native")
          }
        />
        <Eyebrow style={{ marginTop: 28, marginBottom: 6 }}>
          AIDE & CONFIANCE
        </Eyebrow>
        <Setting
          title="Aide & mes demandes"
          icon="message"
          description="Une question, un imprévu ou une annulation"
          onPress={() => (live ? setModal("help") : go("support-native"))}
        />
        <Setting
          title="Confiance & sécurité"
          icon="shield"
          onPress={() => setModal("trust")}
        />
        <Rule />
        <Setting
          title="Passer côté coach"
          icon="user"
          description="Accéder à votre activité professionnelle"
          onPress={() => {
            setRole("coach");
            setEmail(live ? "" : "thomas@example.test");
            setSignup(false);
            go("login");
          }}
        />
        <TextButton
          onPress={() =>
            run(async () => {
              await market.signOut();
              go("welcome");
            })
          }
        >
          {store.account ? "Me déconnecter" : "Me connecter"}
        </TextButton>
        <TextButton
          muted
          onPress={() => (live ? setModal("about") : go("tools"))}
        >
          À propos de ce prototype
        </TextButton>
      </Section>
    );
  if (screen === "notifications")
    content = (
      <Section>
        {notifications.length
          ? notifications.map((n) => (
              <Setting
                key={n.id}
                title={n.body}
                description={n.read ? "Lu" : "Nouveau"}
                icon="calendar"
                onPress={() =>
                  run(async () => {
                    if (live) {
                      const { error } = await supabase
                        .from("notifications")
                        .update({ read_at: new Date().toISOString() })
                        .eq("id", n.id);
                      if (error) throw error;
                      await market.refresh();
                    } else
                      setStore((s) => ({
                        ...s,
                        notices: s.notices.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x,
                        ),
                      }));
                    if (n.booking) {
                      setSelectedBooking(n.booking);
                      go("bookingDetail");
                    } else if (n.id.startsWith("alert:")) go("alerts-native");
                    else if (store.account?.role === "coach") {
                      setConfig("documents");
                      go("config");
                    } else go("support-native");
                  })
                }
              />
            ))
          : empty(
              "Tout est à jour.",
              "Vos réservations et leurs modifications apparaîtront ici.",
              store.account?.role === "coach"
                ? "Revenir à l’agenda"
                : "Explorer les coachs",
              () => {
                if (store.account?.role === "coach") {
                  setCoachTab("agenda");
                  go("coach");
                } else go("explore");
              },
            )}
      </Section>
    );
  if (screen === "messages")
    content = (
      <Section>
        {conversations.map((b) => (
          <Setting
            key={b.id}
            title={
              store.account?.role === "coach"
                ? b.clientName
                : (coaches.find((c) => c.id === b.coach)?.name ?? "Votre coach")
            }
            description={`${dayLabel(b.day, true)} · ${b.time}${!live && (store.messages[b.id] ?? []).some((m) => m.who !== store.account?.id && !m.readBy?.includes(store.account?.id ?? "")) ? " · Nouveau message" : ""}`}
            icon="message"
            onPress={() => {
              setSelectedBooking(b.id);
              go("chat");
            }}
          />
        ))}
        {!conversations.length &&
          empty(
            "La conversation commence ici.",
            store.account?.role === "coach"
              ? "Vos échanges avec vos clients apparaîtront après une première réservation."
              : "Après votre réservation, retrouvez vos échanges avec votre coach.",
            store.account?.role === "coach"
              ? "Revenir à l’agenda"
              : "Découvrir les coachs",
            () => {
              if (store.account?.role === "coach") {
                setCoachTab("agenda");
                go("coach");
              } else go("explore");
            },
          )}
      </Section>
    );
  if (screen === "chat" && booked)
    content = (
      <Section>
        {summary(booked)}
        <Rule />
        {live ? (
          <Note>
            La messagerie partagée reste à raccorder. Aucun message ne sera
            envoyé depuis cet écran pour le moment.
          </Note>
        ) : (
          <>
            {(store.messages[booked.id] ?? []).map((m, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: m.who === store.account?.id ? t.ink : t.fog,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 15,
                  alignSelf:
                    m.who === store.account?.id ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  marginBottom: 15,
                }}
              >
                <P
                  style={{
                    fontSize: 14,
                    color: m.who === store.account?.id ? "#fff" : t.ink,
                  }}
                >
                  {m.text}
                </P>
                {m.who === store.account?.id && (
                  <P small style={{ color: "#bbb", marginTop: 6 }}>
                    {(m.readBy ?? []).some((id) => id !== m.who)
                      ? "Lu"
                      : "Envoyé"}
                  </P>
                )}
              </View>
            ))}
            <Field
              label="Votre message"
              value={message}
              onChange={setMessage}
              multiline
            />
            <Button
              disabled={!message.trim()}
              onPress={() => {
                setStore((s) => ({
                  ...s,
                  messages: {
                    ...s.messages,
                    [booked.id]: [
                      ...(s.messages[booked.id] ?? []),
                      {
                        who: s.account?.id ?? "",
                        text: message.trim(),
                        readBy: [s.account?.id ?? ""],
                      },
                    ],
                  },
                }));
                setMessage("");
              }}
            >
              Envoyer
            </Button>
            <P small muted style={{ marginTop: 16 }}>
              Conversation de démonstration conservée sur cet appareil.
            </P>
          </>
        )}
      </Section>
    );
  if (screen === "coach") {
    const titles: Record<string, string> = {
      agenda: "Votre prochain mouvement.",
      clients: "Les liens qui comptent.",
      activity: "Votre activité, au clair.",
      settings: "Tout, à votre façon.",
    };
    const captions: Record<string, string> = {
      agenda: dayLabel(day),
      clients: "Un suivi simple, une relation qui dure.",
      activity: "Séances, encaissements et versements.",
      settings: "Votre offre. Vos règles. Votre rythme.",
    };
    const ownBookings = store.bookings.filter((b) => b.coach === activeCoach);
    const coachSelf = coaches.find((c) => c.id === activeCoach);
    const ownOffers = store.offers.filter((o) => o.coach === activeCoach);
    const agendaOffer =
      ownOffers.find((o) => o.id === agendaOfferId && o.active) ??
      ownOffers.find((o) => o.active);
    const todayBookings = ownBookings.filter(
      (b) => b.day === day && b.status === "confirmed",
    );
    content = (
      <>
        <View
          style={[
            styles.top,
            { paddingBottom: 42, paddingTop: desktop ? 16 : 20 },
          ]}
        >
          <Row between>
            <Wordmark light coach />
            <IconButton
              name="user"
              color="#fff"
              label="Passer côté client"
              onPress={() => {
                setRole("client");
                go("account");
              }}
            />
          </Row>
          <Row wrap style={{ marginTop: 20, gap: 10 }}>
            {(
              [
                ["messages", "message", "Messages", unreadMessages],
                ["notifications", "bell", "Notifications", unread],
              ] as const
            ).map(([destination, icon, label, count]) => (
              <Pressable
                key={destination}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={
                  count
                    ? `${count} non lu${count > 1 ? "s" : ""}`
                    : "Tout est à jour"
                }
                onPress={() => go(destination)}
                style={{
                  flex: 1,
                  flexBasis: 142,
                  minWidth: 142,
                  minHeight: 44,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: "#626262",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Row style={{ justifyContent: "center", gap: 7 }}>
                  <Icon name={icon} color="#fff" size={17} />
                  <P style={{ color: "#fff", fontSize: 13 }}>{label}</P>
                  {count > 0 && (
                    <View
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 99,
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                      }}
                    >
                      <P style={{ color: t.ink, fontSize: 11, lineHeight: 16 }}>
                        {count > 99 ? "99+" : count}
                      </P>
                    </View>
                  )}
                </Row>
              </Pressable>
            ))}
          </Row>
          <H1
            style={{
              color: "#fff",
              marginTop: 22,
              marginBottom: 10,
              maxWidth: 340,
            }}
          >
            {titles[coachTab]}
          </H1>
          <P style={{ fontSize: 14, color: "#bdbdbd" }}>{captions[coachTab]}</P>
        </View>
        <Section style={styles.sheet}>
          {coachTab === "agenda" && unread > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => go("notifications")}
              style={{ marginBottom: 18 }}
            >
              <Note>
                <Row between>
                  <P bold style={{ fontSize: 14 }}>
                    {unread} nouvelle{unread > 1 ? "s" : ""} notification
                    {unread > 1 ? "s" : ""}
                  </P>
                  <Icon name="chevron" size={17} />
                </Row>
              </Note>
            </Pressable>
          )}
          {coachTab === "settings" ? (
            <>
              <Setting
                title={
                  (
                    live
                      ? store.published
                      : configFor(store, activeCoach ?? "0").published
                  )
                    ? "Votre profil est en ligne"
                    : "Votre profil est en pause"
                }
                description={
                  (
                    live
                      ? store.published
                      : configFor(store, activeCoach ?? "0").published
                  )
                    ? "Les clients peuvent réserver vos disponibilités"
                    : "Les nouvelles réservations sont suspendues"
                }
                onPress={() =>
                  run(async () => {
                    if (live && store.account) {
                      const { error } = await supabase
                        .from("coaches")
                        .update({
                          published: !(live
                            ? store.published
                            : configFor(store, activeCoach ?? "0").published),
                        })
                        .eq("id", store.account.id);
                      if (error) throw error;
                      await market.refresh();
                    }
                    if (!live) setStore(W.publish(store, activeCoach ?? "0"));
                    else setStore((s) => ({ ...s, published: !s.published }));
                  })
                }
                right={
                  <View
                    style={{
                      width: 44,
                      height: 27,
                      borderRadius: 99,
                      backgroundColor: (
                        live
                          ? store.published
                          : configFor(store, activeCoach ?? "0").published
                      )
                        ? t.ink
                        : "#bbb",
                      padding: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: 20,
                        backgroundColor: "#fff",
                        alignSelf: (
                          live
                            ? store.published
                            : configFor(store, activeCoach ?? "0").published
                        )
                          ? "flex-end"
                          : "flex-start",
                      }}
                    />
                  </View>
                }
              />
              <Setting
                title="Ma checklist de mise en ligne"
                onPress={() =>
                  live ? setModal("checklist") : go("checklist-native")
                }
              />
              {reference.coachSections.map(([id, icon, title, description]) => (
                <Setting
                  key={id}
                  title={title}
                  description={description}
                  icon={icon}
                  onPress={() => {
                    setConfig(id);
                    if (coachSelf) {
                      setConfigName(coachSelf.name);
                      setConfigBio(coachSelf.bio);
                    }
                    go("config");
                  }}
                />
              ))}
              {!live && (
                <>
                  <Setting
                    title="Préparer vos clients"
                    description="Matériel, accès et météo"
                    onPress={() => {
                      setConfig("preparation");
                      go("config");
                    }}
                  />
                  <Setting
                    title="Mon compte & mes données"
                    onPress={() => go("account-native")}
                  />
                  <Setting
                    title="À propos de la simulation"
                    onPress={() => go("tools")}
                  />
                </>
              )}
              <Button
                light
                style={{ marginTop: 24 }}
                onPress={() =>
                  coachSelf
                    ? openProfile(coachSelf)
                    : setNotice("Complétez votre profil coach.")
                }
              >
                Prévisualiser mon profil
              </Button>
              <TextButton
                onPress={() =>
                  run(async () => {
                    await market.signOut();
                    go("welcome");
                  })
                }
              >
                Me déconnecter
              </TextButton>
            </>
          ) : coachTab === "agenda" ? (
            <>
              <Row between style={{ marginBottom: 14 }}>
                <H2>Votre agenda</H2>
                <TextButton
                  onPress={() => {
                    setConfig("blocks");
                    go("config");
                  }}
                >
                  + Indisponibilité
                </TextButton>
              </Row>
              {dateStrip()}
              <Row between style={{ marginTop: 24 }}>
                <P bold>{todayBookings.length} rendez-vous au planning</P>
                <TextButton
                  onPress={() => {
                    setConfig("schedule");
                    go("config");
                  }}
                >
                  Configurer
                </TextButton>
              </Row>
              {todayBookings.map((b) => (
                <Pressable
                  accessibilityRole="button"
                  key={b.id}
                  onPress={() => {
                    setSelectedBooking(b.id);
                    go("bookingDetail");
                  }}
                  style={{
                    backgroundColor: t.ink,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 12,
                  }}
                >
                  <Row>
                    <P bold style={{ color: "#fff" }}>
                      {b.time}
                    </P>
                    <View style={{ flex: 1 }}>
                      <P bold style={{ color: "#fff" }}>
                        {b.clientName}
                      </P>
                      <P small style={{ color: "#ccc" }}>
                        {b.serviceName} · {b.format}
                      </P>
                    </View>
                    <Icon name="chevron" color="#fff" />
                  </Row>
                </Pressable>
              ))}
              <Setting
                title="Mes cours en groupe"
                description="Dates, inscriptions et places disponibles"
                icon="all"
                onPress={() => {
                  setConfig("groups");
                  go("config");
                }}
              />
              <H2 style={{ fontSize: 18, marginTop: 24, marginBottom: 14 }}>
                Disponibilités proposées
              </H2>
              {agendaOffer && (
                <Select
                  label="Voir les créneaux de"
                  value={agendaOffer.id}
                  items={ownOffers
                    .filter((o) => o.active)
                    .map((o) => [
                      o.id,
                      `${o.name} · ${o.duration} min · ${euro(o.price)}${o.kind === "Groupe" ? "/pers." : ""}`,
                    ])}
                  onChange={setAgendaOfferId}
                />
              )}
              {coachSelf && agendaOffer ? (
                <Row wrap>
                  {market.times(coachSelf, day, agendaOffer).map((time) => (
                    <Pressable
                      accessibilityRole="button"
                      key={time}
                      onPress={() =>
                        agendaOffer.kind === "Groupe"
                          ? setNotice(
                              "Gérez ce cours dans Mes cours en groupe.",
                            )
                          : live
                            ? setNotice(
                                "La fermeture d’un créneau serveur reste à raccorder.",
                              )
                            : setStore((s) => ({
                                ...s,
                                closed: [
                                  ...s.closed,
                                  `${activeCoach}|${day}|${time}`,
                                ],
                              }))
                      }
                      style={styles.slot}
                    >
                      <P>{time}</P>
                    </Pressable>
                  ))}
                  {store.closed
                    .filter((k) => k.startsWith(`${activeCoach}|${day}|`))
                    .map((key) => (
                      <Pressable
                        accessibilityRole="button"
                        key={key}
                        onPress={() =>
                          setStore((s) => ({
                            ...s,
                            closed: s.closed.filter((k) => k !== key),
                          }))
                        }
                        style={styles.slot}
                      >
                        <P muted>{key.split("|")[2]} ×</P>
                      </Pressable>
                    ))}
                </Row>
              ) : (
                <Note>
                  Complétez votre profil avant d’ouvrir votre planning.
                </Note>
              )}
              <P small muted style={{ marginTop: 24 }}>
                Fermer une heure bloque ce départ pour toutes vos offres. Les
                réservations confirmées sont conservées. Gérez les cours
                collectifs dans « Mes cours en groupe ».
              </P>
              <Note style={{ marginTop: 24 }}>
                <Row>
                  <Icon name="clock" />
                  <P style={{ fontSize: 14, flex: 1 }}>
                    {agendaOffer
                      ? `${agendaOffer.duration} min · ${euro(agendaOffer.price)}${agendaOffer.kind === "Groupe" ? "/personne" : "/séance"}`
                      : "Créez votre première séance"}{" "}
                    · réservation{" "}
                    {live ? 24 : configFor(store, activeCoach ?? "0").notice} h
                    minimum à l’avance.
                  </P>
                </Row>
              </Note>
            </>
          ) : coachTab === "clients" ? (
            <>
              {Array.from(new Set(ownBookings.map((b) => b.clientId))).map(
                (id) => {
                  const b = ownBookings.find((b) => b.clientId === id)!;
                  return (
                    <Setting
                      key={id}
                      title={b.clientName}
                      description={b.goal || "Son prochain mouvement"}
                      icon="user"
                      onPress={() => {
                        if (!live) {
                          go("client-native", b.clientId);
                          return;
                        }
                        setSelectedBooking(b.id);
                        go("chat");
                      }}
                    />
                  );
                },
              )}
              {!ownBookings.length && (
                <P muted>Vos nouveaux clients réservés apparaîtront ici.</P>
              )}
            </>
          ) : (
            <>
              <Eyebrow>NET COACH PRÉVISIONNEL</Eyebrow>
              <P bold style={{ fontSize: 42, lineHeight: 50, marginTop: 16 }}>
                {euro(ownBookings.reduce((n, b) => n + W.net(b) * 0.85, 0))}
              </P>
              <P small muted style={{ marginTop: 12 }}>
                Commission de démonstration · 15 %
              </P>
              <Rule />
              <Row between>
                <P>Paiements cumulés</P>
                <P bold>
                  {euro(
                    ownBookings.reduce((n, b) => n + (b.paid ?? b.price), 0),
                  )}
                </P>
              </Row>
              <Row between>
                <P>Remboursements cumulés</P>
                <P bold>
                  {euro(ownBookings.reduce((n, b) => n + (b.refunded ?? 0), 0))}
                </P>
              </Row>
              <Row between>
                <P>Éligible après séance · démo</P>
                <P bold>
                  {euro(
                    ownBookings
                      .filter((b) => b.status !== "confirmed")
                      .reduce((n, b) => n + W.net(b) * 0.85, 0),
                  )}
                </P>
              </Row>
              <Button
                light
                style={{ marginVertical: 20 }}
                onPress={() =>
                  run(() =>
                    exportFile(
                      "partant-activite.csv",
                      "Date;Heure;Client;Paiements;Remboursements;Net coach\n" +
                        ownBookings
                          .map((b) =>
                            [
                              b.day,
                              b.time,
                              '"' + b.clientName.replace(/"/g, '""') + '"',
                              b.paid ?? b.price,
                              b.refunded ?? 0,
                              W.money(W.net(b) * 0.85),
                            ].join(";"),
                          )
                          .join("\n"),
                      "text/csv",
                    ),
                  )
                }
              >
                Télécharger le relevé CSV
              </Button>
              {ownBookings.map((b) => (
                <Setting
                  key={b.id}
                  title={`${b.clientName} · ${dayLabel(b.day, true)}`}
                  description={
                    b.status === "cancelled"
                      ? "Annulée"
                      : "Réservation enregistrée"
                  }
                  onPress={() => {
                    setSelectedBooking(b.id);
                    go("bookingDetail");
                  }}
                  right={<P bold>{euro(b.price)}</P>}
                />
              ))}
              <Note style={{ marginTop: 24 }}>
                Simulation : aucun encaissement, virement ou document fiscal
                réel.
              </Note>
            </>
          )}
        </Section>
      </>
    );
  }
  if (screen === "config")
    content = (
      <Section>
        {config === "profile" ? (
          <>
            <Field
              label="Nom public"
              value={configName}
              onChange={setConfigName}
            />
            <Field
              label="Votre approche"
              value={configBio}
              onChange={setConfigBio}
              multiline
            />
            <Button
              disabled={busy}
              onPress={() =>
                run(async () => {
                  if (live && store.account) {
                    const { error } = await supabase
                      .from("coaches")
                      .update({
                        display_name: configName.trim(),
                        bio: configBio,
                      })
                      .eq("id", store.account.id);
                    if (error) throw error;
                    await market.refresh();
                    setNotice("Profil enregistré.");
                  } else {
                    setStore((s) => ({
                      ...s,
                      coachOverrides: {
                        ...s.coachOverrides,
                        [activeCoach ?? "0"]: {
                          name: configName.trim(),
                          bio: configBio,
                        },
                      },
                    }));
                    setNotice("Profil enregistré.");
                  }
                })
              }
            >
              Enregistrer
            </Button>
          </>
        ) : config === "offers" ? (
          <>
            {store.offers
              .filter((o) => o.coach === activeCoach)
              .map((o) => (
                <Setting
                  key={o.id}
                  title={o.name}
                  description={`${o.kind} · ${o.duration} min · ${euro(o.price)}`}
                  onPress={() =>
                    run(async () => {
                      if (live) {
                        const { error } = await supabase
                          .from("offers")
                          .update({ active: !o.active })
                          .eq("id", o.id);
                        if (error) throw error;
                        await market.refresh();
                      } else
                        setStore((s) => ({
                          ...s,
                          offers: s.offers.map((x) =>
                            x.id === o.id ? { ...x, active: !x.active } : x,
                          ),
                        }));
                    })
                  }
                  right={<P small>{o.active ? "Active" : "En pause"}</P>}
                />
              ))}
            <H2 style={{ marginTop: 24, marginBottom: 14 }}>
              Créer une séance
            </H2>
            <Field
              label="Nom de la séance"
              value={offerName}
              onChange={setOfferName}
            />
            <Select
              label="Format"
              value={offerKind}
              items={["Individuel", "Duo", "Groupe"]}
              onChange={setOfferKind}
            />
            <Field
              label="Durée (minutes)"
              value={offerDuration}
              onChange={setOfferDuration}
              numeric
            />
            <Field
              label={
                offerKind === "Groupe"
                  ? "Prix par personne (€)"
                  : "Prix de la séance (€)"
              }
              value={offerPrice}
              onChange={setOfferPrice}
              numeric
            />
            {offerKind === "Groupe" && (
              <Field
                label="Nombre maximum de participants"
                value={offerCapacity}
                onChange={setOfferCapacity}
                numeric
              />
            )}
            <Button
              disabled={busy}
              onPress={() =>
                run(async () => {
                  const price = Number(offerPrice.replace(",", ".")),
                    duration = Number(offerDuration),
                    capacity =
                      offerKind === "Duo"
                        ? 2
                        : offerKind === "Groupe"
                          ? Number(offerCapacity)
                          : 1;
                  if (
                    !offerName.trim() ||
                    !Number.isFinite(price) ||
                    price < 0 ||
                    !Number.isInteger(duration) ||
                    duration < 15 ||
                    duration > 240 ||
                    !Number.isInteger(capacity) ||
                    capacity < 1 ||
                    capacity > 20 ||
                    (offerKind === "Groupe" && capacity < 2)
                  )
                    throw Error(
                      "Vérifiez le nom, le prix, la durée et le nombre de participants.",
                    );
                  if (live && store.account) {
                    const { error } = await supabase.from("offers").insert({
                      coach_id: store.account.id,
                      title: offerName,
                      sport: "Coaching sportif",
                      format:
                        offerKind === "Groupe"
                          ? "group"
                          : offerKind === "Duo"
                            ? "duo"
                            : "individual",
                      duration_minutes: duration,
                      price_cents: Math.round(price * 100),
                      capacity,
                    });
                    if (error) throw error;
                    await market.refresh();
                  } else
                    setStore((s) => ({
                      ...s,
                      offers: [
                        ...s.offers,
                        {
                          id: Crypto.randomUUID(),
                          coach: activeCoach ?? "0",
                          name: offerName,
                          kind: offerKind,
                          duration,
                          price,
                          active: true,
                          capacity,
                        },
                      ],
                    }));
                  setOfferName("");
                  setNotice("Offre enregistrée. Ouvrez ensuite ses créneaux.");
                })
              }
            >
              Enregistrer l’offre
            </Button>
          </>
        ) : config === "groups" ? (
          <>
            <H1>Un coach.{"\n"}Une énergie collective.</H1>
            <P muted style={{ marginTop: 12, marginBottom: 24 }}>
              Ouvrez des cours datés. Leur durée bloque votre agenda, même avant
              la première inscription.
            </P>
            <Button
              onPress={() => {
                setGroupOffer(
                  store.offers.find(
                    (o) =>
                      o.coach === activeCoach &&
                      o.kind === "Groupe" &&
                      o.active,
                  )?.id ?? "",
                );
                setModal("open-group");
              }}
            >
              Planifier un cours
            </Button>
            {(live
              ? market.remoteSlots
                  .filter(
                    (x) =>
                      x.coach_id === activeCoach &&
                      store.offers.find((o) => o.id === x.offer_id)?.kind ===
                        "Groupe",
                  )
                  .map((x) => ({
                    id: x.id,
                    offer: store.offers.find((o) => o.id === x.offer_id)!,
                    day: x.day,
                    time: x.time,
                    address: x.location,
                  }))
              : (store.groups ?? []).filter(
                  (g) => g.offer.coach === activeCoach,
                )
            ).map((g) => (
              <Setting
                key={g.id}
                title={`${dayLabel(g.day, true)} · ${g.time}`}
                description={`${g.offer.name} · ${g.offer.capacity} places maximum · ${g.address}`}
                onPress={() => {
                  if (!live) {
                    go("group-manage", g.id);
                    return;
                  }
                  setDay(g.day);
                  setCoachTab("agenda");
                  go("coach");
                }}
              />
            ))}
            <TextButton onPress={() => setConfig("offers")}>
              Gérer mes offres
            </TextButton>
          </>
        ) : config === "schedule" ? (
          <>
            <H1>Votre semaine,{"\n"}à votre rythme.</H1>
            <P muted style={{ marginTop: 12, marginBottom: 24 }}>
              Retrouvez les plages proposées dans votre agenda.
            </P>
            {dateStrip()}
            <Note style={{ marginTop: 24 }}>
              La configuration du planning est disponible dans la simulation
              React Native. Sa persistance serveur sera raccordée au moteur
              partagé.
            </Note>
            <Button
              light
              style={{ marginTop: 24 }}
              onPress={() => {
                setCoachTab("agenda");
                go("coach");
              }}
            >
              Revenir à mon agenda
            </Button>
          </>
        ) : config === "calendars" ? (
          <>
            <H1>Un planning.{"\n"}Tous vos agendas.</H1>
            <P muted style={{ marginTop: 12, marginBottom: 24 }}>
              Évitez les doubles réservations en connectant votre agenda.
            </P>
            {["Google Calendar", "Apple Calendar", "Outlook"].map(
              (provider) => (
                <Setting
                  key={provider}
                  title={provider}
                  description="Non connecté"
                  icon="calendar"
                  onPress={() =>
                    setNotice(
                      "Configuration développeur nécessaire. Aucune connexion externe n’est encore active.",
                    )
                  }
                />
              ),
            )}
            <Note style={{ marginTop: 24 }}>
              Les disponibilités externes ne sont pas synchronisées pour le
              moment. Tenez votre planning Partant à jour.
            </Note>
          </>
        ) : config === "payout" ? (
          <>
            <H1>Votre activité,{"\n"}vos revenus.</H1>
            <Note style={{ marginTop: 24 }}>
              Le paiement et les versements restent reportés à l’étape 4. Aucun
              compte bancaire n’est demandé dans cette version.
            </Note>
          </>
        ) : (
          <>
            <H2>{reference.coachSections.find((x) => x[0] === config)?.[2]}</H2>
            <P muted style={{ marginTop: 12 }}>
              Cette configuration est disponible dans la simulation React
              Native. Son branchement serveur reste à réaliser.
            </P>
            <Button
              light
              style={{ marginTop: 24 }}
              onPress={() =>
                Linking.openURL(
                  "http://127.0.0.1:8766/partant.html?version=a1-a9",
                )
              }
            >
              Consulter le prototype de référence
            </Button>
          </>
        )}
      </Section>
    );
  const sectorResults = sectors.filter(
    (c) =>
      (!department || c.codeDepartement === department) &&
      fold(sectorQuery)
        .split(" ")
        .filter(Boolean)
        .every((word) =>
          fold(
            `${c.nom} ${c.codesPostaux.join(" ")} ${departments[c.codeDepartement]}`,
          ).includes(word),
        ),
  );
  const modalTitles: Record<string, string> = {
    "open-group": "Ouvrir un cours en groupe",
    location: "Votre secteur en Île-de-France",
    filters: "Affinez votre recherche",
    date: "Votre prochain moment",
    "booking-date": "Choisir un créneau",
    sort: "Trier les coachs",
    sports: "Toutes les pratiques",
    compare: "Votre choix, en un regard",
    reviews: "Les avis de ses clients",
    cancel: "Annuler votre séance",
    "change-booking": "Modifier votre séance",
    address: "Votre lieu de rendez-vous",
    "booking-info": "Votre séance",
    "account-settings": "Mon compte & mes rappels",
    trust: "Confiance & sécurité",
    help: "Aide & annulations",
    about: "À propos de ce prototype",
    checklist: "Votre activité prend forme",
  };
  let modalBody: React.ReactNode = null;
  if (modal === "open-group")
    modalBody = (
      <>
        <Select
          label="Votre cours"
          value={groupOffer}
          items={store.offers
            .filter(
              (o) => o.coach === activeCoach && o.active && o.kind === "Groupe",
            )
            .map((o) => [
              o.id,
              `${o.name} · ${euro(o.price)}/pers. · ${o.capacity} places`,
            ])}
          onChange={setGroupOffer}
        />
        {!groupOffer && (
          <Note>Créez d’abord une offre Groupe dans Séances & tarifs.</Note>
        )}
        <Select
          label="Date"
          value={groupDay}
          items={Array.from({ length: 28 }, (_, i) => {
            const d = addDays(today(), i + 1);
            return [d, dayLabel(d)];
          })}
          onChange={setGroupDay}
        />
        <Field
          label="Horaire (HH:MM)"
          value={groupTime}
          onChange={setGroupTime}
        />
        <Field
          label="Lieu du cours"
          value={groupAddress}
          onChange={setGroupAddress}
        />
        <Note>
          La durée, le lieu, le tarif et le nombre de places de cette offre sont
          conservés pour ce cours.
        </Note>
        <Button
          disabled={!groupOffer || busy}
          style={{ marginTop: 20 }}
          onPress={() =>
            run(async () => {
              const o = store.offers.find((o) => o.id === groupOffer);
              if (!o) throw Error("Choisissez une offre.");
              if (live) {
                if (
                  !/^([01]\d|2[0-3]):[0-5]\d$/.test(groupTime) ||
                  !groupAddress.trim()
                )
                  throw Error("Vérifiez l’heure et le lieu.");
                const { error } = await supabase.rpc("open_slot", {
                  p_offer: o.id,
                  p_start: new Date(instant(groupDay, groupTime)).toISOString(),
                  p_location: groupAddress,
                });
                if (error) throw error;
                await market.refresh();
              } else
                setStore(
                  openGroup(store, {
                    id: Crypto.randomUUID(),
                    offer: o,
                    day: groupDay,
                    time: groupTime,
                    address: groupAddress,
                  }),
                );
              setModal("");
              setNotice("Votre cours est ouvert aux réservations.");
            })
          }
        >
          Ouvrir ce cours
        </Button>
      </>
    );
  if (modal === "location")
    modalBody = (
      <>
        <P small muted style={{ marginBottom: 14 }}>
          {pref.city} · secteur actuel
        </P>
        <Field
          label="Commune ou code postal"
          value={sectorQuery}
          onChange={(q) => {
            setSectorQuery(q);
            setSectorLimit(15);
          }}
          placeholder="Versailles, Saint-Denis, 94000…"
        />
        <Select
          label="Département"
          value={department}
          items={[
            ["", "Toute l’Île-de-France"],
            ...Object.entries(departments).map(
              ([id, n]) => [id, `${id} · ${n}`] as [string, string],
            ),
          ]}
          onChange={(d) => {
            setDepartment(d);
            setSectorLimit(15);
          }}
        />
        <P small muted>
          {sectorResults.length} secteurs ·{" "}
          {Math.min(sectorLimit, sectorResults.length)} affichés
        </P>
        {sectorResults.slice(0, sectorLimit).map((c) => (
          <Setting
            key={c.code}
            title={c.nom}
            description={`${departments[c.codeDepartement]} · ${c.codesPostaux[0]}`}
            onPress={() => {
              preference({
                city:
                  c.codeDepartement === "75"
                    ? c.nom
                    : `${c.nom} · ${c.codeDepartement}`,
              });
              setModal("");
            }}
          />
        ))}
        {sectorLimit < sectorResults.length && (
          <TextButton onPress={() => setSectorLimit(sectorLimit + 30)}>
            Afficher plus de secteurs
          </TextButton>
        )}
      </>
    );
  if (modal === "filters")
    modalBody = (
      <>
        <View style={{ marginBottom: 18 }}>
          <P bold>Prix maximum par séance · {budget} €</P>
          <Slider
            accessibilityLabel="Budget maximum par séance"
            minimumValue={20}
            maximumValue={300}
            step={5}
            value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor="#141414"
            maximumTrackTintColor="#e5e5e5"
            thumbTintColor="#141414"
            style={{ height: 44 }}
          />
        </View>
        <Select
          label="Distance maximale"
          value={String(distance)}
          items={[1, 2, 5, 10].map((v) => [String(v), `${v} km`])}
          onChange={(v) => setDistance(Number(v))}
        />
        <Select
          label="Lieu de la séance"
          value={format}
          items={["Tous", "Parc", "Studio", "Domicile", "Visio"]}
          onChange={setFormat}
        />
        <Button onPress={() => setModal("")}>Voir les coachs</Button>
        <TextButton
          onPress={() => {
            resetFilters();
            setModal("");
          }}
        >
          Réinitialiser les filtres
        </TextButton>
      </>
    );
  if (
    modal === "date" ||
    modal === "booking-date" ||
    modal === "change-booking"
  )
    modalBody = (
      <>
        {dateStrip()}
        <P small muted style={{ marginTop: 16, marginBottom: 14 }}>
          Heure de Paris
        </P>
        {modal === "date" ? (
          <>
            <Select
              label="À quelle heure ?"
              value={hour}
              items={[
                ["", "Toutes les heures"],
                ...Array.from({ length: 48 }, (_, i) =>
                  endTime("00:00", i * 30),
                ).map((v) => [v, v] as [string, string]),
              ]}
              onChange={setHour}
            />
            <Button
              onPress={() => {
                setPeriod("all");
                setModal("");
              }}
            >
              Voir les disponibilités
            </Button>
          </>
        ) : (
          <>
            {(modal === "change-booking" && booked
              ? coaches.find((c) => c.id === booked.coach)
              : coach) && (
              <Row wrap>
                {market
                  .times(
                    (modal === "change-booking" && booked
                      ? coaches.find((c) => c.id === booked.coach)
                      : coach)!,
                    day,
                    modal === "change-booking"
                      ? store.offers.find((o) => o.id === booked?.offerId)
                      : offer,
                  )
                  .map((time) => (
                    <Pressable
                      accessibilityRole="button"
                      key={time}
                      style={styles.slot}
                      onPress={() =>
                        run(async () => {
                          if (modal === "booking-date" && draft) {
                            setDraft({ ...draft, day, time });
                            setModal("");
                            return;
                          }
                          if (!booked) return;
                          if (live) {
                            const target = market.remoteSlots.find(
                              (s) =>
                                s.offer_id === booked.offerId &&
                                s.day === day &&
                                s.time === time,
                            );
                            if (!target)
                              throw Error("Ce créneau n’est plus disponible.");
                            const { error } = await supabase.rpc(
                              "change_booking",
                              { p_booking: booked.id, p_target: target.id },
                            );
                            if (error) throw error;
                            await market.refresh();
                          } else {
                            setStore(W.reschedule(store, booked.id, day, time));
                          }
                          setModal("");
                          setNotice(
                            "Séance modifiée. Le coach a reçu une notification.",
                          );
                        })
                      }
                    >
                      <P style={{ fontFamily: t.medium }}>{time}</P>
                    </Pressable>
                  ))}
              </Row>
            )}
            <P small muted style={{ marginTop: 16 }}>
              Choisissez une heure disponible. Si aucun horaire n’apparaît,
              essayez une autre date.
            </P>
          </>
        )}
      </>
    );
  if (modal === "sort")
    modalBody = (
      <>
        {[
          ["recommended", "Pour vous"],
          ["distance", "Les plus proches"],
          ["price", "Prix croissant"],
          ["rating", "Les mieux notés"],
        ].map(([id, title]) => (
          <Choice
            key={id}
            title={title}
            active={sort === id}
            onPress={() => {
              setSort(id);
              setModal("");
            }}
          />
        ))}
      </>
    );
  if (modal === "sports")
    modalBody = (
      <>
        {Object.keys(reference.sportGoals).map((sportName) => (
          <Choice
            key={sportName}
            title={sportName}
            active={sport === sportName}
            onPress={() => {
              setSport(sportName);
              setModal("");
            }}
          />
        ))}
      </>
    );
  if (modal === "compare")
    modalBody = (
      <Row style={{ alignItems: "flex-start", gap: 12 }}>
        {comparison.map((id) => {
          const c = coaches.find((c) => c.id === id)!;
          return (
            <View key={id} style={{ flex: 1 }}>
              <Photo
                uri={c.photoUri}
                index={c.photo}
                height={106}
                style={{ borderRadius: 8 }}
              />
              <H2 style={{ fontSize: 18, marginVertical: 12 }}>{c.name}</H2>
              <P small>{c.sport}</P>
              <Rule />
              <P bold>{euro(c.price)}</P>
              <P small muted>
                {c.dist !== null ? `${c.dist} km` : c.area}
              </P>
              {c.rating && (
                <P small>
                  ★ {c.rating} · {c.reviews} avis
                </P>
              )}
              <Rule />
              <P small>{c.formats.join(" · ")}</P>
              <View style={{ marginTop: 16 }}>
                <Button onPress={() => openProfile(c)}>Voir le profil</Button>
              </View>
            </View>
          );
        })}
      </Row>
    );
  if (modal === "reviews")
    modalBody = (
      <>
        <H2>
          ★ {coach?.rating} · {coach?.reviews} avis
        </H2>
        <P small muted style={{ marginTop: 14 }}>
          Les avis de démonstration sont disponibles dans le mode local. Le
          détail connecté nécessite le parcours après-séance.
        </P>
      </>
    );
  if (modal === "cancel")
    modalBody = (
      <>
        <P>Votre séance sera annulée et les places seront libérées.</P>
        <Note style={{ marginVertical: 20 }}>
          {live
            ? "Aucun paiement n’a été encaissé."
            : "Le remboursement est simulé. Aucun mouvement bancaire réel."}
        </Note>
        <Button
          disabled={busy}
          onPress={() =>
            run(async () => {
              if (!booked) return;
              if (live) await market.cancelBooking(booked.id);
              else
                setStore(
                  W.cancelSession(store, booked.id, "Annulation par le client"),
                );
              setModal("");
              setNotice("Votre séance a été annulée. Le coach est prévenu.");
            })
          }
        >
          Confirmer l’annulation
        </Button>
        <TextButton onPress={() => setModal("")}>Garder ma séance</TextButton>
      </>
    );
  if (modal === "address")
    modalBody = (
      <>
        <H2>{booked?.address}</H2>
        <Button
          light
          style={{ marginTop: 24 }}
          onPress={() =>
            Linking.openURL(
              `https://www.openstreetmap.org/search?query=${encodeURIComponent(booked?.address ?? "")}`,
            )
          }
        >
          Ouvrir la carte
        </Button>
      </>
    );
  if (modal === "booking-info")
    modalBody = (
      <>
        <P>{booked?.serviceName}</P>
        <P muted>
          {booked?.duration} min · {booked?.seats} participant(s)
        </P>
        <P style={{ marginTop: 16 }}>Total : {euro(booked?.price ?? 0)}</P>
      </>
    );
  if (modal === "account-settings")
    modalBody = (
      <>
        <Field label="Votre prénom et nom" value={name} onChange={setName} />
        <P muted style={{ marginBottom: 18 }}>
          {store.account?.email ?? "Mode invité"}
        </P>
        <Button
          onPress={() =>
            run(async () => {
              if (!store.account) {
                setModal("");
                go("login");
                return;
              }
              if (!name.trim()) throw Error("Indiquez votre nom.");
              if (live) {
                const { error } = await supabase
                  .from("profiles")
                  .update({ full_name: name.trim() })
                  .eq("id", store.account.id);
                if (error) throw error;
                await market.refresh();
              } else
                setStore((s) => ({
                  ...s,
                  account: s.account
                    ? { ...s.account, name: name.trim() }
                    : null,
                }));
              setModal("");
              setNotice("Votre compte a été mis à jour.");
            })
          }
        >
          Enregistrer
        </Button>
      </>
    );
  if (modal === "trust")
    modalBody = (
      <>
        <H2>Rencontrer un coach en confiance.</H2>
        <P style={{ marginTop: 16 }}>
          Identité, qualifications et avis accompagnent votre choix.
        </P>
        <Note style={{ marginTop: 20 }}>
          Dans le prototype, profils, vérifications et avis sont fictifs. Aucun
          badge réel n’est attribué automatiquement à un compte Supabase.
        </Note>
      </>
    );
  if (modal === "help")
    modalBody = (
      <>
        <H2>Un imprévu ?</H2>
        <P style={{ marginTop: 16 }}>
          Retrouvez votre réservation dans « Séances » pour contacter le coach,
          modifier votre créneau ou consulter les conditions d’annulation.
        </P>
        <Button style={{ marginTop: 24 }} onPress={() => go("bookings")}>
          Mes séances
        </Button>
      </>
    );
  if (modal === "about")
    modalBody = (
      <>
        <P>
          Le prototype HTML validé est la référence de cette application React
          Native.
        </P>
        <P muted style={{ marginTop: 16 }}>
          {live
            ? "Données partagées Supabase. Paiement et communications externes non connectés."
            : "Comptes, paiements, avis et vérifications fictifs. Données conservées sur cet appareil uniquement."}
        </P>
        <Button
          light
          style={{ marginTop: 24 }}
          onPress={() =>
            Linking.openURL("http://127.0.0.1:8766/partant.html?version=a1-a9")
          }
        >
          Voir la référence validée
        </Button>
        {!live && (
          <TextButton
            onPress={() => {
              setStore(initialStore);
              setScreen("welcome");
              setModal("");
            }}
          >
            Réinitialiser la démo
          </TextButton>
        )}
      </>
    );
  if (modal === "checklist")
    modalBody = (
      <>
        <H1>Faisons place{"\n"}à vos prochains clients.</H1>
        <P muted style={{ marginTop: 16 }}>
          Avancez à votre rythme : tout est enregistré.
        </P>
        {[
          ["profile", "Présentez-vous"],
          ["offers", "Créez votre offre"],
          ["places", "Choisissez vos lieux"],
          ["schedule", "Ouvrez votre planning"],
          ["documents", "Vérifiez votre profil"],
          ["payout", "Activez vos versements"],
        ].map(([id, title], i) => (
          <Setting
            key={id}
            title={`${i + 1} · ${title}`}
            onPress={() => {
              setConfig(id);
              go("config");
            }}
          />
        ))}
      </>
    );
  const flowProps = {
    store,
    setStore,
    coachId,
    bookingId: selectedBooking,
    focus,
    go,
    message: setNotice,
    selectBooking: setSelectedBooking,
    openCoach: (id: string) => {
      const c = coaches.find((c) => c.id === id);
      if (c) openProfile(c);
    },
    choose: (c: Coach, d: string, time: string, o: Offer) => {
      setDay(d);
      chooseTime(c, time, o, d);
    },
  };
  const nativeScreens = [
    "tools",
    "accounts",
    "account-native",
    "client-native",
    "repeat-native",
    "review-native",
    "reviews-native",
    "new-alert",
    "alerts-native",
    "support-native",
    "report-native",
    "team",
    "group-manage",
    "group-details-native",
    "partial-native",
    "transfer-native",
    "proposal-create",
    "proposal-native",
    "checklist-native",
  ];
  if (!live && nativeScreens.includes(screen)) {
    content = (
      <Section>
        <CompleteFlows {...flowProps} screen={screen} />
      </Section>
    );
    barTitle[screen] = (
      {
        tools: "Simulation Partant",
        accounts: "Comptes de démonstration",
        "account-native": "Mon compte",
        "client-native": "Fiche client",
        "repeat-native": "Garder le rythme",
        "review-native": "Votre avis",
        "reviews-native": "Avis clients",
        "new-alert": "Créer une alerte",
        "alerts-native": "Mes alertes",
        "support-native": "Mes demandes",
        "report-native": "Assistance",
        team: "Équipe Partant · démo",
        "group-manage": "Gérer mon cours",
        "group-details-native": "Un moment à plusieurs",
        "partial-native": "Annuler certaines places",
        "transfer-native": "Changer de cours",
        "proposal-create": "Proposer un changement",
        "proposal-native": "Changement proposé",
        "checklist-native": "Mise en ligne",
      } as Record<string, string>
    )[screen];
  }
  if (!live && screen === "config" && config !== "groups")
    content = (
      <Section>
        <CoachConfiguration {...flowProps} section={config} />
      </Section>
    );
  if (!live && screen === "setup" && draft?.kind === "Groupe" && offer) {
    const g = store.groups?.find(
        (g) =>
          g.offer.id === draft.offerId &&
          g.day === draft.day &&
          g.time === draft.time,
      ),
      left = remaining(g?.offer ?? offer, draft.day, draft.time, store);
    barTitle.setup = "Vos places";
    content = (
      <Section>
        <H1>À plusieurs,{"\n"}à votre rythme.</H1>
        <Note style={{ marginVertical: 24 }}>
          <H2>{draft.serviceName}</H2>
          <P>
            {dayLabel(draft.day)} · {draft.time} · {draft.duration} min{"\n"}
            {draft.address}
          </P>
        </Note>
        <Select
          label="Combien de participants ?"
          value={String(draft.seats)}
          items={Array.from({ length: left }, (_, i) => [
            String(i + 1),
            `${i + 1} personne${i ? "s" : ""}`,
          ])}
          onChange={(v) =>
            setDraft({
              ...draft,
              seats: Number(v),
              price: (g?.offer.price ?? offer.price) * Number(v),
            })
          }
        />
        <P small muted>
          Vous réservez pour vous et vos accompagnants. Vous êtes le contact de
          cette réservation.
        </P>
        <View style={{ marginVertical: 20 }}>
          <Field
            label="Un objectif ou une précision facultative"
            value={draft.goal}
            onChange={(goal) => setDraft({ ...draft, goal })}
            multiline
          />
        </View>
        <Row between>
          <P>Prix par personne</P>
          <P bold>{euro(g?.offer.price ?? offer.price)}</P>
        </Row>
        <Row between>
          <H2>Total</H2>
          <H2>{euro(draft.price)}</H2>
        </Row>
        <Note style={{ marginTop: 20 }}>
          {left} places encore disponibles. Les places sont attribuées à la
          confirmation du paiement simulé.
        </Note>
      </Section>
    );
  }
  if (!live && screen === "bookingDetail" && booked)
    content = (
      <>
        {content}
        <Section>
          <BookingExtras {...flowProps} />
        </Section>
      </>
    );
  if (!live && screen === "profile" && coach)
    content = (
      <>
        {content}
        <Section>
          <Button light onPress={() => go("new-alert", coach.id)}>
            Suivre ses disponibilités
          </Button>
          <TextButton onPress={() => go("reviews-native", coach.id)}>
            Voir les avis et réponses
          </TextButton>
          <TextButton onPress={() => go("report-native", "coach:" + coach.id)}>
            Signaler ce profil
          </TextButton>
        </Section>
      </>
    );
  if (!live && ["account", "bookings"].includes(screen)) {
    const attempts =
      store.attempts?.filter(
        (p) => p.owner === store.account?.id && p.status !== "success",
      ) ?? [];
    if (attempts.length)
      content = (
        <>
          {content}
          <Section>
            <H2>Séances à confirmer</H2>
            {attempts
              .slice(-3)
              .reverse()
              .map((p) => (
                <Setting
                  key={p.id}
                  title={`${dayLabel(p.draft.day, true)} · ${p.draft.time}`}
                  description={`${euro(p.draft.price)} · aucun débit`}
                  onPress={() => {
                    setDraft(p.draft);
                    setAttemptId(p.id);
                    setPaymentMethod(p.method);
                    go("payment");
                  }}
                />
              ))}
          </Section>
        </>
      );
  }
  if (!live && screen === "welcome")
    content = (
      <>
        {content}
        <Section>
          <TextButton onPress={() => go("tools")}>
            À propos de la simulation
          </TextButton>
        </Section>
      </>
    );
  if (!live && screen === "explore")
    content = (
      <>
        {content}
        <Section>
          <TextButton onPress={() => go("new-alert")}>
            M’alerter de nouvelles disponibilités
          </TextButton>
        </Section>
      </>
    );
  const body = (
    <View
      style={[
        styles.device,
        desktop
          ? {
              width: pageWidth,
              height: Math.min(900, height - 60),
              minHeight: height > 690 ? 610 : 0,
              borderRadius: 30,
            }
          : { flex: 1, width: "100%" },
      ]}
    >
      {desktop && (
        <Row
          between
          style={{
            height: 44,
            backgroundColor: t.ink,
            paddingHorizontal: 24,
            paddingTop: 8,
          }}
        >
          <P
            small
            style={{ color: "#fff", fontFamily: t.medium, fontSize: 12 }}
          >
            9:41
          </P>
          <P small style={{ color: "#fff", fontSize: 12 }}>
            ▮▮▮ ◒ ▰
          </P>
        </Row>
      )}
      {barTitle[screen] && (
        <Pagebar
          title={barTitle[screen]}
          onBack={back}
          right={
            screen === "profile" && coach ? (
              <IconButton
                name="heart"
                filled={store.favorites.includes(coach.id)}
                label="Ajouter ou retirer des favoris"
                onPress={() => favorite(coach.id)}
              />
            ) : undefined
          }
        />
      )}
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {market.ready ? content : <ActivityIndicator style={{ margin: 50 }} />}
      </ScrollView>
      {sticky}
      {(bottom || coachBottom) && (
        <View style={styles.bottomNav}>
          {(coachBottom ? coachTabs : navItems).map(([id, icon, title]) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{
                selected: coachBottom
                  ? screen === "coach" && coachTab === id
                  : screen === id,
              }}
              key={id}
              onPress={() => {
                if (coachBottom) {
                  setCoachTab(id);
                  if (screen !== "coach") go("coach");
                } else go(id);
              }}
              style={styles.navItem}
            >
              <Icon
                name={icon}
                color={
                  (
                    coachBottom
                      ? screen === "coach" && coachTab === id
                      : screen === id
                  )
                    ? t.ink
                    : t.muted
                }
              />
              <P
                style={{
                  fontSize: 12,
                  lineHeight: 17,
                  color: (
                    coachBottom
                      ? screen === "coach" && coachTab === id
                      : screen === id
                  )
                    ? t.ink
                    : t.muted,
                  fontFamily: (
                    coachBottom
                      ? screen === "coach" && coachTab === id
                      : screen === id
                  )
                    ? t.bold
                    : t.font,
                }}
              >
                {title}
              </P>
            </Pressable>
          ))}
        </View>
      )}
      {!!notice && (
        <View pointerEvents="none" style={styles.toast}>
          <P style={{ fontSize: 14, color: "#fff" }}>{notice}</P>
        </View>
      )}
      {busy && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: 8,
            backgroundColor: "#fff",
            borderRadius: 20,
          }}
        >
          <ActivityIndicator color={t.ink} />
        </View>
      )}
    </View>
  );
  return (
    <SafeAreaView
      edges={desktop ? [] : ["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: desktop
          ? t.desktop
          : ["welcome", "explore", "coach"].includes(screen)
            ? t.ink
            : "#fff",
      }}
    >
      <StatusBar
        style={
          !desktop && ["welcome", "explore", "coach"].includes(screen)
            ? "light"
            : "dark"
        }
      />
      {desktop ? (
        <View style={styles.desktop}>
          <View style={{ maxWidth: width > 900 ? 380 : 280, flex: 1 }}>
            <View style={{ marginBottom: height > 690 ? 68 : 30 }}>
              <Wordmark />
            </View>
            <Eyebrow>LE SPORT, À PORTÉE DE SÉANCE.</Eyebrow>
            <H1
              style={{
                fontSize: width > 900 ? 58 : 48,
                lineHeight: width > 900 ? 59.16 : 49,
                letterSpacing: -3,
                marginTop: 16,
                marginBottom: 24,
              }}
            >
              Le bon coach.{"\n"}Le bon{"\n"}moment.
            </H1>
            <P muted style={{ maxWidth: 300 }}>
              Des personnes qui vous font avancer. Des créneaux qui vous vont.
            </P>
            <View style={{ marginTop: 36 }}>
              <TextButton
                style={{ alignItems: "flex-start" }}
                onPress={() =>
                  Linking.openURL(
                    "http://127.0.0.1:8766/partant.html?version=a1-a9",
                  )
                }
              >
                Prototype de référence ↗
              </TextButton>
              <TextButton
                style={{ alignItems: "flex-start" }}
                onPress={() => {
                  if (Platform.OS === "web")
                    window.location.assign(
                      live ? "/?data=preview" : "/?data=connected",
                    );
                }}
              >
                {live
                  ? "Voir les profils de démonstration"
                  : "Tester les données Supabase"}{" "}
                ↗
              </TextButton>
              <P small muted style={{ marginTop: 20, fontSize: 12 }}>
                React Native ·{" "}
                {live ? "données partagées" : "démonstration locale"}
                {"\n"}Paiements et intégrations externes non activés.
              </P>
            </View>
          </View>
          {body}
        </View>
      ) : (
        body
      )}
      <Dialog
        title={modalTitles[modal] ?? ""}
        open={!!modal}
        onClose={() => setModal("")}
      >
        {modalBody}
      </Dialog>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 76,
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  device: {
    backgroundColor: "#fff",
    overflow: "hidden",
    flexDirection: "column",
  },
  entryHero: {
    backgroundColor: t.ink,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 34,
    overflow: "hidden",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    minHeight: 300,
  },
  top: { backgroundColor: t.ink, paddingHorizontal: 24, paddingBottom: 32 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingTop: 9,
    paddingHorizontal: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  navItem: {
    minWidth: 65,
    minHeight: 46,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 28,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderColor: t.border,
  },
  photoBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slot: {
    backgroundColor: "#f1f1f1",
    borderRadius: 7,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: t.fog,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 5,
  },
  dateButton: {
    borderRadius: 10,
    minWidth: 50,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 6,
    backgroundColor: t.fog,
  },
  empty: {
    paddingVertical: 44,
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
  },
  sticky: {
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  toast: {
    position: "absolute",
    bottom: 92,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: t.ink,
    borderRadius: 12,
    zIndex: 30,
  },
});
