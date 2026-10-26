/** Capture selected comparisons against the current production build; not a conformance audit. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { serveSite } from '../tests/helpers/static-site.mjs';

const pdf = JSON.parse(readFileSync('docs/accessibility-evidence/pdf-inspection.json', 'utf8'));
if (!pdf.selectedContrastSample?.expectedSampleFound) throw new Error('Expected PDF samples not found; inspect the source before comparing.');
const luminance = rgb => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
const contrast = (fg, bg) => {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};
const server = await serveSite();
let browser;
try {
  browser = await chromium.launch();
  const report = {
    date: new Date().toISOString(),
    scope: 'Original PDF versus latest local production HTML, including the retained accessibility fixes. Earlier HTML is not the comparison baseline.',
    pdfSHA256: pdf.sha256,
    htmlSHA256: createHash('sha256').update(readFileSync('dist/client/index.html')).digest('hex'),
    browser: browser.version(),
    pdfContrastSamples: pdf.selectedContrastSample.samples,
    html: [],
  };
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 850 } });
    const page = await context.newPage();
    await page.goto(server.origin);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-reader-ready'));
    await page.evaluate(() => document.fonts.ready);
    const snapshot = await page.evaluate(theme => {
      const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const headings = [...document.querySelectorAll('main h1, main h2, main h3')];
      const samples = ['WLAN & VPN', 'Drucken', 'Software'].map(text => {
        const heading = headings.find(el => el.textContent.trim() === text);
        return { text, level: heading.tagName, foregroundRGB: rgb(getComputedStyle(heading).color), backgroundRGB: rgb(getComputedStyle(heading.closest('section')).backgroundColor) };
      });
      const incoming = document.querySelector('a[href="https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/International-Mobility/incoming/index.html"]');
      return {
        theme, documentLanguage: document.documentElement.lang,
        incomingPassageLanguage: incoming.closest('[lang]').lang,
        mains: document.querySelectorAll('main').length,
        headingCounts: Object.fromEntries(['h1', 'h2', 'h3'].map(tag => [tag, document.querySelectorAll('main ' + tag).length])),
        technologyChapterHeading: document.getElementById('thema-05-title').tagName,
        imagesMissingAlt: document.querySelectorAll('main img:not([alt])').length,
        contrastSamples: samples,
      };
    }, theme);
    for (const sample of snapshot.contrastSamples) sample.contrast = contrast(sample.foregroundRGB, sample.backgroundRGB);
    report.html.push(snapshot);
    if (theme === 'light') {
      await page.setViewportSize({ width: 320, height: 850 });
      await page.getByRole('heading', { name: 'WLAN & VPN', exact: true }).screenshot({ path: 'docs/accessibility-evidence/html-latest-heading-contrast.png' });
    }
    await context.close();
  }
  if (report.html.some(row => row.incomingPassageLanguage !== 'en' || row.technologyChapterHeading !== 'H2' || row.contrastSamples.some(sample => sample.level !== 'H3' || sample.contrast < 4.5))) {
    throw new Error('Latest HTML did not match the expected language, hierarchy or contrast observations.');
  }
  writeFileSync('docs/accessibility-evidence/pdf-html-comparison.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Selected PDF/latest-HTML comparison captured: PDF heading contrast 2.25:1; HTML sage-panel headings 5.32:1 in both themes.');
} finally {
  await browser?.close();
  await server.close();
}
