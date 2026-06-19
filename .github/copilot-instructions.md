# Marginalia — repository instructions

## Humanizer is mandatory for all website-facing text (MUST)

Every piece of human-readable copy that can appear on the site MUST pass the
Humanizer before it ships. No exceptions. This applies whether you are writing new
copy, editing existing copy, seeding the database, or generating text from the AI
pipeline.

"Website-facing text" includes:

- Page and component copy in `src/pages/**` and `src/components/**`
- Seeded content in `db/seed.sql`: direction descriptions, glossary definitions,
  article hooks, "what's going on" and "why it matters" explainers
- Newsletter and email copy
- Prompts and templates in the AI pipeline (`workers/**`, `src/lib/**`,
  `scripts/**`) that generate published explainers, quizzes, glossary terms, or
  summaries. Humanize the prompt so the model's output is already clean.
- Any user-visible label, empty state, error message, or microcopy

Process: run the copy through the Humanizer skill (draft → ask "what still sounds
AI?" → final) before writing it into a file, and before anything is published from
the editorial review queue.

## Hard rules (quick checklist)

- No em dashes (—) or en dashes (–). Use a period, comma, colon, or parentheses.
  This is a hard constraint: scan the diff for `—` and `–` before saving.
- No mechanical bolded inline-header lists (`**Header:** text`). Use prose or a
  plain list.
- No AI-vocab pile-ups: testament, underscore, pivotal, vibrant, tapestry, delve,
  landscape (abstract), showcase, intricate, crucial, foster, seamless, robust.
- No significance inflation ("marks a pivotal moment", "stands as a testament to").
- No rule-of-three padding, no false ranges, no copula avoidance (prefer is / are /
  has over "serves as / boasts").
- No filler or hedging ("it is important to note", "in order to", "could
  potentially possibly").
- No chatbot artifacts ("Here is...", "I hope this helps", "Let me know",
  "Certainly!").
- Keep straight apostrophes in copy. Curly quotes around paper titles are an
  intentional typographic choice and may stay.

## Preserve the voice (do NOT flatten)

Marginalia's copy is a deliberate student-zine voice: short handwritten margin
quips, dry jokes, first-person warmth, plain language. Humanizing means removing AI
tells, not the personality. Keep the quips, the lowercase margin notes, and the
human edge. Read it aloud: if a person wouldn't say it, fix it; if they would, leave
it alone.

## Design rules (hard constraints)

- FORBIDDEN: decorative vertical accent strips/bars. Never add a colored
  `border-left` / `border-inline-start` (or a thin tall element, `::before`/`::after`
  bar, or narrow accent-background div) to pullquotes, blockquotes, cards, sections,
  or headings. The thin vertical "red pen" strip is banned site-wide. Use space,
  weight, italics, or a section label for emphasis instead, never a vertical rule.
- When you catch one of these strips anywhere, remove it.

