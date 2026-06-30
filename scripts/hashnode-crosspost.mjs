// Crosspost all blog posts to Hashnode with originalArticleURL pointing to myneatflow.com.
// Reads HASHNODE_TOKEN + HASHNODE_PUBLICATION_ID from .env.local.
//   node scripts/hashnode-crosspost.mjs            # publishes all 12
//   node scripts/hashnode-crosspost.mjs --limit=1  # only first
//   node scripts/hashnode-crosspost.mjs --offset=2 # skip first 2

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const env = readFileSync('.env.local', 'utf8');
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) process.env[m[1]] = m[2];
}
const TOKEN = process.env.HASHNODE_TOKEN;
const PUB_ID = process.env.HASHNODE_PUBLICATION_ID;
if (!TOKEN || !PUB_ID) {
  console.error('Need HASHNODE_TOKEN and HASHNODE_PUBLICATION_ID in .env.local');
  process.exit(1);
}

const SITE = 'https://myneatflow.com';
const BLOG_DIR = './src/features/blog/content/en';
const DELAY_MS = 20_000;

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
const offset = args.offset ? parseInt(args.offset, 10) : 0;

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: content };
  const data = {};
  const fm = m[1];
  for (const line of fm.split(/\r?\n/)) {
    const lm = line.match(/^([a-zA-Z]+):\s*"?(.+?)"?\s*$/);
    if (lm && !line.startsWith(' ')) data[lm[1]] = lm[2];
  }
  const tagsMatch = fm.match(/^tags:\s*\[([^\]]+)\]/m);
  if (tagsMatch) {
    data.tags = tagsMatch[1].split(',').map(s => s.trim().replace(/^"(.+)"$/, '$1'));
  }
  return { data, body: m[2] };
}

function tagsForHashnode(tags = []) {
  return tags.slice(0, 5).map(name => {
    const slug = name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/^-+|-+$/g, '');
    return { slug, name };
  }).filter(t => t.slug.length >= 2);
}

function processBody(body) {
  return body.replace(/\]\(\/blog\//g, `](${SITE}/blog/`);
}

const PUBLISH_MUTATION = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post { id url slug }
    }
  }
`;

const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).sort();
const toProcess = files.slice(offset, offset + limit);
console.log(`Found ${files.length} posts. Processing ${toProcess.length}.`);

const results = [];
for (let i = 0; i < toProcess.length; i++) {
  const file = toProcess[i];
  const slug = file.replace(/\.md$/, '');
  const content = readFileSync(join(BLOG_DIR, file), 'utf8');
  const { data, body } = parseFrontmatter(content);

  const input = {
    publicationId: PUB_ID,
    title: data.title,
    contentMarkdown: processBody(body.trim()),
    originalArticleURL: `${SITE}/blog/${slug}/`,
    tags: tagsForHashnode(data.tags),
    metaTags: { description: data.description || data.metaDescription || '' },
  };

  console.log(`\n[${i + 1}/${toProcess.length}] ${slug}`);
  console.log(`  title: ${input.title.slice(0, 70)}${input.title.length > 70 ? '…' : ''}`);

  try {
    const r = await fetch('https://gql.hashnode.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
      body: JSON.stringify({ query: PUBLISH_MUTATION, variables: { input } }),
    });
    const result = await r.json();
    if (result.errors) {
      console.log(`  ✗ ${JSON.stringify(result.errors).slice(0, 400)}`);
      results.push({ slug, status: 'fail', error: result.errors });
      if (i === 0) { console.error('First failed — stopping.'); process.exit(1); }
    } else {
      const post = result.data?.publishPost?.post;
      console.log(`  ✓ ${post?.url || 'published'}`);
      results.push({ slug, status: 'ok', url: post?.url, id: post?.id });
    }
  } catch (e) {
    console.log(`  ✗ network: ${e.message}`);
    results.push({ slug, status: 'error', error: e.message });
  }

  if (i < toProcess.length - 1) {
    console.log(`  (waiting ${DELAY_MS / 1000}s)`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
}

console.log(`\n=== Summary ===`);
results.forEach(r => console.log(`${r.status === 'ok' ? '✓' : '✗'} ${r.slug} ${r.url || ''}`));
const ok = results.filter(r => r.status === 'ok').length;
console.log(`\n${ok}/${results.length} published.`);
