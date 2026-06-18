/**
 * POST /api/subscribe — newsletter signup.
 * Stores email in D1 `subscribers`. Minimal validation; idempotent.
 */
import type { APIContext } from "astro";
import { addSubscriber } from "../../lib/db";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request, locals }: APIContext) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  try {
    const result = await addSubscriber(locals.runtime.env.DB, email);
    return json({
      ok: true,
      message: result === "exists" ? "You're already subscribed." : "Subscribed!",
    });
  } catch {
    return json({ error: "Could not subscribe right now." }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
