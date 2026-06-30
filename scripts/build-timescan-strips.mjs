import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const SAMPLE_SIZE = Number(process.env.GLYPH_POOL_SIZE ?? 500)
const PRECOMPUTED_FRAMES = Number(process.env.GLYPH_POOL_FRAMES ?? 4)
const DEFAULT_STRIP_MAX_GLYPHS = Number(process.env.TIMESCAN_STRIP_MAX_GLYPHS ?? 64)
const STRIP_GLYPH_HEIGHT = 52
const STRIP_GLYPH_GAP_PX = 3
const STRIP_EDGE_PAD_PX = 10
const MIN_RENDER_HEIGHT_PX = 8
const MIN_RENDER_WIDTH_PX = 4

const rootDir = process.cwd()
const sourceRoot = path.join(rootDir, "public", "ithkuil-glyph-phrases")
const manifestPath = path.join(sourceRoot, "manifest.json")
const registryPath = path.join(rootDir, "src", "timescanAssets", "registry.js")
const publicOutputRoot = path.join(rootDir, "public", "timescan-glyph-strips")
const manifestOutputPath = path.join(rootDir, "src", "timescanAssets", "manifest.gen.js")

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

function shuffledIndices(count, seed) {
  const indices = Array.from({ length: count }, (_, index) => index)
  const rand = mulberry32(seed)

  for (let index = indices.length - 1; index > 0; index--) {
    const pick = Math.floor(rand() * (index + 1))
    const current = indices[index]
    indices[index] = indices[pick]
    indices[pick] = current
  }

  return indices
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

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function slugForKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function assertInside(parent, child) {
  const relative = path.relative(parent, child)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`)
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const items = Array.isArray(manifest?.items) ? manifest.items : []
  if (!items.length) {
    throw new Error("Manifest has no items.")
  }
  return manifest
}

async function loadRegistry() {
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Timescan registry not found: ${registryPath}`)
  }

  const module = await import(`${pathToFileURL(registryPath).href}?t=${Date.now()}`)
  const definitions = Array.isArray(module?.timescanAssetDefinitions)
    ? module.timescanAssetDefinitions
    : []
  if (!definitions.length) {
    throw new Error("Timescan registry has no definitions.")
  }
  return definitions
}

function buildGlyphPool(manifest) {
  const items = Array.isArray(manifest?.items) ? manifest.items : []
  const seed = toNumber(
    process.env.GLYPH_POOL_SEED ?? manifest?.resolvedSeed ?? hashString32("glyph-pool"),
    hashString32("glyph-pool"),
  )
  const rand = mulberry32(seed)
  const sampledItems = sampleItems(items, SAMPLE_SIZE, rand)

  const phrases = sampledItems.map((item) => {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    return {
      id: String(item?.id || ""),
      text: String(item?.phrase || ""),
      glyphs: glyphs.map((glyph) => {
        const baseFile = normalizeRelPath(glyph?.file)
        const providedVariants = Array.isArray(glyph?.flickerVariants)
          ? glyph.flickerVariants.map(normalizeRelPath).filter(Boolean)
          : []
        const flickerVariants = providedVariants.slice(0, PRECOMPUTED_FRAMES)
        while (flickerVariants.length < PRECOMPUTED_FRAMES) {
          flickerVariants.push(baseFile)
        }

        return {
          glyphIndex: toNumber(glyph?.index, 0),
          width: metric(glyph?.width, 1),
          height: metric(glyph?.height, 1),
          file: baseFile,
          flickerVariants,
        }
      }),
    }
  })

  return {
    seed,
    phrases,
  }
}

