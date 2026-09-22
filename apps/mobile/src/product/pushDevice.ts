import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";
const deviceKey = "partant-push-device-v1",
  ownerKey = "partant-push-owner-v1";
export type PushCategories = {
  booking: boolean;
  changes: boolean;
  reminder: boolean;
  messages: boolean;
  activity: boolean;
  availability?: boolean;
};
export const defaultPushCategories: PushCategories = {
  booking: true,
  changes: true,
  reminder: true,
  messages: true,
  activity: true,
  availability: true,
};
export type PushStatus = {
  categories: PushCategories;
  registered: boolean;
  configured: boolean;
};
export async function deviceId() {
  let id = await AsyncStorage.getItem(deviceKey);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(deviceKey, id);
  }
  return id;
}
export async function pushRequest(
  action: string,
  input: Record<string, unknown> = {},
  expectedOwner?: string,
): Promise<PushStatus> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session || (expectedOwner && session.user.id !== expectedOwner))
    throw Error("Le compte actif a changé. Reconnectez-vous.");
  const { data, error } = await supabase.functions.invoke("push-devices", {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { action, device: await deviceId(), ...input },
  });
  if (error) {
    let detail: any;
    try {
      detail = await (error as any).context?.json();
    } catch {}
    throw Error(
      detail?.error ??
        "Impossible de mettre à jour les notifications. Réessayez.",
    );
  }
  return data;
}
export async function enablePushDevice(
  owner: string,
  requestPermission: boolean,
) {
  if (Platform.OS !== "ios")
    throw Error("L’activation des push est disponible dans la version iPhone.");
  const N = await import("expo-notifications");
  let permission = await N.getPermissionsAsync();
  if (!permission.granted && requestPermission)
    permission = await N.requestPermissionsAsync();
  if (!permission.granted) {
    await unregisterPushDevice();
    throw Error(
      "Autorisez les notifications dans les réglages de votre iPhone.",
    );
  }
  const { data } = await supabase.auth.getUser();
  if (data.user?.id !== owner) throw Error("Le compte actif a changé.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const token = await Promise.race([
    N.getDevicePushTokenAsync(),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            Error(
              "L’iPhone ne répond pas encore. Vérifiez la connexion puis réessayez.",
            ),
          ),
        20_000,
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  const result = await pushRequest(
    "register",
    {
      token: String(token.data),
      environment:
        process.env.EXPO_PUBLIC_APNS_ENVIRONMENT === "production"
          ? "production"
          : "sandbox",
    },
    owner,
  );
  await AsyncStorage.setItem(ownerKey, owner);
  return result;
}
export async function clearLocalPushDevice() {
  await AsyncStorage.removeItem(ownerKey);
  if (Platform.OS === "ios") {
    const N = await import("expo-notifications");
    await N.dismissAllNotificationsAsync();
    await N.setBadgeCountAsync(0);
  }
}
export async function unregisterPushDevice(clearLocal = true) {
  if (Platform.OS !== "ios") return;
  const owner = await AsyncStorage.getItem(ownerKey);
  if (!owner) return;
  await pushRequest("remove", {}, owner);
  if (clearLocal) await clearLocalPushDevice();
}
export async function refreshPushDevice(owner: string) {
  if (Platform.OS === "ios" && !!(await AsyncStorage.getItem(ownerKey)))
    await enablePushDevice(owner, false);
}
export function parsePushTarget(data: unknown, owner: string) {
  const p = (data as any)?.partant;
  if (
    !p ||
    p.v !== 1 ||
    p.recipient !== owner ||
    typeof p.noticeId !== "string" ||
    p.noticeId.length > 200 ||
    typeof p.event !== "string"
  )
    return null;
  return {
    noticeId: p.noticeId,
    event: p.event,
    bookingId:
      typeof p.bookingId === "string" && p.bookingId.length < 200
        ? p.bookingId
        : "",
  };
}
