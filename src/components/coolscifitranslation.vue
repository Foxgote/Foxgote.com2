<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

const PHRASE_CARD_WIDTH = 150
const PHRASE_CARD_HEIGHT = 70
const GLYPH_CARD_HEIGHT = 70
const SENTENCE_GLYPH_HEIGHT = 52
const PHRASES_PER_PAGE = 24
const TIMESCAN_GLYPHS_PER_SECOND = 36
const SENTENCE_GLYPH_PRECOMPUTED_FRAMES = 15
const SENTENCE_GLYPH_FLICKER_STEPS = 9
const SENTENCE_GLYPH_EFFECT_DURATION_MS = 200
const SENTENCE_GLYPH_GAP_PX = 3
const SENTENCE_OVERLAY_TEXT =
  "This is a test statement meant to show after the effect has passed. This is a test statement meant to show after the effect has passed. This is a test statement meant to show after the effect has passed."

const isLoading = ref(true)
const errorText = ref("")
const manifest = ref(null)
const currentPage = ref(1)
const sentenceFlickerVariants = ref([])
const sentenceFlickerActiveLayer = ref([])
const sentenceFlickerVisible = ref([])
const sentenceConsumedHidden = ref([])
const sentenceOverlayRevealPx = ref(0)
let sentenceTimescanRunId = 0
let sentenceTimescanRafId = 0
let sentenceTimescanStartTimestamp = 0

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

