/** Local navigation layers precede the application's route history. No business writes. */
export function createBackStack() {
  let serial = 0;
  const entries = new Map<number, { priority: number; back: () => void }>();
  return {
    register(back: () => void, priority = 10) {
      const id = ++serial;
      entries.set(id, { back, priority });
      return () => {
        entries.delete(id);
      };
    },
    has(minPriority = 0) {
      return [...entries.values()].some((e) => e.priority >= minPriority);
    },
    consume() {
      const next = [...entries.entries()].sort(
        ([a, x], [b, y]) => y.priority - x.priority || b - a,
      )[0];
      if (!next) return false;
      next[1].back();
      return true;
    },
  };
}
