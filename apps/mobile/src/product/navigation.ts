/** Navigation destinations, independent of data loading and browser history. */
export const rootScreens = [
  "welcome",
  "explore",
  "favorites",
  "bookings",
  "account",
  "coach",
];
export const authScreens = ["welcome", "login", "code", "completeAccount"];
export const mainScreen = (role?: string) =>
  role === "coach" ? "coach" : "explore";
export function fallbackScreen(screen: string, role?: string) {
  if (screen === "code") return "login";
  if (["chat", "conversation"].includes(screen)) return "messages";
  if (["report-native", "become-coach"].includes(screen))
    return "account-native";
  if (
    [
      "bookingDetail",
      "confirmation",
      "review-native",
      "partial-native",
      "transfer-native",
      "proposal-native",
      "proposal-create",
      "repeat-native",
    ].includes(screen)
  )
    return role === "coach" ? "coach" : "bookings";
  return mainScreen(role);
}
export function canReturnTo(
  screen: string,
  role: string | undefined,
  live: boolean,
) {
  if (role && authScreens.includes(screen)) return false;
  if (
    live &&
    role === "coach" &&
    [
      "explore",
      "favorites",
      "bookings",
      "account",
      "onboarding",
      "setup",
      "checkout",
      "payment",
    ].includes(screen)
  )
    return false;
  return true;
}
