/**
 * POST or GET /api/auth/logout, clear the session cookie.
 */
import type { APIContext } from "astro";
import { clearSessionCookie } from "../../../lib/auth";

export const prerender = false;

function respond() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/", "Set-Cookie": clearSessionCookie() },
  });
}

export const GET = respond;
export const POST = respond;
