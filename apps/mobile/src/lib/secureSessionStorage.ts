type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/** Two fixed slots: interrupted writes never replace a valid session.
 * Small Unicode-safe chunks respect older Keychain item limits.
 * Slot manifests let a later operation clean up interrupted writes, too.
 */
export function secureSessionStorage(secure: Storage, legacy: Storage): Storage {
  const pending = new Map<string, Promise<unknown>>();
  function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
    if (!/^[A-Za-z0-9._-]+$/.test(key)) return Promise.reject(Error("Clé de session invalide."));
    const task = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(work);
    pending.set(key, task);
    void task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {});
    return task;
  }
  const pointer = (key: string) => `partant.${key}.active`;
  const slot = (key: string, name: string) => `partant.${key}.${name}`;
  async function clearSlot(base: string) {
    const count = Number(await secure.getItem(base + ".count") ?? 0);
    if (!Number.isInteger(count) || count < 0 || count > 128) throw Error("Stockage de session invalide.");
    for (let i = 0; i < count; i++) await secure.removeItem(`${base}.${i}`);
    await secure.removeItem(base + ".count");
  }
  async function write(key: string, value: string) {
    const chars = Array.from(value), chunks: string[] = [];
    for (let i = 0; i < chars.length; i += 400) chunks.push(chars.slice(i, i + 400).join(""));
    if (chunks.length > 128) throw Error("Session trop volumineuse. Reconnectez-vous.");
    const current = await secure.getItem(pointer(key));
    const next = current === "a" ? "b" : "a", base = slot(key, next);
    await clearSlot(base);
    await secure.setItem(base + ".count", String(chunks.length));
    try {
      for (let i = 0; i < chunks.length; i++) await secure.setItem(`${base}.${i}`, chunks[i]);
      await secure.setItem(pointer(key), next);
    } catch (e) {
      await clearSlot(base).catch(() => {});
      throw e;
    }
    // Never discard the previous plaintext session before its secure copy exists.
    await legacy.removeItem(key);
    if (current === "a" || current === "b") await clearSlot(slot(key, current));
  }
  return {
    getItem: key => serial(key, async () => {
      const active = await secure.getItem(pointer(key));
      if (active === "a" || active === "b") {
        const base = slot(key, active), raw = await secure.getItem(base + ".count");
        const count = Number(raw);
        if (raw === null || !Number.isInteger(count) || count < 0 || count > 128)
          throw Error("Session illisible. Reconnectez-vous.");
        let value = "";
        for (let i = 0; i < count; i++) {
          const part = await secure.getItem(`${base}.${i}`);
          if (part === null) throw Error("Session incomplète. Reconnectez-vous.");
          value += part;
        }
        // Finish a migration interrupted after the secure pointer was saved.
        await legacy.removeItem(key);
        return value;
      }
      const value = await legacy.getItem(key);
      if (value !== null) await write(key, value);
      return value;
    }),
    setItem: (key, value) => serial(key, () => write(key, value)),
    removeItem: key => serial(key, async () => {
      await legacy.removeItem(key);
      await secure.removeItem(pointer(key));
      await clearSlot(slot(key, "a"));
      await clearSlot(slot(key, "b"));
    }),
  };
}
