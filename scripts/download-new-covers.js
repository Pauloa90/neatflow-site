import { writeFile, readFile } from "node:fs/promises"
import { join } from "node:path"
import { existsSync } from "node:fs"

const { PEXELS_API_KEY } = process.env
if (!PEXELS_API_KEY) {
  console.error("PEXELS_API_KEY missing in .env")
  process.exit(1)
}

const COVERS_DIR = "src/assets/blog/covers"
const MANIFEST_PATH = "scripts/covers-manifest.json"
const CREDITS_PATH = join(COVERS_DIR, "CREDITS.md")

// New posts only. Each query is chosen to fit the post topic.
const QUERIES = [
  { slug: "what-is-the-model-context-protocol-and-why-i-started-using-it", query: "usb-c cable ports connection technology" },
  { slug: "setting-up-a-gmail-mcp-server-for-claude",                      query: "person using laptop email inbox" },
  { slug: "n8n-vs-make-vs-zapier-in-2026-which-i-actually-reach-for",      query: "workflow automation flowchart connected" },
  { slug: "running-local-llms-on-a-normal-laptop-in-2026",                 query: "laptop computer code dark desk" },
]

console.log(`=== Downloading ${QUERIES.length} new cover images from Pexels ===\n`)

const newEntries = []
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
    newEntries.push({
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
    console.error(`  ✗ ${slug}: ${e.message}`)
  }
}

// Append to manifest
let manifest = []
if (existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
}
manifest.push(...newEntries)
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

// Append rows to CREDITS.md (before any trailing "Failed" section if present)
let credits = await readFile(CREDITS_PATH, "utf8")
let rows = ""
for (const m of newEntries) {
  rows += `| \`${m.slug}\` | [${m.photographer}](${m.photographer_url}) | [link](${m.pexels_url}) |\n`
}
credits = credits.trimEnd() + "\n" + rows
await writeFile(CREDITS_PATH, credits)

console.log(`\nDone. Added ${newEntries.length} new covers.`)
