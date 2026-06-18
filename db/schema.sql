-- ===========================================================================
-- Marginalia — D1 (SQLite) schema
-- AI research, explained for newcomers. "AI for Good."
--
-- Apply locally:  npm run db:local
-- Apply remote:   npm run db:remote
-- ===========================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Members (editors/admins who review AI drafts; chapter leads).
-- Auth is intentionally lightweight for v1 (token-gated admin). Full user
-- accounts can layer on later without changing this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member','chapter_lead','editor','admin')),
  chapter_id    INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Research directions — the curated, plain-language map of the field.
-- Hierarchical via parent_id. `momentum` = count of articles in last 30d,
-- refreshed by the ingest job; drives node sizing on /map.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS directions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  plain_description TEXT NOT NULL DEFAULT '',
  branch            TEXT NOT NULL DEFAULT 'foundations'
                      CHECK (branch IN ('foundations','applied','methods','society')),
  parent_id         INTEGER REFERENCES directions(id) ON DELETE SET NULL,
  momentum          INTEGER NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Articles — the core content unit. One row per explained paper.
-- Only ORIGINAL plain-language summaries are stored; never the arXiv abstract
-- verbatim (see integrity guardrails). We link out to source instead.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT UNIQUE NOT NULL,
  arxiv_id          TEXT UNIQUE,                 -- enforces "never on the site twice"
  original_title    TEXT NOT NULL,
  plain_title       TEXT NOT NULL,
  hook              TEXT NOT NULL DEFAULT '',
  whats_going_on    TEXT NOT NULL DEFAULT '',    -- markdown, grade-9 reading level
  why_it_matters    TEXT NOT NULL DEFAULT '',
  difficulty        TEXT NOT NULL DEFAULT 'Beginner'
                      CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  read_minutes      INTEGER NOT NULL DEFAULT 3,
  is_ai4good        INTEGER NOT NULL DEFAULT 0,  -- 0/1 boolean
  is_foundational   INTEGER NOT NULL DEFAULT 0,
  source_url        TEXT,                        -- arXiv abstract page
  pdf_url           TEXT,
  authors           TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  institution       TEXT,
  published_date    TEXT,                        -- ISO date of the paper
  citation_count    INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','in_review','published','rejected')),
  reviewer_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name     TEXT,                        -- denormalised for the byline
  is_article_of_day INTEGER NOT NULL DEFAULT 0,
  day_date          TEXT,                        -- ISO date this was AOTD
  ai_model          TEXT,                        -- which Workers AI model wrote it
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  published_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_status     ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_day        ON articles(is_article_of_day, day_date);
CREATE INDEX IF NOT EXISTS idx_articles_published  ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_difficulty ON articles(difficulty);

-- Many-to-many: article <-> direction
CREATE TABLE IF NOT EXISTS article_directions (
  article_id   INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  direction_id INTEGER NOT NULL REFERENCES directions(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, direction_id)
);

-- ---------------------------------------------------------------------------
-- Glossary — plain-language AI term library. Auto-grown by the pipeline,
-- human-approved before going live.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS glossary_terms (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  term        TEXT UNIQUE NOT NULL,
  definition  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS article_terms (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  term_id    INTEGER NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, term_id)
);

-- ---------------------------------------------------------------------------
-- Chapters — student groups that contribute explainers.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  region      TEXT,
  lat         REAL,
  lng         REAL,
  lead_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','archived')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chapter_members (
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  joined_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (chapter_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE NOT NULL,
  confirmed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_issues (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  intro       TEXT NOT NULL DEFAULT '',
  article_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array of article ids
  sent_at     TEXT
);

-- ---------------------------------------------------------------------------
-- Ingest audit log — one row per cron run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingest_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at    TEXT NOT NULL DEFAULT (datetime('now')),
  fetched   INTEGER NOT NULL DEFAULT 0,
  deduped   INTEGER NOT NULL DEFAULT 0,
  selected  INTEGER NOT NULL DEFAULT 0,
  errors    TEXT NOT NULL DEFAULT ''
);
