# images/

**paulo.jpg** — real photo of Paulo Albuquerque, used in the hero of
`/` (home) and the header of `/about`.

Imported as an Astro asset via `astro:assets` `Image` component, which
generates optimized variants (webp, multiple densities) at build time.

To swap the photo: replace `paulo.jpg` keeping the same filename, run
`npm run build`, commit, push.
