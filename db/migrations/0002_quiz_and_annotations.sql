-- Migration 0002: per-article quizzes (AI-generated, cached) + member annotations.
-- Apply remote:
--   npx wrangler d1 execute marginalia-db --remote --file db/migrations/0002_quiz_and_annotations.sql

CREATE TABLE IF NOT EXISTS article_quizzes (
  article_id     INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  questions_json TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS annotations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Member',
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'approved'
                CHECK (status IN ('pending','approved','rejected')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_annotations_article ON annotations(article_id, status);
