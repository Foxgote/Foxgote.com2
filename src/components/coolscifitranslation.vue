<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

const PHRASE_CARD_WIDTH = 150
const PHRASE_CARD_HEIGHT = 70
const GLYPH_CARD_HEIGHT = 70
const SENTENCE_GLYPH_HEIGHT = 52
const PHRASES_PER_PAGE = 24
const FIRST_GLYPH_FLICKER_STEPS = 20
const FIRST_GLYPH_FLICKER_DURATION_MS = 1000

const isLoading = ref(true)
const errorText = ref("")
const manifest = ref(null)
const currentPage = ref(1)
const firstGlyphFlickerFile = ref("")
const firstGlyphFlickerVisible = ref(false)
let firstGlyphFlickerTimeoutIds = []

function withBase(path) {
  const base = String(import.meta.env.BASE_URL || "/")
  const normalizedBase = base.endsWith("/") ? base : `${base}/`
  return `${normalizedBase}${String(path).replace(/^\/+/, "")}`
}

const poolBasePath = withBase("ithkuil-glyph-phrases/")
const manifestPath = withBase("ithkuil-glyph-phrases/manifest.json")

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function poolAsset(file) {
  return `${poolBasePath}${String(file || "").replace(/^\/+/, "")}`
}

async function loadManifest() {
  isLoading.value = true
  errorText.value = ""

  try {
    const response = await fetch(manifestPath, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`Failed to load manifest (${response.status}).`)
    }

    const data = await response.json()
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error("Manifest has no items.")
    }

    manifest.value = data
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Unknown manifest load error."
  } finally {
    isLoading.value = false
  }
}

const allItems = computed(() => {
  if (!manifest.value || !Array.isArray(manifest.value.items)) {
    return []
  }
  return manifest.value.items
})

const allGlyphFiles = computed(() =>
  allItems.value.flatMap((item) =>
    (Array.isArray(item?.glyphs) ? item.glyphs : [])
      .map((glyph) => String(glyph?.file || ""))
      .filter(Boolean),
  ),
)

const canTriggerFirstGlyphFlicker = computed(
  () =>
    !isLoading.value &&
    !errorText.value &&
    pagedGlyphEntries.value.length > 0 &&
    allGlyphFiles.value.length > 0,
)

const totalPages = computed(() => {
  const total = Math.ceil(allItems.value.length / PHRASES_PER_PAGE)
  return Math.max(1, total)
})

const pagedItems = computed(() => {
  const maxPage = totalPages.value
  const page = Math.min(Math.max(1, currentPage.value), maxPage)
  if (page !== currentPage.value) {
    currentPage.value = page
  }

  const start = (page - 1) * PHRASES_PER_PAGE
  return allItems.value.slice(start, start + PHRASES_PER_PAGE)
})

const pagedGlyphEntries = computed(() =>
  pagedItems.value.flatMap((item) => {
    const phraseWidth = toNumber(item?.phraseWidth, PHRASE_CARD_WIDTH)
    const phraseHeight = toNumber(item?.phraseHeight, PHRASE_CARD_HEIGHT)
    const glyphs = Array.isArray(item?.glyphs) ? item.glyphs : []

    return glyphs.map((glyph) => ({
      phraseId: String(item.id || ""),
      phrase: String(item.phrase || ""),
      glyphCount: toNumber(item.glyphCount, glyphs.length),
      phraseWidth,
      phraseHeight,
      glyphIndex: toNumber(glyph?.index, 0),
      file: String(glyph?.file || ""),
      rawWidth: toNumber(glyph?.rawWidth, toNumber(glyph?.width, 1)),
      rawHeight: toNumber(glyph?.rawHeight, toNumber(glyph?.height, 1)),
      width: toNumber(glyph?.width, 1),
      height: toNumber(glyph?.height, 1),
    }))
  }),
)

function glyphRenderSize(entry, targetHeight) {
  const width = toNumber(entry?.width, 1)
  const height = Math.max(1, toNumber(entry?.height, 1))
  const renderHeight = Math.max(16, Math.round(targetHeight))
  const renderWidth = Math.max(12, Math.round((width / height) * renderHeight))

  return { renderWidth, renderHeight }
}

