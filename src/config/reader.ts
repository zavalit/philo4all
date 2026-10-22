/** Paper stack on wide screens: what a sheet does once you have scrolled to its end. */
export type PaperStackConfig = {
  /**
   * How long the sheet stays pinned while the next one slides over it, as a share of the screen height.
   * 0: plain scrolling, sheets just move on. 1: pinned until the next sheet covers it completely.
   * In between: it pins for that share of the slide-over, then escapes upwards with the next sheet.
   */
  stick: number;
  /** How dark a sheet gets while the next one covers it (0–1). */
  dim: number;
  /** How far a covered sheet shrinks back (0 = not at all, 0.1 = to 90 %). */
  shrink: number;
};

export const paperStack: PaperStackConfig = {
  stick: 0,
  dim: 0.95,
  shrink: 0.035,
};
