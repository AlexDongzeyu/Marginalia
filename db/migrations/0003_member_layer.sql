-- Migration 0003: the member layer.
-- Public profile handles, chapter join requests, citizen-science classify
-- campaigns + labels, and explainer claims. Safe to run more than once.
-- Apply remote:
--   npx wrangler d1 execute marginalia-db --remote --file db/migrations/0003_member_layer.sql
-- Apply local:
--   npx wrangler d1 execute marginalia-db --local  --file db/migrations/0003_member_layer.sql

-- ---------------------------------------------------------------------------
-- Public usernames (handles) for /profile/[username]. Nullable; backfilled
-- below with a URL-safe, unique handle derived from the display name.
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN username TEXT;

UPDATE users
SET username = lower(
      replace(replace(replace(replace(trim(name), ' ', '-'), '.', ''), '''', ''), '/', '-')
    ) || '-' || id
WHERE username IS NULL OR username = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ---------------------------------------------------------------------------
-- Chapter join requests — a member asks to join a chapter; the lead reviews.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapter_join_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chapter_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Citizen science — classification campaigns + the labels members submit.
-- options_json: JSON array of {value,label}.  items_json: JSON array of
-- {id,title,text}.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dataset_campaigns (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  question     TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL DEFAULT '[]',
  items_json   TEXT NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','closed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dataset_labels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES dataset_campaigns(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  value       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_labels_campaign ON dataset_labels(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_labels_unique
  ON dataset_labels(campaign_id, item_id, user_id);

-- ---------------------------------------------------------------------------
-- Explainer claims — a member claims a published paper to write a deeper,
-- community explainer. Editors see claims in the review flow.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS explainer_claims (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Member',
  status     TEXT NOT NULL DEFAULT 'claimed'
               CHECK (status IN ('claimed','submitted','done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (article_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_claims_article ON explainer_claims(article_id);

-- ---------------------------------------------------------------------------
-- Seed one open classify campaign so /contribute/classify works immediately.
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO dataset_campaigns (slug, title, question, instructions, options_json, items_json, status)
VALUES (
  'summary-accuracy',
  'Rate plain-language summaries',
  'Is this plain-language summary accurate to the paper title?',
  'Read the paper title and the one-line summary. Judge whether the summary fairly captures it. There are no trick questions, your honest read is the data.',
  '[{"value":"accurate","label":"Accurate"},{"value":"mostly","label":"Mostly"},{"value":"inaccurate","label":"Inaccurate"}]',
  '[
    {"id":"i1","title":"Attention Is All You Need","text":"Introduces a network that learns relationships between all words at once, instead of reading them strictly in order."},
    {"id":"i2","title":"Deep Residual Learning for Image Recognition","text":"Lets very deep image networks train well by adding shortcut connections that skip layers."},
    {"id":"i3","title":"Highly accurate protein structure prediction with AlphaFold","text":"Predicts the 3D shape a protein folds into directly from its sequence of building blocks."},
    {"id":"i4","title":"Denoising Diffusion Probabilistic Models","text":"Generates images by starting from random noise and removing it step by step until a picture appears."},
    {"id":"i5","title":"Language Models are Few-Shot Learners","text":"Shows a very large language model can do new tasks from just a few examples in its prompt, without retraining."},
    {"id":"i6","title":"Adam: A Method for Stochastic Optimization","text":"A popular recipe for adjusting how fast a model learns, adapting the step size for each value it tunes."}
  ]',
  'open'
);
