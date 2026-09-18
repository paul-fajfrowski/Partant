import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
WebBrowser.maybeCompleteAuthSession();
export const redirectTo = () =>
  Platform.OS === "web"
    ? `${window.location.origin}/?data=connected`
    : makeRedirectUri({ scheme: "partant", path: "auth/callback" });
const handledCodes = new Set<string>();
export async function completeAuth(url: string) {
  const parsed = new URL(url);
  const failure = parsed.searchParams.get("error_description");
  if (failure) throw new Error(failure);
  const code = parsed.searchParams.get("code");
  if (!code || handledCodes.has(code)) return;
  handledCodes.add(code);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (Platform.OS === "web")
    window.history.replaceState(
      {},
      "",
      window.location.pathname + "?data=connected",
    );
  if (error) throw error;
}
export async function socialProviders(): Promise<{
  google: boolean;
  apple: boolean;
}> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
    {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    },
  );
  if (!response.ok)
    throw Error("Impossible de vérifier les connexions disponibles.");
  const data = await response.json();
  return {
    google: data.external?.google === true,
    apple: data.external?.apple === true,
  };
}
export async function signInSocial(
  provider: "google" | "apple",
  intent?: { name: string; role: "client" | "coach" },
) {
  const enabled = await socialProviders();
  if (!enabled[provider])
    throw Error(
      "Ce mode de connexion n’est pas encore activé. Utilisez votre e-mail.",
    );
  if (intent)
    await AsyncStorage.setItem("partant-auth-intent", JSON.stringify(intent));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo(), skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (Platform.OS === "web") {
    window.location.assign(data.url);
    return;
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo());
  if (result.type === "success") await completeAuth(result.url);
}
