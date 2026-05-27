import glyphPool from "@/glyphPool/pool.gen"

export function hashString32(input) {
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

function normalizeOptions(minGlyphsOrOptions, targetGlyphs) {
  if (
    minGlyphsOrOptions &&
    typeof minGlyphsOrOptions === "object" &&
    !Array.isArray(minGlyphsOrOptions)
  ) {
    return minGlyphsOrOptions
  }

  return {
    minGlyphs: minGlyphsOrOptions,
    targetGlyphs,
  }
}

export function buildGlyphSequence(text, minGlyphsOrOptions = 1, targetGlyphs = 24) {
  const options = normalizeOptions(minGlyphsOrOptions, targetGlyphs)
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) return []

  const minimumGlyphs = Math.max(1, Math.floor(Number(options?.minGlyphs) || 1))
  const targetCount = Math.max(
    1,
    Math.floor(Number(options?.targetGlyphs) || minimumGlyphs),
  )
  const salt = typeof options?.salt === "string" ? options.salt : ""
  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${salt}:${text}`)
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
