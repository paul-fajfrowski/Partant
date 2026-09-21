import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { parsePushTarget, refreshPushDevice } from "./pushDevice";
export function usePushNotifications(
  owner: string | undefined,
  live: boolean,
  onOpen: (target: NonNullable<ReturnType<typeof parsePushTarget>>) => void,
  refresh: () => Promise<unknown>,
) {
  const callbacks = useRef({ onOpen, refresh });
  callbacks.current = { onOpen, refresh };
  const handled = useRef("");
  useEffect(() => {
    if (!live || !owner || Platform.OS !== "ios") return;
    let disposed = false;
    const subscriptions: { remove: () => void }[] = [];
    const sync = () => void refreshPushDevice(owner).catch(() => {});
    void import("expo-notifications")
      .then(async (N) => {
        if (disposed) return;
        // In the foreground the app refreshes its existing inbox; no second banner.
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          }),
        });
        const open = (
          response: import("expo-notifications").NotificationResponse | null,
        ) => {
          if (disposed || !response) return;
          const id = response.notification.request.identifier;
          if (handled.current === id) return;
          const target = parsePushTarget(
            response.notification.request.content.data,
            owner,
          );
          if (!target) {
            void N.clearLastNotificationResponseAsync();
            return;
          }
          handled.current = id;
          callbacks.current.onOpen(target);
          void N.clearLastNotificationResponseAsync();
        };
        subscriptions.push(N.addNotificationResponseReceivedListener(open));
        subscriptions.push(
          N.addNotificationReceivedListener(() => {
            void callbacks.current.refresh().catch(() => {});
          }),
        );
        subscriptions.push(N.addPushTokenListener(sync));
        open(await N.getLastNotificationResponseAsync());
        sync();
      })
      .catch(() => {});
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => {
      disposed = true;
      foreground.remove();
      subscriptions.forEach((s) => s.remove());
    };
  }, [owner, live]);
}
