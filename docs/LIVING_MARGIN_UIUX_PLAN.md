# Marginalia — "Living Margin" UI/UX Design Plan

*The universal design system for every Marginalia page. One metaphor, made
literal: **you are scrolling a sheet of paper, and the margins are alive.** The
center column is the page you read; the margins hold the marginalia — plain
notes, definitions, and jokes that explain the content and introduce the people
behind it.*

> This is the implementation brief for the real Astro + Cloudflare site (not a
> mockup). It maps every design decision to concrete CSS, components, and
> existing open-source libraries you can drop in.

---

## 1. The one rule

> **The reading column is calm; the personality lives at the edges.**

Paper-craft tips into "scrapbook" the instant textures, tape, and torn edges
invade the reading area. So the center is *a serious journal printed on
beautiful paper* — clean, generous typography — and all warmth, humor, and
hand-made texture lives in the **margins and dividers**. Restraint in the
middle, personality in the margins.

---

## 2. Visual language

### 2.1 Paper surfaces
| Surface | Treatment |
|---|---|
| **Desk (page background)** | Warm `#E5DCC9`, faint SVG fiber-noise (~5% opacity `feTurbulence`). Never pure white. |
| **The sheet** | The content sits on one wide brighter sheet `#FCFAF4` with a soft drop shadow — a single page resting on the desk. |
| **Dividers** | Torn-paper strips between sections, each rotated ±0.5–1.5°. 2–3 SVG variants, rotated through. |
| **Scraps / cards** | Featured items look clipped/taped: paper-clip SVG, masking-tape corner, slight rotation. |

### 2.2 Color tokens
| Token | Hex | Use |
|---|---|---|
| `--desk` | `#E5DCC9` | Page background (the desk) |
| `--paper` | `#FCFAF4` | The reading sheet |
| `--ink` | `#211C16` | Body text (warm near-black, never `#000`) |
| `--ink-soft` | `#5B5347` | Captions, secondary |
| `--ink-faint` | `#8A8073` | Labels, metadata |
| `--margin-ink` | `#7A5C3E` | Marginalia (sepia/brown ink) |
| `--accent` (red pen) | `#C2410C` | **Brand signature** — annotation marks, links, anchored underlines. *Punctuation, not paint.* |
| `--accent-2` | `#1E3A5F` | Rare deep-ink-blue accent |
| `--ok` | `#2E6B36` | "understood" / success |
| `--card` | `#FBF7EC` | Margin-note / scrap cards |
| `--tape` | `#E8DFC8` | Masking-tape elements |

The **red pen** is the soul of the brand — a teacher's correction color. It only
marks a phrase that has a margin note, a link, or a "+points" stamp. Sparing use
keeps it meaningful.

### 2.3 Typography — the contrast *is* the voice
| Role | Face | Notes |
|---|---|---|
| Display / masthead, body | **Newsreader** (serif) | 18–20px body, line-height ~1.6, measure ~66ch |
| Explainer marginalia, labels, UI | **JetBrains Mono** | "typed onto the page" — definitions, nav tabs, metadata |
| Personality marginalia | **Caveat** (handwriting) | warm, funny — jokes only, ≤2 lines |

Three voices, used consistently: **serif = content, typewriter = explanation,
handwriting = personality.** That tri-voice system is the entire identity.

### 2.4 Motion
- Margin notes **fade + slide a few px** in as their anchor scrolls into view.
- Hovering an anchored phrase lifts its note (and vice-versa); optional drawn
  connector line.
- Respect `prefers-reduced-motion` everywhere (and Calm Mode).

---

## 3. The signature interaction — the Living Margin

The heart of the product, on **every page**.

- **Desktop (wide):** three zones `[ left margin | reading column | right margin ]`.
  Anchored phrases own a margin note placed in the nearest free margin slot.
  Hover links the pair.
- **Tablet:** single (right) margin, or notes collapse to clickable markers.
- **Mobile:** margins don't fit → notes become **inline expandable callouts** (a
  red-pen marker after the phrase; tap → expands beneath that line). This is the
  proven Tufte/sidenotes mobile pattern — don't reinvent it.

**Three kinds of marginalia, visually distinct:**
1. **Explainer** — plain clarification (typewriter, sepia card).
2. **Personality** — the funny human voice (handwriting). *Nobody else's research
   site has jokes in the margins — the differentiator.*
