/**
 * arXiv source adapter.
 * Fetches recent papers from the arXiv API and parses the Atom XML response.
 * We store ONLY metadata + our own summaries, never the abstract verbatim,
 * and respect arXiv API etiquette (descriptive UA, modest request rate).
 */

export interface ArxivPaper {
  arxivId: string; // e.g. "2406.01234"
  title: string;
  abstract: string; // used transiently for the LLM prompt; NOT stored
  authors: string[];
  published: string; // ISO date
  sourceUrl: string;
  pdfUrl: string;
  primaryCategory: string;
}

const ARXIV_API = "http://export.arxiv.org/api/query";

// AI-relevant categories (spec §6.1)
export const DEFAULT_CATEGORIES = ["cs.AI", "cs.LG", "cs.CL", "cs.CV"];

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : "";
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntries(xml: string): ArxivPaper[] {
  const entries = xml.split("<entry>").slice(1);
  const papers: ArxivPaper[] = [];

  for (const raw of entries) {
    const entry = raw.split("</entry>")[0];
    const idUrl = tag(entry, "id"); // http://arxiv.org/abs/2406.01234v1
    const idMatch = idUrl.match(/abs\/([^v]+)(?:v\d+)?$/);
    const arxivId = idMatch ? idMatch[1] : idUrl.split("/").pop() ?? "";
    if (!arxivId) continue;

    const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) =>
      decode(m[1]),
    );

    const pdfMatch = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/);
    const catMatch = entry.match(/<arxiv:primary_category[^>]*term="([^"]+)"/);

    papers.push({
      arxivId,
      title: tag(entry, "title"),
      abstract: tag(entry, "summary"),
      authors,
      published: tag(entry, "published").slice(0, 10),
      sourceUrl: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${arxivId}`,
      primaryCategory: catMatch ? catMatch[1] : "",
    });
  }
  return papers;
}

/**
 * Fetch the most recent papers across the given categories.
 * `maxResults` keeps the call small and within etiquette.
 */
export async function fetchRecentArxiv(
  categories: string[] = DEFAULT_CATEGORIES,
  maxResults = 25,
): Promise<ArxivPaper[]> {
  const catQuery = categories.map((c) => `cat:${c}`).join("+OR+");
  const url =
    `${ARXIV_API}?search_query=${catQuery}` +
    `&sortBy=submittedDate&sortOrder=descending` +
    `&start=0&max_results=${maxResults}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Marginalia/0.1 (student research explainer; +https://marginalia.pages.dev)",
    },
  });
  if (!res.ok) {
    throw new Error(`arXiv API error: ${res.status}`);
  }
  const xml = await res.text();
  return parseEntries(xml);
}
