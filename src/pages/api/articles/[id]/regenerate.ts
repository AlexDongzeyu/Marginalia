/**
 * POST /api/articles/[id]/regenerate, re-write an article's plain-language
 * content with the current prompt + model. Staff only. Uses the real arXiv
 * abstract when the article has one, otherwise re-explains from the content we
 * already store (so hand-written seed articles can be upgraded too). Clears the
 * cached quiz. Title and slug stay put.
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
    `SELECT id, arxiv_id, original_title, plain_title, whats_going_on, why_it_matters
     FROM articles WHERE id = ? LIMIT 1`,
  )
    .bind(id)
    .first<{
      id: number;
      arxiv_id: string | null;
      original_title: string;
      plain_title: string;
      whats_going_on: string;
      why_it_matters: string;
    }>();
  if (!row) return json({ error: "Article not found." }, 404);

  // Prefer the real arXiv abstract; otherwise re-explain from what we already have.
  let paper: { title: string; abstract: string } | null = null;
  if (row.arxiv_id) {
    const fetched = await fetchArxivById(row.arxiv_id);
    if (fetched?.abstract) {
      paper = { title: fetched.title || row.original_title, abstract: fetched.abstract };
    }
  }
  if (!paper) {
    const strip = (s: string) =>
      (s || "").replace(/\*\*/g, "").replace(/^[-*]\s+/gm, "").replace(/\s+/g, " ").trim();
    const existing = `${strip(row.whats_going_on)} ${strip(row.why_it_matters)}`.trim();
    if (existing.length < 40) {
      return json({ error: "Not enough content to regenerate this article." }, 400);
    }
    paper = { title: row.original_title || row.plain_title, abstract: existing };
  }

  try {
    const { draft, model } = await explainPaper(env.AI, paper as any);
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
