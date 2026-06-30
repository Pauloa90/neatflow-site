// Crosspost all blog posts to dev.to with canonical_url pointing to myneatflow.com.
// Reads DEVTO_API_KEY from .env.local. Skips frontmatter, rewrites internal /blog/ links.
//   node scripts/devto-crosspost.mjs           # publishes all 12 posts
//   node scripts/devto-crosspost.mjs --limit=1 # only first post (test mode)

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// --- Load .env.local ---
const env = readFileSync('.env.local', 'utf8');
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) process.env[m[1]] = m[2];
}
const API_KEY = process.env.DEVTO_API_KEY;
if (!API_KEY) { console.error('Missing DEVTO_API_KEY in .env.local'); process.exit(1); }

const SITE = 'https://myneatflow.com';
const BLOG_DIR = './src/features/blog/content/en';
const DELAY_MS = 30_000; // 30s between requests — well under dev.to's 30 req / 30s limit

// --- args ---
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
const offset = args.offset ? parseInt(args.offset, 10) : 0;

// --- frontmatter parser (manual; only top-level scalars + tags array we need) ---
function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: content };
  const data = {};
  const fm = m[1];
  for (const line of fm.split(/\r?\n/)) {
    const lm = line.match(/^([a-zA-Z]+):\s*"?(.+?)"?\s*$/);
    if (lm && !line.includes(':  ') && !line.startsWith(' ')) {
      // skip nested fields (heroImage.url etc.) which start with space
      data[lm[1]] = lm[2];
    }
  }
  const tagsMatch = fm.match(/^tags:\s*\[([^\]]+)\]/m);
  if (tagsMatch) {
    data.tags = tagsMatch[1].split(',').map(s => s.trim().replace(/^"(.+)"$/, '$1'));
  }
  return { data, body: m[2] };
}

function cleanTags(tags = []) {
  return tags
    .map(t => t.replace(/[^a-z0-9]/gi, '').toLowerCase())
    .filter(t => t.length >= 2 && t.length <= 30)
    .slice(0, 4);
}

function processBody(body) {
  // Rewrite internal /blog/ links to absolute
  return body.replace(/\]\(\/blog\//g, `](${SITE}/blog/`);
}

// --- main ---
const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).sort();
console.log(`Found ${files.length} posts. Limit: ${limit === Infinity ? 'none' : limit}`);

const results = [];
const toProcess = files.slice(offset, offset + limit);

for (let i = 0; i < toProcess.length; i++) {
  const file = toProcess[i];
  const slug = file.replace(/\.md$/, '');
  const content = readFileSync(join(BLOG_DIR, file), 'utf8');
  const { data, body } = parseFrontmatter(content);
  const canonical = `${SITE}/blog/${slug}/`;

  const article = {
    title: data.title,
    body_markdown: processBody(body.trim()),
    published: true,
    canonical_url: canonical,
    description: data.description || data.metaDescription,
    tags: cleanTags(data.tags),
  };

  console.log(`\n[${i + 1}/${toProcess.length}] ${slug}`);
  console.log(`  title: ${article.title.slice(0, 70)}${article.title.length > 70 ? '…' : ''}`);
  console.log(`  tags:  ${article.tags.join(', ') || '(none)'}`);

  try {
    const r = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: { 'api-key': API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'neatflow-crosspost/1.0' },
      body: JSON.stringify({ article }),
    });
    const result = await r.json();
    if (r.ok) {
      console.log(`  ✓ ${result.url}`);
      results.push({ slug, status: 'ok', url: result.url, id: result.id });
    } else {
      console.log(`  ✗ ${r.status}: ${JSON.stringify(result).slice(0, 400)}`);
      results.push({ slug, status: 'fail', http: r.status, error: result });
      if (i === 0) {
        console.error('\nFirst article failed — stopping to avoid cascading errors. Fix the issue and re-run.');
        process.exit(1);
      }
    }
  } catch (e) {
    console.log(`  ✗ network: ${e.message}`);
    results.push({ slug, status: 'error', error: e.message });
  }

  if (i < toProcess.length - 1) {
    console.log(`  (waiting ${DELAY_MS / 1000}s before next request)`);
    await new Promise(res => setTimeout(res, DELAY_MS));
  }
}

console.log(`\n=== Summary ===`);
results.forEach(r => console.log(`${r.status === 'ok' ? '✓' : '✗'} ${r.slug} ${r.url || r.error?.error || ''}`));
const ok = results.filter(r => r.status === 'ok').length;
console.log(`\n${ok}/${results.length} published.`);
