import { writeFile, readFile, readdir, mkdir, unlink } from "node:fs/promises"
import { join } from "node:path"
import { existsSync } from "node:fs"

const { PEXELS_API_KEY } = process.env
if (!PEXELS_API_KEY) {
  console.error("PEXELS_API_KEY missing in .env")
  process.exit(1)
}

const COVERS_DIR = "src/assets/blog/covers"
const POSTS_DIR = "src/features/blog/content/en"
const MANIFEST_PATH = "scripts/covers-manifest.json"

const QUERIES = [
  { slug: "ar-automation-for-it-services-and-msps-a-2026-buyers-guide",            query: "server room IT data center" },
  { slug: "ar-recovery-system-should-you-build-it-yourself-or-buy",                query: "developer building software" },
  { slug: "best-ar-automation-tools-for-small-b2b-service-firms-in-2026",          query: "small business team meeting laptop" },
  { slug: "cash-flow-problems-in-small-b2b-service-firms-2026-statistics-roundup", query: "money cash flow business charts" },
  { slug: "how-a-12-person-agency-recovered-47000-in-overdue-invoices-in-60-days", query: "marketing agency team collaboration" },
  { slug: "how-ai-agents-handle-invoice-disputes-and-partial-payments-in-2026",    query: "AI artificial intelligence robot technology" },
  { slug: "how-to-write-a-late-invoice-reminder-email-that-actually-works",        query: "person writing email laptop office" },
  { slug: "quickbooks-vs-xero-vs-freshbooks-for-ar-in-service-businesses",         query: "accounting software dashboard" },
  { slug: "the-hidden-cost-of-chasing-invoices-in-a-small-b2b-agency",             query: "stressed business owner papers" },
  { slug: "when-to-hire-an-ar-clerk-vs-automate-accounts-receivable",              query: "office worker desk computer" },
]

await mkdir(COVERS_DIR, { recursive: true })
await mkdir("scripts", { recursive: true })

console.log(`=== Downloading ${QUERIES.length} cover images from Pexels ===\n`)

const manifest = []
for (const { slug, query } of QUERIES) {
  try {
    const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`
    const res = await fetch(searchUrl, { headers: { Authorization: PEXELS_API_KEY } })
    if (!res.ok) throw new Error(`search HTTP ${res.status}`)
    const data = await res.json()
    if (!data.photos?.length) throw new Error("no photos returned")
    const photo = data.photos[0]
    const imgUrl = photo.src.large2x || photo.src.large
    const imgRes = await fetch(imgUrl)
    if (!imgRes.ok) throw new Error(`image HTTP ${imgRes.status}`)
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const file = join(COVERS_DIR, `${slug}.jpg`)
    await writeFile(file, buf)
    manifest.push({
      slug, query,
      pexels_id: photo.id,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      pexels_url: photo.url,
      bytes: buf.length,
      downloaded_at: new Date().toISOString(),
    })
    console.log(`  ✓ ${slug}.jpg (${(buf.length / 1024).toFixed(0)} KB) — ${photo.photographer}`)
  } catch (e) {
    manifest.push({ slug, query, error: e.message })
    console.error(`  ✗ ${slug}: ${e.message}`)
  }
}

await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

console.log(`\n=== Removing old SVG covers ===`)
const existing = await readdir(COVERS_DIR)
let removed = 0
for (const f of existing.filter(f => f.endsWith(".svg"))) {
  await unlink(join(COVERS_DIR, f))
  console.log(`  removed ${f}`)
  removed++
}
console.log(`  ${removed} SVG file(s) removed`)

console.log(`\n=== Updating post frontmatters (.svg → .jpg) ===`)
const posts = (await readdir(POSTS_DIR)).filter(f => f.endsWith(".md"))
let updated = 0
for (const file of posts) {
  const path = join(POSTS_DIR, file)
  const raw = await readFile(path, "utf8")
  const newRaw = raw.replace(/(heroImage:\n\s*url:\s*"[^"]+?)\.svg(")/m, "$1.jpg$2")
  if (newRaw !== raw) {
    await writeFile(path, newRaw)
    console.log(`  ✓ ${file}`)
    updated++
  }
}
console.log(`  ${updated} frontmatter(s) updated`)

console.log(`\n=== Writing CREDITS.md ===`)
let credits = "# Cover image credits\n\n"
credits += "All cover images are sourced from [Pexels](https://www.pexels.com/) under their free license.\n"
credits += "Pexels does not require attribution but credit is appreciated.\n\n"
credits += "| Slug | Photographer | Pexels URL |\n|---|---|---|\n"
for (const m of manifest.filter(m => !m.error)) {
  credits += `| \`${m.slug}\` | [${m.photographer}](${m.photographer_url}) | [link](${m.pexels_url}) |\n`
}
const failed = manifest.filter(m => m.error)
if (failed.length) {
  credits += `\n## Failed to download\n\n`
  for (const f of failed) credits += `- \`${f.slug}\` (query: ${JSON.stringify(f.query)}) — ${f.error}\n`
}
await writeFile(join(COVERS_DIR, "CREDITS.md"), credits)
console.log(`  ✓ ${join(COVERS_DIR, "CREDITS.md")}`)

const ok = manifest.filter(m => !m.error).length
const totalBytes = manifest.filter(m => !m.error).reduce((a, m) => a + (m.bytes || 0), 0)
console.log(`\nDone. Downloaded ${ok}/${QUERIES.length} covers. Total ${(totalBytes / 1024 / 1024).toFixed(2)} MB.`)
