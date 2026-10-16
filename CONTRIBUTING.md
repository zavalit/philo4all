# Development conventions

- **Components:** each one lives in `src/components/Name/Name.astro` with a co-located `Name.module.css`. Only resets, base elements, `@font-face` and the token import belong in `src/styles/global.css`.
- **Tokens:**
  - Edit the DTCG files in `tokens/`, never `src/styles/generated/tokens.css`. Run `pnpm run tokens` after changes; it fails on contrast regressions.
  - Use semantic tokens (`--color-ink`, `--color-forest`, `--space-4`, …).
  - Authored CSS has no literal colours or lengths. Exceptions: `@media`/`@container` conditions, and structural units (`%`, `cqi`, `dvh`, `deg`, ratios).
- **Layout inside a sheet** follows the sheet's width with `@container sheet (…)`. The viewport is queried only in `Reader` and `PageTeaser`, at the 60rem rail breakpoint.
- **Accessibility:** native elements, real links, semantic headings, visible focus, `prefers-reduced-motion` and both colour schemes. Decorative art is `aria-hidden` with `alt=""`.
- **Content:**
  - Content lives only in MDX. `Panel` and `Art` are passed in by `src/pages/index.astro`, so MDX files carry no imports.
  - Do not add client-side UI libraries. `src/components/Reader/reader.ts` is the only script.
- **Before a PR:** `pnpm run check`, `pnpm run build`, `node scripts/check-internal-links.mjs` and `pnpm run test:a11y` must pass.
- **Links:** if a source link is obsolete, ask the Studi-Team to approve a replacement rather than changing it silently.
