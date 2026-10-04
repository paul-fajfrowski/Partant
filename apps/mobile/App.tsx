import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ProductApp from "./src/product/ProductApp";
import { runtimeMode } from "./src/runtimeMode";
import ConnectedPilot from "./src/ConnectedPilot";
export default function App() {
  const [loaded, error] = useFonts({
    Hanken: require("./assets/hanken.ttf"),
    HankenMedium: require("./assets/hanken-600.ttf"),
    HankenBold: require("./assets/hanken-800.ttf"),
  });
  React.useEffect(() => {
    if (Platform.OS === "web") document.documentElement.lang = "fr";
  }, []);
  if (error) throw error;
  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator color="#141414" />
      </View>
    );
  const params =
    Platform.OS === "web" ? new URLSearchParams(window.location.search) : null;
  const mode = runtimeMode(process.env.EXPO_PUBLIC_RELEASE_CHANNEL === "production", Platform.OS,
    params?.get("data"), process.env.EXPO_PUBLIC_DATA_MODE, params?.get("tools"));
  return (
    <SafeAreaProvider>
      {mode.connectionTools ? (
        <ConnectedPilot />
      ) : (
        <ProductApp
          live={mode.live}
        />
      )}
    </SafeAreaProvider>
  );
}
