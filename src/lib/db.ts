/**
 * D1 data-access layer for Marginalia.
 * All queries live here so pages/APIs stay thin. Every function takes the D1
 * binding explicitly (from `Astro.locals.runtime.env.DB`).
 */
import type { D1Database } from "@cloudflare/workers-types";
import {
  hydrateArticle,
  parseAuthors,
  type Article,
  type ArticleRow,
  type DirectionRow,
  type DirectionWithCount,
  type GlossaryTerm,
} from "./types";

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function getArticleOfDay(db: D1Database): Promise<Article | null> {
  // Prefer a pick explicitly marked for today; otherwise fall back to the most
  // recently published article so "Today" never goes stale on an old seed paper.
  let row = await db
    .prepare(
      `SELECT * FROM articles
       WHERE status = 'published' AND is_article_of_day = 1
         AND day_date = date('now')
       ORDER BY published_at DESC
       LIMIT 1`,
    )
    .first<ArticleRow>();
  if (!row) {
    row = await db
      .prepare(
        `SELECT * FROM articles WHERE status = 'published'
         ORDER BY published_at DESC, created_at DESC
         LIMIT 1`,
      )
      .first<ArticleRow>();
  }
  if (!row) return null;
  const article = hydrateArticle(row);
  article.directions = await getDirectionsForArticle(db, article.id);
  return article;
}

export async function getPublishedArticleBySlug(
  db: D1Database,
  slug: string,
): Promise<Article | null> {
  const row = await db
    .prepare(`SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`)
    .bind(slug)
    .first<ArticleRow>();
  if (!row) return null;
  const article = hydrateArticle(row);
  article.directions = await getDirectionsForArticle(db, article.id);
  return article;
}

export interface FeedFilters {
  direction?: string; // slug
  difficulty?: string;
  ai4good?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listPublishedArticles(
  db: D1Database,
  filters: FeedFilters = {},
): Promise<Article[]> {
  const where: string[] = ["a.status = 'published'"];
  const binds: unknown[] = [];

  if (filters.direction) {
    where.push(
      `a.id IN (SELECT ad.article_id FROM article_directions ad
                JOIN directions d ON d.id = ad.direction_id WHERE d.slug = ?)`,
    );
    binds.push(filters.direction);
  }
  if (filters.difficulty) {
    where.push(`a.difficulty = ?`);
    binds.push(filters.difficulty);
  }
  if (filters.ai4good) {
    where.push(`a.is_ai4good = 1`);
  }
  if (filters.search) {
    where.push(`(a.plain_title LIKE ? OR a.hook LIKE ? OR a.whats_going_on LIKE ?)`);
    const like = `%${filters.search}%`;
    binds.push(like, like, like);
  }

  const limit = Math.min(filters.limit ?? 30, 100);
  const offset = filters.offset ?? 0;

  const rows = await db
    .prepare(
      `SELECT a.* FROM articles a
       WHERE ${where.join(" AND ")}
       ORDER BY a.published_at DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all<ArticleRow>();

  return (rows.results ?? []).map(hydrateArticle);
}

export async function getLatestArticles(
  db: D1Database,
  limit = 6,
): Promise<Article[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM articles WHERE status = 'published'
       ORDER BY published_at DESC, created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<ArticleRow>();
  return (rows.results ?? []).map(hydrateArticle);
}

export async function getRelatedArticles(
  db: D1Database,
  articleId: number,
  directionIds: number[],
  limit = 3,
): Promise<Article[]> {
  if (directionIds.length === 0) return [];
  const placeholders = directionIds.map(() => "?").join(",");
  const rows = await db
    .prepare(
      `SELECT DISTINCT a.* FROM articles a
       JOIN article_directions ad ON ad.article_id = a.id
       WHERE a.status = 'published' AND a.id != ?
         AND ad.direction_id IN (${placeholders})
       ORDER BY a.published_at DESC LIMIT ?`,
    )
    .bind(articleId, ...directionIds, limit)
    .all<ArticleRow>();
  return (rows.results ?? []).map(hydrateArticle);
}

// ---------------------------------------------------------------------------
// Directions
// ---------------------------------------------------------------------------

export async function getDirectionsForArticle(
  db: D1Database,
  articleId: number,
): Promise<DirectionRow[]> {
  const rows = await db
    .prepare(
      `SELECT d.* FROM directions d
       JOIN article_directions ad ON ad.direction_id = d.id
       WHERE ad.article_id = ? ORDER BY d.sort_order`,
    )
    .bind(articleId)
    .all<DirectionRow>();
  return rows.results ?? [];
}

export async function getAllDirections(db: D1Database): Promise<DirectionRow[]> {
  const rows = await db
    .prepare(`SELECT * FROM directions ORDER BY branch, sort_order, name`)
    .all<DirectionRow>();
  return rows.results ?? [];
}

export async function getDirectionsWithCounts(
  db: D1Database,
): Promise<DirectionWithCount[]> {
  const rows = await db
    .prepare(
      `SELECT d.*, COUNT(ad.article_id) AS article_count
       FROM directions d
       LEFT JOIN article_directions ad ON ad.direction_id = d.id
       LEFT JOIN articles a ON a.id = ad.article_id AND a.status = 'published'
       GROUP BY d.id
       ORDER BY d.branch, d.sort_order, d.name`,
    )
    .all<DirectionWithCount>();
  return rows.results ?? [];
}

export async function getDirectionBySlug(
  db: D1Database,
  slug: string,
): Promise<DirectionRow | null> {
  return db
    .prepare(`SELECT * FROM directions WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<DirectionRow>();
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

export async function getApprovedGlossary(db: D1Database): Promise<GlossaryTerm[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM glossary_terms WHERE status = 'approved' ORDER BY term COLLATE NOCASE`,
    )
    .all<GlossaryTerm>();
  return rows.results ?? [];
}

// ---------------------------------------------------------------------------
// Admin / review queue
// ---------------------------------------------------------------------------

export async function listDraftArticles(db: D1Database): Promise<Article[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM articles WHERE status IN ('draft','in_review')
       ORDER BY created_at DESC`,
    )
    .all<ArticleRow>();
  return (rows.results ?? []).map(hydrateArticle);
}

export async function getArticleById(
  db: D1Database,
  id: number,
): Promise<Article | null> {
  const row = await db
    .prepare(`SELECT * FROM articles WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<ArticleRow>();
  return row ? hydrateArticle(row) : null;
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function addSubscriber(
  db: D1Database,
  email: string,
): Promise<"added" | "exists"> {
  const existing = await db
    .prepare(`SELECT id FROM subscribers WHERE email = ? LIMIT 1`)
    .bind(email)
    .first();
  if (existing) return "exists";
  await db
    .prepare(`INSERT INTO subscribers (email, confirmed) VALUES (?, 0)`)
    .bind(email)
    .run();
  return "added";
}

export { parseAuthors };
