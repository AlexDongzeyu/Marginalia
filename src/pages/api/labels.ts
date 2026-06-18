/**
 * POST /api/labels, save one classification label for an open campaign.
 * Body: { slug: string, itemId: string, value: string }
 * Upserts so a member can change their answer on an item.
 */
import type { APIContext } from "astro";
import { getSessionUser } from "../../lib/auth";

export const prerender = false;

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;
  const me = await getSessionUser(ctx.request.headers.get("cookie"), env, env.DB);
  if (!me) return json({ error: "Please sign in to save labels." }, 401);

  let slug = "";
  let itemId = "";
  let value = "";
  try {
    const b = (await ctx.request.json()) as { slug?: string; itemId?: string; value?: string };
    slug = String(b.slug ?? "").trim();
    itemId = String(b.itemId ?? "").trim();
    value = String(b.value ?? "").trim().slice(0, 60);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!slug || !itemId || !value) return json({ error: "Invalid request." }, 400);

  const campaign = await env.DB.prepare(
    `SELECT id FROM dataset_campaigns WHERE slug = ? AND status = 'open' LIMIT 1`,
  )
    .bind(slug)
    .first<{ id: number }>();
  if (!campaign) return json({ error: "Campaign not found or closed." }, 404);

  try {
    await env.DB.prepare(
      `INSERT INTO dataset_labels (campaign_id, item_id, user_id, value)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (campaign_id, item_id, user_id)
       DO UPDATE SET value = ?4, created_at = datetime('now')`,
    )
      .bind(campaign.id, itemId, me.id, value)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: "Could not save your label right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
