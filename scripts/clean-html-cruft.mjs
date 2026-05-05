// One-off cleanup: strip raw HTML cruft (dir="auto", data-preset-tag, etc.)
// from existing blog posts and convert back to plain markdown.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/features/blog/content/en/', import.meta.url).pathname.replace(/^\//, '');

const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const path = join(dir, file);
  let txt = readFileSync(path, 'utf8');

  // Split frontmatter from body so we don't touch the YAML
  const fmMatch = txt.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];
  let body = fmMatch[2];

  // Skip if there's no HTML cruft at all
  if (!/dir="auto"|data-preset-tag/.test(body)) continue;

  // Inline transformations first (so they survive the block strips)
  body = body.replace(/<a href="([^"]+)">([^<]*?)<\/a>/g, '[$2]($1)');
  body = body.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  body = body.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');

  // Headings
  body = body.replace(/<h2 dir="auto">([\s\S]*?)<\/h2>/g, '\n\n## $1\n\n');
  body = body.replace(/<h3 dir="auto">([\s\S]*?)<\/h3>/g, '\n\n### $1\n\n');
  body = body.replace(/<h4 dir="auto">([\s\S]*?)<\/h4>/g, '\n\n#### $1\n\n');

  // List items: match li wrappers with optional inner <p>
  body = body.replace(/<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/g, '\n- $1');
  body = body.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '\n- $1');

  // Open/close ul/ol — leave a blank line so the markdown list parses
  body = body.replace(/<\/?ul[^>]*>/g, '\n\n');
  body = body.replace(/<\/?ol[^>]*>/g, '\n\n');

  // Paragraphs
  body = body.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n\n$1\n\n');

  // Any remaining stray attribute residue
  body = body.replace(/<br\s*\/?>/g, '\n');

  // Tidy whitespace: collapse 3+ newlines to 2
  body = body.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n');

  writeFileSync(path, fm + body, 'utf8');
  console.log(`cleaned: ${file}`);
}
