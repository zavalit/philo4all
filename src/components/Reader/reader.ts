/*
 * Scroll engine for the reader. Progressive enhancement: every link works without it.
 * - --sheet-h on each sheet lets the CSS pin it by its bottom edge (paper stack).
 * - --cover (0–1) on each sheet is how far the next sheet has slid over it.
 * - --p on the teaser is the continuous page position (sum of covers); --v is scroll velocity.
 */
const root = document.documentElement;
const sheets = [...document.querySelectorAll<HTMLElement>('[data-sheet]')];
const anchors = sheets.map((sheet) => sheet.previousElementSibling as HTMLElement);
const teaser = document.querySelector<HTMLElement>('[data-teaser]');
const pages = document.querySelector<HTMLElement>('[data-pages]');
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-page-link]')];
const numbers = [...document.querySelectorAll<HTMLElement>('[data-page-number]')];
const title = document.querySelector<HTMLElement>('[data-page-title]');
const stacked = matchMedia('(width >= 60rem) and (prefers-reduced-motion: no-preference)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
let tops: number[] = [];
let active = -1;
let lastY = scrollY;
let velocity = 0;
let frame = 0;

function measure() {
  for (const sheet of sheets) sheet.style.setProperty('--sheet-h', `${sheet.offsetHeight}px`);
  tops = anchors.map((anchor) => anchor.getBoundingClientRect().top + scrollY);
}

function activate(index: number) {
  if (index === active) return;
  active = index;
  links.forEach((link, i) => (i === index ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current')));
  const number = String(index + 1).padStart(2, '0');
  for (const el of numbers) el.textContent = number;
  if (title) title.textContent = links[index]?.dataset.title ?? '';
}

function update() {
  frame = 0;
  const y = scrollY;
  const vh = innerHeight;
  let progress = 0;
  for (let i = 0; i < sheets.length; i++) {
    const cover = i + 1 < tops.length ? clamp((y + vh - tops[i + 1]) / vh, 0, 1) : 0;
    sheets[i].style.setProperty('--cover', cover.toFixed(3));
    progress += cover;
  }
  velocity = reduced.matches ? 0 : clamp(velocity * 0.85 + (y - lastY) * 0.15, -40, 40);
  lastY = y;
  teaser?.style.setProperty('--p', progress.toFixed(4));
  teaser?.style.setProperty('--v', velocity.toFixed(2));
  activate(Math.round(progress));
  if (Math.abs(velocity) > 0.05) schedule();
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

function remeasure() {
  measure();
  schedule();
}

// Focus can land in a pinned sheet that the next one covers (e.g. Shift+Tab); scroll back until it is uncovered.
document.addEventListener('focusin', (event) => {
  if (!stacked.matches) return;
  const target = event.target as HTMLElement;
  const index = sheets.findIndex((sheet) => sheet.contains(target));
  const next = sheets[index + 1];
  if (index < 0 || !next || next.getBoundingClientRect().top >= target.getBoundingClientRect().bottom) return;
  const offset = target.getBoundingClientRect().top - sheets[index].getBoundingClientRect().top;
  scrollTo({ top: Math.min(tops[index] + offset - innerHeight / 3, tops[index + 1] - innerHeight), behavior: 'instant' });
});

// Following a link in the mobile page list closes the list.
pages?.addEventListener('click', (event) => {
  if ((event.target as Element).closest('a') && pages.matches(':popover-open')) pages.hidePopover();
});

const observer = new ResizeObserver(remeasure);
for (const sheet of sheets) observer.observe(sheet);
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', remeasure);
stacked.addEventListener('change', remeasure);
measure();
root.dataset.readerReady = '';
update();
