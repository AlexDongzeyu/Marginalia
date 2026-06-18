/**
 * GET /api/map, returns research directions shaped as graph nodes + edges
 * for the React Flow map. Node size scales with `momentum` (recent article
 * count); edges link children to their parent branch.
 */
import type { APIContext } from "astro";
import { getDirectionsWithCounts } from "../../lib/db";

export const prerender = false;

export async function GET({ locals }: APIContext) {
  const { env } = locals.runtime;
  const directions = await getDirectionsWithCounts(env.DB);

  const nodes = directions.map((d) => ({
    id: String(d.id),
    slug: d.slug,
    name: d.name,
    description: d.plain_description,
    branch: d.branch,
    isBranch: d.parent_id === null,
    parentId: d.parent_id ? String(d.parent_id) : null,
    articleCount: d.article_count,
    momentum: d.momentum,
  }));

  const edges = directions
    .filter((d) => d.parent_id !== null)
    .map((d) => ({
      id: `e-${d.parent_id}-${d.id}`,
      source: String(d.parent_id),
      target: String(d.id),
    }));

  return new Response(JSON.stringify({ nodes, edges }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