function buildGlyphSequence(glyphPool, definition) {
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) return []

  const minimumGlyphs = Math.max(1, Math.floor(Number(definition?.minGlyphs) || 1))
  const targetCount = Math.max(
    1,
    Math.floor(Number(definition?.targetGlyphs) || minimumGlyphs),
  )
  const salt = typeof definition?.salt === "string" ? definition.salt : ""
  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${salt}:${definition.text}`)
  const orderedPhraseIndices = shuffledIndices(phrases.length, seed)

  const collected = []
  const seenFiles = new Set()

  const pushUniqueGlyphs = (glyphs) => {
    for (let index = 0; index < glyphs.length; index++) {
      if (collected.length >= targetCount) return
      const entry = glyphs[index]
      const file = String(entry?.file || "")
      if (!file || seenFiles.has(file)) continue
      seenFiles.add(file)
      collected.push(entry)
    }
  }

  for (let index = 0; index < orderedPhraseIndices.length; index++) {
    const phrase = phrases[orderedPhraseIndices[index]]
    const glyphs = Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
    if (glyphs.length < minimumGlyphs) continue
    pushUniqueGlyphs(glyphs)
    if (collected.length >= targetCount) return collected
  }

  for (let index = 0; index < orderedPhraseIndices.length; index++) {
    if (collected.length >= targetCount) break
    const phrase = phrases[orderedPhraseIndices[index]]
    const glyphs = Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
    pushUniqueGlyphs(glyphs)
  }

  return collected
}

function uniqueFilesForEntry(entry) {
  const files = []
  const baseFile = String(entry?.file || "")
  if (baseFile) files.push(baseFile)

  const variantFiles = Array.isArray(entry?.flickerVariants)
    ? entry.flickerVariants.map((file) => String(file || "")).filter(Boolean)
    : []
  for (let index = 0; index < variantFiles.length; index++) {
    const file = variantFiles[index]
    if (!files.includes(file)) files.push(file)
  }

  return files
}

function buildExtendedEntry(entry, cycle, step) {
  if (!entry || cycle <= 0) {
    return entry
  }

  const files = uniqueFilesForEntry(entry)
  if (files.length <= 1) {
    return entry
  }

  const baseFile = String(entry?.file || "")
  let fileIndex = (cycle + step) % files.length
  if (files[fileIndex] === baseFile) {
    fileIndex = (fileIndex + 1) % files.length
  }

  return {
    ...entry,
    file: files[fileIndex],
  }
}

function buildExtendedGlyphSequence(sourceEntries, maxGlyphs = DEFAULT_STRIP_MAX_GLYPHS) {
  if (!Array.isArray(sourceEntries) || !sourceEntries.length) {
    return []
  }

  const extendedEntries = []
  let cycle = 0

  while (extendedEntries.length < maxGlyphs) {
    const isReverse = cycle % 2 === 1
    const cycleOffset = cycle % sourceEntries.length

    for (let step = 0; step < sourceEntries.length; step++) {
      if (extendedEntries.length >= maxGlyphs) break

      const sourceIndex = isReverse
        ? (cycleOffset - step + sourceEntries.length) % sourceEntries.length
        : (cycleOffset + step) % sourceEntries.length
      extendedEntries.push(buildExtendedEntry(sourceEntries[sourceIndex], cycle, step))
    }

    cycle++
  }

  return extendedEntries
}

function glyphRenderSize(entry, targetHeight) {
  const width = toNumber(entry?.width, 1)
  const height = Math.max(1, toNumber(entry?.height, 1))
  const renderHeight = Math.max(MIN_RENDER_HEIGHT_PX, Math.round(targetHeight))
  const renderWidth = Math.max(
    MIN_RENDER_WIDTH_PX,
    Math.round((width / height) * renderHeight),
  )

  return { renderWidth, renderHeight }
}

function extractSvgParts(svgText, filePath) {
  const openMatch = svgText.match(/<svg\b([^>]*)>/i)
  const closeIndex = svgText.toLowerCase().lastIndexOf("</svg>")
  if (!openMatch || closeIndex < 0) {
    throw new Error(`Could not parse SVG: ${filePath}`)
  }

  const attrs = openMatch[1]
  const viewBoxMatch = attrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const widthMatch = attrs.match(/\bwidth\s*=\s*["']([^"']+)["']/i)
  const heightMatch = attrs.match(/\bheight\s*=\s*["']([^"']+)["']/i)
  const viewBox =
    viewBoxMatch?.[1] ||
    `0 0 ${Number.parseFloat(widthMatch?.[1]) || 1} ${Number.parseFloat(heightMatch?.[1]) || 1}`
  const inner = svgText.slice(openMatch.index + openMatch[0].length, closeIndex)

  return {
    viewBox,
    inner: inner
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/\s+xmlns(:\w+)?="[^"]*"/gi, ""),
  }
}

function readGlyphSvg(relPath) {
  const normalized = normalizeRelPath(relPath)
  const filePath = path.join(sourceRoot, normalized)
  assertInside(sourceRoot, filePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing glyph SVG: ${filePath}`)
  }

  return extractSvgParts(fs.readFileSync(filePath, "utf8"), filePath)
}

function variantFileForEntry(entry, layerIndex) {
  if (layerIndex === -1) {
    return String(entry?.file || "")
  }

  const variants = Array.isArray(entry?.flickerVariants)
    ? entry.flickerVariants.map((file) => String(file || "")).filter(Boolean)
    : []
  return variants[layerIndex] || String(entry?.file || "")
}

function buildStripSvg(entries, layerIndex) {
  let x = 0
  const nestedSvgs = []
  const safeStops = []

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const file = variantFileForEntry(entry, layerIndex)
    const { renderWidth, renderHeight } = glyphRenderSize(entry, STRIP_GLYPH_HEIGHT)
    const y = Math.max(0, STRIP_GLYPH_HEIGHT - renderHeight)
    const glyphSvg = readGlyphSvg(file)

    nestedSvgs.push(
      [
        `<svg x="${metric(x)}" y="${metric(y)}" width="${renderWidth}" height="${renderHeight}"`,
        ` viewBox="${escapeAttr(glyphSvg.viewBox)}" preserveAspectRatio="xMidYMid meet"`,
        ' color="#fff" fill="#fff" stroke="none">',
        glyphSvg.inner.trim(),
        "</svg>",
      ].join(""),
    )

    x += renderWidth
    if (index < entries.length - 1) {
      safeStops.push(metric(x + Math.max(1, STRIP_GLYPH_GAP_PX - 1)))
      x += STRIP_GLYPH_GAP_PX
    } else {
      safeStops.push(metric(x + STRIP_EDGE_PAD_PX))
    }
  }

  const width = Math.max(1, metric(x + STRIP_EDGE_PAD_PX))
  const height = STRIP_GLYPH_HEIGHT
  return {
    width,
    height,
    safeStops,
    svg: [
      '<svg xmlns="http://www.w3.org/2000/svg"',
      ` viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"`,
      ' fill="#fff" color="#fff" stroke="none">',
      `<g>${nestedSvgs.join("")}</g>`,
      "</svg>",
      "",
    ].join("\n"),
  }
}

