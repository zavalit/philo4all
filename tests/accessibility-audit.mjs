import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { serveSite } from './helpers/static-site.mjs';

// Optional evidence export; no new dependencies. Run against a fresh production build.
const output = process.env.A11Y_OUTPUT && resolve(process.env.A11Y_OUTPUT);
const phase = process.env.A11Y_PHASE || 'current';
if (output) mkdirSync(output, { recursive: true });
const server = process.env.A11Y_URL ? null : await serveSite();
const origin = process.env.A11Y_URL || server.origin;
const browser = await chromium.launch();
const report = { phase, date: new Date().toISOString(), target: process.env.A11Y_URL || 'local production build', browser: browser.version(), checks: [], axe: [] };
const check = (id, scenario, passed, evidence) => report.checks.push({ id, scenario, passed, evidence });
const frames = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const scrollSettled = page => page.evaluate(() => new Promise((done, reject) => {
  let last = scrollY, still = 0;
  const deadline = performance.now() + 5000;
  const tick = () => {
    still = scrollY === last ? still + 1 : 0;
    last = scrollY;
    if (still >= 6) done();
    else if (performance.now() > deadline) reject(new Error('Page scrolling did not settle within five seconds'));
    else requestAnimationFrame(tick);
  };
  tick();
}));
const capture = async (page, name) => {
  if (output) {
    await frames(page);
    await scrollSettled(page);
    await page.screenshot({ path: resolve(output, `${phase}-${name}.png`) });
  }
};
const ready = async page => {
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-reader-ready'));
  await page.evaluate(() => document.fonts.ready);
  await frames(page);
};
const active = page => page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, text: document.activeElement.textContent.trim().replace(/\s+/g, ' ').slice(0, 100) }));

// Inspect text itself, since overflow:clip can conceal loss without a page scrollbar.
const textClipping = page => page.evaluate(() => {
  const found = [];
  const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('[aria-hidden="true"],script,style,.sr-only')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()];
    let parent = node.parentElement;
    while (parent && parent !== document.body) {
      const css = getComputedStyle(parent);
      if (['clip', 'hidden', 'auto', 'scroll'].includes(css.overflowX)) {
        const box = parent.getBoundingClientRect();
        if (rects.some(r => r.width && (r.left < box.left - 2 || r.right > box.right + 2))) {
          found.push({ text: node.textContent.trim().slice(0, 100), clippedBy: parent.tagName, width: Math.round(box.width) });
          break;
        }
      }
      parent = parent.parentElement;
    }
  }
  return found;
});

async function scan(page, scenario) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const simplify = rule => ({ id: rule.id, impact: rule.impact, help: rule.help, nodes: rule.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) });
  report.axe.push({ scenario, engine: result.testEngine, violations: result.violations.map(simplify), incomplete: result.incomplete.map(simplify), passedRules: result.passes.length });
  check('axe', scenario, result.violations.length === 0, result.violations.map(v => `${v.id}: ${v.nodes.length} nodes`));
}

