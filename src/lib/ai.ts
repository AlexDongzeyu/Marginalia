/**
 * Workers AI helpers.
 * Runs Cloudflare-hosted Llama models at the edge — no external API key.
 * Two jobs:
 *   1. explainPaper(): turn a paper's metadata into an ORIGINAL plain-language
 *      explainer as strict JSON (never copies the abstract).
 *   2. explainSimpler(): re-explain a single sentence for the on-page assistant.
 */
import type { Ai } from "@cloudflare/workers-types";
import type { ArxivPaper } from "./arxiv";
import type { Difficulty } from "./types";

// Instruct model available on Workers AI.
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export interface ExplainerDraft {
  plain_title: string;
  hook: string;
  whats_going_on: string;
  why_it_matters: string;
  glossary_terms: { term: string; definition: string }[];
  difficulty: Difficulty;
  direction_slugs: string[];
  is_ai4good: boolean;
  read_minutes: number;
}

const VALID_DIFFICULTY: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

/** Known direction slugs the model may tag (kept in sync with seed.sql). */
export const KNOWN_DIRECTION_SLUGS = [
  "machine-learning",
  "deep-learning",
  "reinforcement-learning",
  "large-language-models",
  "computer-vision",
  "generative-models",
  "ai-agents",
  "efficient-ai",
  "ai-for-health",
  "ai-for-climate",
  "ai-for-education",
  "ai-for-accessibility",
  "ai-alignment",
  "interpretability",
  "fairness",
];

function buildPrompt(paper: ArxivPaper): string {
  return `You are an editor for "Marginalia", a site that explains AI research to curious beginners (about a grade-9 reading level). You will be given a paper's title and abstract. Write an ORIGINAL plain-language explainer. Do NOT copy or paraphrase the abstract sentence-by-sentence — explain the ideas in your own simple words.

Return ONLY valid minified JSON with exactly these keys:
- "plain_title": a rewritten, jargon-free title (a real person would click it)
- "hook": ONE sentence on why a normal person should care
- "whats_going_on": 2-4 short paragraphs, simple words, separated by blank lines (use \\n\\n). You may use **bold** for key terms.
- "why_it_matters": 1-2 short paragraphs on the real-world stakes (especially any social-good angle)
- "glossary_terms": array of up to 4 {"term","definition"} for jargon you used; definitions 1 sentence, plain
- "difficulty": one of "Beginner","Intermediate","Advanced"
- "direction_slugs": array of 1-3 slugs from this list that best fit: ${KNOWN_DIRECTION_SLUGS.join(", ")}
- "is_ai4good": true if the work clearly helps society (health, climate, education, accessibility, fairness), else false
- "read_minutes": estimated reading time as an integer (3-7)

PAPER TITLE: ${paper.title}
PAPER ABSTRACT: ${paper.abstract}

JSON:`;
}

function extractJson(text: string): unknown {
  // Models sometimes wrap JSON in prose/fences. Grab the first {...} block.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

function coerceDraft(raw: any): ExplainerDraft {
  const difficulty: Difficulty = VALID_DIFFICULTY.includes(raw?.difficulty)
    ? raw.difficulty
    : "Beginner";

  const directionSlugs: string[] = Array.isArray(raw?.direction_slugs)
    ? raw.direction_slugs.filter((s: unknown) => KNOWN_DIRECTION_SLUGS.includes(String(s)))
    : [];

  const glossary = Array.isArray(raw?.glossary_terms)
    ? raw.glossary_terms
        .filter((g: any) => g && g.term && g.definition)
        .slice(0, 4)
        .map((g: any) => ({ term: String(g.term), definition: String(g.definition) }))
    : [];

  const readMinutes = Number.isFinite(raw?.read_minutes)
    ? Math.min(7, Math.max(3, Math.round(raw.read_minutes)))
    : 4;

  return {
    plain_title: String(raw?.plain_title ?? "").trim() || "Untitled explainer",
    hook: String(raw?.hook ?? "").trim(),
    whats_going_on: String(raw?.whats_going_on ?? "").trim(),
    why_it_matters: String(raw?.why_it_matters ?? "").trim(),
    glossary_terms: glossary,
    difficulty,
    direction_slugs: directionSlugs.length ? directionSlugs : ["machine-learning"],
    is_ai4good: Boolean(raw?.is_ai4good),
    read_minutes: readMinutes,
  };
}

export interface ExplainResult {
  draft: ExplainerDraft;
  model: string;
}

export async function explainPaper(ai: Ai, paper: ArxivPaper): Promise<ExplainResult> {
  const response = (await ai.run(MODEL as any, {
    messages: [
      { role: "system", content: "You output only valid JSON. No commentary." },
      { role: "user", content: buildPrompt(paper) },
    ],
    max_tokens: 1100,
    temperature: 0.4,
  } as any)) as { response?: string };

  const text = response?.response ?? "";
  const raw = extractJson(text);
  return { draft: coerceDraft(raw), model: MODEL };
}

/** On-page "Explain it simpler" — scoped to the displayed sentence. */
export async function explainSimpler(
  ai: Ai,
  sentence: string,
  context: string,
): Promise<string> {
  const prompt = `A reader is on a plain-language AI article and wants this sentence explained even more simply, in 2-3 short sentences, no jargon. Stay faithful to the meaning; do not add new claims.

ARTICLE TOPIC: ${context}
SENTENCE: "${sentence}"

Simpler explanation:`;

  const response = (await ai.run(MODEL as any, {
    messages: [
      { role: "system", content: "You explain things simply and accurately for beginners." },
      { role: "user", content: prompt },
    ],
    max_tokens: 220,
    temperature: 0.5,
  } as any)) as { response?: string };

  return (response?.response ?? "").trim();
}
