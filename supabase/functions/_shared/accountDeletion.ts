/** Bounded, replayable cleanup. Storage must be empty before Auth can be removed. */
export async function runAccountDeletions(admin: any, actor?: string) {
  const lease = crypto.randomUUID();
  const claimed = await admin.rpc("product_deletion_claim", {
    p_lease: lease, p_limit: actor ? 1 : 3, p_actor: actor ?? null,
  });
  if (claimed.error) throw claimed.error;
  let completed = 0;
  for (const job of claimed.data ?? []) {
    let stage = "storage", error: string | null = null;
    try {
      for (const bucket of ["coach-documents", "coach-photos"]) {
        // Upload paths are strictly actor/UUID.ext. Never enumerate other users.
        // Always start at offset 0 because each successful batch disappears.
        let emptied = false;
        for (let batch = 0; batch < 4; batch++) {
          const list = await admin.storage.from(bucket).list(job.actor, {
            limit: 100, offset: 0, sortBy: { column: "name", order: "asc" },
          });
          if (list.error) throw Error("storage_unavailable");
          const objects = list.data ?? [];
          if (!objects.length) { emptied = true; break; }
          if (objects.some((f: any) => !f.id || f.name.includes("/") || f.name === ".."))
            throw Error("storage_pending");
          const removed = await admin.storage.from(bucket).remove(
            objects.map((file: any) => `${job.actor}/${file.name}`),
          );
          if (removed.error) throw Error("storage_unavailable");
        }
        if (!emptied) throw Error("storage_pending");
      }
      stage = "auth";
      const deleted = await admin.auth.admin.deleteUser(job.actor);
      // A crash after successful provider deletion is safe to replay.
      if (deleted.error && deleted.error.status !== 404 && deleted.error.code !== "user_not_found")
        throw Error("auth_unavailable");
      stage = "completed";
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      error = ["storage_unavailable", "storage_pending", "auth_unavailable"].includes(message)
        ? message : stage === "auth" ? "auth_unavailable" : "storage_unavailable";
    }
    const finished = await admin.rpc("product_deletion_finish", {
      p_actor: job.actor, p_lease: lease, p_stage: stage, p_error: error,
    });
    if (finished.error) throw finished.error;
    if (finished.data && stage === "completed" && !error) completed++;
  }
  return { processed: claimed.data?.length ?? 0, completed };
}
