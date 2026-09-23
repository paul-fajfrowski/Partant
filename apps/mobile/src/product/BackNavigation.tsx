import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import { createBackStack } from "./backStack";
type BackStack = ReturnType<typeof createBackStack>;
const Context = createContext<BackStack | null>(null);
export function BackNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const stack = useRef<BackStack | null>(null);
  if (!stack.current) stack.current = createBackStack();
  return <Context.Provider value={stack.current}>{children}</Context.Provider>;
}
export function useBackNavigation() {
  return useContext(Context);
}
/** Callback stays current without changing the layer's position on each render. */
export function useLocalBack(active: boolean, back: () => void, priority = 10) {
  const stack = useBackNavigation(),
    callback = useRef(back);
  callback.current = back;
  useLayoutEffect(
    () =>
      active && stack
        ? stack.register(() => callback.current(), priority)
        : undefined,
    [stack, active, priority],
  );
}
