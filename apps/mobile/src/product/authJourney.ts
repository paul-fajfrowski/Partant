import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Booking } from "./model";
export type AuthJourney = {
  screen: string;
  focus: string;
  coachId: string;
  offerId: string;
  day: string;
  expires: number;
  draft?: Booking;
  favorite?: string;
};
const key = "partant-auth-journey-v1";
const destinations = new Set([
  "setup",
  "favorites",
  "bookings",
  "account",
  "notifications",
  "messages",
  "account-native",
  "alerts-native",
  "new-alert",
  "support-native",
  "report-native",
  "conversation",
]);
export function parseJourney(raw: string | null): AuthJourney | null {
  try {
    const j = JSON.parse(raw ?? "null");
    if (
      !j ||
      !destinations.has(j.screen) ||
      !Number.isFinite(j.expires) ||
      j.expires < Date.now() ||
      j.expires > Date.now() + 31 * 60 * 1000
    )
      return null;
    if (
      ![j.focus, j.coachId, j.offerId, j.day].every(
        (x) => typeof x === "string",
      )
    )
      return null;
    if (
      j.screen === "setup" &&
      (!j.draft ||
        typeof j.draft.coach !== "string" ||
        typeof j.draft.time !== "string")
    )
      return null;
    return j;
  } catch {
    return null;
  }
}
export const saveJourney = (journey: AuthJourney) =>
  AsyncStorage.setItem(key, JSON.stringify(journey));
export const readJourney = async () =>
  parseJourney(await AsyncStorage.getItem(key));
export const clearJourney = () => AsyncStorage.removeItem(key);
