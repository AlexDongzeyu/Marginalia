/**
 * POST /api/articles/[id]/review, editorial actions on an AI draft.
 * Admin-gated. Actions: publish, reject, set-aotd, update (edit fields).
 * This is the quality bar + anti-hallucination check: nothing goes live
 * without a human here.
 */
import type { APIContext } from "astro";
import { getSessionUser, isStaff } from "../../../../lib/auth";

export const prerender = false;

async function isAuthorized(ctx: APIContext): Promise<boolean> {
  const { env } = ctx.locals.runtime;
  // Editors/admins are authorized by their signed-in session cookie.
  const user = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (isStaff(user)) return true;
  // Fallback: the shared ADMIN_TOKEN secret (Bearer header).
  const expected = env.ADMIN_TOKEN;
  if (expected && expected !== "change-me-in-cloudflare-dashboard") {
    const bearer = (ctx.request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (bearer === expected) return true;
  }
  return false;
}

export async function POST(ctx: APIContext) {
  if (!(await isAuthorized(ctx))) return json({ error: "Unauthorized" }, 401);

  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "Bad id" }, 400);

  const { env } = ctx.locals.runtime;
  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");
  const reviewer = String(body.reviewer ?? "Editorial").slice(0, 80);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  try {
    switch (action) {
      case "publish": {
        await env.DB
          .prepare(
            `UPDATE articles
             SET status='published', reviewer_name=?, published_at=COALESCE(published_at, ?)
             WHERE id=?`,
          )
          .bind(reviewer, now, id)
          .run();
        return json({ ok: true, status: "published" });
      }
      case "reject": {
        await env.DB
          .prepare(`UPDATE articles SET status='rejected', reviewer_name=? WHERE id=?`)
          .bind(reviewer, id)
          .run();
        return json({ ok: true, status: "rejected" });
      }
      case "set-aotd": {
        // Clear any current AOTD, then set this one (must be published).
        await env.DB.prepare(`UPDATE articles SET is_article_of_day=0 WHERE is_article_of_day=1`).run();
        await env.DB
          .prepare(
            `UPDATE articles SET is_article_of_day=1, day_date=?,
             status='published', reviewer_name=COALESCE(reviewer_name, ?),
             published_at=COALESCE(published_at, ?)
             WHERE id=?`,
          )
          .bind(today, reviewer, now, id)
          .run();
        return json({ ok: true, status: "article_of_day" });
      }
      case "update": {
        // Allow editing the plain-language fields before publishing.
        const fields = ["plain_title", "hook", "whats_going_on", "why_it_matters", "difficulty"];
        const sets: string[] = [];
        const binds: unknown[] = [];
        for (const f of fields) {
          if (typeof body[f] === "string") {
            sets.push(`${f}=?`);
            binds.push(body[f]);
          }
        }
        if (sets.length === 0) return json({ error: "Nothing to update" }, 400);
        binds.push(id);
        await env.DB.prepare(`UPDATE articles SET ${sets.join(", ")} WHERE id=?`).bind(...binds).run();
        return json({ ok: true, status: "updated" });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
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
