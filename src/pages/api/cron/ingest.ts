/**
 * POST /api/cron/ingest — manual trigger for the daily ingest pipeline.
 * Admin-gated via the ADMIN_TOKEN secret (Bearer header or ?token=).
 * The unattended daily run is handled by the separate cron Worker
 * (workers/cron.ts); this route lets an editor kick it off on demand.
 */
import type { APIContext } from "astro";
import { runIngest } from "../../../lib/ingest";

export const prerender = false;

function isAuthorized(ctx: APIContext): boolean {
  const { env } = ctx.locals.runtime;
  const expected = env.ADMIN_TOKEN;
  if (!expected || expected === "change-me-in-cloudflare-dashboard") return false;
  const header = ctx.request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const qp = new URL(ctx.request.url).searchParams.get("token") ?? "";
  return bearer === expected || qp === expected;
}

export async function POST(ctx: APIContext) {
  if (!isAuthorized(ctx)) {
    return json({ error: "Unauthorized" }, 401);
  }
  const { env } = ctx.locals.runtime;
  if (!env.AI) {
    return json({ error: "Workers AI binding is not configured in this environment." }, 503);
  }
  try {
    const result = await runIngest(env.DB, env.AI, { maxFetch: 25, maxDraft: 4 });
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
