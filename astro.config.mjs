import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import devPort from './scripts/dev-port.mjs';

// Island support: client:query="name" hydrates an island only when the URL has ?name (see src/directives/query.ts).
const islands = {
  name: 'islands',
  hooks: {
    'astro:config:setup': ({ command, addClientDirective, updateConfig }) => {
      addClientDirective({ name: 'query', entrypoint: './src/directives/query.ts' });
      // React's production runtime has no jsxDEV, so a build that rewrites the pre-bundled dependencies of a
      // running dev server breaks every island there ("_jsxDEV is not a function"). Builds get their own cache.
      if (command === 'build') updateConfig({ vite: { cacheDir: 'node_modules/.vite-build' } });
    },
  },
};

export default defineConfig({
  output: 'static',
  integrations: [mdx(), react(), islands, devPort()],
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node', inspectorPort: false }),
  session: false,
  trailingSlash: 'ignore',
});
