import type { ImageMetadata } from 'astro';

/** Illustrations extracted from the original Philo4all PDF, keyed by file name. */
const files = import.meta.glob<{ default: ImageMetadata }>('./*.webp', { eager: true });
export const art: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([path, module]) => [path.slice(2, -'.webp'.length), module.default]),
);
