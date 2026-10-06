import { useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import {
  parseProductRoute,
  productRouteURL,
  ProductRoute,
} from "./productRoutes";

/** Public destinations only. Forms, authentication tokens and private documents never enter the URL. */
export function useProductRoutes({
  ready,
  route,
  onRoute,
  canLeave,
}: {
  ready: boolean;
  route: ProductRoute | null;
  onRoute: (r: ProductRoute) => void;
  canLeave: () => boolean;
}) {
  const first = useRef(true),
    pending = useRef<ProductRoute | null>(null),
    skip = useRef(false),
    index = useRef(0),
    replaceNext = useRef(false);
  const callbacks = useRef({ onRoute, canLeave, ready });
  callbacks.current = { onRoute, canLeave, ready };
  const [revision, setRevision] = useState(0);
  const entries = useRef(new Map<number, ProductRoute>());
  const routeJSON = JSON.stringify(route);
  const key = (r: ProductRoute) =>
    [r.view, r.coach, r.offer, r.booking, r.section, r.tab].join("|");
  useEffect(() => {
    if (Platform.OS === "web") {
      pending.current = parseProductRoute(window.location.href);
      index.current = Number(window.history.state?.partantIndex) || 0;
      window.history.replaceState(
        { partantIndex: index.current },
        "",
        window.location.href,
      );
      let restoring = false;
      const pop = () => {
        if (restoring) {
          restoring = false;
          return;
        }
        const nextIndex = Number(window.history.state?.partantIndex) || 0;
        if (!callbacks.current.ready || !callbacks.current.canLeave()) {
          const delta = index.current - nextIndex;
          if (delta) {
            restoring = true;
            window.history.go(delta);
          }
          return;
        }
        index.current = nextIndex;
        skip.current = true;
        callbacks.current.onRoute(
          parseProductRoute(window.location.href) ?? { view: "welcome" },
        );
        setRevision((v) => v + 1);
      };
      window.addEventListener("popstate", pop);
      return () => window.removeEventListener("popstate", pop);
    }
    let alive = true;
    const accept = (url: string) => {
      if (!url.startsWith("partant:")) return;
      const r = parseProductRoute(url);
      if (!r) return;
      if (first.current || !callbacks.current.ready) pending.current = r;
      else if (callbacks.current.canLeave()) callbacks.current.onRoute(r);
    };
    void Linking.getInitialURL()
      .then((url) => {
        if (alive && url) accept(url);
      })
      .catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => accept(url));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (first.current || pending.current) {
      first.current = false;
      if (pending.current) {
        const r = pending.current;
        pending.current = null;
        skip.current = true;
        callbacks.current.onRoute(r);
        setRevision((v) => v + 1);
        return;
      }
    }
    if (Platform.OS !== "web" || !route) return;
    const next = productRouteURL(window.location.href, route);
    if (skip.current || replaceNext.current) {
      skip.current = false;
      replaceNext.current = false;
      window.history.replaceState({ partantIndex: index.current }, "", next);
      entries.current.set(index.current, route);
      return;
    }
    if (next !== window.location.href) {
      const old = parseProductRoute(window.location.href);
      const replace =
        !old ||
        key(old) === key(route) ||
        route.view === "welcome" ||
        (old.view === "welcome" && route.view !== "profile");
      if (!replace) index.current++;
      window.history[replace ? "replaceState" : "pushState"](
        { partantIndex: index.current },
        "",
        next,
      );
    }
    entries.current.set(index.current, route);
  }, [ready, routeJSON, revision]);
  return (screen: string, destination: ProductRoute) => {
    if (Platform.OS !== "web") return false;
    const current = parseProductRoute(window.location.href);
    const previous = entries.current.get(index.current - 1);
    if (
      current?.view === screen &&
      previous &&
      key(previous) === key(destination) &&
      index.current > 0
    ) {
      window.history.back();
      return true;
    }
    replaceNext.current = true;
    return false;
  };
}
