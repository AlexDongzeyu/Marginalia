/**
 * POST /api/explainers/claim, a member claims a published paper to write a
 * deeper community explainer. Recorded for editors; one claim per member/paper.
 * Body: { slug: string }
 */
import type { APIContext } from "astro";
import { getSessionUser } from "../../../lib/auth";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;
  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!me) return json({ error: "Please sign in to claim a paper." }, 401);

  let slug = "";
  try {
    const b = (await ctx.request.json()) as { slug?: string };
    slug = String(b.slug ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const article = await env.DB.prepare(
    `SELECT id FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`,
  )
    .bind(slug)
    .first<{ id: number }>();
  if (!article) return json({ error: "Paper not found." }, 404);

  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO explainer_claims (article_id, user_id, author_name, status)
       VALUES (?, ?, ?, 'claimed')`,
    )
      .bind(article.id, me.id, me.name)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: "Could not claim this paper right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
