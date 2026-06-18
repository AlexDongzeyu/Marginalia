/**
 * POST /api/chapters/review, a chapter lead approves or rejects a join request.
 * On approval the member is added to the chapter (chapter_members + users.chapter_id).
 * Body: { requestId: number, action: "approve" | "reject" }
 */
import type { APIContext } from "astro";
import { getSessionUser } from "../../../lib/auth";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;
  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!me) return json({ error: "Please sign in." }, 401);

  let requestId = 0;
  let action = "";
  try {
    const b = (await ctx.request.json()) as { requestId?: number; action?: string };
    requestId = Number(b.requestId ?? 0);
    action = String(b.action ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!requestId || (action !== "approve" && action !== "reject")) {
    return json({ error: "Invalid request." }, 400);
  }

  const req = await env.DB.prepare(
    `SELECT r.id, r.chapter_id, r.user_id, c.lead_id
     FROM chapter_join_requests r JOIN chapters c ON c.id = r.chapter_id
     WHERE r.id = ? AND r.status = 'pending' LIMIT 1`,
  )
    .bind(requestId)
    .first<{ id: number; chapter_id: number; user_id: number; lead_id: number | null }>();

  if (!req) return json({ error: "Request not found." }, 404);
  if (req.lead_id !== me.id && me.role !== "admin") {
    return json({ error: "Only the chapter lead can review requests." }, 403);
  }

  try {
    if (action === "approve") {
      await env.DB.batch([
        env.DB.prepare(`UPDATE chapter_join_requests SET status = 'approved' WHERE id = ?`).bind(req.id),
        env.DB.prepare(
          `INSERT OR IGNORE INTO chapter_members (chapter_id, user_id, role) VALUES (?, ?, 'member')`,
        ).bind(req.chapter_id, req.user_id),
        env.DB.prepare(`UPDATE users SET chapter_id = ? WHERE id = ?`).bind(req.chapter_id, req.user_id),
      ]);
    } else {
      await env.DB.prepare(`UPDATE chapter_join_requests SET status = 'rejected' WHERE id = ?`)
        .bind(req.id)
        .run();
    }
    return json({ ok: true });
  } catch {
    return json({ error: "Could not update the request." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
