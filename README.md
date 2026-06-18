# Marginalia

**AI research, explained for newcomers.** A free, student-run platform that
surfaces and explains new and notable AI papers in plain language, presents the
field as an interactive map of research directions, and hosts learning tracks —
all oriented around **AI for good**.

Built with [Astro](https://astro.build) and deployed on **Cloudflare Pages**,
with **Cloudflare D1** for data and **Workers AI** for the explainer pipeline.
No external API keys required.

> The visual design system is carried over from the ECHOE platform (warm
> pastels, hard offset shadows, rounded cards, the Comfort Settings panel). Only
> the features and content are new.

---

## What's inside

| Area | What it does |
|---|---|
| **`/today`** | The auto-curated Article of the Day. |
| **`/feed`** | Every published explainer, with filters + search (SSR, shareable URLs). |
| **`/article/[slug]`** | The explained-paper template: plain title, hook, "what's going on", "why it matters", source box that links out to arXiv, and an on-page "Explain it simpler" assistant. |
| **`/map`** | The flagship: an editorial, clickable map of research **directions** (React Flow), not a citation graph. |
| **`/directions/[slug]`** | A single direction: plain-language overview + its articles. |
| **`/learn`** | Learning tracks (outlines now; MDX lessons later). |
| **`/glossary`** | Searchable plain-language AI term library. |
| **`/chapters`**, **`/chapters/start`** | Student chapters directory + application flow. |
| **`/newsletter`** | Subscribe + (future) web archive. |
| **`/admin`** | The editorial review queue — the human gate before anything publishes. |

### The daily pipeline (`src/lib/ingest.ts`)

```
fetch arXiv (cs.AI/LG/CL/CV)  →  dedup against D1 (never on the site twice)
   →  score + select  →  explain with Workers AI (original prose, strict JSON)
   →  store as DRAFT  →  human reviews in /admin  →  publish
```

Nothing auto-publishes. Every draft is reviewed against its source. We store
only metadata + our own summaries — **never the arXiv abstract verbatim** — and
we credit + link every paper.

---

## Tech stack

- **Astro** (`output: "server"`) + **@astrojs/cloudflare** adapter
- **Cloudflare Pages** (hosting), **Pages Functions** (the `/api/*` routes)
- **Cloudflare D1** (SQLite at the edge) — schema in [`db/schema.sql`](db/schema.sql)
- **Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) — the explainer + assistant
- **React Flow** island for the map
- A **separate cron Worker** (`workers/cron.ts`) for the unattended daily run

---

## Local development

> **Requirements:** Node.js **20 or 22 LTS** is recommended. Node 25 currently
> crashes `workerd` on Windows (a libuv conflict), so while `astro build` works
> on any recent Node, running `wrangler pages dev` / `astro dev` locally needs
> Node 22 LTS.

```bash
npm install

# 1. Create the local D1 database and load schema + seed data
npm run db:local
npm run db:seed:local

# 2a. Run the dev server (needs `wrangler login` because Workers AI has no
#     local simulator — it proxies to Cloudflare):
npm run dev

# 2b. ...or build + preview the production output:
npm run build
npm run preview
```

The seed data ships a hand-curated taxonomy of ~19 research directions, a
starter glossary, and two hand-written foundational explainers so the site is
never empty.

---

## Deploying to Cloudflare

Everything runs natively on Cloudflare — no external services. The repo is set
up to deploy via the Cloudflare dashboard (recommended) or the CLI.

### One-time setup

1. **Create the D1 database** (CLI; needs `npx wrangler login` first):

   ```bash
   npx wrangler d1 create marginalia-db
   ```

   Copy the printed `database_id` into **both** `wrangler.toml` and
   `workers/wrangler.toml` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

2. **Load the schema + seed into the remote DB:**

   ```bash
   npm run db:remote
   npm run db:seed:remote
   ```

### Deploy the site (Cloudflare Pages)

**Option A — Dashboard (recommended):**

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Under the project's **Settings → Functions → Bindings**, add:
   - **D1 database binding** — Variable name `DB`, database `marginalia-db`.
   - **Workers AI binding** — Variable name `AI`.
5. Under **Settings → Environment variables**, add a secret
   **`ADMIN_TOKEN`** (a long random string). This gates `/admin` actions and the
   manual ingest trigger.
6. Save and deploy.

**Option B — CLI:**

```bash
npm run deploy   # runs `astro build` then `wrangler pages deploy ./dist`
```

(With the CLI you still add the `AI` binding and `ADMIN_TOKEN` in the dashboard,
since `pages deploy` doesn't push every binding type.)

### Deploy the daily cron Worker

Cloudflare Pages can't host cron triggers, so the unattended daily ingest lives
in a tiny standalone Worker that shares the same D1 + AI:

```bash
npx wrangler deploy --config workers/wrangler.toml
```

It runs at 06:00 UTC (configurable in `workers/wrangler.toml`) and only writes
drafts. You can also trigger ingestion on demand from `/admin` (with the
`ADMIN_TOKEN`).

---

## Project structure

```
db/
  schema.sql            D1 schema
  seed.sql              direction taxonomy + glossary + foundational articles
src/
  components/           Header, Footer, ComfortSettings, ArticleCard, ResearchMap
  layouts/BaseLayout.astro
  lib/                  db, types, markdown (safe renderer), arxiv, ai, ingest
  pages/                routes (see table above) + api/ (Pages Functions)
  scripts/              comfort-settings.ts (accessibility panel)
  styles/               global.css + comfort.css (ported design system)
workers/
  cron.ts               scheduled ingest Worker
  wrangler.toml         its config (D1 + AI + cron trigger)
wrangler.toml           Pages config (D1 + AI + vars)
astro.config.mjs
```

---

## Integrity & copyright

Non-negotiable, and baked into the product:

- **Original summaries only** — we never republish abstracts; we link out.
- **Credit + link** every paper's authors and source.
- **Transparency labels** — "AI-assisted summary, reviewed by [name]."
- **Human review before publish** — the editorial queue is the quality bar.
- Respect arXiv API etiquette (descriptive user-agent, modest request rate,
  metadata-only storage).

See `/about#integrity` on the live site.

---

## License

See [LICENSE](../LICENSE).
