import fs from "node:fs"
import path from "node:path"

const SAMPLE_SIZE = Number(process.env.GLYPH_POOL_SIZE ?? 500)
const PRECOMPUTED_FRAMES = Number(process.env.GLYPH_POOL_FRAMES ?? 4)

const rootDir = process.cwd()
const sourceRoot = path.join(rootDir, "public", "ithkuil-glyph-phrases")
const manifestPath = path.join(sourceRoot, "manifest.json")
const assetRoot = path.join(rootDir, "src", "assets", "ithkuil-glyph-phrases")
const outputPath = path.join(rootDir, "src", "glyphPool", "pool.gen.js")

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function hashString32(input) {
  let hash = 2166136261
  const str = String(input || "")
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed) {
  let t = seed >>> 0 || 1
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function sampleItems(items, sampleSize, rand) {
  const source = Array.isArray(items) ? items : []
  const targetSize = Math.min(sampleSize, source.length)
  const sample = []

  for (let i = 0; i < source.length; i++) {
    if (i < targetSize) {
      sample[i] = source[i]
      continue
    }
    const pick = Math.floor(rand() * (i + 1))
    if (pick < targetSize) {
      sample[pick] = source[i]
    }
  }

  for (let i = sample.length - 1; i > 0; i--) {
    const pick = Math.floor(rand() * (i + 1))
    const temp = sample[i]
    sample[i] = sample[pick]
    sample[pick] = temp
  }

  return sample
}

function normalizeRelPath(relPath) {
  return String(relPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function copyAsset(relPath) {
  const sourcePath = path.join(sourceRoot, relPath)
  const destPath = path.join(assetRoot, relPath)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing glyph asset: ${sourcePath}`)
  }
  ensureDir(path.dirname(destPath))
  fs.copyFileSync(sourcePath, destPath)
}

function urlExpr(relPath) {
  const normalized = normalizeRelPath(relPath)
  return `new URL(${JSON.stringify(
    `../assets/ithkuil-glyph-phrases/${normalized}`,
  )}, import.meta.url).href`
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const items = Array.isArray(manifest?.items) ? manifest.items : []
  if (!items.length) {
    throw new Error("Manifest has no items.")
  }

  const seed = toNumber(
    process.env.GLYPH_POOL_SEED ?? manifest?.resolvedSeed ?? hashString32("glyph-pool"),
    hashString32("glyph-pool"),
  )
  const rand = mulberry32(seed)
  const sampledItems = sampleItems(items, SAMPLE_SIZE, rand)

  const baseGlyphFiles = new Set()
  for (const item of sampledItems) {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    for (const glyph of glyphs) {
      const file = normalizeRelPath(glyph?.file)
      if (file) {
        baseGlyphFiles.add(file)
      }
    }
  }

  const baseGlyphFileSet = new Set(baseGlyphFiles)

  const phrases = sampledItems.map((item) => {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    const normalizedGlyphs = glyphs.map((glyph) => {
      const baseFile = normalizeRelPath(glyph?.file)
      const providedVariants = Array.isArray(glyph?.flickerVariants)
        ? glyph.flickerVariants.map(normalizeRelPath).filter(Boolean)
        : []
      const filteredVariants = providedVariants.filter((file) => baseGlyphFileSet.has(file))

      const variants = filteredVariants.slice(0, PRECOMPUTED_FRAMES)
      while (variants.length < PRECOMPUTED_FRAMES) {
        variants.push(baseFile)
      }

      return {
        glyphIndex: toNumber(glyph?.index, 0),
        width: toNumber(glyph?.width, 1),
        height: toNumber(glyph?.height, 1),
        file: baseFile,
        flickerVariants: variants,
      }
    })

    return {
      id: String(item?.id || ""),
      text: String(item?.phrase || ""),
      glyphs: normalizedGlyphs,
    }
  })

  ensureDir(assetRoot)
  ensureDir(path.dirname(outputPath))

  for (const file of baseGlyphFileSet) {
    copyAsset(file)
  }

  let glyphCount = 0
  for (const phrase of phrases) {
    glyphCount += phrase.glyphs.length
  }

  const lines = []
  lines.push("// GENERATED FILE. DO NOT EDIT BY HAND.")
  lines.push(`// Source: ${path.relative(rootDir, manifestPath)}`)
  lines.push(
    `// Sample size: ${SAMPLE_SIZE} (seed=${seed}, frames=${PRECOMPUTED_FRAMES})`,
  )
  lines.push("")
  lines.push("export const glyphPool = {")
  lines.push(`  seed: ${seed},`)
  lines.push(`  sampledCount: ${phrases.length},`)
  lines.push(`  totalCount: ${items.length},`)
  lines.push(`  glyphCount: ${glyphCount},`)
  lines.push("  phrases: [")

  for (const phrase of phrases) {
    lines.push("    {")
    lines.push(`      id: ${JSON.stringify(phrase.id)},`)
    lines.push(`      text: ${JSON.stringify(phrase.text)},`)
    lines.push("      glyphs: [")
    for (const glyph of phrase.glyphs) {
      lines.push("        {")
      lines.push(`          glyphIndex: ${glyph.glyphIndex},`)
      lines.push(`          width: ${glyph.width},`)
      lines.push(`          height: ${glyph.height},`)
      lines.push(`          file: ${urlExpr(glyph.file)},`)
      lines.push("          flickerVariants: [")
      for (const variant of glyph.flickerVariants) {
        lines.push(`            ${urlExpr(variant)},`)
      }
      lines.push("          ],")
      lines.push("        },")
    }
    lines.push("      ],")
    lines.push("    },")
  }

  lines.push("  ],")
  lines.push("}")
  lines.push("")
  lines.push("export const glyphTokens = glyphPool.phrases.flatMap((phrase) => phrase.glyphs)")
  lines.push("export default glyphPool")
  lines.push("")

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8")

  console.log(
    `[build:glyph-pools] wrote ${path.relative(rootDir, outputPath)} with ${phrases.length} phrases and ${glyphCount} glyphs.`,
  )
  console.log(
    `[build:glyph-pools] copied ${baseGlyphFileSet.size} glyph assets into ${path.relative(
      rootDir,
      assetRoot,
    )}.`,
  )
}

main()
