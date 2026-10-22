# Development conventions

- **Components:** each one lives in `src/components/Name/Name.astro` with a co-located `Name.module.css`; a React island (`.tsx`) takes a CSS module too. Only resets, base elements, `@font-face` and the token import belong in `src/styles/global.css`.
- **Tokens:**
  - Edit the DTCG files in `tokens/`, never `src/styles/generated/tokens.css`. Run `pnpm run tokens` after changes; it fails on contrast regressions.
  - Use semantic tokens (`--color-ink`, `--color-forest`, `--space-4`, …).
  - Authored CSS has no literal colours or lengths. Exceptions: `@media`/`@container` conditions, and structural units (`%`, `cqi`, `dvh`, `deg`, ratios).
- **Layout inside a sheet** follows the sheet's width with `@container sheet (…)`. The viewport is queried only in `Reader` and `PageNav`, at the 60rem breakpoint.
- **Accessibility:** native elements, real links, semantic headings, visible focus, `prefers-reduced-motion` and both colour schemes. Decorative art is `aria-hidden` with `alt=""`.
- **Content:**
  - Content lives only in MDX. `Panel` and `Art` are passed in by `src/pages/index.astro`, so MDX files carry no imports.
  - Do not add client-side UI libraries. The one exception is React for the AI chat island (`src/components/AiChat/`, loaded only with `?ai`, see the README). The other scripts are `src/components/Reader/reader.ts` (scroll engine) and `src/components/PageNav/pagenav.ts` (current page, hover previews).
- **Dev server port:** `pnpm dev` starts on the first free port from 4321 up (`--port` sets the start). Vite alone misses a server that listens on `127.0.0.1:4321`, for example another project's `astro dev --host 127.0.0.1`, and would share the port number with it; `scripts/dev-port.mjs` connects to find any listener. That is about ports only: Astro also allows one dev server per project, so a second `pnpm dev` in this folder fails with "Another astro dev server is already running" until the first is stopped (Ctrl+C, `pnpm exec astro dev stop`, or `pnpm dev --force` to replace it).
- **Dev server and builds:** `astro build` uses its own Vite cache (`node_modules/.vite-build`, set in `astro.config.mjs`), so you can build while `pnpm dev` is running. With a shared cache, React 19's production runtime would overwrite the dev server's pre-bundled dependencies, and every island would fail with `_jsxDEV is not a function` until the dev server restarts.
- **Before a PR:** `pnpm run check`, `pnpm run test:chat`, `pnpm run build`, `node scripts/check-internal-links.mjs` and `pnpm run test:a11y` must pass.
- **Links:** if a source link is obsolete, ask the Studi-Team to approve a replacement rather than changing it silently.
