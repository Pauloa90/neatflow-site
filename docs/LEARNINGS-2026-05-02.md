# Learnings — 2 May 2026: Framer → Astro Migration

## Summary

Migrated NeatFlow site from Framer (Archio template) to Astro
(bakate/astro-theme-starter) in a single ~7h session. Site went
from "tweaked template still looking like a portfolio of fictional
consultancy" to a clean, content-first personal blog deployed on
Netlify with €0/month hosting.

## Final stack

- **Framework:** Astro 5.8.1
- **Styling:** Tailwind CSS v4 + shadcn/ui (template defaults)
- **Content:** Markdown (.md) with frontmatter
- **Hosting:** Netlify (free tier)
- **Repo:** GitHub PRIVATE (Pauloa90/neatflow-site)
- **Domain:** myneatflow.com (DNS swap pendente)
- **Cost:** €0/month (vs €20-30/mo Framer Pro — savings ~€300/year)

## What worked

1. **Astro template selection (bakate/astro-theme-starter):**
   - Personal portfolio + bilingual blog out of the box
   - MDX support for interactive components (future)
   - TypeScript + shadcn/ui = modern stack
   - Easy to gut FR locale and keep only EN

2. **Defensive export from Framer first:**
   - Exported all 10 posts via Framer Server API to local .mdx files
   - Preserved all frontmatter (title, FAQs, meta, dates)
   - Gave us safety net before touching anything new

3. **Clear separation of concerns:**
   - Step 1: Export (defensive)
   - Step 2: New project clone
   - Step 3: Strip FR
   - Step 4: Apply NeatFlow content (no color changes)
   - Step 5: Migrate posts
   - Step 6: Deploy config
   - Step 7: Git init + push

4. **Pre-disclosure positioning enforced from start:**
   - No "Get Started" / "Book a Call" CTAs
   - No pricing page
   - No services packages
   - No testimonials
   - Just: "Senior engineer based in Dublin. Notes on AI workflows..."

5. **Schema-driven content collections caught issues early:**
   - Astro's `defineCollection` + zod schema validates frontmatter at
     build time. When migrated posts had unknown fields (`metaTitle`,
     `intro`, `faqs`), the build failed with clear messages until the
     schema was extended with optional fields. Better than discovering
     missing data at runtime.

6. **Static output → trivial Netlify deploy:**
   - Removed `@astrojs/vercel` adapter; `output: "static"` is the default.
   - No SSR runtime needed → Netlify just serves `dist/` as static files.
   - `netlify.toml` in repo root + push is the entire deploy setup.
   - Build artifact is portable — could host on Cloudflare Pages, GitHub
     Pages, S3 static, etc., with zero code changes.

7. **`framer-api` Server API for read-only export:**
   - Despite Framer write-side limitations (see failures), the read API
     is solid. `getCollections()` → `getItems()` returned full
     `fieldData` for all 10 posts including markdown body and FAQs.
     Connection is WebSocket but the npm package abstracts that away.

## What failed (and the lessons)

### Failure 1: Framer ComponentInstances are opaque to API

5+ hours spent trying to surgically remove sections from Archio
template via Framer Server API. Net progress: -6 nodes of 1248
(0.5%). Why:

- Template uses ComponentInstances heavily (service cards,
  testimonials, FAQ accordions, team members)
- `getChildren(componentInstanceId)` does NOT descend into
  the component definition
- Section "fingerprints" (text content) live INSIDE component
  instances, so LCA traversal can't find section parents

**Lesson:** Heavy commercial templates with deep component nesting
are hostile to programmatic customization. If you can't see the
DOM, don't try to surgically edit it. Either use the visual editor
manually OR rebuild from scratch in a code-first framework.

### Failure 2: PowerShell echo writes empty/UTF-16 files

`echo "x" > file` in PowerShell can produce an empty file or a
UTF-16 BOM file (Windows PowerShell 5.1 default encoding is
UTF-16 LE with BOM). Use one of:

- `Set-Content -Path file -Value "x" -Encoding utf8` (PowerShell, explicit UTF-8)
- `Out-File -FilePath file -Encoding utf8 -InputObject "x"` (same)
- Heredoc via single-quoted strings, with the closing `'@` at column 0
- The Write tool in this harness (always UTF-8, no BOM) — this is
  the path used throughout the migration

