# Marginalia — Design System (MASTER)

> The single source of truth for how Marginalia looks, moves, and feels.
> Generated with the `ui-ux-pro-max` skill (styles 37 E-Ink/Paper, 47 Editorial
> Grid/Magazine, 29 Exaggerated Minimalism) and tuned to Marginalia's voice.
> When building a page, read this file first. If a file exists under
> `design-system/pages/<page>.md`, its rules override this one.

## 1. The idea in one line

A sheet of warm paper resting on a desk. The center column is calm, high-contrast
reading. The margins are alive with notes. Motion is quiet and editorial, never a
performance. Red pen is punctuation, not paint.

Two hard rules, never broken:
- No em dashes anywhere. Use commas, colons, periods, or parentheses.
- No emojis. Icons are inline SVG or typographic arrows (the arrows are design,
  not emoji).

## 2. Style DNA (from the skill)

| Layer | Style | What we take from it |
|-------|-------|----------------------|
| Surface | E-Ink / Paper (#37) | Warm paper, ink-black text, grain/noise texture, WCAG AAA reading contrast, serif body |
| Structure | Editorial Grid / Magazine (#47) | Asymmetric three-zone grid, drop caps, pull quotes, bylines, section dividers, reveal-on-scroll |
| Statement | Exaggerated Minimalism (#29) | Oversized masthead `clamp()`, tight tracking, massive whitespace, a single accent color |

E-Ink/Paper alone says "no animation". We deliberately blend in Editorial Grid's
restrained motion (reveal-on-scroll, hover lifts) because the brief asks for an
artwork-grade feel. Motion stays subtle and is fully disabled under
`prefers-reduced-motion`.

## 3. Color tokens

Single accent discipline: red pen `#C2410C` is the only brand accent. Blue and
green are functional only (data, success). Everything else is paper and ink.

```css
--desk:        #ddd3bf;  /* the desk under the sheet */
--desk-2:      #e8e0cd;  /* nav / footer tint */
--paper:       #fcfaf4;  /* the reading sheet */
--ink:         #211c16;  /* body text, warm near-black (never pure #000) */
--ink-soft:    #5b5347;  /* captions, secondary */
--ink-faint:   #8a8073;  /* labels, meta */
--margin-ink:  #7a5c3e;  /* sepia handwriting notes */
--accent:      #c2410c;  /* red pen: links, anchors, section labels */
--accent-2:    #1e3a5f;  /* deep ink blue: data only */
--ok:          #2e6b36;  /* success green: functional only */
--card:        #fbf7ec;  /* cards just off the sheet */
--line:        rgba(33,28,22,0.12);
```

Contrast: ink on paper is ~13:1 (AAA). Functional color always pairs with a word
or icon, never carries meaning alone.

## 4. Typography

100% serif and mono, zero UI sans (this matches the skill's "Minimalist Monochrome
Editorial" pairing).

```css
--serif: "Newsreader", Georgia, serif;     /* display + reading */
--mono:  "JetBrains Mono", monospace;       /* labels, dates, tags, nav */
--hand:  "Caveat", cursive;                 /* personality margin notes */
```

Scale and roles:
- Masthead wordmark: `clamp(56px, 11vw, 132px)`, weight 600, tracking -0.04em, leading 0.9. This is the artwork moment on every page.
- Reading body: 20.5px, line-height 1.62, measure 65 to 75 characters (`--read-w: 560px`).
- Section label: mono 11px, uppercase, tracking 0.2em, red pen.
- Drop cap: first letter of a lead paragraph, ~3.4em, serif, ink.
- Pull quote: Newsreader italic, 26 to 30px, left red rule.

## 5. The three-zone grid (Living Margin)

```
[ left margin 1fr ] [ reading column 560px ] [ right margin 1fr ]
```

- Reading column is always clean. Texture and torn edges live only at section
  boundaries, never inside reading content.
- Margin notes never overlap the reading column on desktop.
- Under 1040px the margins collapse and notes stack inline.

## 6. Motion language

Tokens: 150 to 300ms for micro-interactions, ease-out on enter. Transform and
opacity only (never width/height/top/left). One or two elements move per view.

- Reveal on scroll: opacity 0 to 1 plus translateY(8px to 0), 600ms ease-out,
  staggered 40ms per item in a group. Driven by IntersectionObserver.
- Hover lift: cards and buttons translateY(-2px) plus shadow, 160ms.
- Press: scale(0.98) on `:active` for buttons and cards.
- Masthead: a single quiet rise-and-fade on load.
- Links: red underline grows from left on hover.
- Reading progress: a thin red rule at the very top of the viewport.

Every one of these is removed under `prefers-reduced-motion: reduce` and under the
Comfort panel's Calm mode. No parallax, no scroll-jacking (the skill flags these as
motion-sickness triggers).

## 7. Accessibility (non-negotiable)

- Focus visible: 2px red outline, 2px offset on every interactive element.
- Skip-to-content link as the first focusable element.
- All touch targets at least 44x44px.
- Headings sequential, one h1 per page.
- Comfort panel: Calm (no motion), Focus (margins hidden), Contrast, Text size.
- Color never the sole signal.

## 8. Components at a glance

- Paper-tab nav: rotated mono chips, straighten and lift on hover, accent underline on the active tab.
- Masthead: Vol/No rule, oversized wordmark, italic tagline, lower rule.
- Margin notes: `hand` (Caveat sepia), `def`/`why` (mono card, optional tape), `member` (avatar + Caveat).
- Torn divider: SVG feTurbulence strip between sections.
- Scrap: featured card with paperclip SVG, slight rotation, lifts on hover.
- Note-row: feed/list row, date + title + meta + arrow.
- Ransom: newsletter letters in mixed faces; wiggle on hover.
- Buttons: `btn-ink` (solid) and `btn-outline`.

## 9. Pre-delivery checklist (run before every deploy)

- [ ] No em dashes, no emojis in any rendered copy.
- [ ] Masthead renders oversized and crisp at 375 / 768 / 1024 / 1440.
- [ ] All links, the mobile menu, and both subscribe forms work.
- [ ] Reading contrast passes AAA; functional color is never alone.
- [ ] Focus rings visible; skip link works; tab order matches reading order.
- [ ] Motion disabled correctly under reduced-motion and Calm mode.
- [ ] No horizontal scroll on mobile; touch targets >= 44px.
