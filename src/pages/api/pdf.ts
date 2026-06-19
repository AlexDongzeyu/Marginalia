/**
 * GET /api/pdf?id=ARXIV_ID, a same-origin proxy for arXiv PDFs.
 * arXiv sends X-Frame-Options, so its PDFs cannot be embedded directly. We
 * fetch the bytes server-side and re-serve them from our own origin (without
 * X-Frame-Options) so the in-page "Source PDF" view actually renders.
 *
 * Locked to valid arXiv ids only, so this never becomes an open proxy (SSRF).
 */
import type { APIContext } from "astro";

export const prerender = false;

// New-style arXiv ids, e.g. 1706.03762 or 2210.03629v2.
const ARXIV_ID = /^\d{4}\.\d{4,5}(?:v\d+)?$/;

export async function GET(ctx: APIContext) {
  const id = (new URL(ctx.request.url).searchParams.get("id") ?? "").trim();
  if (!ARXIV_ID.test(id)) {
    return new Response("Invalid arXiv id.", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`https://arxiv.org/pdf/${id}`, {
      headers: { "User-Agent": "MarginaliaBot/1.0 (student reading room)" },
    });
  } catch {
    return new Response("Could not reach arXiv.", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Paper PDF not found.", { status: 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
