/**
 * POST /api/articles/[id]/regenerate, re-write an article's plain-language
 * content with the current prompt + model. Staff only. Re-fetches the abstract
 * from arXiv, regenerates the summary + why-it-matters, and clears the cached
 * quiz so it rebuilds from the fresh content. Title and slug stay put.
 */
import type { APIContext } from "astro";
import { getSessionUser, isStaff } from "../../../../lib/auth";
import { fetchArxivById } from "../../../../lib/arxiv";
import { explainPaper } from "../../../../lib/ai";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;

  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!isStaff(me)) return json({ error: "Unauthorized" }, 401);

  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "Bad id" }, 400);
  if (!env.AI) return json({ error: "Workers AI is not configured here." }, 503);

  const row = await env.DB.prepare(
    `SELECT id, arxiv_id, original_title, authors FROM articles WHERE id = ? LIMIT 1`,
  )
    .bind(id)
    .first<{ id: number; arxiv_id: string | null; original_title: string; authors: string }>();
  if (!row) return json({ error: "Article not found." }, 404);
  if (!row.arxiv_id) return json({ error: "This article has no arXiv id to regenerate from." }, 400);

  const paper = await fetchArxivById(row.arxiv_id);
  if (!paper || !paper.abstract) {
    return json({ error: "Could not fetch this paper from arXiv right now." }, 502);
  }

  try {
    const { draft, model } = await explainPaper(env.AI, paper);
    await env.DB.prepare(
      `UPDATE articles
       SET hook = ?, whats_going_on = ?, why_it_matters = ?, read_minutes = ?, ai_model = ?
       WHERE id = ?`,
    )
      .bind(draft.hook, draft.whats_going_on, draft.why_it_matters, draft.read_minutes, model, id)
      .run();
    // Drop the cached quiz so it regenerates from the new summary.
    await env.DB.prepare(`DELETE FROM article_quizzes WHERE article_id = ?`).bind(id).run();
    return json({ ok: true, model });
  } catch (e) {
    return json({ error: (e as Error).message || "Regeneration failed." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