function glyphCardStyle(entry) {
  const { renderWidth } = glyphRenderSize(entry, GLYPH_CARD_HEIGHT)
  return {
    width: `${renderWidth + 16}px`,
  }
}

function glyphImageStyle(entry) {
  const { renderWidth, renderHeight } = glyphRenderSize(entry, GLYPH_CARD_HEIGHT)
  return {
    width: `${renderWidth}px`,
    height: `${renderHeight}px`,
  }
}

function sentenceGlyphStyle(entry) {
  const { renderWidth, renderHeight } = glyphRenderSize(entry, SENTENCE_GLYPH_HEIGHT)
  return {
    width: `${renderWidth}px`,
    height: `${renderHeight}px`,
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function clearFirstGlyphFlickerTimers() {
  firstGlyphFlickerTimeoutIds.forEach((timeoutId) => {
    clearTimeout(timeoutId)
  })
  firstGlyphFlickerTimeoutIds = []
}

function hideFirstGlyphFlicker() {
  firstGlyphFlickerVisible.value = false
  firstGlyphFlickerFile.value = ""
}

function pickRandomGlyphFile() {
  const files = allGlyphFiles.value
  if (!files.length) {
    return ""
  }
  return files[Math.floor(Math.random() * files.length)]
}

function runFirstGlyphFlicker() {
  clearFirstGlyphFlickerTimers()
  hideFirstGlyphFlicker()

  if (!pagedGlyphEntries.value.length || !allGlyphFiles.value.length) {
    return
  }

  const stepDurationMs = Math.max(
    1,
    Math.floor(FIRST_GLYPH_FLICKER_DURATION_MS / FIRST_GLYPH_FLICKER_STEPS),
  )

  for (let step = 0; step < FIRST_GLYPH_FLICKER_STEPS; step++) {
    const timeoutId = setTimeout(() => {
      firstGlyphFlickerFile.value = pickRandomGlyphFile()
      firstGlyphFlickerVisible.value = true
    }, step * stepDurationMs)

    firstGlyphFlickerTimeoutIds.push(timeoutId)
  }

  const despawnTimeoutId = setTimeout(() => {
    hideFirstGlyphFlicker()
  }, FIRST_GLYPH_FLICKER_DURATION_MS)

  firstGlyphFlickerTimeoutIds.push(despawnTimeoutId)
}

watch(
  pagedGlyphEntries,
  (entries) => {
    if (!entries.length) {
      clearFirstGlyphFlickerTimers()
      hideFirstGlyphFlicker()
      return
    }
    clearFirstGlyphFlickerTimers()
    hideFirstGlyphFlicker()
  },
  { immediate: true },
)

onMounted(() => {
  void loadManifest()
})

onBeforeUnmount(() => {
  clearFirstGlyphFlickerTimers()
})
</script>

<template>
  <section class="cool-scifi-pool">
    <header class="pool-header">
      <h2>Cool Sci-Fi Translation Pool</h2>

      <p
        v-if="manifest"
        class="pool-meta"
      >
        phrases={{ manifest.count }}, glyphs={{ pagedGlyphEntries.length }} (page),
        unifiedH={{ manifest.glyphTargetHeight }}, seed={{ manifest.resolvedSeed }}
      </p>

      <div
        v-if="manifest && totalPages > 1"
        class="pager"
      >
        <button
          class="pager-button"
          :disabled="currentPage <= 1"
          @click="previousPage"
        >
          Prev
        </button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button
          class="pager-button"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </header>

    <p
      v-if="isLoading"
      class="pool-status"
    >
      Loading glyph pool...
    </p>
    <p
      v-else-if="errorText"
      class="pool-status pool-status-error"
    >
      {{ errorText }}
    </p>
    <template v-else>
      <div class="pool-block">
        <h3>Phrases</h3>
        <div class="scroller">
          <article
            v-for="item in pagedItems"
            :key="item.id"
            class="phrase-card"
          >
            <img
              :src="poolAsset(item.phraseFile)"
              :alt="`${item.id} phrase`"
              loading="lazy"
              class="phrase-image"
            />
            <div class="phrase-title">{{ item.id }} ({{ item.glyphCount }})</div>
            <div
              class="phrase-text"
              :title="item.phrase"
            >
              {{ item.phrase }}
            </div>
          </article>
        </div>
      </div>

      <div class="pool-block">
        <h3>Single Glyph Slices</h3>
        <div class="scroller">
          <article
            v-for="entry in pagedGlyphEntries"
            :key="`${entry.phraseId}-${entry.glyphIndex}`"
            class="glyph-card"
            :style="glyphCardStyle(entry)"
          >
            <img
              :src="poolAsset(entry.file)"
              :alt="`${entry.phraseId} glyph-${String(entry.glyphIndex).padStart(2, '0')}`"
              loading="lazy"
              class="glyph-image"
              :style="glyphImageStyle(entry)"
            />
            <div class="glyph-title">{{ entry.phraseId }} g{{ entry.glyphIndex }}</div>
            <div
              class="glyph-meta"
              :title="`${entry.phrase} (${entry.glyphCount})`"
            >
              {{ Math.round(entry.width) }}x{{ Math.round(entry.height) }}
            </div>
          </article>
        </div>
      </div>

      <div class="pool-block">
        <h3>Single Slice Sentence</h3>
        <div class="sentence-controls">
          <button
            type="button"
            class="flicker-button"
            :disabled="!canTriggerFirstGlyphFlicker"
            @click="runFirstGlyphFlicker"
          >
            Trigger First Glyph Flicker
          </button>
        </div>
        <div class="sentence-box">
          <p class="sentence-line">
            <span
              v-for="(entry, index) in pagedGlyphEntries"
              :key="`sentence-${entry.phraseId}-${entry.glyphIndex}`"
              class="sentence-glyph-slot"
            >
              <img
                :src="poolAsset(entry.file)"
                :alt="`${entry.phraseId} glyph-${String(entry.glyphIndex).padStart(2, '0')}`"
                loading="lazy"
                class="sentence-glyph"
                :class="{ 'sentence-glyph-hidden': index === 0 }"
                :style="sentenceGlyphStyle(entry)"
              />
              <img
                v-if="index === 0 && firstGlyphFlickerVisible && firstGlyphFlickerFile"
                :src="poolAsset(firstGlyphFlickerFile)"
                alt=""
                aria-hidden="true"
                loading="eager"
                class="sentence-glyph sentence-glyph-flicker"
                :style="sentenceGlyphStyle(entry)"
              />
            </span>
          </p>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cool-scifi-pool {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.pager {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.pager-button {
  border: 1px solid #2f4f73;
  background: #142435;
  color: #b9d2ef;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.pager-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pool-status {
  margin: 0;
  color: #88a6c5;
}

.pool-status-error {
  color: #ff8686;
}

.pool-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pool-block h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #b9d2ef;
}

.scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px;
  border: 1px solid #2f4f73;
  border-radius: 12px;
  background: #111820;
}

.phrase-card,
.glyph-card {
  flex: 0 0 auto;
  border: 1px solid #2f4f73;
  border-radius: 10px;
  background: #0f151d;
  padding: 8px;
}

.phrase-card {
  width: 150px;
}

.phrase-image {
  display: block;
  width: 100%;
  height: 70px;
  object-fit: contain;
  object-position: center center;
}

.glyph-image {
  display: block;
  object-fit: contain;
  object-position: center center;
}

.phrase-title,
.glyph-title {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #6bb3ff;
  line-height: 1.2;
}

.phrase-text,
.glyph-meta {
  margin-top: 4px;
  font-size: 0.74rem;
  color: #9bb2c8;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sentence-box {
  padding: 10px;
  border: 1px solid #2f4f73;
  border-radius: 12px;
  background: #111820;
}

.sentence-controls {
  display: flex;
  justify-content: flex-start;
}

.flicker-button {
  border: 1px solid #2f4f73;
  background: #142435;
  color: #b9d2ef;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font: inherit;
}

.flicker-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sentence-line {
  margin: 0;
  display: flex;
  gap: 3px;
  align-items: flex-end;
  overflow-x: auto;
  white-space: nowrap;
}

.sentence-glyph-slot {
  position: relative;
  display: block;
  flex: 0 0 auto;
}

.sentence-glyph {
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
  object-position: center center;
}

.sentence-glyph-hidden {
  opacity: 0;
}

.sentence-glyph-flicker {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
