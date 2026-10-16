# Philo4all → accessible single-page reader

**Prototype, not an official FU Berlin service.** This repository turns the **Philo4all** student guide of the Studi-Team (Canva PDF, version of May 2025, 12 pages) into one accessible, responsive web page. It keeps the PDF's look (palette, typefaces, illustrations) and reads like scrolling through paper sheets. The editorial content (nine chapters, their order and links) is the Studi-Team's and is not rewritten here.

## Quick start

Requirements: Node.js 22.12+ and pnpm.

```sh
pnpm install
pnpm run dev                      # http://localhost:4321/
pnpm run check                    # tokens, CSS/content lint, astro check
pnpm run build
node scripts/check-internal-links.mjs
pnpm exec playwright install chromium
pnpm run test:a11y
```

## How the page works

- **11 sheets on one page:** the cover, the table of contents with the Studi-Team, and the nine chapters. Each sheet is at least 9:16 like the PDF pages and grows with its content. Chapter 6 covers PDF pages 8–9.
- **Wide screens (≥ 60rem):**
  - A tilted stack of page thumbnails on the left replaces the PDF viewer's sidebar.
  - Next to it is a column of dots, one per page.
  - Each sheet pins once you reach its end, and the next one slides over it ("paper stack"). The thumbnail stack glides in step.
- **Narrow screens:** plain top-to-bottom scrolling. A floating "Seite 05 / 11" pill opens the page list.
- **Without JavaScript:** all navigation still works. It uses ordinary fragment links (`#themen`, `#thema-04`); `reader.ts` only adds the stacking and the teaser motion.
- **Reduced motion:** with `prefers-reduced-motion`, there is no stacking, no velocity skew and no smooth scrolling.

### Teaser configuration

The defaults are in [`src/config/teaser.ts`](src/config/teaser.ts). `<PageTeaser>` accepts any of them as props.

| Option | Meaning |
|---|---|
| `angle` | Rotation of the whole stack, in degrees |
| `tilt` | 3D turn towards the document, in degrees |
| `visible` | Neighbouring pages shown above and below the current page |
| `spacing` | Distance between thumbnails, as a share of thumbnail height |
| `tint` | Desk-coloured veil over pages that are not current (0–1) |
| `bend` | Skew from scroll speed (0 turns it off) |
| `scale` | Size of neighbours relative to the current page |

## Project layout

```text
src/
  pages/index.astro               composes the reader from the content collections
  layouts/Base.astro              document head, fonts, skip link
  components/
    Reader/       grid of teaser + sheets; reader.ts is the scroll engine
    PageTeaser/   tilted thumbnail stack, dots (wide) / pill + popover list (narrow)
    Sheet/        one paper page; corner decor; paper-stack CSS
    Cover/        PDF page 1
    Contents/     PDF page 2: topic cards, Studi-Team
    Chapter/      chapter title + 12-column panel collage
    Panel/        coloured content panel (used in MDX)
    Art/          PDF illustration, in flow / hanging / behind (used in MDX)
  content/pages/{intro,studi-team}.mdx
  content/topics/01-studienalltag.mdx … 09-ueber-die-uni-hinaus.mdx
  assets/art/      illustrations extracted from the PDF (+ maze.svg)
  assets/pages/    PDF page renders used as teaser thumbnails
  assets/photos/   team portraits and campus photos
  config/teaser.ts
  styles/global.css, styles/generated/tokens.css (generated)
public/fonts/      Now and Alex Brush (SIL OFL, licence files alongside)
tokens/{base,light,dark}.tokens.json
scripts/           token build, CSS/content lint, internal link check
tests/a11y.mjs     axe + reader behaviour, light/dark, 390/1280 px, with/without reduced motion
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
  - One `nav` lists all pages. The thumbnail stack is `aria-hidden`, and its links are not in the tab order.
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

The `verify` job in GitHub Actions does the following:
1. Validates tokens and content.
2. Runs `astro check` and the build.
3. Checks internal anchors and runs the a11y tests.
4. Checks external links with Lychee (strict).

`deploy` uploads the verified `dist/` to Cloudflare Pages:

```sh
npx wrangler pages deploy dist --project-name=philo4all --branch=main
```

Setup:
- Create a Cloudflare Pages *Direct Upload* project named `philo4all`.
- Add the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
- Do not enable a second Git-connected Cloudflare build: it would bypass the checks.

External university URLs inherited from the PDF may be outdated, and Lychee can block a release. Fix or replace them with the Studi-Team's approval rather than disabling the check.
