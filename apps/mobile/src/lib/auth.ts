import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
WebBrowser.maybeCompleteAuthSession();
export const redirectTo = () =>
  Platform.OS === "web"
    ? `${window.location.origin}/?data=connected`
    : makeRedirectUri({ scheme: "partant", path: "auth/callback" });
export async function withAuthTimeout<T>(
  work: Promise<T>,
  ms = 30000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Error(
                "La connexion prend trop de temps. Vérifiez votre réseau puis réessayez.",
              ),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
const exchanges = new Map<string, Promise<void>>();
export async function completeAuth(url: string) {
  const parsed = new URL(url);
  const expected = new URL(redirectTo());
  if (
    parsed.protocol !== expected.protocol ||
    parsed.host !== expected.host ||
    parsed.pathname !== expected.pathname
  )
    return;
  const failure =
    parsed.searchParams.get("error") ||
    new URLSearchParams(parsed.hash.slice(1)).get("error");
  if (failure)
    throw Error(
      failure === "access_denied"
        ? "Connexion annulée. Vous pouvez réessayer."
        : "La connexion n’a pas abouti. Veuillez réessayer.",
    );
  const code = parsed.searchParams.get("code");
  if (!code) return;
  if (exchanges.has(code)) return exchanges.get(code);
  const exchange = (async () => {
    const { error } = await withAuthTimeout(
      supabase.auth.exchangeCodeForSession(code),
    );
    if (error)
      throw Error("Impossible de terminer la connexion. Veuillez recommencer.");
    if (Platform.OS === "web")
      window.history.replaceState(
        {},
        "",
        window.location.pathname + "?data=connected",
      );
  })();
  exchanges.set(code, exchange);
  try {
    await exchange;
  } catch (error) {
    exchanges.delete(code);
    throw error;
  }
  // Keep only recent successful callbacks; a repeated native link shares its exchange.
  if (exchanges.size > 20) exchanges.delete(exchanges.keys().next().value!);
}
export async function socialProviders(): Promise<{
  google: boolean;
  apple: boolean;
}> {
  const response = await withAuthTimeout(
    fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    }),
  );
  if (!response.ok)
    throw Error("Impossible de vérifier les connexions disponibles.");
  const data = await response.json();
  return {
    google: data.external?.google === true,
    apple:
      data.external?.apple === true &&
      (Platform.OS !== "ios" || (await AppleAuthentication.isAvailableAsync())),
  };
}
let authenticating = false;
export async function signInSocial(
  provider: "google" | "apple",
  intent?: { name: string; role: "client" | "coach" },
) {
  if (authenticating) return;
  authenticating = true;
  try {
    if (intent)
      await AsyncStorage.setItem("partant-auth-intent", JSON.stringify(intent));
    if (provider === "apple" && Platform.OS === "ios") {
      if (!(await AppleAuthentication.isAvailableAsync()))
        throw Error(
          "La connexion Apple n’est pas disponible sur cet appareil.",
        );
      const nonce = Crypto.randomUUID() + Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );
      let credential;
      try {
        credential = await AppleAuthentication.signInAsync({
          nonce: hashedNonce,
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
      } catch (error) {
        if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED")
          return;
        throw Error(
          "Apple n’a pas pu terminer la connexion. Réessayez ou choisissez une autre méthode.",
        );
      }
      if (!credential.identityToken)
        throw Error(
          "Apple n’a pas transmis la confirmation. Veuillez réessayer.",
        );
      const name = credential.fullName
        ? AppleAuthentication.formatFullName(credential.fullName).trim()
        : "";
      if (name && !intent?.name)
        await AsyncStorage.setItem(
          "partant-auth-intent",
          JSON.stringify({ ...intent, name }),
        );
      const { error } = await withAuthTimeout(
        supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
          nonce,
        }),
      );
      if (error)
        throw Error(
          "La connexion Apple n’a pas pu être confirmée par Partant. Réessayez ou utilisez une autre méthode.",
        );
      return;
    }
    const { data, error } = await withAuthTimeout(
      supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo(), skipBrowserRedirect: true },
      }),
    );
    if (error || !data.url)
      throw Error("Impossible d’ouvrir la connexion. Veuillez réessayer.");
    if (Platform.OS === "web") {
      window.location.assign(data.url);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo(),
    );
    if (result.type === "success") {
      await completeAuth(result.url);
      const { data: session } = await withAuthTimeout(
        supabase.auth.getSession(),
      );
      if (!session.session)
        throw Error(
          "Le retour vers Partant n’a pas abouti. Veuillez réessayer.",
        );
    }
  } finally {
    authenticating = false;
  }
}
