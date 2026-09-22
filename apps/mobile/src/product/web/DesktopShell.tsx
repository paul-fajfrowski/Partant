import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { tokens as t } from "../tokens";
import { Icon, Wordmark } from "../ui";

export const DESKTOP_BREAKPOINT = 1080;

export type DesktopNavItem =
  | "explore"
  | "favorites"
  | "bookings"
  | "agenda"
  | "clients"
  | "activity"
  | "settings"
  | "messages"
  | "notifications"
  | "team"
  | "account"
  | "help";

export type DesktopShellProps = {
  role: "client" | "coach" | "team";
  activeItem?: DesktopNavItem;
  onNavigate: (item: DesktopNavItem) => void;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  userName?: string;
  /** For example “Se connecter” for an unauthenticated visitor. */
  accountLabel?: string;
  /** Counts must already be filtered by the caller's account and permissions. */
  unreadCounts?: { messages?: number; notifications?: number };
  /** Server-provided team permission. Never inferred from the selected role. */
  staff?: boolean;
  navigationDisabled?: boolean;
  contentWidth?: "wide" | "reading" | "form";
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional parent-owned controls, such as the explicitly labelled demo mode. */
  sidebarFooter?: React.ReactNode;
};

type NavEntry = { id: DesktopNavItem; icon: string; label: string };

const clientItems: NavEntry[] = [
  { id: "explore", icon: "search", label: "Explorer" },
  { id: "favorites", icon: "heart", label: "Favoris" },
  { id: "bookings", icon: "calendar", label: "Mes séances" },
];
const coachItems: NavEntry[] = [
  { id: "agenda", icon: "calendar", label: "Agenda" },
  { id: "clients", icon: "user", label: "Clients" },
  { id: "activity", icon: "wallet", label: "Activité" },
  { id: "settings", icon: "filter", label: "Réglages" },
];
const teamItem: NavEntry = {
  id: "team",
  icon: "shield",
  label: "Dossiers coachs",
};
const communicationItems: NavEntry[] = [
  { id: "messages", icon: "message", label: "Messages" },
  { id: "notifications", icon: "bell", label: "Notifications" },
];

function ShellIcon({ name, color }: { name: string; color: string }) {
  // These two glyphs are absent from the archived prototype's icon catalogue.
  if (name !== "bell" && name !== "help")
    return <Icon name={name} size={20} color={color} />;
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {name === "bell" ? (
        <>
          <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3M12 16.5v.01" />
        </>
      )}
    </Svg>
  );
}

function countValue(value?: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value!)) : 0;
}

