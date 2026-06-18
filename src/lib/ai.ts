/**
 * Workers AI helpers.
 * Runs Cloudflare-hosted Llama models at the edge, no external API key.
 * Two jobs:
 *   1. explainPaper(): turn a paper's metadata into an ORIGINAL plain-language
 *      explainer as strict JSON (never copies the abstract).
 *   2. explainSimpler(): re-explain a single sentence for the on-page assistant.
 */
import type { Ai } from "@cloudflare/workers-types";
import type { ArxivPaper } from "./arxiv";
import type { Difficulty } from "./types";

// Workers AI text models. The daily pipeline rotates which model writes first
// (so the voice varies day to day and we can compare quality), and always
// falls back to the proven Llama 3.3 70B if a newer model is unavailable or
// returns something unusable.
const SAFE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MODEL_POOL = [
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
  SAFE_MODEL,
];

/** Today's model order: a different model leads each day, SAFE_MODEL tried last. */
function dailyModels(): string[] {
  const day = Math.floor(Date.now() / 86_400_000);
  const n = MODEL_POOL.length;
  const shift = ((day % n) + n) % n;
  const rotated = MODEL_POOL.slice(shift).concat(MODEL_POOL.slice(0, shift));
  const ordered = rotated.filter((m) => m !== SAFE_MODEL);
  ordered.push(SAFE_MODEL); // always attempt the proven model last
  return ordered;
}

interface RunOpts {
  system: string;
  user: string;
  max_tokens: number;
  temperature: number;
}

/**
 * Run a chat completion across today's models, returning the first output the
 * `parse` function accepts. `parse` must THROW on unusable output so the next
 * model is tried. Returns the parsed value plus the model that produced it.
 */
