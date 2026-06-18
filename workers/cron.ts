/**
 * Scheduled ingest Worker.
 *
 * Cloudflare Pages can't host cron triggers, so the unattended daily run lives
 * in this standalone Worker. It shares the same D1 database + Workers AI binding
 * as the Pages app and reuses the exact ingest logic.
 *
 * Deploy separately:
 *   wrangler deploy --config workers/wrangler.toml
 *
 * It only writes DRAFTS (status='draft'); a human still publishes via /admin.
 */
import { runIngest } from "../src/lib/ingest";
import type { Ai, D1Database } from "@cloudflare/workers-types";

export interface CronEnv {
  DB: D1Database;
  AI: Ai;
}

export default {
  // Runs on the schedule(s) defined in workers/wrangler.toml.
  async scheduled(_event: ScheduledEvent, env: CronEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      runIngest(env.DB, env.AI, { maxFetch: 25, maxDraft: 4 })
        .then((r) => console.log("[cron ingest]", JSON.stringify(r)))
        .catch((e) => console.error("[cron ingest] failed", e)),
    );
  },

  // Health/status endpoint only. The daily ingest runs via scheduled() above;
  // manual runs go through the admin-gated /api/cron/ingest on the site. This
  // keeps the public Worker URL from being used to burn Workers AI quota.
  async fetch(): Promise<Response> {
    return new Response(
      JSON.stringify({
        ok: true,
        worker: "marginalia-cron",
        schedule: "0 6 * * * (UTC)",
        note: "Ingestion runs on schedule. Use the admin-gated /api/cron/ingest for manual runs.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