function NavigationButton({
  item,
  selected,
  count,
  disabled,
  onPress,
  compact = false,
  avatar,
}: {
  item: NavEntry;
  selected: boolean;
  count?: number;
  disabled?: boolean;
  onPress: () => void;
  compact?: boolean;
  avatar?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const unread = countValue(count);
  const color = selected ? t.white : t.ink;
  return (
    <Pressable
      testID={`desktop-nav-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={
        unread
          ? `${item.label}, ${unread} non lu${unread > 1 ? "s" : ""}`
          : item.label
      }
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        s.navButton,
        compact && s.compactButton,
        hovered && !selected && s.hovered,
        selected && s.selected,
        focused && s.focused,
        pressed && s.pressed,
        disabled && s.disabled,
      ]}
    >
      {avatar ? (
        <View style={[s.avatar, selected && s.avatarSelected]}>
          <Text style={[s.initials, { color }]}>{avatar}</Text>
        </View>
      ) : (
        <ShellIcon name={item.icon} color={color} />
      )}
      <Text
        numberOfLines={1}
        style={[s.navLabel, { color }, !compact && s.grow]}
      >
        {item.label}
      </Text>
      {unread > 0 && (
        <View style={[s.badge, selected && s.badgeSelected]}>
          <Text style={[s.badgeText, selected && { color: t.ink }]}>
            {unread > 99 ? "99+" : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Desktop presentation only: the parent owns routing, authentication and scrolling.
 * Mount on web at DESKTOP_BREAKPOINT or above. Content may contain its own ScrollView.
 */
export function DesktopShell({
  role,
  activeItem,
  onNavigate,
  children,
  title,
  subtitle,
  userName,
  accountLabel,
  unreadCounts,
  staff = false,
  navigationDisabled = false,
  contentWidth = "wide",
  contentStyle,
  sidebarFooter,
}: DesktopShellProps) {
  const teamSpace = role === "team" && staff;
  const items = teamSpace
    ? [teamItem]
    : role === "coach"
      ? coachItems
      : clientItems;
  const spaceLabel = teamSpace
    ? "Espace équipe"
    : role === "coach"
      ? "Espace coach"
      : "Votre espace sport";
  const initials = userName
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("fr");
  const renderItem = (item: NavEntry) => (
    <NavigationButton
      key={item.id}
      item={item}
      selected={activeItem === item.id}
      count={
        item.id === "messages" || item.id === "notifications"
          ? unreadCounts?.[item.id]
          : undefined
      }
      disabled={navigationDisabled}
      onPress={() => onNavigate(item.id)}
    />
  );
  return (
    <View style={s.shell} testID="desktop-shell">
      <View
        style={s.sidebar}
        role="navigation"
        accessibilityLabel="Navigation principale"
      >
        <View style={s.brand}>
          <Wordmark />
          <Text style={s.spaceLabel}>{spaceLabel}</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.sidebarScroll}
        >
          <View style={s.navGroup}>{items.map(renderItem)}</View>
          {!teamSpace && (
            <View style={s.communication}>
              <Text style={s.groupLabel}>ÉCHANGES</Text>
              <View style={s.navGroup}>
                {communicationItems.map(renderItem)}
              </View>
            </View>
          )}
          {staff && !teamSpace && (
            <View style={s.communication}>
              <Text style={s.groupLabel}>ÉQUIPE PARTANT</Text>
              {renderItem(teamItem)}
            </View>
          )}
        </ScrollView>
        <View style={s.sidebarFooter}>
          {sidebarFooter}
          <Text style={s.signature}>Le sport, à portée de séance.</Text>
        </View>
      </View>
      <View style={s.workspace}>
        <View style={s.header}>
          <View style={s.heading}>
            <Text accessibilityRole="header" numberOfLines={1} style={s.title}>
              {title}
            </Text>
            {!!subtitle && (
              <Text numberOfLines={1} style={s.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={s.headerActions}>
            <NavigationButton
              compact
              item={{ id: "help", icon: "help", label: "Aide" }}
              selected={activeItem === "help"}
              disabled={navigationDisabled}
              onPress={() => onNavigate("help")}
            />
            <NavigationButton
              compact
              avatar={initials}
              item={{
                id: "account",
                icon: "user",
                label: accountLabel || userName || "Mon compte",
              }}
              selected={activeItem === "account"}
              disabled={navigationDisabled}
              onPress={() => onNavigate("account")}
            />
          </View>
        </View>
        <View style={s.main} role="main" accessibilityLabel={title}>
          <View
            style={[
              s.content,
              contentWidth === "reading" && s.readingContent,
              contentWidth === "form" && s.formContent,
              contentStyle,
            ]}
          >
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    flexDirection: "row",
    backgroundColor: t.white,
  },
  sidebar: {
    width: 248,
    paddingHorizontal: 18,
    borderRightWidth: 1,
    borderRightColor: t.border,
    backgroundColor: "#fafafa",
  },
  brand: { paddingTop: 32, paddingHorizontal: 14, paddingBottom: 40 },
  spaceLabel: {
    fontFamily: t.font,
    fontSize: 13,
    lineHeight: 19,
    color: t.muted,
    marginTop: 7,
  },
  sidebarScroll: { paddingBottom: 24 },
  navGroup: { gap: 6 },
  navButton: {
    minHeight: 46,
    borderRadius: t.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  compactButton: { gap: 9, paddingHorizontal: 12, maxWidth: 225 },
  navLabel: {
    fontFamily: t.medium,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  grow: { flex: 1 },
  hovered: { backgroundColor: "#ededed" },
  selected: { backgroundColor: t.ink },
  focused: { borderColor: "#878787" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: t.pill,
    backgroundColor: t.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSelected: { backgroundColor: t.white },
  badgeText: {
    fontFamily: t.bold,
    color: t.white,
    fontSize: 11,
    lineHeight: 16,
  },
  communication: { marginTop: 32 },
  groupLabel: {
    fontFamily: t.medium,
    color: t.muted,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.3,
    paddingHorizontal: 17,
    marginBottom: 12,
  },
  sidebarFooter: { paddingHorizontal: 14, paddingVertical: 24, gap: 16 },
  signature: {
    fontFamily: t.font,
    fontSize: 12,
    lineHeight: 18,
    color: t.muted,
  },
  workspace: { flex: 1, minWidth: 0, minHeight: 0 },
  header: {
    minHeight: 94,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  heading: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    fontFamily: t.bold,
    color: t.ink,
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: t.font,
    color: t.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaeaea",
  },
  avatarSelected: { backgroundColor: "#3d3d3d" },
  initials: { fontFamily: t.bold, fontSize: 10, lineHeight: 15 },
  main: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  content: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: 1480,
    backgroundColor: t.white,
    borderRadius: 20,
    overflow: "hidden",
  },
  readingContent: { maxWidth: 880 },
  formContent: { maxWidth: 620 },
});
