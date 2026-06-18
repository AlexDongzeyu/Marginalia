/**
 * POST /api/explain-simpler — the on-page assistant.
 * Re-explains a single sentence from an article, scoped to that article's
 * topic. Labeled AI; explains the displayed content only.
 */
import type { APIContext } from "astro";
import { getPublishedArticleBySlug } from "../../lib/db";
import { explainSimpler } from "../../lib/ai";

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const { env } = locals.runtime;

  let sentence = "";
  let slug = "";
  try {
    const body = (await request.json()) as { sentence?: string; slug?: string };
    sentence = (body.sentence ?? "").trim().slice(0, 600);
    slug = (body.slug ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (sentence.length < 3) {
    return json({ error: "Please paste a sentence to explain." }, 400);
  }

  // Use the article's plain title as topic context (and to confirm it exists).
  let context = "an AI research paper";
  if (slug) {
    const article = await getPublishedArticleBySlug(env.DB, slug);
    if (article) context = article.plain_title;
  }

  if (!env.AI) {
    return json({ error: "The assistant isn't configured in this environment." }, 503);
  }

  try {
    const explanation = await explainSimpler(env.AI, sentence, context);
    if (!explanation) {
      return json({ error: "Couldn't generate an explanation. Try another sentence." }, 502);
    }
    return json({ explanation });
  } catch {
    return json({ error: "The assistant is unavailable right now." }, 503);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