3. **Member** — community-contributed, with initials/avatar.

---

## 4. Page skeleton (universal)

Every page is the same bones:

```
sticky paper-tab nav  →  masthead / page title  →  one paper sheet with
three-zone Living-Margin body  →  torn-paper dividers between sections  →
contact-sheet footer
```

Because the skeleton is constant, perfecting one page perfects them all. In the
codebase this is exactly:

- `BaseLayout.astro` — desk background, fonts, paper-tab nav, contact footer,
  Comfort widget, scroll-reveal script.
- `Sheet.astro` / `.sheet` — the wide paper sheet.
- `Masthead.astro` — newspaper masthead.
- `MarginRow.astro` — the 3-zone grid (Astro named slots: `left` / default /
  `right`).
- `TornDivider.astro` — SVG torn strip (rotation variants).
- `MarginNote.astro` — note card (`variant`: `hand` | `def` | `why` | `member`).

### 4.1 `/` Home — "The Front Page"
Masthead nameplate + tagline → **annotated intro** (the concept lands here, with
handwriting jokes in the margins) → **Today's Margin** (Article of the Day as a
clipped paper scrap) → **What we do** (three torn cards) → **Latest annotations**
→ **ransom-note newsletter** → contact footer.

### 4.2 `/article/[slug]` — "The Annotated Paper" ⭐ (flagship)
- **Header:** plain-language title + original title + authors + difficulty +
  read time + "AI-assisted, reviewed by [name]".
- **Center, two toggleable modes:**
  - **Explainer (default):** Marginalia's plain-language retelling; margin notes
    define terms + add "why it matters".
  - **Source PDF:** the actual arXiv PDF embedded in the center; team notes in
    the margin point at parts of the paper.
- **Footer of the page:** "Test your understanding" quiz → +points stamp →
  contribute CTA. Right margin: **member notes** + **leaderboard**.

### 4.3 Every other page (same look)
`/feed` filterable wall of paper-scrap cards · `/map` React-Flow graph styled as
pinned paper tags · `/directions/[slug]` · `/learn` annotated-textbook lessons ·
`/glossary` typewriter definition cards · `/chapters` directory + map · `/about`
(most on-brand — margins introduce each person with a joke) · `/newsletter` ·
`/projects` · `/join` · auth pages (`/login`, `/signup`, `/dashboard`) ·
`/admin` editorial queue.

---

## 5. Community + gamification (roadmap)

*(Designed now, built after the visual system lands — see §9.)*

- **Member marginalia:** logged-in members propose annotations (highlight phrase
  → write note) → **editorial review queue** (`/admin`) → approved notes render
  with their initials. Members **edit their own** + **save a copy** of any
  article + annotations to "my annotated library".
- **Understanding quizzes:** 3–5 questions per article on the *plain-language*
  explanation. Passing unlocks a "read & understood" stamp, points, and the
  right to annotate (understand before you annotate — an elegant quality gate).
- **Points / badges / leaderboard:** points for passing quizzes, approved
  annotations, upvotes, streaks. Leaderboard **weekly + all-time, global +
  per-chapter** (per-chapter drives friendly inter-school competition). Points
  only for *approved* work; quizzes randomize — anti-gaming matters.
- **Profiles:** annotated library + stamps + badges — a shareable artifact.

### Data model additions (D1)
```
quizzes(id, article_id, questions_json)
quiz_results(id, user_id, article_id, passed, score, taken_at)
annotations(id, article_id, user_id, anchor_quote, anchor_prefix, body,
            status['pending'|'approved'|'rejected'], votes, created_at)
annotation_votes(annotation_id, user_id)
saved_articles(user_id, article_id, snapshot_json, saved_at)
points_ledger(id, user_id, delta, reason, created_at)
```

---

## 6. Existing projects to use directly (researched)

