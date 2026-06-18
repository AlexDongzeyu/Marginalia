/**
 * POST /api/chapters/apply — store a chapter application as 'pending'.
 */
import type { APIContext } from "astro";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST({ request, locals }: APIContext) {
  const { env } = locals.runtime;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const region = String(body.region ?? "").trim().slice(0, 120);
  const description = String(body.description ?? "").trim().slice(0, 2000);
  const email = String(body.email ?? "").trim().toLowerCase();
  const leadName = String(body.lead_name ?? "").trim().slice(0, 120);

  if (!name || !region || !EMAIL_RE.test(email)) {
    return json({ error: "Please fill in your name, email, chapter name and region." }, 400);
  }

  const baseSlug = slugify(name) || `chapter-${Date.now()}`;
  const fullDesc = `${description}\n\n— Lead: ${leadName} <${email}>`;

  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO chapters (slug, name, region, description, status)
       VALUES (?, ?, ?, ?, 'pending')`,
    )
      .bind(baseSlug, name, region, fullDesc)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: "Could not submit right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
