/// <reference types="astro/client" />

// Cloudflare runtime bindings available via `Astro.locals.runtime.env`
// (in .astro/.ts route files) and `context.locals.runtime.env`.
type D1Database = import("@cloudflare/workers-types").D1Database;
type Ai = import("@cloudflare/workers-types").Ai;

interface Env {
  /** D1 database binding (see wrangler.toml). */
  DB: D1Database;
  /** Workers AI binding, runs Llama models at the edge. */
  AI: Ai;
  /** Deploy environment label. */
  ENVIRONMENT: string;
  /** Shared secret gating the admin review API + manual ingest. */
  ADMIN_TOKEN: string;
  /** Secret used to sign session cookies. Falls back to ADMIN_TOKEN. */
  SESSION_SECRET?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
