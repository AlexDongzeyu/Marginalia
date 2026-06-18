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

  // A manual HTTP entrypoint for testing (no secret here — protect via Cloudflare
  // Access or remove before exposing publicly).
  async fetch(_req: Request, env: CronEnv): Promise<Response> {
    const result = await runIngest(env.DB, env.AI, { maxFetch: 10, maxDraft: 2 });
    return new Response(JSON.stringify(result, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
