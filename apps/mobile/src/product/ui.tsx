import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SvgXml } from "react-native-svg";
import reference from "../reference/prototype.json";
import { tokens as t } from "./tokens";
export function Icon({
  name,
  size = 22,
  color = t.ink,
  filled = false,
}: {
  name: string;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const body = (
    (reference.icons as Record<string, string>)[name] ?? reference.icons.all
  )
    .replace(/var\(--sport-surface\)/g, "#fff")
    .replace(/currentColor/g, color);
  return (
    <SvgXml
      width={size}
      height={size}
      xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? color : "none"}" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`}
    />
  );
}
export function P({
  children,
  muted = false,
  small = false,
  bold = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
  bold?: boolean;
  style?: TextStyle | TextStyle[];
}) {
  return (
    <Text
      style={[
        s.text,
        muted && { color: t.muted },
        small && { fontSize: 13, lineHeight: 18.2 },
        bold && { fontFamily: t.bold },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function H1({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <Text accessibilityRole="header" style={[s.h1, style]}>
      {children}
    </Text>
  );
}
export function H2({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <Text accessibilityRole="header" style={[s.h2, style]}>
      {children}
    </Text>
  );
}
export function Wordmark({
  coach = false,
  light = false,
}: {
  coach?: boolean;
  light?: boolean;
}) {
  return (
    <Text style={[s.wordmark, light && { color: "#fff" }]}>
      partant
      {coach && (
        <Text
          style={{
            fontFamily: t.font,
            fontSize: 12,
            letterSpacing: 0.3,
            color: "#bdbdbd",
          }}
        >
          {" "}
          coach
        </Text>
      )}
    </Text>
  );
}
export function Eyebrow({
  children,
  light = false,
  style,
}: {
  children: React.ReactNode;
  light?: boolean;
  style?: TextStyle;
}) {
  return (
    <Text style={[s.eyebrow, light && { color: "#bdbdbd" }, style]}>
      {children}
    </Text>
  );
}
export function Row({
  children,
  between = false,
  wrap = false,
  style,
}: {
  children: React.ReactNode;
  between?: boolean;
  wrap?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        s.row,
        between && { justifyContent: "space-between" },
        wrap && { flexWrap: "wrap" },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Section({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { width } = useWindowDimensions();
  return (
    <View style={[{ padding: width <= 740 ? 22 : 24 }, style]}>{children}</View>
  );
}
export function Button({
  children,
  onPress,
  light = false,
  white = false,
  disabled = false,
  icon,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  light?: boolean;
  white?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        light && { backgroundColor: t.fog },
        white && { backgroundColor: "#fff" },
        style,
        (disabled || pressed) && { opacity: disabled ? 0.35 : 0.8 },
      ]}
    >
      <Text style={[s.buttonText, (light || white) && { color: t.ink }]}>
        {children}
      </Text>
      {icon && (
        <Icon name={icon} size={17} color={light || white ? t.ink : "#fff"} />
      )}
    </Pressable>
  );
}
export function TextButton({
  children,
  onPress,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  muted?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        { minHeight: 44, justifyContent: "center", alignItems: "center" },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: t.medium,
          fontSize: 14,
          textDecorationLine: "underline",
          color: muted ? t.muted : t.ink,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  light = false,
  white = false,
  color = t.ink,
  filled = false,
}: {
  name: string;
  onPress: () => void;
  label: string;
  light?: boolean;
  white?: boolean;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      style={[
        s.iconButton,
        light && { backgroundColor: t.fog },
        white && { backgroundColor: "#fff" },
      ]}
    >
      <Icon name={name} color={color} filled={filled} />
    </Pressable>
  );
}
export function Chip({
  children,
  onPress,
  active = false,
  dark = false,
  icon,
}: {
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  dark?: boolean;
  icon?: string;
}) {
  const color = dark ? (active ? t.ink : "#dedede") : active ? "#fff" : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      aria-pressed={active}
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: dark
            ? active
              ? "#fff"
              : "#303030"
            : active
              ? t.ink
              : t.fog,
        },
      ]}
    >
      {icon && <Icon name={icon} size={17} color={color} />}
      <Text style={{ fontFamily: t.medium, fontSize: 14, color }}>
        {children}
      </Text>
    </Pressable>
  );
}
export function Choice({
  title,
  description,
  active,
  onPress,
  price,
}: {
  title: string;
  description?: string;
  active: boolean;
  onPress: () => void;
  price?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      aria-checked={active}
      onPress={onPress}
      style={[s.choice, active && { backgroundColor: t.ink }]}
    >
      <View style={[s.radio, { borderColor: active ? "#fff" : t.ink }]}>
        {active && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#fff",
            }}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <P bold style={{ color: active ? "#fff" : t.ink }}>
          {title}
        </P>
        {description && (
          <P small style={{ color: active ? "#ccc" : t.muted, marginTop: 4 }}>
            {description}
          </P>
        )}
      </View>
      {price && (
        <P bold style={{ color: active ? "#fff" : t.ink }}>
          {price}
        </P>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  numeric = false,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 8, marginBottom: 18 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={
          numeric
            ? "numeric"
            : label.toLowerCase().includes("mail")
              ? "email-address"
              : "default"
        }
        autoCapitalize={
          label.toLowerCase().includes("mail") ? "none" : "sentences"
        }
        style={[
          s.input,
          multiline && { minHeight: 100, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Select({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: (string | [string, string])[];
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const opts = items.map((i) => (typeof i === "string" ? [i, i] : i));
  return (
    <>
      <View style={{ gap: 8, marginBottom: 18 }}>
        <Text style={s.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} : ${opts.find((o) => o[0] === value)?.[1] ?? value}`}
          onPress={() => setOpen(true)}
          style={s.select}
        >
          <P style={{ fontSize: 14, flex: 1 }}>
            {opts.find((o) => o[0] === value)?.[1] ?? value}
          </P>
          <Icon name="down" size={17} />
        </Pressable>
      </View>
      <Dialog title={label} open={open} onClose={() => setOpen(false)}>
        {opts.map(([key, text]) => (
          <Choice
            key={key}
            title={text}
            active={value === key}
            onPress={() => {
              onChange(key);
              setOpen(false);
            }}
          />
        ))}
      </Dialog>
    </>
  );
}
export function Photo({
  index,
  uri,
  height,
  style,
  children,
  label = "Portrait de coach",
}: {
  index: number | null;
  uri?: string;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  label?: string;
}) {
  const [width, setWidth] = useState(0);
  const [actualHeight, setHeight] = useState(height ?? 0);
  const tileW = Math.max(width, 1.5 * actualHeight);
  const tileH = tileW / 1.5;
  return (
    <View
      accessible
      accessibilityLabel={label}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        setHeight(e.nativeEvent.layout.height);
      }}
      style={[{ height, overflow: "hidden", backgroundColor: "#ddd" }, style]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : index !== null && width > 0 ? (
        <Image
          source={require("../../assets/coaches.png")}
          accessibilityIgnoresInvertColors
          style={{
            position: "absolute",
            width: tileW * 2,
            height: tileH * 3,
            left: (width - tileW) / 2 - (index % 2) * tileW,
            top: -Math.floor(index / 2) * tileH,
          }}
        />
      ) : (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="user" size={40} />
        </View>
      )}
      {children}
    </View>
  );
}
export function Pagebar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.pagebar}>
      <IconButton name="back" onPress={onBack} label="Retour" />
      <Text style={{ fontFamily: t.bold, fontSize: 15, color: t.ink }}>
        {title}
      </Text>
      <View style={{ minWidth: 44 }}>{right}</View>
    </View>
  );
}
export function Note({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[s.note, style]}>
      {typeof children === "string" ? (
        <P style={{ fontSize: 14, lineHeight: 21 }}>{children}</P>
      ) : (
        children
      )}
    </View>
  );
}
export function Setting({
  title,
  description,
  icon,
  onPress,
  right,
}: {
  title: string;
  description?: string;
  icon?: string;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={s.setting}
    >
      <Row style={{ flex: 1 }}>
        {icon && <Icon name={icon} />}
        <View style={{ flex: 1 }}>
          <P bold>{title}</P>
          {description && (
            <P small muted style={{ marginTop: 4 }}>
              {description}
            </P>
          )}
        </View>
      </Row>
      {right ?? <Icon name="chevron" />}
    </Pressable>
  );
}
export function Rule() {
  return (
    <View
      style={{ height: 1, backgroundColor: t.border, marginVertical: 24 }}
    />
  );
}
export function Dialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#0008",
          justifyContent: width > 740 ? "center" : "flex-end",
          alignItems: "center",
          padding: 12,
        }}
      >
        <Pressable
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            width: "100%",
            maxWidth: width > 740 ? 410 : 480,
            maxHeight: height * 0.85,
            overflow: "hidden",
          }}
        >
          <Row
            between
            style={{
              paddingLeft: 24,
              paddingRight: 14,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            <H2 style={{ flex: 1 }}>{title}</H2>
            <IconButton name="close" onPress={onClose} label="Fermer" />
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 12 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  text: { fontFamily: t.font, fontSize: 16, lineHeight: 24, color: t.ink },
  h1: {
    fontFamily: t.bold,
    fontSize: 28,
    lineHeight: 31.64,
    letterSpacing: -0.9,
    color: t.ink,
  },
  h2: {
    fontFamily: t.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
    color: t.ink,
  },
  wordmark: {
    fontFamily: t.bold,
    fontSize: 24,
    letterSpacing: -1.15,
    color: t.ink,
  },
  eyebrow: {
    fontFamily: t.medium,
    fontSize: 12,
    letterSpacing: 1.8,
    color: t.muted,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: {
    minHeight: 50,
    borderRadius: 99,
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: t.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: { fontFamily: t.medium, fontSize: 16, color: "#fff" },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  choice: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: t.fog,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: t.medium, fontSize: 14, color: t.ink },
  input: {
    backgroundColor: t.fog,
    borderRadius: 9,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: t.font,
    fontSize: 16,
    color: t.ink,
  },
  select: {
    backgroundColor: t.fog,
    borderRadius: 9,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pagebar: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  note: { padding: 16, borderRadius: 14, backgroundColor: t.fog },
  setting: {
    minHeight: 64,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
});