async function generate<T>(
  ai: Ai,
  opts: RunOpts,
  parse: (out: unknown) => T,
): Promise<{ value: T; model: string }> {
  let lastErr: unknown = null;
  for (const model of dailyModels()) {
    try {
      const response = (await ai.run(model as any, {
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        max_tokens: opts.max_tokens,
        temperature: opts.temperature,
      } as any)) as any;
      const out = response?.response ?? response?.output ?? response;
      const value = parse(out);
      return { value, model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All models failed to produce usable output.");
}

// Writer voice, shaped by the humanizer guidance so the daily output reads like
// a person wrote it, not an AI.
const WRITER_SYSTEM = `You write for "Marginalia", a site that explains AI research to people who know nothing about AI. Write like a clear, friendly human, not like an AI assistant.

Hard rules:
- No em dashes. Use commas, periods, colons, or parentheses.
- No emojis.
- Avoid AI-tell words and filler: delve, leverage, underscore, testament, pivotal, crucial, vital, intricate, realm, landscape, navigate, foster, showcase, robust, seamless, "plays a key role", "stands as", "serves as", "it is important to note", "ever-evolving", "rich tapestry".
- Do not pad with significance ("marks a turning point", "reflects a broader trend") or "-ing" tails that add fake depth.
- Vary sentence length. Use plain words. Be concrete and accurate.
- Output ONLY the requested JSON, with no commentary.`;

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
  return `Explain this AI paper for a total beginner who has never studied AI. Use your own words. Do NOT copy or closely paraphrase the abstract.

Return ONLY valid minified JSON with exactly these keys:
- "plain_title": a clear, jargon-free title a normal person would click
- "hook": ONE plain sentence on why a normal person should care
- "whats_going_on": a COMPREHENSIVE plain-language summary, 4 to 6 short paragraphs separated by blank lines (\\n\\n). After reading only this, a beginner should fully understand what the paper is, what the researchers actually did, how it works (use one everyday analogy), and what they found (include real numbers or results when the abstract gives them). The FIRST time you use ANY technical or professional term, put it in **bold** and immediately follow it with a short plain-language explanation in parentheses, for example: a **transformer** (a kind of AI model that learns by weighing which words matter most to each other). Do this for every piece of jargon so the reader never gets stuck.
- "why_it_matters": a markdown BULLET LIST of 4 to 6 points, each line starting with "- ". Each point connects the work to everyday life with a concrete, relatable example (your phone, a doctor, school, translation, maps, money, accessibility) and stays accurate. Keep each point to one or two sentences and gloss any term in parentheses.
- "glossary_terms": array of up to 5 {"term","definition"} for the jargon you bolded; each definition one plain sentence
- "difficulty": one of "Beginner","Intermediate","Advanced"
- "direction_slugs": array of 1-3 slugs from this list that best fit: ${KNOWN_DIRECTION_SLUGS.join(", ")}
- "is_ai4good": true if the work clearly helps society (health, climate, education, accessibility, fairness), else false
- "read_minutes": estimated reading time as an integer (3-8)

PAPER TITLE: ${paper.title}
PAPER ABSTRACT: ${paper.abstract}

JSON:`;
}

function extractJson(text: unknown): unknown {
  // Some models return the JSON already parsed as an object; pass it through.
  if (text && typeof text === "object") return text;
  const str = typeof text === "string" ? text : String(text ?? "");
  // Models sometimes wrap JSON in prose/fences. Grab the first {...} block.
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : str;
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
        .slice(0, 5)
        .map((g: any) => ({ term: String(g.term), definition: String(g.definition) }))
    : [];

  const readMinutes = Number.isFinite(raw?.read_minutes)
    ? Math.min(8, Math.max(3, Math.round(raw.read_minutes)))
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
  const { value: draft, model } = await generate(
    ai,
    {
      system: WRITER_SYSTEM,
      user: buildPrompt(paper),
      max_tokens: 1900,
      temperature: 0.45,
    },
    (out) => {
      const d = coerceDraft(extractJson(out));
      if (!d.plain_title || d.whats_going_on.length < 200) {
        throw new Error("Explainer too thin; trying another model.");
      }
      return d;
    },
  );
  return { draft, model };
}

/** On-page "Explain it simpler", scoped to the displayed sentence. */
export async function explainSimpler(
  ai: Ai,
  sentence: string,
  context: string,
): Promise<string> {
  const user = `A reader is on a plain-language AI article and wants this sentence explained even more simply, in 2 to 3 short sentences, no jargon. Stay faithful to the meaning. Do not add new claims. No em dashes, no emojis.

ARTICLE TOPIC: ${context}
SENTENCE: "${sentence}"

Simpler explanation:`;

  const { value } = await generate(
    ai,
    {
      system: "You explain things simply and accurately for beginners. No em dashes, no emojis.",
      user,
      max_tokens: 240,
      temperature: 0.5,
    },
    (out) => {
      const s = (typeof out === "string" ? out : String(out ?? "")).trim();
      if (!s) throw new Error("empty");
      return s;
    },
  );
  return value;
}

// ---------------------------------------------------------------------------
// Per-article comprehension quiz
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

function parseQuizArray(out: unknown): any[] {
  if (Array.isArray(out)) return out;
  if (out && typeof out === "object" && Array.isArray((out as any).questions)) {
    return (out as any).questions;
  }
  const str = typeof out === "string" ? out : String(out ?? "");
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : str;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  const os = candidate.indexOf("{");
  const oe = candidate.lastIndexOf("}");
  if (os !== -1 && oe !== -1) {
    const obj = JSON.parse(candidate.slice(os, oe + 1));
    if (Array.isArray(obj.questions)) return obj.questions;
  }
  throw new Error("No quiz array in model output");
}

function coerceQuestion(raw: any): QuizQuestion | null {
  if (!raw || typeof raw.question !== "string" || !raw.question.trim()) return null;
  const options = Array.isArray(raw.options)
    ? raw.options.map((o: unknown) => String(o).trim()).filter(Boolean).slice(0, 4)
    : [];
  if (options.length < 2) return null;
  let ci = Number(raw.correct_index ?? raw.correct ?? raw.answer ?? 0);
  if (!Number.isInteger(ci) || ci < 0 || ci >= options.length) ci = 0;
  return {
    question: raw.question.trim(),
    options,
    correct_index: ci,
    explanation: String(raw.explanation ?? "").trim(),
  };
}

/** Generate three comprehension questions ABOUT this specific article. */
export async function generateQuiz(
  ai: Ai,
  article: { plain_title: string; hook: string; whats_going_on: string; why_it_matters: string },
): Promise<QuizQuestion[]> {
  const prompt = `Write a short comprehension quiz for the plain-language explainer below. The questions MUST be about THIS specific article, what the researchers did, how it works, and why it matters. Do NOT ask about the website, "Marginalia", arXiv, or generic trivia.

Write exactly 3 multiple-choice questions. Each has exactly 3 options with ONE correct answer. Make the wrong options plausible but clearly wrong to someone who read the article.

Return ONLY valid minified JSON: an array of exactly 3 objects, each:
{"question": string, "options": [string, string, string], "correct_index": 0-2, "explanation": one short sentence on why that answer is right}

ARTICLE TITLE: ${article.plain_title}
HOOK: ${article.hook}
WHAT'S GOING ON: ${article.whats_going_on.slice(0, 1600)}
WHY IT MATTERS: ${article.why_it_matters.slice(0, 800)}

JSON:`;

  const { value } = await generate(
    ai,
    {
      system: "You output only valid JSON. No commentary. No em dashes, no emojis.",
      user: prompt,
      max_tokens: 800,
      temperature: 0.3,
    },
    (out) => {
      const qs = (parseQuizArray(out).map(coerceQuestion).filter(Boolean) as QuizQuestion[]).slice(0, 3);
      if (!qs.length) throw new Error("No usable quiz questions.");
      return qs;
    },
  );
  return value;
}
