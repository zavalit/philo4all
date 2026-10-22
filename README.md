# Philo4all → accessible single-page reader

**Prototype, not an official FU Berlin service.** This repository turns the **Philo4all** student guide of the Studi-Team (Canva PDF, version of May 2025, 12 pages) into one accessible, responsive web page. It keeps the PDF's look (palette, typefaces, illustrations) and reads like scrolling through paper sheets. The editorial content (nine chapters, their order and links) is the Studi-Team's and is not rewritten here.

## Quick start

Requirements: Node.js 22.12+ and pnpm.

```sh
pnpm install
pnpm run dev                      # http://localhost:4321/
pnpm run check                    # tokens, CSS/content lint, astro check
pnpm run test:chat                # API validation, response passthrough, privacy
pnpm run build
node scripts/check-internal-links.mjs
pnpm exec playwright install chromium
pnpm run test:a11y
```

## How the page works

- **11 sheets on one page:** the cover, the table of contents with the Studi-Team, and the nine chapters. Each sheet is at least 9:16 like the PDF pages and grows with its content. Chapter 6 covers PDF pages 8–9.
- **Wide screens (≥ 60rem):**
  - The sheets are centred like in a PDF viewer.
  - The left gutter holds a column of dots, one per page. The visible dot sits as far from the sheet as the sheets sit from the top.
  - Hovering or focusing a dot shows a preview of that whole sheet: a live copy of the real sheet, laid out at its own width and scaled down. It is always identical to the page, including in dark mode and after edits.
  - The preview opens into the gutter when there is room, otherwise next to the dots. It stays open while hovered, Escape closes it, and clicking it opens the page.
  - Each sheet pins once you reach its end, and the next one slides over it ("paper stack").
- **Page labels:** dots, previews, the page list and the pill all use each sheet's own heading ("1) Studienalltag & Zurechtfinden"); there is no separate page numbering.
- **URL:** the hash follows the page being read (`#thema-07` only while "7) Wohnen & Finanzieren" is current, none on the cover), without adding history entries. Deep links land directly; in-page jumps glide and keep their target hash.
- **Narrow screens:** plain top-to-bottom scrolling. A floating pill with the current heading opens the page list.
- **Without JavaScript:** all navigation still works. It uses ordinary fragment links (`#themen`, `#thema-04`); `reader.ts` and `pagenav.ts` only add the stacking, the current-page marker and the previews.
- **Reduced motion:** with `prefers-reduced-motion`, there is no stacking and no smooth scrolling.

### Paper stack configuration

The defaults are in [`src/config/reader.ts`](src/config/reader.ts). `<Reader>` accepts any of them as props.

| Option | Meaning |
|---|---|
| `stick` | How long a finished sheet stays pinned while the next one slides over it, as a share of the screen height. `0` gives plain scrolling, `1` keeps it pinned until it is fully covered, and values in between pin it and then let it escape upwards. |
| `dim` | How dark a covered sheet gets (0–1) |
| `shrink` | How far a covered sheet recedes (0 = not at all, 0.1 = to 90 %) |

## Project layout

```text
src/
  pages/index.astro               composes the reader; defines each sheet's heading (also the nav label)
  layouts/Base.astro              document head, fonts, skip link
  components/
    Reader/       grid of page dots + sheets; reader.ts is the scroll engine (progress, paper stack)
    PageNav/      page dots with hover previews (pagenav.ts, wide) / pill + popover list (narrow)
    Sheet/        one paper page; corner decor; paper-stack CSS
    Cover/        PDF page 1
    Contents/     PDF page 2: topic cards, Studi-Team
    Chapter/      chapter title + 12-column panel collage
    Panel/        coloured content panel (used in MDX)
    Art/          PDF illustration, in flow / hanging / behind (used in MDX)
  content/pages/{intro,studi-team}.mdx
  content/topics/01-studienalltag.mdx … 09-ueber-die-uni-hinaus.mdx
  assets/art/      illustrations extracted from the PDF (+ maze.svg)
  assets/photos/   team portraits and campus photos
  config/reader.ts paper-stack settings (stick, dim, shrink)
  styles/global.css, styles/generated/tokens.css (generated)
public/fonts/      Now and Alex Brush (SIL OFL, licence files alongside)
tokens/{base,light,dark}.tokens.json
scripts/           token build, CSS/content lint, internal link check
tests/a11y.mjs     axe, reader behaviour, labels = headings, URL hash = current page, preview = page equivalence; light/dark, 390/1280 px, with/without reduced motion
```

## Design system

- **Tokens:** DTCG JSON in `tokens/` is the source of truth. `scripts/build-tokens.mjs` generates CSS custom properties and fails the build if a text/background pair drops below 4.5:1 or a focus ring below 3:1, in either theme.
- **Palette:** the PDF's flat Canva colours:

  | Colour | Use |
  |---|---|
  | `#f7f4e6` | paper |
  | `#ced8be` | pale panels |
  | `#90ac8e` | sage panels |
  | `#50745f` | forest panels |
  | `#845551` | burgundy cards |
  | `#3b4c42` | ink, and the desk the sheets lie on |

  One deviation, for WCAG: text on sage panels uses a deeper ink `#26332c`, because the PDF's white text there reaches only 2.5:1.
