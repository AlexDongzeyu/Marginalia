/**
 * POST /api/auth/signup — create an account.
 * Hashes the password (PBKDF2) and sets a signed session cookie.
 */
import type { APIContext } from "astro";
import { hashPassword, createSessionCookie, getUserByEmail } from "../../../lib/auth";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request, locals }: APIContext) {
  const { env } = locals.runtime;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name) return json({ error: "Please enter your name." }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const existing = await getUserByEmail(env.DB, email);
  if (existing) return json({ error: "An account with that email already exists." }, 409);

  const password_hash = await hashPassword(password);
  let userId: number;
  try {
    const res = await env.DB.prepare(
      `INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'member')`,
    )
      .bind(email, name, password_hash)
      .run();
    userId = res.meta.last_row_id as number;
  } catch {
    return json({ error: "Could not create the account." }, 500);
  }

  const cookie = await createSessionCookie(userId, env);
  if (!cookie) {
    // Account created but sessions aren't configured (no secret set).
    return json(
      { ok: true, warning: "Account created. Sign-in sessions are not configured yet." },
      201,
    );
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
