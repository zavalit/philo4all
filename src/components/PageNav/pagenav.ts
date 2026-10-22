/*
 * Page navigation, labelled with the sheets' own headings: marks the current page and, on wide
 * screens, previews a sheet when its dot is hovered or focused. The preview is a live copy of the
 * real sheet, laid out at the sheet's own width and scaled down, so it always matches the page.
 * Copies are made on first use.
 */
import { onProgress, sheets } from '../Reader/reader';

const pages = document.querySelector<HTMLElement>('[data-pages]');
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-page-link]')];
const titles = [...document.querySelectorAll<HTMLElement>('[data-page-title]')];
const preview = document.querySelector<HTMLAnchorElement>('[data-preview]');
const previewTitle = preview?.querySelector<HTMLElement>('[data-preview-title]');
const previewMini = preview?.querySelector<HTMLElement>('[data-preview-mini]');
const wide = matchMedia('(width >= 60rem)');
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const copies = new Map<number, HTMLElement>();
let active = -1;
let hideTimer = 0;

onProgress((progress) => {
  const index = Math.round(progress);
  if (index === active) return;
  active = index;
  links.forEach((link, i) => (i === index ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current')));
  for (const el of titles) el.textContent = links[index]?.dataset.title ?? '';
});

// A copy without ids, labels or reader state, so it is inert decoration.
function copyOf(index: number) {
  let copy = copies.get(index);
  if (!copy) {
    copy = sheets[index].cloneNode(true) as HTMLElement;
    for (const el of [copy, ...copy.querySelectorAll('[id],[aria-labelledby],[aria-describedby]')]) {
      el.removeAttribute('id');
      el.removeAttribute('aria-labelledby');
      el.removeAttribute('aria-describedby');
    }
    copy.removeAttribute('data-sheet');
    copy.removeAttribute('style');
    copy.inert = true;
    copies.set(index, copy);
  }
  return copy;
}

function show(index: number) {
  if (!wide.matches || !preview || !previewMini || !previewTitle) return;
  clearTimeout(hideTimer);
  const sheet = sheets[index];
  const copy = copyOf(index);
  const scale = previewMini.clientWidth / sheet.offsetWidth;
  copy.style.cssText = `inline-size:${sheet.offsetWidth}px;scale:${scale}`;
  previewMini.style.blockSize = `${sheet.offsetHeight * scale}px`;
  previewMini.replaceChildren(copy);
  previewTitle.textContent = links[index].dataset.title ?? '';
  preview.href = links[index].getAttribute('href') ?? '#';

  // Open into the gutter left of the dots when it fits, otherwise towards the sheet; keep it on screen.
  const dot = links[index].getBoundingClientRect();
  const gap = 16;
  const { offsetWidth: width, offsetHeight: height } = preview;
  const left = dot.left - gap - width >= gap ? dot.left - gap - width : dot.right + gap;
  const top = clamp(dot.top + dot.height / 2 - height / 2, gap, innerHeight - height - gap);
  preview.style.insetInlineStart = `${left}px`;
  preview.style.insetBlockStart = `${top}px`;
  preview.dataset.open = '';
}

function hide(delay = 0) {
  clearTimeout(hideTimer);
  const close = () => preview && delete preview.dataset.open;
  if (delay) hideTimer = window.setTimeout(close, delay);
  else close();
}

links.forEach((link, i) => {
  link.addEventListener('pointerenter', () => show(i));
  link.addEventListener('pointerleave', () => hide(150));
  link.addEventListener('focus', () => link.matches(':focus-visible') && show(i));
  link.addEventListener('blur', () => hide());
});
// The preview stays open while hovered, and Escape dismisses it (WCAG 1.4.13).
preview?.addEventListener('pointerenter', () => clearTimeout(hideTimer));
preview?.addEventListener('pointerleave', () => hide(150));
preview?.addEventListener('click', () => hide());
document.addEventListener('keydown', (event) => event.key === 'Escape' && hide());

// Following a link in the narrow-screen page list closes the list.
pages?.addEventListener('click', (event) => {
  hide();
  if ((event.target as Element).closest('a') && pages.matches(':popover-open')) pages.hidePopover();
});
