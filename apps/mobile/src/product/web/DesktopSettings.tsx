import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Eyebrow, H1, H2, P, Row, Button, Icon, TextButton } from "../ui";
import { tokens as t } from "../tokens";

const groups = [
  {
    title: "Votre offre",
    description: "Ce que vos futurs clients découvrent.",
    items: [
      [
        "profile",
        "Profil & présentation",
        "Votre parcours, votre approche, vos photos",
        "user",
      ],
      [
        "offers",
        "Séances & tarifs",
        "Individuel, duo et cours en groupe",
        "wallet",
      ],
      [
        "places",
        "Lieux & déplacements",
        "Adresses, formats et zones d’intervention",
        "pin",
      ],
    ],
  },
  {
    title: "Votre organisation",
    description: "Votre temps, selon vos propres règles.",
    items: [
      ["schedule", "Disponibilités", "Votre semaine, vos horaires", "calendar"],
      [
        "rules",
        "Réservations & annulations",
        "Délais et conditions de vos séances",
        "clock",
      ],
      [
        "calendars",
        "Agendas connectés",
        "Vos calendriers au même endroit",
        "calendar",
      ],
      [
        "preparation",
        "Préparer vos clients",
        "Matériel, accès et consignes",
        "check",
      ],
    ],
  },
  {
    title: "Votre compte professionnel",
    description: "Les essentiels pour exercer sur Partant.",
    items: [
      [
        "documents",
        "Documents & vérifications",
        "Vos pratiques et leurs justificatifs",
        "shield",
      ],
      [
        "payout",
        "Paiements & versements",
        "Le suivi de vos encaissements",
        "wallet",
      ],
      [
        "notifications",
        "Préférences de notification",
        "Choisir les alertes utiles",
        "filter",
      ],
    ],
  },
];
const related: Record<string, string> = {
  dates: "schedule",
  blocks: "schedule",
  groups: "offers",
};
function Item({
  item,
  selected,
  onPress,
  disabled,
  compact = false,
}: {
  item: string[];
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item[1]}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      testID={`desktop-setting-${item[0]}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.item,
        compact && s.compact,
        selected && s.selected,
        pressed && { opacity: 0.65 },
      ]}
    >
      {!compact && <Icon name={item[3]} size={22} />}
      <View style={{ flex: 1 }}>
        <P
          bold
          style={{
            fontSize: compact ? 13 : 15,
            color: selected ? "#fff" : t.ink,
          }}
        >
          {item[1]}
        </P>
        {!compact && (
          <P muted small style={{ marginTop: 4 }}>
            {item[2]}
          </P>
        )}
      </View>
      {!compact && <Icon name="chevron" size={17} />}
    </Pressable>
  );
}
export function DesktopSettings({
  published,
  onSelect,
  onChecklist,
  onPreview,
  onPrivacy,
  onPublication,
  disabled,
}: {
  published: boolean;
  onSelect: (id: string) => void;
  onChecklist: () => void;
  onPreview: () => void;
  onPrivacy: () => void;
  onPublication: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={s.page} testID="desktop-settings">
      <Row between wrap style={{ marginBottom: 28 }}>
        <View>
          <Eyebrow>VOTRE ACTIVITÉ</Eyebrow>
          <H1 style={{ marginTop: 10 }}>Tout, à votre façon.</H1>
        </View>
        <Button light onPress={onPreview}>
          Voir mon profil
        </Button>
      </Row>
      <Row between wrap style={s.status}>
        <View style={{ flex: 1, minWidth: 250 }}>
          <H2>
            {published
              ? "Votre profil est en ligne"
              : "Votre profil est en pause"}
          </H2>
          <P muted small style={{ marginTop: 5 }}>
            {published
              ? "Vos offres et disponibilités sont visibles des clients."
              : "Préparez votre offre et complétez les étapes de mise en ligne."}
          </P>
        </View>
        <Button onPress={onChecklist}>Gérer ma mise en ligne</Button>
      </Row>
      {published && (
        <TextButton
          style={{ alignSelf: "flex-start", marginTop: 10 }}
          onPress={() => {
            if (!disabled) onPublication();
          }}
        >
          Mettre mon profil en pause
        </TextButton>
      )}
      <View style={s.grid}>
        {groups.map((group) => (
          <View key={group.title} style={s.group}>
            <H2>{group.title}</H2>
            <P small muted style={{ marginTop: 6, marginBottom: 18 }}>
              {group.description}
            </P>
            {group.items.map((item) => (
              <Item
                key={item[0]}
                item={item}
                onPress={() => onSelect(item[0])}
              />
            ))}
          </View>
        ))}
      </View>
      <TextButton
        style={{ alignSelf: "flex-start", marginTop: 24 }}
        onPress={onPrivacy}
      >
        Confidentialité & données personnelles
      </TextButton>
    </View>
  );
}
export function DesktopSettingsLayout({
  current,
  onSelect,
  disabled,
  children,
}: {
  current: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.layout} testID="desktop-settings-layout">
      <View
        style={s.menu}
        accessibilityLabel="Rubriques des réglages"
        role="navigation"
      >
        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 20 }}>
            <Eyebrow
              style={{ marginHorizontal: 12, marginBottom: 8, fontSize: 9 }}
            >
              {group.title.toUpperCase()}
            </Eyebrow>
            {group.items.map((item) => (
              <Item
                compact
                key={item[0]}
                item={item}
                selected={(related[current] ?? current) === item[0]}
                disabled={disabled}
                onPress={() => onSelect(item[0])}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flex: 1, minWidth: 0, maxWidth: 860 }}>{children}</View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { padding: 32 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 32, marginTop: 38 },
  group: { flexGrow: 1, flexBasis: 330, minWidth: 280 },
  item: {
    minHeight: 88,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderColor: t.border,
  },
  compact: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    borderRadius: 24,
    marginBottom: 4,
  },
  selected: { backgroundColor: t.ink },
  status: { padding: 24, backgroundColor: t.fog, borderRadius: 20, gap: 24 },
  layout: { flexDirection: "row", minHeight: 650 },
  menu: {
    width: 226,
    paddingHorizontal: 14,
    paddingVertical: 26,
    borderRightWidth: 1,
    borderColor: t.border,
  },
});
