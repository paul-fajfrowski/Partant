export type TeamRole = "reviewer" | "support" | "admin";
export type TeamAccess = { role: TeamRole; unlocked: boolean };
export function teamPermission(
  name: string,
  args: any[] = [],
): TeamRole | null {
  if (["reviewPractice", "reviewDossier"].includes(name)) return "reviewer";
  if (name === "liftSuspension") return "admin";
  if (name === "resolveTicket")
    return args[2] === "Répondre" ? "support" : "admin";
  return null;
}
export function teamAllowed(role: TeamRole | undefined, permission: TeamRole) {
  return role === "admin" || role === permission;
}
