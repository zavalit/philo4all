/*
 * Scroll engine for the reader. Progressive enhancement: every link works without it.
 * - --sheet-h on each sheet lets the CSS pin it by its bottom edge (paper stack).
 * - --cover (0–1) on each sheet is how far the next sheet has slid over it.
 * - Progress, the continuous page position (sum of covers), is published through onProgress.
 * - The URL hash follows the page being read (#thema-07 only while 7) is current; none on the cover).
 */
const root = document.documentElement;
export const sheets = [...document.querySelectorAll<HTMLElement>('[data-sheet]')];
const anchors = sheets.map((sheet) => sheet.previousElementSibling as HTMLElement);
const ids = anchors.map((anchor) => anchor.id);
const stacked = matchMedia('(width >= 60rem) and (prefers-reduced-motion: no-preference)');

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const listeners = new Set<(progress: number) => void>();
let tops: number[] = [];
let progress = 0;
let frame = 0;
let arriving = -1;
let arriveTimer = 0;

/** Calls back with the page position now and on every frame it changes. */
export function onProgress(callback: (progress: number) => void) {
  listeners.add(callback);
  callback(progress);
}

function measure() {
  for (const sheet of sheets) sheet.style.setProperty('--sheet-h', `${sheet.offsetHeight}px`);
  tops = anchors.map((anchor) => anchor.getBoundingClientRect().top + scrollY);
}

function update() {
  frame = 0;
  const y = scrollY;
  const vh = innerHeight;
  progress = 0;
  for (let i = 0; i < sheets.length; i++) {
    const cover = i + 1 < tops.length ? clamp((y + vh - tops[i + 1]) / vh, 0, 1) : 0;
    sheets[i].style.setProperty('--cover', cover.toFixed(3));
    progress += cover;
  }
  for (const listener of listeners) listener(progress);
  syncHash();
}

// Keep the hash on the current page without adding history entries. While a hash navigation
// (deep link, dot, contents card) is still scrolling to its page, leave the hash alone until it arrives.
function syncHash() {
  const index = Math.round(progress);
  if (arriving >= 0) {
    if (index !== arriving) return;
    arriving = -1;
  }
  const hash = index > 0 ? `#${ids[index]}` : '';
  if (location.hash !== hash) history.replaceState(history.state, '', hash || location.pathname + location.search);
}

function expect(hash: string) {
  arriving = ids.indexOf(decodeURIComponent(hash.slice(1)));
  clearTimeout(arriveTimer);
  if (arriving >= 0) arriveTimer = window.setTimeout(stopExpecting, 1500);
}

// Scrolling ended (arrived, or the reader took over mid-way): follow the page in view again.
function stopExpecting() {
  if (arriving < 0) return;
  arriving = -1;
  schedule();
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

const observer = new ResizeObserver(remeasure);
for (const sheet of sheets) observer.observe(sheet);
addEventListener('scroll', schedule, { passive: true });
// Catch in-page links before the browser navigates, and any other hash change (address bar, back/forward).
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  expect(link.hash);
  const index = ids.indexOf(decodeURIComponent(link.hash.slice(1)));
  const heading = index >= 0 && document.getElementById(sheets[index].getAttribute('aria-labelledby') ?? '');
  // Native fragment scrolling still handles the jump. Afterwards, give the chapter a
  // meaningful focus destination, including when a popover link has just been hidden.
  if (heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
});
addEventListener('hashchange', () => expect(location.hash));
addEventListener('scrollend', stopExpecting);
expect(location.hash);
addEventListener('resize', remeasure);
stacked.addEventListener('change', remeasure);
measure();
root.dataset.readerReady = '';
update();
// Smooth scrolling only after the initial jump to a deep link, so that one lands without a long glide.
const enableSmooth = () => requestAnimationFrame(() => (root.dataset.smooth = ''));
if (document.readyState === 'complete') enableSmooth();
else addEventListener('load', enableSmooth, { once: true });
