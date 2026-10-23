/*
 * client:query="ai" hydrates an island only when the page URL carries ?ai (or ?ai=1), so visitors without
 * the flag download none of the island's JavaScript. Registered in astro.config.mjs. To release a flagged
 * island, switch it to client:idle (or client:load); delete this directive once nothing uses it.
 */
import type { ClientDirective } from 'astro';

declare module 'astro' {
  interface AstroClientDirectives {
    /** Hydrate only when the URL has this query parameter, e.g. client:query="ai" for ?ai. */
    'client:query'?: string;
  }
}

const query: ClientDirective = async (load, options) => {
  const value = new URLSearchParams(location.search).get(options.value);
  // ?ai=0, ?ai=false and ?ai=off switch it off explicitly.
  if (value === null || /^(0|false|off)$/i.test(value)) return;
  const hydrate = await load();
  await hydrate();
};

export default query;