- **Dark mode:** only the desk gets darker and the paper slightly dimmed. Sheets stay paper, as in a PDF viewer, so the illustrations keep their colours.
- **CSS:**
  - Every component has a co-located CSS module.
  - Authored CSS contains no literal colours or lengths. The one exception is `@media`/`@container` query conditions, which cannot read custom properties.
  - Inside a sheet, sizes use `cqi` (a share of the sheet width) to keep the PDF proportions.
  - Layout inside a sheet reacts to the sheet's width (`@container sheet`), not the viewport's.

## Editing

See [`REDAKTION.md`](./REDAKTION.md) (German) for the Studi-Team. In short: chapters are MDX files with `<Panel>` blocks; `<Panel>` and `<Art>` are provided by the page, so no `import` lines are needed.

## Accessibility

- **Structure:**
  - `lang="de"` and a skip link.
  - Each sheet is an `<article>` labelled by its heading.
  - One `nav` lists all pages. The hover preview is `aria-hidden` and out of the tab order; its sheet copy is `inert`, with all ids removed.
- **Focus:**
  - Visible focus with a token-checked contrast.
  - Focus moving into a sheet that is pinned under the next one scrolls it back into view (WCAG 2.4.11).
- **Images:** all illustrations are decorative (`alt=""`). Portraits and campus images have text alternatives.
- **Testing limits:**
  - Passing axe is not a WCAG certification. Test manually with NVDA/VoiceOver and at 200%/400% zoom before launch.
  - Known limitation: the browser's find-in-page does not unpin a sheet, so a match inside the sheet that is currently being covered can be hidden until you scroll.

## Assets, licences and provenance

- **Fonts:** **Now** (© 2015 Alfredo Marco Pradil, SIL OFL 1.1, reserved font name "Now") and **Alex Brush** (SIL OFL 1.1) are self-hosted as unmodified WOFF2. They are deliberately not subset, because the Reserved Font Name clause would then require renaming them.
- **Illustrations:** the illustrations, maze, FU logo, portraits and campus images were extracted from the PDF (pdfimages/pdftocairo). Vector art was rasterised to transparent WebP; the maze is an SVG.
- **Before publishing:** confirm permission for the portraits, the FU logo and any third-party imagery (for example the aerial map), or replace them.
- **Content checks:** verify facts, dates and every external URL; the source is from May 2025.

## Deployment

The Cloudflare adapter builds the reader as static assets in `dist/client/` and the Astro API as a Worker in `dist/server/`. Sessions are disabled and images are compiled at build time, so the frontend needs no KV or Images resources.

GitHub Actions validates tokens/content, generates binding types, checks TypeScript, runs chat tests, builds and dry-runs the Worker, checks links and accessibility, then deploys the verified `dist/` artifact as Worker `philo4all`:

```sh
pnpm run build
pnpm run deploy:dry-run
pnpm run deploy
```

Set GitHub secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with Workers Scripts Edit permission in the account containing `ax-chat-demo`. The build explicitly selects the `production` environment; CI deploys its generated `dist/server/wrangler.json` with the production `AX_CHAT` service binding. Routine deployments do not migrate or seed AX Chat data.

This replaces the Pages deployment command with Workers deployment. The existing Pages site and its domain are not changed by these code edits; move any custom domain to Worker `philo4all` when releasing it. Do not enable a second Cloudflare build that bypasses CI checks. External university links can still block a release; fix them with the Studi-Team rather than disabling validation.

## Chat API

`src/pages/api/chat.ts` implements `POST /api/chat` with JSON `{ "question": "…" }`. The handler in `src/lib/chat.ts` trims the question, enforces 1–2,000 characters, and sends `{ "question": "…", "mapping": "clef-flash" }` to AX Chat. Each question is independent.

Production calls `env.AX_CHAT.fetch(backendRequest)` through the `AX_CHAT` → `ax-chat-demo` service binding. The request uses the incoming origin with path `/api/ask`; the binding selects the Worker, so no artificial hostname or public backend URL is needed.

Responses pass through unchanged, including `429`, error bodies, and response headers. Browser authorization headers, cookies, debug tokens, and extra JSON fields are discarded. Invalid input returns `400`, unsupported methods `405` with `Allow: POST`, and connection failures `503`.

The frontend posts to the same-origin `/api/chat`, checks `response.ok`, then reads `result.runs[0].answer` and `result.runs[0].citations`.

### Local or live backend

| Command | AX Chat target |
|---|---|
| `npm run dev` | Local HTTP endpoint, default `http://localhost:5173/api/ask` |
| `npm run dev:live` | Deployed `ax-chat-demo` through a remote service binding; requires `wrangler login` and uses live AI |

Both serve `http://localhost:4321` and run the same Astro API route in the Workers runtime. Stop the current server before switching modes (Ctrl+C, or `npx astro dev stop` for a background server). Keep AX Chat running locally for the first command. AX Chat's `npm run dev:offline` uses recorded questions and a marked stub answer; its `npm run dev` uses live AI.

To change the local endpoint, copy `.dev.vars.local.example` to `.dev.vars.local`, edit `AX_CHAT_URL` to the full `/api/ask` URL, then restart Philo4all. This file is ignored and applies only to `npm run dev`. An empty `AX_CHAT_URL` selects the Worker binding; production and `dev:live` configure it empty.

```sh
curl http://localhost:4321/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"Wie melde ich mich für einen Kurs an?"}'
```

`pnpm run test:chat` tests both transports, answer/citation passthrough, input validation, credential stripping, and backend errors without consuming live AI.
