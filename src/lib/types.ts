/**
 * Shared domain types for Marginalia.
 * Mirrors the D1 schema (db/schema.sql).
 */

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type ArticleStatus = "draft" | "in_review" | "published" | "rejected";
export type DirectionBranch = "foundations" | "applied" | "methods" | "society";

export interface DirectionRow {
  id: number;
  slug: string;
  name: string;
  plain_description: string;
  branch: DirectionBranch;
  parent_id: number | null;
  momentum: number;
  sort_order: number;
}

export interface ArticleRow {
  id: number;
  slug: string;
  arxiv_id: string | null;
  original_title: string;
  plain_title: string;
  hook: string;
  whats_going_on: string;
  why_it_matters: string;
  difficulty: Difficulty;
  read_minutes: number;
  is_ai4good: number;
  is_foundational: number;
  source_url: string | null;
  pdf_url: string | null;
  authors: string; // JSON array
  institution: string | null;
  published_date: string | null;
  citation_count: number;
  status: ArticleStatus;
  reviewer_id: number | null;
  reviewer_name: string | null;
  is_article_of_day: number;
  day_date: string | null;
  ai_model: string | null;
  created_at: string;
  published_at: string | null;
}

/** Article shape with parsed JSON + attached directions, for templates. */
export interface Article extends Omit<ArticleRow, "authors"> {
  authors: string[];
  directions?: DirectionRow[];
}

export interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  status: "pending" | "approved" | "rejected";
}

export interface DirectionWithCount extends DirectionRow {
  article_count: number;
}

export function parseAuthors(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function hydrateArticle(row: ArticleRow): Article {
  return { ...row, authors: parseAuthors(row.authors) };
}

export const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Beginner: "badge-beginner",
  Intermediate: "badge-intermediate",
  Advanced: "badge-advanced",
};
