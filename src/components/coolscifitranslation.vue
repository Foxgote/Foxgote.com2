<script setup>
import { computed } from "vue"
import glyphPool from "@/glyphPool/pool.gen"
import TimescanSentence from "@/components/TimescanSentence.vue"

const SENTENCE_PHRASE_COUNT = 24
const SENTENCE_OVERLAY_TEXT =
  "This is a test statement meant to show after the effect has passed. This is a test statement meant to show after the effect has passed. This is a test statement meant to show after the effect has passed."

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

const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
const seed = hashString32(`${glyphPool?.seed ?? "seed"}:sentence-demo`)
const rng = mulberry32(seed)
const sampledPhrases = sampleItems(phrases, SENTENCE_PHRASE_COUNT, rng)
const sentenceTokens = sampledPhrases.flatMap((phrase) =>
  Array.isArray(phrase?.glyphs) ? phrase.glyphs : [],
)

const poolMeta = computed(() => ({
  phrases: glyphPool?.sampledCount ?? glyphPool?.phrases?.length ?? 0,
  glyphs: sentenceTokens.length,
  seed: glyphPool?.seed ?? "n/a",
}))
</script>

<template>
  <section class="cool-scifi-pool">
    <header class="pool-header">
      <h2>Timescan Sentence</h2>
      <p class="pool-meta">
        phrases={{ poolMeta.phrases }}, glyphs={{ poolMeta.glyphs }}, seed={{ poolMeta.seed }}
      </p>
    </header>
    <TimescanSentence
      :overlay-text="SENTENCE_OVERLAY_TEXT"
      :glyph-tokens="sentenceTokens"
      framed
      show-button
      empty-message="Glyph pool is empty. Run `npm run build:glyph-pools`."
    />
  </section>
</template>

<style scoped>
.cool-scifi-pool {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #b9d2ef;
}

.pool-header h2 {
  margin: 0 0 6px;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
}

.pool-meta {
  margin: 0;
  font-size: 0.92rem;
  color: #88a6c5;
}
</style>
