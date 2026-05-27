import fs from "node:fs"
import path from "node:path"

const SAMPLE_SIZE = Number(process.env.GLYPH_POOL_SIZE ?? 500)
const PRECOMPUTED_FRAMES = Number(process.env.GLYPH_POOL_FRAMES ?? 4)

const rootDir = process.cwd()
const sourceRoot = path.join(rootDir, "public", "ithkuil-glyph-phrases")
const manifestPath = path.join(sourceRoot, "manifest.json")
const outputPath = path.join(rootDir, "src", "glyphPool", "pool.gen.js")

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function metric(value, fallback = 0) {
  return Number(toNumber(value, fallback).toFixed(3))
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

function parseGlyphFileParts(relPath) {
  const normalized = normalizeRelPath(relPath)
  const match = normalized.match(/^phrases\/phrase-(\d+)\/glyph-(\d+)\.svg$/)
  if (!match) {
    throw new Error(`Unexpected glyph file path: ${normalized}`)
  }

  return [Number(match[1]), Number(match[2])]
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function assertPublicAsset(relPath) {
  const sourcePath = path.join(sourceRoot, relPath)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing glyph asset: ${sourcePath}`)
  }
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

  const referencedGlyphFiles = new Set()
  for (const item of sampledItems) {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    for (const glyph of glyphs) {
      const file = normalizeRelPath(glyph?.file)
      if (file) {
        referencedGlyphFiles.add(file)
      }
    }
  }

  const phrases = sampledItems.map((item) => {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    const normalizedGlyphs = glyphs.map((glyph) => {
      const baseFile = normalizeRelPath(glyph?.file)
      const providedVariants = Array.isArray(glyph?.flickerVariants)
        ? glyph.flickerVariants.map(normalizeRelPath).filter(Boolean)
        : []

      const variants = providedVariants.slice(0, PRECOMPUTED_FRAMES)
      while (variants.length < PRECOMPUTED_FRAMES) {
        variants.push(baseFile)
      }
      variants.forEach((file) => referencedGlyphFiles.add(file))

      return {
        glyphIndex: toNumber(glyph?.index, 0),
        width: metric(glyph?.width, 1),
        height: metric(glyph?.height, 1),
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

  ensureDir(path.dirname(outputPath))

  for (const file of referencedGlyphFiles) {
    assertPublicAsset(file)
  }

  let glyphCount = 0
  const glyphHeights = new Set()
  for (const phrase of phrases) {
    glyphCount += phrase.glyphs.length
    phrase.glyphs.forEach((glyph) => glyphHeights.add(glyph.height))
  }
  const sharedGlyphHeight = glyphHeights.size === 1 ? [...glyphHeights][0] : null

  const lines = []
  lines.push("// GENERATED FILE. DO NOT EDIT BY HAND.")
  lines.push(`// Source: ${path.relative(rootDir, manifestPath)}`)
  lines.push(
    `// Sample size: ${SAMPLE_SIZE} (seed=${seed}, frames=${PRECOMPUTED_FRAMES})`,
  )
  lines.push("")
  lines.push(
    'const GLYPH_ASSET_BASE = `${String(import.meta.env.BASE_URL || "/").replace(/\\/?$/, "/")}ithkuil-glyph-phrases/`',
  )
  lines.push(
    'const glyphAsset = (phrase, glyph) => `${GLYPH_ASSET_BASE}phrases/phrase-${String(phrase).padStart(3, "0")}/glyph-${String(glyph).padStart(2, "0")}.svg`',
  )
  if (sharedGlyphHeight != null) {
    lines.push(`const GLYPH_HEIGHT = ${sharedGlyphHeight}`)
  }
  lines.push("")
  lines.push("const rawPhrases = [")

  for (const phrase of phrases) {
    lines.push(`  [${JSON.stringify(phrase.id)}, ${JSON.stringify(phrase.text)}, [`)
    for (const glyph of phrase.glyphs) {
      const [filePhrase, fileGlyph] = parseGlyphFileParts(glyph.file)
      const variants = glyph.flickerVariants
        .map((variant) => `[${parseGlyphFileParts(variant).join(", ")}]`)
        .join(", ")
      if (sharedGlyphHeight != null) {
        lines.push(
          `    [${glyph.glyphIndex}, ${glyph.width}, ${filePhrase}, ${fileGlyph}, [${variants}]],`,
        )
      } else {
        lines.push(
          `    [${glyph.glyphIndex}, ${glyph.width}, ${glyph.height}, ${filePhrase}, ${fileGlyph}, [${variants}]],`,
        )
      }
    }
    lines.push("  ]],")
  }

  lines.push("]")
  lines.push("")
  lines.push(
    sharedGlyphHeight != null
      ? "const normalizeGlyph = ([glyphIndex, width, filePhrase, fileGlyph, flickerVariants]) => ({"
      : "const normalizeGlyph = ([glyphIndex, width, height, filePhrase, fileGlyph, flickerVariants]) => ({",
  )
  lines.push("  glyphIndex,")
  lines.push("  width,")
  lines.push(sharedGlyphHeight != null ? "  height: GLYPH_HEIGHT," : "  height,")
  lines.push("  file: glyphAsset(filePhrase, fileGlyph),")
  lines.push("  flickerVariants: flickerVariants.map(([phrase, glyph]) => glyphAsset(phrase, glyph)),")
  lines.push("})")
  lines.push("")
  lines.push("const normalizePhrase = ([id, text, glyphs]) => ({")
  lines.push("  id,")
  lines.push("  text,")
  lines.push("  glyphs: glyphs.map(normalizeGlyph),")
  lines.push("})")
  lines.push("")
  lines.push("export const glyphPool = {")
  lines.push(`  seed: ${seed},`)
  lines.push(`  sampledCount: ${phrases.length},`)
  lines.push(`  totalCount: ${items.length},`)
  lines.push(`  glyphCount: ${glyphCount},`)
  lines.push("  phrases: rawPhrases.map(normalizePhrase),")
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
    `[build:glyph-pools] referenced ${referencedGlyphFiles.size} public glyph assets.`,
  )
}

main()
