import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

export default defineConfig({
  site: 'https://myneatflow.com',
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkReadingTime],
      syntaxHighlight: { type: 'shiki' },
    }),
    sitemap(),
  ],
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
