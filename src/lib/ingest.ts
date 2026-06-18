/**
 * The daily ingest pipeline (spec §6.1), shared by the manual API route and
 * the scheduled cron worker.
 *
 * Flow: fetch arXiv candidates → dedup against the DB (enforces "never on the
 * site twice") → score & select → explain with Workers AI → store as DRAFT
 * (status='draft') for human review. Nothing auto-publishes.
 */
import type { Ai, D1Database } from "@cloudflare/workers-types";
import { fetchRecentArxiv, type ArxivPaper } from "./arxiv";
import { explainPaper } from "./ai";

export interface IngestResult {
  fetched: number;
  deduped: number;
  drafted: number;
  aotdSlug: string | null;
  errors: string[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Lightweight heuristic score for ordering candidates (0-1). */
function recencyScore(paper: ArxivPaper): number {
  if (!paper.published) return 0.5;
  const days = (Date.now() - new Date(paper.published).getTime()) / 86_400_000;
  return Math.max(0, 1 - days / 7); // newer = higher
}

async function existingArxivIds(db: D1Database, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const placeholders = ids.map(() => "?").join(",");
  const rows = await db
    .prepare(`SELECT arxiv_id FROM articles WHERE arxiv_id IN (${placeholders})`)
    .bind(...ids)
    .all<{ arxiv_id: string }>();
  return new Set((rows.results ?? []).map((r) => r.arxiv_id));
}

async function uniqueSlug(db: D1Database, base: string): Promise<string> {
  let slug = base || "explainer";
  let n = 1;
  // Try a few suffixes; collisions are rare.
  while (n < 50) {
    const hit = await db
      .prepare(`SELECT 1 FROM articles WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    if (!hit) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export interface IngestOptions {
  /** How many papers to fetch from arXiv. */
  maxFetch?: number;
  /** How many to actually draft per run (keeps Workers AI usage modest). */
  maxDraft?: number;
}

export async function runIngest(
  db: D1Database,
  ai: Ai,
  opts: IngestOptions = {},
): Promise<IngestResult> {
  const maxFetch = opts.maxFetch ?? 25;
  const maxDraft = opts.maxDraft ?? 4;
  const errors: string[] = [];

  let candidates: ArxivPaper[] = [];
  try {
    candidates = await fetchRecentArxiv(undefined, maxFetch);
  } catch (e) {
    errors.push(`fetch: ${(e as Error).message}`);
  }
  const fetched = candidates.length;

  // Dedup against DB
  const seen = await existingArxivIds(
    db,
    candidates.map((c) => c.arxivId),
  ).catch(() => new Set<string>());
  const fresh = candidates.filter((c) => !seen.has(c.arxivId));
  const deduped = fetched - fresh.length;

  // Score + select
  fresh.sort((a, b) => recencyScore(b) - recencyScore(a));
  const selected = fresh.slice(0, maxDraft);

  let drafted = 0;
  let aotdSlug: string | null = null;
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < selected.length; i++) {
    const paper = selected[i];
    try {
      const { draft, model } = await explainPaper(ai, paper);
      const slug = await uniqueSlug(db, slugify(draft.plain_title));

      const insert = await db
        .prepare(
          `INSERT INTO articles
            (slug, arxiv_id, original_title, plain_title, hook, whats_going_on,
             why_it_matters, difficulty, read_minutes, is_ai4good, is_foundational,
             source_url, pdf_url, authors, institution, published_date, status,
             ai_model, day_date)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          slug,
          paper.arxivId,
          paper.title,
          draft.plain_title,
          draft.hook,
          draft.whats_going_on,
          draft.why_it_matters,
          draft.difficulty,
          draft.read_minutes,
          draft.is_ai4good ? 1 : 0,
          0,
          paper.sourceUrl,
          paper.pdfUrl,
          JSON.stringify(paper.authors),
          null,
          paper.published,
          "draft",
          model,
          today,
        )
        .run();

      const articleId = insert.meta.last_row_id as number;

      // Link to directions
      for (const dirSlug of draft.direction_slugs) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO article_directions (article_id, direction_id)
             SELECT ?, id FROM directions WHERE slug = ?`,
          )
          .bind(articleId, dirSlug)
          .run();
      }

      // Propose glossary terms (pending review)
      for (const g of draft.glossary_terms) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO glossary_terms (term, definition, status)
             VALUES (?, ?, 'pending')`,
          )
          .bind(g.term, g.definition)
          .run();
      }

      // First (highest-scored) fresh draft is the proposed Article of the Day.
      if (i === 0) aotdSlug = slug;
      drafted += 1;
    } catch (e) {
      errors.push(`${paper.arxivId}: ${(e as Error).message}`);
    }
  }

  // Audit log
  try {
    await db
      .prepare(
        `INSERT INTO ingest_log (fetched, deduped, selected, errors)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(fetched, deduped, drafted, errors.join(" | "))
      .run();
  } catch {
    /* non-fatal */
  }

  // Refresh momentum (articles per direction, last 30 days)
  try {
    await db
      .prepare(
        `UPDATE directions SET momentum = (
           SELECT COUNT(*) FROM article_directions ad
           JOIN articles a ON a.id = ad.article_id
           WHERE ad.direction_id = directions.id
             AND a.status = 'published'
             AND a.published_at >= datetime('now','-30 days')
         )`,
      )
      .run();
  } catch {
    /* non-fatal */
  }

  return { fetched, deduped, drafted, aotdSlug, errors };
}
