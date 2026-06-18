// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  // Server-rendered on Cloudflare Pages so dynamic routes (article pages,
  // the feed, admin queue) and API routes work at the edge, while static
  // marketing pages are still cached aggressively.
  output: "server",
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "compile",
    // We don't use Astro's session API; disable it so the adapter doesn't
    // require a SESSION KV binding at deploy time.
    sessionKVBindingName: undefined,
  }),
  integrations: [react()],
  site: "https://marginalia.pages.dev",
  vite: {
    ssr: {
      // reactflow ships ESM that Cloudflare's bundler handles best when external
      external: [],
    },
  },
});
