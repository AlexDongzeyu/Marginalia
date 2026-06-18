/**
 * POST /api/annotations, leave a plain-language note on an article.
 * Requires a signed-in member. Notes are short (<= 280 chars) and show up in
 * the article's right margin.
 */
import type { APIContext } from "astro";
import { getSessionUser } from "../../lib/auth";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;

  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!me) return json({ error: "Please sign in to add a note." }, 401);

  let slug = "";
  let body = "";
  try {
    const b = (await ctx.request.json()) as { slug?: string; body?: string };
    slug = String(b.slug ?? "").trim();
    body = String(b.body ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (body.length < 3) return json({ error: "Write a little more." }, 400);
  if (body.length > 280) body = body.slice(0, 280);

  const article = await env.DB.prepare(
    `SELECT id FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`,
  )
    .bind(slug)
    .first<{ id: number }>();
  if (!article) return json({ error: "Article not found." }, 404);

  try {
    const res = await env.DB.prepare(
      `INSERT INTO annotations (article_id, author_id, author_name, body, status)
       VALUES (?, ?, ?, ?, 'approved')`,
    )
      .bind(article.id, me.id, me.name, body)
      .run();
    return json({
      ok: true,
      annotation: {
        id: res.meta.last_row_id,
        author_name: me.name,
        body,
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return json({ error: "Could not save your note right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
