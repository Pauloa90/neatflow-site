import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/features/blog/content',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z
        .object({
          url: image(),
          alt: z.string(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      relatedPosts: z.array(reference('blog')).optional().default([]),
      readingTimeMinutes: z.number().optional(),
      isDraft: z.boolean().default(false),
      lang: z.enum(['en']).optional().default('en'),
      author: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      intro: z.string().optional(),
      faqs: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
    }),
});

export const collections = {
  blog: blogCollection,
};
