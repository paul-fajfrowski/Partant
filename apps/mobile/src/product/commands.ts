import type { Store } from "./model";
export type Command = { name: string; args: any[] };
export const commandLog = Symbol("partantCommands");
let depth = 0;
/** Carries user intent to the transport; never sends the computed client state. */
export function recorded<F extends (s: Store, ...args: any[]) => Store>(
  name: string,
  fn: F,
): F {
  return ((s: Store, ...args: any[]) => {
    const outer = depth++ === 0;
    try {
      const next = fn(s, ...args);
      return outer && s.connected
        ? Object.assign({}, next, { [commandLog]: [{ name, args }] })
        : next;
    } finally {
      depth--;
    }
  }) as F;
}
export function commandsFrom(before: Store, after: Store): Command[] {
  const commands: Command[] = [...((after as any)[commandLog] ?? [])];
  if (commands.some((c) => c.name === "deleteAccount")) return commands;
  const changed = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);
  const add = (name: string, ...args: any[]) => commands.push({ name, args });
  const me = before.account?.id;
  if (changed(before.preferences, after.preferences))
    add("preferences", after.preferences);
  if (changed(before.favorites, after.favorites))
    add("favorites", after.favorites);
  if (changed(before.coachDrafts, after.coachDrafts))
    add("drafts", after.coachDrafts ?? {});
  if (
    me &&
    (changed(before.account, after.account) ||
      changed(before.accountInfo?.[me], after.accountInfo?.[me])) &&
    after.account
  )
    add("account", {
      name: after.account.name,
      email: after.account.email,
      ...after.accountInfo?.[me],
    });
  if (changed(before.closed, after.closed))
    add(
      "closed",
      after.closed.filter((x) => !before.closed.includes(x)),
      before.closed.filter((x) => !after.closed.includes(x)),
    );
  for (const n of after.notices)
    if (n.read && !before.notices.find((x) => x.id === n.id)?.read)
      add("readNotice", n.id);
  for (const [id, ms] of Object.entries(after.messages)) {
    const old = before.messages[id] ?? [];
    for (const m of ms.slice(old.length)) add("message", id, m.text, m.id);
    if (
      ms.some(
        (m, i) =>
          i < old.length &&
          m.readBy?.includes(me ?? "") &&
          !old[i]?.readBy?.includes(me ?? ""),
      )
    )
      add("readMessages", id);
  }
  if (changed(before.alerts, after.alerts)) {
    for (const a of after.alerts ?? [])
      if (
        changed(
          a,
          before.alerts?.find((x) => x.id === a.id),
        )
      )
        add("alert", a);
    for (const a of before.alerts ?? [])
      if (!after.alerts?.some((x) => x.id === a.id)) add("removeAlert", a.id);
  }
  for (const b of after.bookings) {
    const old = before.bookings.find((x) => x.id === b.id);
    if (old && old.prepared !== b.prepared) add("prepared", b.id, !!b.prepared);
  }
  // Place saves also change the public venue index; server derives it from settings.
  if (
    !commands.length &&
    changed(before, after) &&
    after.account === null &&
    before.account
  )
    add("signOut");
  return commands;
}