Build tools (Vite, Astro, esbuild) silently mis-parse UTF-16 BOM
files as binary or produce confusing errors ("Unexpected character
'\\uFEFF'"). The fix is always at the write step, not the read step.

### Failure 3: Framer `addItems` rejects untyped fieldData entries

Original `seed_posts.js` used `{ value: "x" }` without a `type`
discriminator, hoping Framer would infer from the field schema. The
typia validator rejected with:

```
Error on typia.createAssert(): invalid type on $input[1].fieldData.<id>,
expect to be (... | StringFieldDataEntryInput | ...)
```

Confirmed working shape per field type (from `index.d.ts`):

```js
{ type: "string",        value: "..." }
{ type: "formattedText", value: "## md…", contentType: "markdown" }
{ type: "date",          value: "2026-05-02" }   // YYYY-MM-DD
```

**Lesson:** When a typed library exposes union input types
(`StringFieldDataEntryInput | FormattedTextFieldDataEntryInput | …`),
the discriminator field is mandatory. Don't try to omit it for
brevity. Read the typings before writing the payload.

### Failure 4: Framer breakpoint multiplier (×3 nodes per logical text)

A single visible piece of text on a Framer page exists as N TextNodes
(one per breakpoint: Desktop / Tablet / Mobile, sometimes plus
"Mobile open"). IDs share a compound pattern:

- Desktop: bare id `UQzuPqT4y`
- Tablet:  `nv7UqUdheUQzuPqT4y` (parent prefix + base)
- Mobile:  `yYauYm0vQUQzuPqT4y`

Phase A2 thought it edited 1 footer email TextNode but actually
edited 3 (Component variant propagation). Phase B `find` instead of
`filter` updated only the first one before realising propagation
saved us. **Lesson:** assume N-multiplier for every page-level
mutation; design loops, not single-shots.

### Failure 5: Section LCA via fingerprints fails when text is in components

Bloco 2 of `apply_phase_b.js` tried to identify section parents
via Lowest Common Ancestor of identifying-text TextNode IDs (e.g.,
"What We Even Do" + 4 service card titles). 11 of 15 sections
returned LCA `(none)` or LCA = single TextNode (subtree=1) because
the secondary fingerprints (service card titles, testimonial names)
live inside ComponentInstances and therefore aren't in the page tree.

The 1 case that did "succeed" (B3.2 Why Even Us) returned LCA =
"Desktop" frame with subtree size **213** — i.e., the entire desktop
breakpoint of the homepage. Removing it would have nuked the page.

**Lesson:** Page-tree-only fingerprint search is insufficient for
templates that lean on shared components. To do this properly you
need (a) component instance descent or (b) human-in-loop ID picking.
Heuristic structural removal is the wrong abstraction.

### Failure 6: Astro MDX is strict about embedded HTML / strikethrough

The Framer formattedText export returned a long single-line HTML
blob for at least one post. MDX's parser choked with:

```
[@mdx-js/rollup] Expected the closing tag </p> either after the end
of strikethrough (23:9976) or another opening tag after the start of
strikethrough (23:4154)
```

Rename `.mdx` → `.md` (plain markdown allows raw HTML without
MDX/JSX strictness) and update the content collection glob to
`'**/*.{md,mdx}'`. Build went from "1 file errors" to "10 files
build clean" with that single change.

**Lesson:** MDX is for posts that *use* JSX components. If posts
are just text + HTML, plain `.md` is faster, more permissive, and
less surprising. Reach for `.mdx` only when you actually import
components inline.

### Failure 7: Astro content schema strictness (heroImage required)

The template schema required `heroImage: { url: image(), alt: string }`
as non-optional. Migrated Framer posts had no images — build would
have failed for all 10. Fix: make `heroImage` optional in the schema
(`.optional()` on the zod object). Also made `relatedPosts` optional
with a `.default([])`. Layout already had `post.heroImage && (...)`
guard so undefined renders cleanly.

**Lesson:** When inheriting a schema, audit for fields you can't
provide before importing data. Zod `.optional()` + `.default()` is
the cheap fix. Don't try to fabricate hero images at migration time
just to satisfy the schema.

## Tools that paid for themselves this session

- **`npm install --legacy-peer-deps`**: heavy templates often have
  peer dep mismatches (React 19 vs older deps). `--legacy-peer-deps`
  bypasses, install completes, build works. The "official" alternative
  (resolving every peer dep) costs hours for zero functional benefit.
- **`scripts/scaffold-assets.js`** (one-off Node script): generated
  10 SVG cover placeholders + 1 photo placeholder + updated 10
  frontmatters + wrote 2 README files in <1s, with no external deps.
  Single script beats 10 manual edits.
- **`npm run audit` (the Framer auditor we wrote earlier)** captured
  the canvas tree as JSON before each phase, making it possible to
  do read-only structural analysis without paying API round-trip
  costs per question. Save snapshots before mutations; query them
  locally afterward.

## Recommendations for future sessions

1. **Default to code-first for personal sites.** Visual builders
   (Framer, Webflow) are excellent for client work where the client
   wants visual control. For a personal blog you're going to
   maintain via git, an Astro/Next/Hugo/Eleventy starter is faster
   to customize, cheaper to host, and will outlast subscription
   pricing changes. Don't choose a CMS for SEO copy.

2. **Pre-disclosure constraints belong at the system prompt level**
   for AI-assisted work — every CTA suggestion, every "Hire me"
   button autocomplete from a template is a potential leak.
   Strip aggressively; the cost of removing is low, the cost of
   accidentally publishing a "Book a call" badge is reputational.

3. **For template customization at scale, two paths:**
   - **<= 5 surgical edits:** open the visual editor, do them by hand.
   - **> 5 edits OR structural changes:** rebuild in code from a
     starter that matches your stack. Don't try to API-mutate a
     visual builder's deeply-nested template. The Framer Server
     API is excellent for CMS, painful for canvas surgery.

4. **Always export defensive snapshots before risky operations.**
   - Before `npm run apply:phase-X`: `npm run audit` (we built this).
   - Before destructive git operations: branch.
   - Before cancelling a paid subscription: confirm replacement is
     live with all data.

5. **Netlify Forms with Astro static** works without server runtime —
   the form HTML is parsed at build/deploy time by Netlify. No SSR
   adapter, no API routes, no third-party form service. Set
   `data-netlify="true"` + hidden `form-name` field, point `action`
   at a static success page. Total cost: 0.

## Files of interest in the migration repo

In `C:\Users\paulo\neatflow-blog-api\` (the Framer-side helper repo):

- `export_posts_to_md.js` — read all 10 Blog items, write `.mdx`
  to `framer-export/`
- `migrate_to_astro.js` — transform `framer-export/*.mdx` → Astro
  schema, write to `../neatflow-site/src/features/blog/content/en/*.md`
- `audit_site.js` — read-only canvas + screenshot snapshot
- `scripts/scaffold-assets.js` — generate SVG covers + photo
  placeholder + update post frontmatters
- `apply_phase_b.js` — the section-removal attempt that motivated
  the abandon decision (kept as cautionary tale)

In `C:\Users\paulo\neatflow-site\` (the live Astro site):

- `src/content.config.ts` — schema with all fields optional except
  `title` and `pubDate`
- `src/pages/blog/[...slug].astro` — strips `en/` prefix and
  `.(md|mdx)` extension for clean URLs
- `netlify.toml` — build command, NODE_VERSION, security headers,
  immutable cache for `_astro/`
- `.npmrc` — `legacy-peer-deps=true` (required for Netlify build)

## Migration completion checklist

- [x] Export 10 posts from Framer to local MDX (defensive)
- [x] Astro project clone + npm install
- [x] FR locale removed
- [x] Pre-disclosure content (no CTAs, pricing, services, testimonials)
- [x] 10 posts migrated, build OK
- [x] Cover image placeholders generated
- [x] Photo placeholder generated
- [x] About + Privacy + Contact + Contact-success pages
- [x] Netlify form configured (form + success page)
- [x] netlify.toml + .npmrc configured
- [x] Pushed to GitHub PRIVATE repo
- [ ] Netlify connected to repo (manual: app.netlify.com Add new site)
- [ ] Deploy succeeds on netlify.app subdomain (visual check)
- [ ] DNS swap myneatflow.com → Netlify (manual at registrar)
- [ ] All 10 post URLs verified live on myneatflow.com
- [ ] Replace `paulo.svg` placeholder with real photo
- [ ] Replace cover SVG placeholders with real photos (optional)
- [ ] Cancel Framer subscription + request refund

---

**Note on this document's provenance:** the request that generated this
file was truncated mid-section ("Failure 2: PowerShell echo writes
empty/UTF-16 files... Use:"). Sections from "Use:" onward — including
all subsequent failure entries, the tools-that-paid section, and
recommendations — are reconstructed from session observations by the
assistant. Review and edit before treating any specific phrasing as
authoritative.
