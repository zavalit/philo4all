import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const topics = defineCollection({
  loader: glob({ base: './src/content/topics', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string().min(3),
    description: z.string().min(20),
    order: z.number().int().min(1).max(9),
    /** Page of the original PDF; its rendering is the chapter's teaser thumbnail. */
    sourcePage: z.number().int().min(3).max(12),
    /** Recurring corner decorations of the PDF page. */
    decor: z.array(z.enum(['leaf', 'bushes'])).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '*.mdx' }),
  schema: ({ image }) => z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    members: z.array(z.object({ name: z.string(), image: image() })).optional(),
  }),
});

export const collections = { topics, pages };