try {
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 1280]) {
      const scenario = `${theme}-${width}`;
      const context = await browser.newContext({ colorScheme: theme, viewport: { width, height: 850 } });
      const page = await context.newPage();
      await page.goto(origin + '/');
      await ready(page);
      await scan(page, scenario + '-cover');
      check('reflow', scenario, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { width });
      const clipped = await textClipping(page);
      check('text-clipping', scenario, clipped.length === 0, clipped);
      if (theme === 'light') await capture(page, `cover-${width}`);
      if (theme === 'light' && width === 320) {
        await page.goto(origin + '/#thema-01');
        await ready(page);
        await page.getByRole('heading', { name: 'Studienanfänger*innen (Erstis)' }).evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await capture(page, 'first-year-320');
        await page.goto(origin + '/');
        await ready(page);
      }

      const semantics = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('main h1,main h2,main h3,main h4')];
        return { lang: document.documentElement.lang, title: document.title, mains: document.querySelectorAll('main').length, h1s: document.querySelectorAll('main h1').length, skippedHeadings: headings.filter((h, i) => i && +h.tagName[1] > +headings[i - 1].tagName[1] + 1).map(h => h.textContent), missingAlt: document.querySelectorAll('main img:not([alt])').length };
      });
      check('semantics', scenario, semantics.lang === 'de' && !!semantics.title && semantics.mains === 1 && semantics.h1s === 1 && !semantics.skippedHeadings.length && !semantics.missingAlt, semantics);

      // Native keyboard actions: the skip link must move focus to main.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await scrollSettled(page);
      check('skip-link', scenario, (await active(page)).id === 'hauptinhalt', await active(page));

      // Keyboard chapter navigation must transfer focus out of the menu and into the chapter.
      await page.goto(origin + '/');
      await ready(page);
      if (width < 960) {
        const pill = page.locator('[popovertarget="seiten"]');
        await pill.focus();
        await page.keyboard.press('Enter');
      }
      const chapter = page.locator('[data-page-link][href="#thema-04"]');
      await chapter.focus();
      await page.keyboard.press('Enter');
      await scrollSettled(page);
      const focused = await active(page);
      check('chapter-focus', scenario, focused.id === 'thema-04-title', focused);
      await page.keyboard.press('Tab');
      await scrollSettled(page);
      const nextInChapter = await page.evaluate(() => document.querySelector('[aria-labelledby="thema-04-title"]').contains(document.activeElement));
      check('chapter-next-tab', scenario, nextInChapter, await active(page));
      if (theme === 'light' && width === 320) await capture(page, 'chapter-keyboard-320');

      // Scroll to the long advice chapter for a second rendered axe state.
      await page.goto(origin + '/#thema-06');
      await ready(page);
      await scan(page, scenario + '-advice');
      if (width === 1280) await capture(page, `advice-${theme}-1280`);

      // Text-spacing overrides from WCAG 1.4.12; check clipped text, not just page overflow.
      await page.addStyleTag({ content: '* { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } p { margin-bottom:2em!important; }' });
      await frames(page);
      const spacingClip = await textClipping(page);
      check('text-spacing', scenario, spacingClip.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), spacingClip);
      if (theme === 'light' && width === 320) { await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await capture(page, 'text-spacing-320'); }
      await context.close();
    }
  }

  for (const viewport of [{ width: 390, height: 850 }, { width: 1920, height: 1080 }, { width: 1280, height: 300 }]) {
    const scenario = `keyboard-${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(origin + '/?ai');
    await ready(page);
    await page.getByRole('button', { name: 'KI-Chat öffnen' }).waitFor();
    // Traverse every focus stop; sample the focused element to detect complete obstruction.
    const obscured = [];
    const outlines = [];
    let count = 0;
    for (; count < 240; count++) {
      await page.keyboard.press('Tab');
      await frames(page);
      await scrollSettled(page);
      const state = await page.evaluate(() => {
        const el = document.activeElement;
        if (el === document.body) return { end: true };
        const rects = [...el.getClientRects()].filter(r => r.width && r.height);
        const visible = rects.some(r => [0.2, 0.5, 0.8].some(x => [0.2, 0.5, 0.8].some(y => {
          const px = r.left + r.width * x, py = r.top + r.height * y;
          return px >= 0 && px < innerWidth && py >= 0 && py < innerHeight && el.contains(document.elementFromPoint(px, py));
        })));
        const css = getComputedStyle(el);
        const card = el.closest('li');
        return { end: false, text: el.textContent.trim().slice(0, 100), visible, outline: css.outlineStyle !== 'none' || (card && getComputedStyle(card).outlineStyle !== 'none') };
      });
      if (state.end) break;
      if (!state.visible) { obscured.push(state.text); if (obscured.length === 1) await capture(page, `obscured-${viewport.width}x${viewport.height}`); }
      if (!state.outline) outlines.push(state.text);
    }
    check('keyboard-visible', scenario, !obscured.length && count < 240, { focusStops: count, obscured });
    check('keyboard-outline', scenario, !outlines.length, outlines);
    await context.close();
  }

  // Enlarged default text is a separate check from a 320px reflow viewport.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(origin + '/');
    await ready(page);
    await page.addStyleTag({ content: 'html { font-size:200%; }' });
    await frames(page);
    const clipped = await textClipping(page);
    check('text-resize', '200-percent-root-text', !clipped.length && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), clipped);
    const motion = await page.evaluate(() => ({ position: getComputedStyle(document.querySelector('[data-sheet]')).position, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior }));
    check('reduced-motion', '1280-reduce', motion.position === 'relative' && motion.scrollBehavior === 'auto', motion);
    await capture(page, 'text-200-percent');
    await context.close();
  }

  // Progressive enhancement: chapter navigation still works without the scripts.
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 850 } });
    const page = await context.newPage();
    await page.goto(origin + '/');
    const toggle = page.locator('[popovertarget="seiten"]');
    if (await toggle.isVisible()) await toggle.click();
    await page.locator('[data-page-link][href="#thema-04"]').click();
    check('no-js-menu-closes', '390-no-js', !await page.locator('[data-pages]').evaluate(el => el.matches(':popover-open')), { hash: new URL(page.url()).hash });
    check('no-js-destination', '390-no-js', new URL(page.url()).hash === '#thema-04', { hash: new URL(page.url()).hash });
    await capture(page, 'no-js-390');
    await context.close();
  }
} finally {
  await browser.close();
  await server?.close();
  report.summary = { checks: report.checks.length, passed: report.checks.filter(c => c.passed).length, failed: report.checks.filter(c => !c.passed).length, axeScans: report.axe.length, axeViolationInstances: report.axe.reduce((n, r) => n + r.violations.length, 0) };
  if (output) writeFileSync(resolve(output, `${phase}.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.summary));
  for (const failure of report.checks.filter(c => !c.passed)) console.error(failure.id, failure.scenario, JSON.stringify(failure.evidence));
  if (report.summary.failed) process.exitCode = 1;
}
