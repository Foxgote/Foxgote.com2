import fs from "node:fs"
import path from "node:path"

const FRAMES_PER_GLYPH = Number(process.env.GLYPH_FLICKER_FRAMES ?? 4)
const BUCKET_SCALE = 100
const SEARCH_RADIUS = 18
const MIN_BUCKET_CANDIDATES = 48

const rootDir = process.cwd()
const manifestPath = path.join(rootDir, "public", "ithkuil-glyph-phrases", "manifest.json")

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function aspectRatio(glyph) {
  const width = Math.max(1, toNumber(glyph?.width, 1))
  const height = Math.max(1, toNumber(glyph?.height, 1))
  return width / height
}

function hashString32(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function makeDeterministicRng(seed) {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function uniqueByFirstSeen(values) {
  const seen = new Set()
  const output = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    output.push(value)
  }
  return output
}

function pickVariants({
  glyph,
  glyphFilePool,
  ratioBuckets,
  framesPerGlyph,
  bucketScale,
  searchRadius,
  minBucketCandidates,
  rng,
}) {
  const baseFile = String(glyph?.file || "")
  const ratioKey = Math.round(aspectRatio(glyph) * bucketScale)

  let nearbyCandidates = []
  for (let radius = 0; radius <= searchRadius; radius++) {
    const lower = ratioBuckets.get(ratioKey - radius) || []
    const upper = radius === 0 ? [] : ratioBuckets.get(ratioKey + radius) || []
    nearbyCandidates = uniqueByFirstSeen(nearbyCandidates.concat(lower, upper))
    if (nearbyCandidates.length >= minBucketCandidates) {
      break
    }
  }

  if (!nearbyCandidates.length) {
    nearbyCandidates = glyphFilePool
  }

  let pool = nearbyCandidates.filter((file) => file !== baseFile)
  if (!pool.length) {
    pool = glyphFilePool.filter((file) => file !== baseFile)
  }
  if (!pool.length) {
    pool = glyphFilePool
  }

  const candidates = pool.slice()
  const variants = []
  let previous = ""

  while (variants.length < framesPerGlyph) {
    if (!candidates.length) {
      candidates.push(...pool)
    }

    let pickedIndex = Math.floor(rng() * candidates.length)
    if (candidates[pickedIndex] === previous && candidates.length > 1) {
      pickedIndex = (pickedIndex + 1) % candidates.length
    }

    const picked = candidates.splice(pickedIndex, 1)[0]
    variants.push(picked)
    previous = picked
  }

  return variants
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  if (!Array.isArray(manifest?.items)) {
    throw new Error("Invalid manifest: missing items[]")
  }

  const glyphRecords = []
  for (const item of manifest.items) {
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []
    for (const glyph of glyphs) {
      if (!glyph || !glyph.file) continue
      glyphRecords.push({ item, glyph })
    }
  }

  if (!glyphRecords.length) {
    throw new Error("Manifest has no glyph records")
  }

  const ratioBuckets = new Map()
  const glyphFilePool = []

  for (const { glyph } of glyphRecords) {
    const file = String(glyph.file)
    glyphFilePool.push(file)
    const key = Math.round(aspectRatio(glyph) * BUCKET_SCALE)
    if (!ratioBuckets.has(key)) {
      ratioBuckets.set(key, [])
    }
    ratioBuckets.get(key).push(file)
  }

  const uniqueGlyphFiles = uniqueByFirstSeen(glyphFilePool)
  const baseSeed = toNumber(manifest?.resolvedSeed, hashString32("flicker-variants"))

  for (const { item, glyph } of glyphRecords) {
    const seedInput = `${baseSeed}:${item?.id ?? ""}:${glyph?.index ?? ""}:${glyph?.file ?? ""}`
    const seed = hashString32(seedInput)
    const rng = makeDeterministicRng(seed)

    glyph.flickerVariants = pickVariants({
      glyph,
      glyphFilePool: uniqueGlyphFiles,
      ratioBuckets,
      framesPerGlyph: FRAMES_PER_GLYPH,
      bucketScale: BUCKET_SCALE,
      searchRadius: SEARCH_RADIUS,
      minBucketCandidates: MIN_BUCKET_CANDIDATES,
      rng,
    })
  }

  manifest.flickerVariantFrames = FRAMES_PER_GLYPH
  manifest.flickerVariantBucketScale = BUCKET_SCALE
  manifest.flickerVariantsGeneratedAt = new Date().toISOString()

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")

  console.log(
    `[precompute:flicker] Updated ${glyphRecords.length} glyphs with ${FRAMES_PER_GLYPH} variants each.`,
  )
}

main()
