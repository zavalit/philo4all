/** Defaults for the tilted page teaser in the left rail; <PageTeaser> props override any of them. */
export const teaser = {
  /** Rotation of the whole stack, in degrees (negative tilts it to the left). */
  angle: -8,
  /** 3D turn of the stack towards the document, in degrees. */
  tilt: 16,
  /** How many neighbouring pages stay visible above and below the current one. */
  visible: 2,
  /** Distance between thumbnail centres, as a share of the thumbnail height. */
  spacing: 1.06,
  /** Strength (0–1) of the desk-coloured veil over pages that are not current. */
  tint: 0.6,
  /** Skew from scroll speed (0 turns it off). */
  bend: 0.35,
  /** Size of the neighbouring pages relative to the current one. */
  scale: 0.84,
};

export type TeaserConfig = typeof teaser;
