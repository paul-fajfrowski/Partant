import React from "react";
import { View } from "react-native";
import { Eyebrow, H1, P, Photo } from "../ui";
import { tokens as t } from "../tokens";
export function DesktopEntry({
  children,
  coach,
}: {
  children: React.ReactNode;
  coach: boolean;
}) {
  return (
    <View
      style={{ flexDirection: "row", flex: 1, minHeight: 620 }}
      testID="desktop-entry"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: t.ink,
          padding: 36,
          justifyContent: "space-between",
          minWidth: 280,
        }}
      >
        <View>
          <Eyebrow style={{ color: "#c6c6c6" }}>
            LE SPORT, À PORTÉE DE SÉANCE.
          </Eyebrow>
          <H1
            style={{
              color: "#fff",
              fontSize: 46,
              lineHeight: 49,
              letterSpacing: -2,
              marginTop: 28,
            }}
          >
            {coach
              ? "Votre savoir-faire.\nLeur prochain pas."
              : "Le bon coach.\nLe bon moment."}
          </H1>
          <P style={{ color: "#c6c6c6", marginTop: 22, maxWidth: 390 }}>
            {coach
              ? "Des disponibilités choisies. Des clients qui vous correspondent. Du temps pour votre métier."
              : "Des personnes qui vous font avancer. Des créneaux qui vous vont. Trouvez votre rythme, près de chez vous."}
          </P>
        </View>
        <Photo
          index={coach ? 0 : 1}
          height={280}
          style={{ marginTop: 36, borderRadius: 20 }}
          label="Le coaching, une rencontre humaine"
        />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 380,
          maxWidth: 630,
          padding: 20,
          alignSelf: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