function writeStripFile(definition, assetDir, fileName, entries, layerIndex) {
  const strip = buildStripSvg(entries, layerIndex)
  const outputPath = path.join(assetDir, fileName)
  fs.writeFileSync(outputPath, strip.svg, "utf8")
  return strip
}

function writeGeneratedManifest(records) {
  ensureDir(path.dirname(manifestOutputPath))

  const lines = []
  lines.push("// GENERATED FILE. DO NOT EDIT BY HAND.")
  lines.push("// Source: src/timescanAssets/registry.js")
  lines.push("")
  lines.push(
    'const TIMESCAN_STRIP_BASE = `${String(import.meta.env?.BASE_URL || "/").replace(/\\/?$/, "/")}timescan-glyph-strips/`',
  )
  lines.push("")
  lines.push("const timescanGlyphStrips = {")

  for (const record of records) {
    lines.push(`  ${JSON.stringify(record.key)}: {`)
    lines.push(`    width: ${record.width},`)
    lines.push(`    height: ${record.height},`)
    lines.push(`    maxGlyphs: ${record.maxGlyphs},`)
    lines.push(`    safeStops: [${record.safeStops.join(", ")}],`)
    lines.push(`    base: \`${"${TIMESCAN_STRIP_BASE}"}${record.slug}/base.svg\`,`)
    lines.push("    flicker: [")
    for (let index = 0; index < record.flickerCount; index++) {
      lines.push(
        `      \`${"${TIMESCAN_STRIP_BASE}"}${record.slug}/flicker-${index + 1}.svg\`,`,
      )
    }
    lines.push("    ],")
    lines.push("  },")
  }

  lines.push("}")
  lines.push("")
  lines.push("export default timescanGlyphStrips")
  lines.push("export { timescanGlyphStrips }")
  lines.push("")

  fs.writeFileSync(manifestOutputPath, `${lines.join("\n")}\n`, "utf8")
}

async function main() {
  const manifest = loadManifest()
  const definitions = await loadRegistry()
  const glyphPool = buildGlyphPool(manifest)

  const resolvedPublicOutputRoot = path.resolve(publicOutputRoot)
  const resolvedPublicDir = path.resolve(rootDir, "public")
  assertInside(resolvedPublicDir, resolvedPublicOutputRoot)
  fs.rmSync(resolvedPublicOutputRoot, { recursive: true, force: true })
  ensureDir(resolvedPublicOutputRoot)

  const seenKeys = new Set()
  const seenSlugs = new Set()
  const records = []
  let stripFileCount = 0

  for (const definition of definitions) {
    const key = String(definition?.key || "").trim()
    if (!key) {
      throw new Error("Timescan asset definition is missing key.")
    }
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate timescan asset key: ${key}`)
    }
    seenKeys.add(key)

    const slug = slugForKey(key)
    if (!slug || seenSlugs.has(slug)) {
      throw new Error(`Duplicate or empty timescan asset slug for key: ${key}`)
    }
    seenSlugs.add(slug)

    const sourceEntries = buildGlyphSequence(glyphPool, definition)
    const maxGlyphs = Math.max(
      1,
      Math.floor(Number(definition?.maxGlyphs) || DEFAULT_STRIP_MAX_GLYPHS),
    )
    const stripEntries = buildExtendedGlyphSequence(sourceEntries, maxGlyphs)
    if (!stripEntries.length) {
      throw new Error(`No glyph entries generated for ${key}`)
    }

    const assetDir = path.join(resolvedPublicOutputRoot, slug)
    assertInside(resolvedPublicOutputRoot, assetDir)
    ensureDir(assetDir)

    const baseStrip = writeStripFile(definition, assetDir, "base.svg", stripEntries, -1)
    stripFileCount++
    for (let index = 0; index < PRECOMPUTED_FRAMES; index++) {
      writeStripFile(definition, assetDir, `flicker-${index + 1}.svg`, stripEntries, index)
      stripFileCount++
    }

    records.push({
      key,
      slug,
      width: baseStrip.width,
      height: baseStrip.height,
      safeStops: baseStrip.safeStops,
      maxGlyphs: stripEntries.length,
      flickerCount: PRECOMPUTED_FRAMES,
    })
  }

  writeGeneratedManifest(records)

  console.log(
    `[build:timescan-strips] wrote ${stripFileCount} strip SVGs for ${records.length} timescan assets.`,
  )
}

main()
