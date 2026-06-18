/**
 * Lightweight auth for Marginalia, built on Web Crypto (works on Cloudflare).
 * - Passwords: PBKDF2-SHA256 with a random per-user salt.
 * - Sessions: a signed, HttpOnly cookie (HMAC-SHA256). No server-side store.
 *
 * The signing secret comes from env.SESSION_SECRET, falling back to
 * env.ADMIN_TOKEN. If neither is configured, auth fails safe (callers return
 * a clear error).
 */
import type { D1Database } from "@cloudflare/workers-types";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_COOKIE = "mg_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = fromHex(parts[2]);
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return timingSafeEqual(toHex(bits), parts[3]);
}

// ---------------------------------------------------------------------------
// Sessions (signed cookie)
// ---------------------------------------------------------------------------

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toHex(sig);
}

export interface SessionEnv {
  SESSION_SECRET?: string;
  ADMIN_TOKEN?: string;
}

function secretOf(env: SessionEnv): string | null {
  const s = env.SESSION_SECRET || env.ADMIN_TOKEN;
  if (!s || s === "change-me-in-cloudflare-dashboard") return null;
  return s;
}

export async function createSessionCookie(
  userId: number,
  env: SessionEnv,
): Promise<string | null> {
  const secret = secretOf(env);
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const sig = await hmac(payload, secret);
  const token = `${payload}.${sig}`;
  return (
    `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; ` +
    `Max-Age=${SESSION_TTL_SECONDS}`
  );
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getSessionUserId(
  cookieHeader: string | null,
  env: SessionEnv,
): Promise<number | null> {
  const secret = secretOf(env);
  if (!secret || !cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const payload = `${userId}.${exp}`;
  const expected = await hmac(payload, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  if (parseInt(exp, 10) < Math.floor(Date.now() / 1000)) return null;
  const id = parseInt(userId, 10);
  return Number.isInteger(id) ? id : null;
}

// ---------------------------------------------------------------------------
// User lookups
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function getUserById(db: D1Database, id: number): Promise<AuthUser | null> {
  return db
    .prepare(`SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<AuthUser>();
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<(AuthUser & { password_hash: string | null }) | null> {
  return db
    .prepare(`SELECT id, email, name, role, password_hash FROM users WHERE email = ? LIMIT 1`)
    .bind(email)
    .first();
}
