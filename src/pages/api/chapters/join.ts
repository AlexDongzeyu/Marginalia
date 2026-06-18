/**
 * POST /api/chapters/join, a member requests to join a chapter.
 * Stored as 'pending' for the chapter lead to review.
 */
import type { APIContext } from "astro";
import { getSessionUser } from "../../../lib/auth";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;
  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!me) return json({ error: "Please sign in to join a chapter." }, 401);

  let slug = "";
  try {
    const b = (await ctx.request.json()) as { slug?: string };
    slug = String(b.slug ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const chapter = await env.DB.prepare(`SELECT id FROM chapters WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: number }>();
  if (!chapter) return json({ error: "Chapter not found." }, 404);

  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO chapter_join_requests (chapter_id, user_id, status)
       VALUES (?, ?, 'pending')`,
    )
      .bind(chapter.id, me.id)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: "Could not send your request right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
