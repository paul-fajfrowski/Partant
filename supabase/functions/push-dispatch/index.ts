import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { emptyConnected, documents, maintain } from "../product-api/domain.js";
import { sendApns } from "../_shared/apns.ts";
const apnsClient = Deno.createHttpClient({ http2: true, http1: false });
const apnsFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, client: apnsClient });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
Deno.serve(async (req) => {
  const secret = Deno.env.get("PUSH_JOB_SECRET");
  if (
    req.method !== "POST" ||
    !secret ||
    req.headers.get("x-partant-job") !== secret
  )
    return json({ error: "Unauthorized" }, 401);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const rpc = async (name: string, args: any = {}) => {
    const r = await admin.rpc(name, args);
    if (r.error) throw r.error;
    return r.data;
  };
  const started = Date.now();
  try {
    // Scheduled maintenance produces reminders even if nobody opens the application.
    for (let attempt = 0; attempt < 4; attempt++) {
      const loaded = await rpc("product_load");
      const state = { ...emptyConnected(), ...loaded.documents };
      const next = documents(maintain(state));
      if (JSON.stringify(next) !== JSON.stringify(documents(state))) {
        if (
          !(await rpc("product_commit", {
            p_version: loaded.version,
            p_documents: next,
          }))
        )
          continue;
        // A later request may have advanced the version: do not mark that version as maintained.
        await rpc("product_maintenance_done", {
          p_version: loaded.version + 1,
        });
      } else
        await rpc("product_maintenance_done", { p_version: loaded.version });
      break;
    }
    const key = Deno.env.get("APNS_PRIVATE_KEY_BASE64")
        ? atob(Deno.env.get("APNS_PRIVATE_KEY_BASE64")!)
        : undefined,
      keyId = Deno.env.get("APNS_KEY_ID"),
      team = Deno.env.get("APNS_TEAM_ID");
    if (!key || !keyId || !team)
      return json({ configured: false, accepted: 0 });
    // Private transport diagnostic: an impossible all-zero token, never a user's device.
    if (req.headers.get("x-partant-check") === "apns") {
      const probe = await sendApns(
        {
          id: crypto.randomUUID(),
          recipient: "probe",
          notice_id: "probe",
          booking: "",
          event: "other",
          token: "0".repeat(64),
          environment: Deno.env.get("APNS_ENVIRONMENT") ?? "sandbox",
          expires_at: new Date().toISOString(),
        },
        { key, keyId, team, topic: "com.paulfajfrowski.partant" },
        apnsFetch,
      );
      return json({
        configured: true,
        transportReachable: true,
        probe: probe.error ?? probe.status,
        realDeviceTest: false,
      });
    }
    const lease = crypto.randomUUID();
    const jobs = await rpc("product_push_claim", {
      p_lease: lease,
      p_limit: 20,
    });
    let accepted = 0;
    // At most four provider requests at once, bounded work per invocation.
    for (let i = 0; i < jobs.length; i += 4)
      await Promise.all(
        jobs.slice(i, i + 4).map(async (job: any) => {
          if (
            !(await rpc("product_push_eligible", {
              p_id: job.id,
              p_lease: lease,
            }))
          ) {
            await rpc("product_push_finish", {
              p_id: job.id,
              p_lease: lease,
              p_status: "cancelled",
            });
            return;
          }
          let result;
          try {
            result = await sendApns(
              job,
              { key, keyId, team, topic: "com.paulfajfrowski.partant" },
              apnsFetch,
            );
          } catch {
            result = {
              status: "pending",
              error: "ProviderUnavailable",
              disable: false,
            };
          }
          await rpc("product_push_finish", {
            p_id: job.id,
            p_lease: lease,
            p_status: result.status,
            p_error: result.error,
            p_disable: result.disable,
          });
          if (result.status === "accepted") accepted++;
        }),
      );
    console.log(
      JSON.stringify({
        service: "push-dispatch",
        processed: jobs.length,
        accepted,
        durationMs: Date.now() - started,
      }),
    );
    return json({ configured: true, processed: jobs.length, accepted });
  } catch {
    console.error(
      JSON.stringify({
        service: "push-dispatch",
        code: "dispatch_failed",
        durationMs: Date.now() - started,
      }),
    );
    return json({ error: "Temporary worker failure" }, 503);
  }
});