const canTriggerSentenceTimescan = computed(
  () =>
    !isLoading.value &&
    !errorText.value &&
    pagedGlyphEntries.value.length > 0,
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
      flickerVariants: Array.isArray(glyph?.flickerVariants)
        ? glyph.flickerVariants.map((file) => String(file || "")).filter(Boolean)
        : [],
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

function sentenceGlyphMaskStyle(entry, file) {
  const maskUrl = `url("${poolAsset(file)}")`
  return {
    ...sentenceGlyphStyle(entry),
    maskImage: maskUrl,
    WebkitMaskImage: maskUrl,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center center",
    WebkitMaskPosition: "center center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  }
}

const sentenceSlotWidthsPx = computed(() =>
  pagedGlyphEntries.value.map(
    (entry) => glyphRenderSize(entry, SENTENCE_GLYPH_HEIGHT).renderWidth,
  ),
)

const sentenceScanTotalWidthPx = computed(() => {
  if (!sentenceSlotWidthsPx.value.length) {
    return 0
  }
  const glyphWidths = sentenceSlotWidthsPx.value.reduce((sum, width) => sum + width, 0)
  const gapWidths = Math.max(0, sentenceSlotWidthsPx.value.length - 1) * SENTENCE_GLYPH_GAP_PX
  return glyphWidths + gapWidths
})

const sentenceRevealWidthsByIndexPx = computed(() => {
  const revealWidths = []
  let consumedWidth = 0

  sentenceSlotWidthsPx.value.forEach((width, index) => {
    consumedWidth += width
    revealWidths.push(consumedWidth + index * SENTENCE_GLYPH_GAP_PX)
  })

  return revealWidths
})

const sentenceStageStyle = computed(() => ({
  width: `${Math.max(1, sentenceScanTotalWidthPx.value)}px`,
}))

const sentenceOverlayRevealStyle = computed(() => {
  const clippedWidth = Math.max(
    0,
    Math.min(sentenceOverlayRevealPx.value, sentenceScanTotalWidthPx.value),
  )

  return {
    width: `${clippedWidth}px`,
    opacity: clippedWidth > 0 ? 1 : 0,
  }
})

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

function hideAllSentenceFlickers() {
  sentenceFlickerVisible.value = Array.from(
    { length: pagedGlyphEntries.value.length },
    () => false,
  )
  sentenceFlickerActiveLayer.value = Array.from(
    { length: pagedGlyphEntries.value.length },
    () => -1,
  )
}

function getFlickerVariantsForEntry(entry) {
  const providedVariants = Array.isArray(entry?.flickerVariants)
    ? entry.flickerVariants.map((file) => String(file || "")).filter(Boolean)
    : []

  if (providedVariants.length >= SENTENCE_GLYPH_PRECOMPUTED_FRAMES) {
    return providedVariants.slice(0, SENTENCE_GLYPH_PRECOMPUTED_FRAMES)
  }

  const fallback = String(entry?.file || "")
  const variants = providedVariants.slice()
  while (variants.length < SENTENCE_GLYPH_PRECOMPUTED_FRAMES) {
    variants.push(fallback)
  }
  return variants
}

function resetSentenceFlickerVariants() {
  sentenceFlickerVariants.value = pagedGlyphEntries.value.map((entry) =>
    getFlickerVariantsForEntry(entry),
  )
}

function resetSentenceConsumedHidden() {
  sentenceConsumedHidden.value = Array.from(
    { length: pagedGlyphEntries.value.length },
    () => false,
  )
}

function revealSentenceOverlayThroughIndex(index) {
  const revealWidth = sentenceRevealWidthsByIndexPx.value[index] || 0
  sentenceOverlayRevealPx.value = Math.max(sentenceOverlayRevealPx.value, revealWidth)
}

function clearSentenceTimescanAnimation() {
  if (sentenceTimescanRafId) {
    cancelAnimationFrame(sentenceTimescanRafId)
    sentenceTimescanRafId = 0
  }
  sentenceTimescanStartTimestamp = 0
}

function stopSentenceTimescan() {
  sentenceTimescanRunId++
  clearSentenceTimescanAnimation()
  resetSentenceFlickerVariants()
  hideAllSentenceFlickers()
  resetSentenceConsumedHidden()
  sentenceOverlayRevealPx.value = 0
}

function runSentenceTimescan() {
  sentenceTimescanRunId++
  const runId = sentenceTimescanRunId
  clearSentenceTimescanAnimation()
  resetSentenceFlickerVariants()
  hideAllSentenceFlickers()
  resetSentenceConsumedHidden()
  sentenceOverlayRevealPx.value = 0

  if (!pagedGlyphEntries.value.length) {
    return
  }

  const glyphCount = pagedGlyphEntries.value.length
  const scanStepMs = Math.max(1, 1000 / TIMESCAN_GLYPHS_PER_SECOND)
  const glyphDurationMs = Math.max(1, SENTENCE_GLYPH_EFFECT_DURATION_MS)
  const stepDurationMs = Math.max(
    1,
    glyphDurationMs / Math.max(1, SENTENCE_GLYPH_FLICKER_STEPS),
  )
  const finalGlyphFinishMs = (glyphCount - 1) * scanStepMs + glyphDurationMs

  const animate = (timestamp) => {
    if (runId !== sentenceTimescanRunId) {
      return
    }

    if (!sentenceTimescanStartTimestamp) {
      sentenceTimescanStartTimestamp = timestamp
    }

    const elapsedMs = timestamp - sentenceTimescanStartTimestamp
    let furthestCompletedIndex = -1

    for (let index = 0; index < glyphCount; index++) {
      const startMs = index * scanStepMs
      const endMs = startMs + glyphDurationMs

      if (elapsedMs < startMs) {
        if (sentenceFlickerVisible.value[index]) {
          sentenceFlickerVisible.value[index] = false
        }
        if (sentenceFlickerActiveLayer.value[index] !== -1) {
          sentenceFlickerActiveLayer.value[index] = -1
        }
        if (sentenceConsumedHidden.value[index]) {
          sentenceConsumedHidden.value[index] = false
        }
        continue
      }

      if (elapsedMs >= endMs) {
        furthestCompletedIndex = index
        if (sentenceFlickerVisible.value[index]) {
          sentenceFlickerVisible.value[index] = false
        }
        if (sentenceFlickerActiveLayer.value[index] !== -1) {
          sentenceFlickerActiveLayer.value[index] = -1
        }
        if (!sentenceConsumedHidden.value[index]) {
          sentenceConsumedHidden.value[index] = true
        }
        continue
      }

      const variants = sentenceFlickerVariants.value[index] || []
      if (!variants.length) {
        furthestCompletedIndex = index
        if (sentenceFlickerVisible.value[index]) {
          sentenceFlickerVisible.value[index] = false
        }
        if (sentenceFlickerActiveLayer.value[index] !== -1) {
          sentenceFlickerActiveLayer.value[index] = -1
        }
        if (!sentenceConsumedHidden.value[index]) {
          sentenceConsumedHidden.value[index] = true
        }
        continue
      }

      const stepIndex = Math.min(
        SENTENCE_GLYPH_FLICKER_STEPS - 1,
        Math.floor((elapsedMs - startMs) / stepDurationMs),
      )
      const activeLayer = stepIndex % variants.length

      if (!sentenceFlickerVisible.value[index]) {
        sentenceFlickerVisible.value[index] = true
      }
      if (sentenceFlickerActiveLayer.value[index] !== activeLayer) {
        sentenceFlickerActiveLayer.value[index] = activeLayer
      }
      if (sentenceConsumedHidden.value[index]) {
        sentenceConsumedHidden.value[index] = false
      }
    }

    if (furthestCompletedIndex >= 0) {
      revealSentenceOverlayThroughIndex(furthestCompletedIndex)
    }

    if (elapsedMs >= finalGlyphFinishMs) {
      sentenceTimescanRafId = 0
      sentenceTimescanStartTimestamp = 0
      return
    }

    sentenceTimescanRafId = requestAnimationFrame(animate)
  }

  sentenceTimescanRafId = requestAnimationFrame(animate)
}

watch(
  pagedGlyphEntries,
  (entries) => {
    if (!entries.length) {
      stopSentenceTimescan()
      return
    }
    stopSentenceTimescan()
  },
  { immediate: true },
)

onMounted(() => {
  void loadManifest()
})

onBeforeUnmount(() => {
  stopSentenceTimescan()
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
            :disabled="!canTriggerSentenceTimescan"
            @click="runSentenceTimescan"
          >
            Trigger Sentence Timescan
          </button>
        </div>
        <div class="sentence-box">
          <div
            class="sentence-stage"
            :style="sentenceStageStyle"
          >
            <p class="sentence-overlay">
              <span
                class="sentence-overlay-reveal"
                :style="sentenceOverlayRevealStyle"
              >
                {{ SENTENCE_OVERLAY_TEXT }}
              </span>
            </p>
            <p class="sentence-line">
              <span
                v-for="(entry, index) in pagedGlyphEntries"
                :key="`sentence-${entry.phraseId}-${entry.glyphIndex}`"
                class="sentence-glyph-slot"
              >
                <span
                  class="sentence-glyph sentence-glyph-mask"
                  :class="{
                    'sentence-glyph-hidden':
                      sentenceFlickerVisible[index] || sentenceConsumedHidden[index],
                  }"
                  :style="sentenceGlyphMaskStyle(entry, entry.file)"
                  aria-hidden="true"
                ></span>
                <span
                  v-if="sentenceFlickerVisible[index] && sentenceFlickerVariants[index]?.length"
                  class="sentence-glyph-flicker-stack"
                  aria-hidden="true"
                >
                  <span
                    v-for="(variantFile, variantIndex) in sentenceFlickerVariants[index]"
                    :key="`flicker-${entry.phraseId}-${entry.glyphIndex}-${variantIndex}`"
                    class="sentence-glyph sentence-glyph-mask sentence-glyph-flicker-layer"
                    :class="{
                      'sentence-glyph-flicker-active':
                        sentenceFlickerActiveLayer[index] === variantIndex,
                    }"
                    :style="sentenceGlyphMaskStyle(entry, variantFile)"
                  ></span>
                </span>
              </span>
            </p>
          </div>
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
  overflow-x: auto;
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
  position: relative;
  z-index: 2;
  display: flex;
  gap: 3px;
  align-items: flex-end;
}

.sentence-stage {
  --sentence-ink: rgba(187, 223, 255, 0.95);
  position: relative;
  min-height: 52px;
}

.sentence-overlay {
  margin: 0;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.sentence-overlay-reveal {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  color: var(--sentence-ink);
  font-size: 1.3rem;
  line-height: 1;
  letter-spacing: 0.03em;
  text-shadow: 0 0 12px rgba(109, 196, 255, 0.35);
  transition: opacity 60ms steps(1, end);
}

.sentence-glyph-slot {
  position: relative;
  display: block;
  flex: 0 0 auto;
}

.sentence-glyph {
  display: block;
  flex: 0 0 auto;
}

.sentence-glyph-mask {
  background-color: var(--sentence-ink);
}

.sentence-glyph-hidden {
  opacity: 0;
}

.sentence-glyph-flicker-stack {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sentence-glyph-flicker-layer {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
}

.sentence-glyph-flicker-active {
  opacity: 1;
}
</style>
