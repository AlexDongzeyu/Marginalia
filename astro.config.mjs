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
    resolve: {
      // Cloudflare's Workers runtime doesn't expose the DOM `MessageChannel`
      // that `react-dom/server.browser` touches at module load, which crashes
      // the Pages Function. The `.edge` build (Web Streams based) avoids it and
      // works in Node dev too. https://github.com/facebook/react/issues/26906
      alias: [
        { find: /^react-dom\/server$/, replacement: "react-dom/server.edge" },
        { find: /^react-dom\/server\.browser$/, replacement: "react-dom/server.edge" },
      ],
    },
  },
});
