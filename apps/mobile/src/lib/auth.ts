import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
WebBrowser.maybeCompleteAuthSession();
export const redirectTo = () =>
  Platform.OS === "web"
    ? `${window.location.origin}/`
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
    window.history.replaceState({}, "", window.location.pathname);
  if (error) throw error;
}
export async function signInSocial(provider: "google" | "apple") {
  const enabled =
    provider === "google"
      ? process.env.EXPO_PUBLIC_GOOGLE_ENABLED
      : process.env.EXPO_PUBLIC_APPLE_ENABLED;
  if (enabled !== "true")
    throw new Error(
      "Connexion en préparation : configuration du fournisseur nécessaire.",
    );
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