| Project | Gives you | Use for | License |
|---|---|---|---|
| **Tufte CSS** | Canonical sidenote/margin CSS + mobile toggle | Base of the static Living Margin | MIT |
| **gwern.net `sidenotes.js`** | Runtime sidenote layout that auto-positions to **minimize overlap**, collapses long notes | The hard overlap problem on dense article pages | open |
| **rough-notation** | Animated hand-drawn underline/circle/box marks (SVG) | The **red-pen** annotation marks on anchored phrases | MIT |
| **Rough.js** | Hand-drawn/sketchy canvas + SVG primitives | Torn/sketchy accents, connector lines | MIT |
| **EmbedPDF** | Headless, MIT, framework-agnostic PDF viewer (PDFium/WASM); annotation + search; full styling control | The center-column arXiv PDF reader (Source mode) | MIT |
| **react-pdf** (wojtekmaj) | Simpler PDF.js wrapper | Lighter PDF alternative | MIT |
| **Hypothesis** (`hypothesis/h` + client) | Full open-source collaborative annotation over web **and PDF**; groups, moderation, API; proven on **eLife / JSTOR** | Reference architecture + data model for member annotations | BSD/open |
| **AllenAI Semantic Reader / PaperMage** | Research-grade "augmented reader": inline definitions, skimming over a PDF | Proof the PDF-with-explanations UX works at scale | open |
| **W3C Web Annotation Data Model** | Standard target+body+creator selectors | Anchor notes to PDF/text so they re-find their spot | spec |
| **React Flow** | Interactive clickable node-graph | `/map` research-directions graph | MIT |
| **Leaflet** | Maps | Chapters map | BSD |
| **Newsreader / JetBrains Mono / Caveat** | The tri-voice type system | Whole site | OFL |

**Key validation:** *community annotations in the margin of an academic PDF* is
already battle-tested — Hypothesis powers it on real journals; Semantic Reader
does the augmented PDF. **Technical risk is low.** Nobody has packaged it as a
**designed, gamified, student-run publication with paper craft + jokes in the
margins** — your unclaimed lane.

**Aesthetic bar to study (not copy):** *Quanta Magazine*, *gwern.net*, the
*Tufte CSS* demo, *Distill.pub*. Your edge: **warm paper + humor in the margins.**

---

## 7. The hard part — the PDF + margin layer

- **Static margins** (home, about, learn) → Tufte-CSS pattern: float notes into
  the margin; mobile = a JS/checkbox toggle to inline. Easy, ship first.
- **Dense article pages** → adopt gwern's `sidenotes.js` approach: measure
  anchor positions, lay notes top-to-bottom in the nearest free margin, push on
  collision, collapse over-long notes. Don't hand-roll.
- **PDF Source mode** → embed with **EmbedPDF** (headless → full paper-UI
  control). Anchor annotations with text-quote/position selectors (W3C model).
  Render team notes **outside the PDF canvas**, in your own margin column with
  connector lines — keep full aesthetic control. *Interim:* an `<iframe>` to the
  arXiv PDF works today; swap in EmbedPDF for annotations.
- **Moderation pipeline:** member highlights → `annotation(status='pending')` →
  editor approves in `/admin` → renders publicly. "Save a copy" clones the
  article + approved annotations into the member's library.

---

## 8. Accessibility (non-negotiable)
Keep Comfort Settings: **Focus/Reading mode** (perfect here — collapses to the
clean center column), High Contrast, Text-Size, Calm (reduce motion), Quick
Exit. Margin notes reachable by keyboard + screen reader (Tufte accessible
pattern with visually-hidden labels). Map needs a list fallback. All paper
texture is decorative CSS (`aria-hidden`), never carries meaning. **Maintain
WCAG AA contrast even on textured paper** — the sepia margin ink is the riskiest;
test it.

---

## 9. Build order (lock the look on one page first)
1. **Design system + shell + home page** — textures, tri-voice type, dividers,
   paper-tab nav, the annotated intro. *(this redesign)*
2. **Article template, explainer mode** — Living Margin + team notes, real D1
   content. *(this redesign)*
3. Roll the system across **every other page** — feed, map, glossary, learn,
   chapters, newsletter, projects, about, join, auth, admin. *(this redesign)*
4. **gwern auto-layout** for dense notes + the mobile inline pattern.
5. **Source mode** — EmbedPDF arXiv reader + margin layer.
6. **Member annotations + editorial queue** (extends the existing `/admin`).
7. **Quizzes + points + leaderboard + profiles.**

---

## 10. The one-line test
> A stranger lands on an article, sees the arXiv paper in the center, plain
> notes and a couple of jokes hand-written in the margins, and a *"you understood
> this — +10"* stamp — and understands **exactly** what Marginalia is without
> reading a word of marketing. That's the design working.
