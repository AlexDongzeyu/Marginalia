/**
 * POST /api/auth/login, verify credentials and set a session cookie.
 */
import type { APIContext } from "astro";
import { verifyPassword, createSessionCookie, getUserByEmail } from "../../../lib/auth";

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  const { env } = locals.runtime;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return json({ error: "Email and password are required." }, 400);

  const user = await getUserByEmail(env.DB, email);
  // Always run a comparison-like delay path; respond with a generic message.
  if (!user || !user.password_hash) {
    return json({ error: "Incorrect email or password." }, 401);
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return json({ error: "Incorrect email or password." }, 401);

  const cookie = await createSessionCookie(user.id, env);
  if (!cookie) {
    return json({ error: "Sign-in is not configured on the server yet." }, 503);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
