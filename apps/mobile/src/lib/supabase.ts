import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import type { Database } from "./database.types";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw new Error("Configurer apps/mobile/.env à partir de .env.example.");
export const supabase = createClient<Database>(url, key, {
  global: {
    fetch: async (input, init) => {
      const target = String(input);
      const timeout = target.includes("/auth/v1/logout")
        ? 2500
        : target.includes("/functions/v1/")
          ? 20000
          : 0;
      if (!timeout) return fetch(input, init);
      const controller = new AbortController();
      const cancel = () => controller.abort();
      if (init?.signal?.aborted) cancel();
      else init?.signal?.addEventListener("abort", cancel, { once: true });
      const timer = setTimeout(cancel, timeout);
      try {
        return await fetch(input, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timer);
        init?.signal?.removeEventListener("abort", cancel);
      }
    },
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
    lock: processLock,
  },
});
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) =>
    state === "active"
      ? supabase.auth.startAutoRefresh()
      : supabase.auth.stopAutoRefresh(),
  );
}
