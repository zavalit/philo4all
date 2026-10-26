/** Composite the inactive dot's opacity over the desk before measuring luminance. */
export function navigationContrast(page) {
  return page.evaluate(() => {
    const dot = document.querySelector('[data-page-link]:not([aria-current]) span[aria-hidden]');
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const background = getComputedStyle(document.documentElement).backgroundColor;
    const css = getComputedStyle(dot);
    const bg = rgb(background), fg = rgb(css.backgroundColor), opacity = Number(css.opacity);
    const visible = fg.map((n, i) => opacity * n + (1 - opacity) * bg[i]);
    const luminance = color => color.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((n, x, i) => n + x * [.2126, .7152, .0722][i], 0);
    const a = luminance(visible), b = luminance(bg);
    const contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    return { foreground: css.backgroundColor, background, opacity, contrast, minimum: 3, passed: contrast >= 3 };
  });
}
