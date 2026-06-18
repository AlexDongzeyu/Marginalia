/**
 * Tiny, safe Markdown-to-HTML renderer for article bodies.
 * We intentionally keep this minimal (no external deps) and ESCAPE everything
 * first, then re-introduce a small allow-list of formatting. This avoids any
 * HTML injection from AI-generated or DB content.
 *
 * Supports: paragraphs, **bold**, *italic*, `code`, [links](url),
 * unordered (-) and ordered (1.) lists, and ## / ### headings.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // links [text](http...), only http(s) URLs allowed
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

/**
 * Repair bullet lists that models format badly. Two common cases:
 *  - bullets indented with leading spaces, which breaks list detection;
 *  - a whole list crammed onto one line with " - " between points.
 * Normalise the leading marker and split inline separators so each point is a
 * clean "- " line.
 */
function normalizeBullets(src: string): string {
  return src
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((ln) => {
      const m = ln.match(/^\s*[-*]\s+(.*)$/);
      if (!m) return ln;
      return ("- " + m[1]).replace(/\s+-\s+/g, "\n- ");
    })
    .join("\n");
}

export function renderMarkdown(src: string): string {
  if (!src) return "";
  const lines = normalizeBullets(src).split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushPara();
      closeList();
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      flushPara();
      closeList();
      const level = h[1].length;
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      flushPara();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeList();
    para.push(line);
  }
  flushPara();
  closeList();
  return html.join("\n");
}
