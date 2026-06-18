/**
 * GET /api/articles/[id]/quiz, the per-article comprehension quiz.
 * Generated once with Workers AI from the article's own content, then cached
 * in D1 (article_quizzes) so later readers get it instantly.
 */
import type { APIContext } from "astro";
import { generateQuiz } from "../../../../lib/ai";

export const prerender = false;

export async function GET(ctx: APIContext) {
  const { env } = ctx.locals.runtime;
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "Bad id" }, 400);

  // Serve the cached quiz if we have one.
  const cached = await env.DB.prepare(
    `SELECT questions_json FROM article_quizzes WHERE article_id = ?`,
  )
    .bind(id)
    .first<{ questions_json: string }>();
  if (cached?.questions_json) {
    try {
      const questions = JSON.parse(cached.questions_json);
      if (Array.isArray(questions) && questions.length) return json({ questions });
    } catch {
      /* fall through and regenerate */
    }
  }

  const article = await env.DB.prepare(
    `SELECT plain_title, hook, whats_going_on, why_it_matters
     FROM articles WHERE id = ? AND status = 'published' LIMIT 1`,
  )
    .bind(id)
    .first<{
      plain_title: string;
      hook: string;
      whats_going_on: string;
      why_it_matters: string;
    }>();
  if (!article) return json({ error: "Article not found." }, 404);

  if (!env.AI) return json({ error: "The quiz isn't available in this environment." }, 503);

  try {
    const questions = await generateQuiz(env.AI, article);
    if (!questions.length) return json({ error: "Could not build a quiz for this one." }, 502);
    await env.DB.prepare(
      `INSERT OR REPLACE INTO article_quizzes (article_id, questions_json) VALUES (?, ?)`,
    )
      .bind(id, JSON.stringify(questions))
      .run();
    return json({ questions });
  } catch {
    return json({ error: "The quiz is unavailable right now." }, 503);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
