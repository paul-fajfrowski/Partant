import test from "node:test";
import assert from "node:assert/strict";
import {
  instant,
  normalizeGoogle,
  normalizeOutlook,
  pullGoogle,
  pullOutlook,
  googleEvent,
  outlookEvent,
} from "../providers.mjs";
const g = {
  id: "a",
  start: { date: "2026-10-25" },
  end: { date: "2026-10-26" },
};
const m = {
  id: "b",
  start: { dateTime: "2026-09-20T12:00:00.0000000", timeZone: "UTC" },
  end: { dateTime: "2026-09-20T13:00:00.0000000", timeZone: "UTC" },
  showAs: "busy",
};
const range = {
  accessToken: "test-only",
  start: "2026-09-20T00:00:00Z",
  end: "2026-11-01T00:00:00Z",
};
const response = (data) => new Response(JSON.stringify(data));
test("all-day Paris event crosses DST as 25 hours", () => {
  const b = normalizeGoogle(g, "Europe/Paris");
  assert.equal(Date.parse(b.ends_at) - Date.parse(b.starts_at), 25 * 3600000);
});
test("Google free/cancelled/our own events are ignored", () => {
  assert.equal(
    normalizeGoogle({ ...g, transparency: "transparent" }, "UTC"),
    null,
  );
  assert.equal(normalizeGoogle({ ...g, status: "cancelled" }, "UTC"), null);
  assert.equal(normalizeGoogle(g, "UTC", new Set(["a"])), null);
});
test("Graph UTC seven-digit seconds", () =>
  assert.equal(normalizeOutlook(m).starts_at, "2026-09-20T12:00:00Z"));
test("Graph cancelled/free events are ignored", () => {
  assert.equal(normalizeOutlook({ ...m, isCancelled: true }), null);
  assert.equal(normalizeOutlook({ ...m, showAs: "free" }), null);
});
test("ambiguous and nonexistent local times fail closed", () => {
  assert.throws(() => instant("2026-10-25T02:30:00", "Europe/Paris"));
  assert.throws(() => instant("2026-03-29T02:30:00", "Europe/Paris"));
});
test("unknown timezone is not guessed", () =>
  assert.throws(() => instant("2026-10-20T12:00:00", "Unknown/Zone")));
test("Google follows pagination and hides event titles", async () => {
  let n = 0;
  const blocks = await pullGoogle({
    ...range,
    fetcher: async () =>
      response(
        n++
          ? { timeZone: "Europe/Paris", items: [] }
          : {
              timeZone: "Europe/Paris",
              items: [{ ...g, summary: "Private medical appointment" }],
              nextPageToken: "page2",
            },
      ),
  });
  assert.equal(n, 2);
  assert.equal(blocks.length, 1);
  assert.equal("summary" in blocks[0], false);
});
test("Outlook nextLink rejects token exfiltration", async () => {
  let n = 0;
  await assert.rejects(
    pullOutlook({
      ...range,
      fetcher: async () => {
        n++;
        return response({
          value: [],
          "@odata.nextLink": "https://evil.invalid/steal",
        });
      },
    }),
    /INVALID_CALENDAR_NEXT_LINK/,
  );
  assert.equal(n, 1);
});
test("OAuth revoked makes sync fail closed", async () => {
  await assert.rejects(
    pullGoogle({
      ...range,
      fetcher: async () => new Response("", { status: 401 }),
    }),
    /REAUTH/,
  );
});
test("rate limit makes sync fail closed", async () => {
  await assert.rejects(
    pullOutlook({
      ...range,
      fetcher: async () => new Response("", { status: 429 }),
    }),
    /RATE_LIMITED/,
  );
});
test("range capped to 92 days", async () => {
  await assert.rejects(
    pullGoogle({ ...range, end: "2027-09-20T00:00:00Z" }),
    /INVALID_SYNC_WINDOW/,
  );
});
test("provider event drafts omit participant personal data", () => {
  const s = {
    id: "slot",
    location: "Parc",
    starts_at: "2026-09-20T14:00:00+02:00",
    ends_at: "2026-09-20T15:00:00+02:00",
  };
  assert.equal(googleEvent(s).summary, "Séance Partant");
  assert.equal(outlookEvent(s).start.dateTime, "2026-09-20T12:00:00");
  assert.equal(outlookEvent(s).transactionId, "slot");
});
