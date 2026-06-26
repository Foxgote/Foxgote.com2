<script setup>
import {
  computed,
  defineExpose,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue"
import { useTimescanSentence } from "@/composables/useTimescanSentence"
import timescanGlyphStrips from "@/timescanAssets/manifest.gen"

const props = defineProps({
  overlayText: {
    type: String,
    required: true,
  },
  glyphTokens: {
    type: Array,
    required: true,
  },
  assetKey: {
    type: String,
    default: "",
  },
  containerWidth: {
    type: Number,
    default: 0,
  },
  glyphScale: {
    type: Number,
    default: null,
  },
  framed: {
    type: Boolean,
    default: false,
  },
  showButton: {
    type: Boolean,
    default: false,
  },
  buttonLabel: {
    type: String,
    default: "Trigger Sentence Timescan",
  },
  emptyMessage: {
    type: String,
    default: "Glyph pool is empty.",
  },
  triggerKey: {
    type: Number,
    default: 0,
  },
  autoTriggerOnView: {
    type: Boolean,
    default: false,
  },
  viewTriggerThreshold: {
    type: Number,
    default: 0.2,
  },
  viewTriggerRootMargin: {
    type: String,
    default: "0px",
  },
  viewTriggerDelayMs: {
    type: Number,
    default: 0,
  },
  viewTriggerOnce: {
    type: Boolean,
    default: true,
  },
})

const tokens = computed(() => props.glyphTokens ?? [])
const timescanRootRef = ref(null)
const overlayMeasureRef = ref(null)
const overlayTextWidthPx = ref(0)
const width = computed(() => props.containerWidth ?? 0)
const classGlyphScale = ref(1)
const glyphScale = computed(() => {
  const explicit = Number(props.glyphScale)
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit
  }
  return classGlyphScale.value
})

let overlayResizeObserver = null
let viewTriggerObserver = null
let viewTriggerDelayId = 0
let viewTriggerFallbackCheckIds = []
let viewTriggerFallbackListenersActive = false
let viewTriggerHasRun = false
const missingStripAssetWarnings = new Set()
const pendingViewTrigger = ref(false)
const stripAsset = computed(() => {
  const key = String(props.assetKey || "")
  return key ? timescanGlyphStrips?.[key] || null : null
})
const usesStripAsset = computed(() => Boolean(stripAsset.value?.base))

watch(
  () => [props.assetKey, usesStripAsset.value],
  ([assetKey, hasAsset]) => {
    if (!import.meta.env.DEV) return
    const key = String(assetKey || "")
    if (!key || hasAsset || missingStripAssetWarnings.has(key)) return
    missingStripAssetWarnings.add(key)
    console.warn(
      `[TimescanSentence] Missing generated strip asset for asset-key "${key}". ` +
        "Add it to src/timescanAssets/registry.js and run npm run build:timescan-strips.",
    )
  },
  { immediate: true },
)

function viewportVisibilityRatio(el) {
  const rect = el.getBoundingClientRect()
  const viewportHeight =
    window.innerHeight || document.documentElement?.clientHeight || 0
  const viewportWidth =
    window.innerWidth || document.documentElement?.clientWidth || 0

  if (viewportHeight <= 0 || viewportWidth <= 0) return 0

  const visibleHeight =
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
  const visibleWidth =
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)

  if (visibleHeight <= 0 || visibleWidth <= 0) return 0

  const elementArea = Math.max(1, rect.height * rect.width)
  const visibleArea = visibleHeight * visibleWidth
  return Math.max(0, Math.min(1, visibleArea / elementArea))
}

function syncOverlayTextWidth() {
  const measureEl = overlayMeasureRef.value
  if (!measureEl) {
    overlayTextWidthPx.value = 0
    return
  }
  overlayTextWidthPx.value = Math.max(0, Math.ceil(measureEl.getBoundingClientRect().width))
}

function syncClassGlyphScale() {
  const rootEl = timescanRootRef.value
  if (!rootEl || typeof window === "undefined") {
    classGlyphScale.value = 1
    return
  }

  const raw = window.getComputedStyle(rootEl).getPropertyValue("--timescan-glyph-scale")
  const parsed = Number.parseFloat(raw)
  classGlyphScale.value =
    Number.isFinite(parsed) && parsed > 0
      ? parsed
      : 1
}

function clampViewTriggerThreshold() {
  const parsed = Number(props.viewTriggerThreshold)
  if (!Number.isFinite(parsed)) return 0.2
  return Math.max(0, Math.min(1, parsed))
}

function clearViewTriggerDelay() {
  if (!viewTriggerDelayId) return
  window.clearTimeout(viewTriggerDelayId)
  viewTriggerDelayId = 0
}

function clearViewTriggerFallbackChecks() {
  viewTriggerFallbackCheckIds.forEach((id) => window.clearTimeout(id))
  viewTriggerFallbackCheckIds = []
}

function teardownViewTriggerFallbackListeners() {
  if (!viewTriggerFallbackListenersActive) return
  window.removeEventListener("scroll", maybeRunViewTrigger)
  window.removeEventListener("resize", maybeRunViewTrigger)
  viewTriggerFallbackListenersActive = false
}

function canRunViewTrigger() {
  return !props.viewTriggerOnce || !viewTriggerHasRun
}

function runViewTriggerNow() {
  if (!canRunViewTrigger()) return
  if (!canTriggerSentenceTimescan.value || overlayTextWidthPx.value <= 0) {
    pendingViewTrigger.value = true
    return
  }
  pendingViewTrigger.value = false
  viewTriggerHasRun = true
  if (props.viewTriggerOnce) {
    teardownViewTriggerObserver()
    teardownViewTriggerFallbackListeners()
    clearViewTriggerFallbackChecks()
  }
  runSentenceTimescan()
}

function scheduleViewTrigger() {
  if (!props.autoTriggerOnView || !canRunViewTrigger()) return
  if (viewTriggerDelayId) return

  const delayMs = Math.max(0, Math.round(Number(props.viewTriggerDelayMs) || 0))
  if (delayMs <= 0) {
    runViewTriggerNow()
    return
  }

  viewTriggerDelayId = window.setTimeout(() => {
    viewTriggerDelayId = 0
    runViewTriggerNow()
  }, delayMs)
}

function maybeRunViewTrigger() {
  if (!props.autoTriggerOnView || !canRunViewTrigger()) return
  const rootEl = timescanRootRef.value
  if (!rootEl) return
  const threshold = clampViewTriggerThreshold()
  const visibleRatio = viewportVisibilityRatio(rootEl)
  if (visibleRatio <= 0) return
  if (threshold > 0 && visibleRatio < threshold) return
  scheduleViewTrigger()
}

function teardownViewTriggerObserver() {
  if (!viewTriggerObserver) return
  viewTriggerObserver.disconnect()
  viewTriggerObserver = null
}

function setupViewTriggerObserver() {
  if (!props.autoTriggerOnView || typeof IntersectionObserver !== "function") {
    return
  }

  const rootEl = timescanRootRef.value
  if (!rootEl) return

  const threshold = clampViewTriggerThreshold()
  const rootMargin =
    typeof props.viewTriggerRootMargin === "string"
      ? props.viewTriggerRootMargin
      : "0px"

  viewTriggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          clearViewTriggerDelay()
          return
        }
        if (!canRunViewTrigger()) return

        if (threshold > 0) {
          const ratio = Number(entry?.intersectionRatio)
          const visibleRatio = Number.isFinite(ratio)
            ? ratio
            : viewportVisibilityRatio(rootEl)
          if (visibleRatio < threshold) return
        }
        scheduleViewTrigger()
      })
    },
    { threshold, rootMargin },
  )

  viewTriggerObserver.observe(rootEl)
  requestAnimationFrame(() => {
    maybeRunViewTrigger()
  })
}

function setupViewTriggerFallback() {
  if (!props.autoTriggerOnView || typeof window === "undefined") return

  clearViewTriggerFallbackChecks()
  viewTriggerFallbackCheckIds = [120, 500, 1200, 2400].map((delayMs) => {
    const timeoutId = window.setTimeout(() => {
      viewTriggerFallbackCheckIds = viewTriggerFallbackCheckIds.filter(
        (id) => id !== timeoutId,
      )
      maybeRunViewTrigger()
    }, delayMs)
    return timeoutId
  })

  if (viewTriggerFallbackListenersActive) {
    return
  }

  window.addEventListener("scroll", maybeRunViewTrigger, { passive: true })
  window.addEventListener("resize", maybeRunViewTrigger)
  viewTriggerFallbackListenersActive = true
}

const {
  sentenceGlyphEntries,
  sentenceGlyphMaskStyle,
  sentenceOverlayRevealStyle,
  sentenceOverlayRevealPx,
  sentenceStageStyle,
  sentenceStripHeightPx,
  sentenceFlickerVisible,
  sentenceFlickerVariants,
  sentenceFlickerActiveLayer,
  sentenceConsumedHidden,
  sentenceStripFlickerActiveLayer,
  sentenceStripFlickerLeftPx,
  sentenceStripFlickerRightPx,
  sentenceTotalWidthPx,
  sentenceStripWidthPx,
  runSentenceTimescan,
  canTriggerSentenceTimescan,
} = useTimescanSentence({
  glyphTokens: tokens,
  containerWidth: width,
  glyphScale,
  overlayTextWidth: overlayTextWidthPx,
})

const hasTokens = computed(() => sentenceGlyphEntries.value.length > 0)
const sentenceStripLayers = computed(() =>
  Array.isArray(stripAsset.value?.flicker) ? stripAsset.value.flicker : [],
)
const sentenceStripLineStyle = computed(() => ({
  width: `${Math.max(1, sentenceStripWidthPx.value)}px`,
  height: `${Math.max(1, sentenceStripHeightPx.value)}px`,
}))

function maskUrl(src) {
  return `url("${String(src || "")}")`
}

function stripClipStyle(
  leftPx,
  rightPx = sentenceStripWidthPx.value,
  totalPx = sentenceStripWidthPx.value,
) {
  const totalWidth = Math.max(1, totalPx)
  const left = Math.max(0, Math.min(totalWidth, leftPx))
  const right = Math.max(left, Math.min(totalWidth, rightPx))
  const rightInset = Math.max(0, totalWidth - right)
  return `inset(0 ${rightInset}px 0 ${left}px)`
}

const sentenceStripBaseStyle = computed(() => {
  const src = stripAsset.value?.base
  const revealPx = Math.max(0, sentenceOverlayRevealPx.value)
  const flickerLeftPx = sentenceStripFlickerLeftPx.value
  const flickerRightPx = sentenceStripFlickerRightPx.value
  const hasActiveFlicker =
    sentenceStripFlickerActiveLayer.value >= 0 && flickerRightPx > flickerLeftPx
  const stripStartPx = hasActiveFlicker
    ? Math.max(revealPx, flickerRightPx)
    : revealPx
  return {
    maskImage: maskUrl(src),
    WebkitMaskImage: maskUrl(src),
    clipPath: stripClipStyle(stripStartPx),
  }
})

const sentenceStripFlickerLayerStyles = computed(() => {
  const leftPx = sentenceStripFlickerLeftPx.value
  const rightPx = sentenceStripFlickerRightPx.value
  const activeLayer = sentenceStripFlickerActiveLayer.value
  const isVisible = rightPx > leftPx && activeLayer >= 0

  return sentenceStripLayers.value.map((src, index) => ({
    maskImage: maskUrl(src),
    WebkitMaskImage: maskUrl(src),
    clipPath: stripClipStyle(leftPx, rightPx),
    opacity: isVisible && activeLayer === index ? 1 : 0,
  }))
})

watch(
  () => props.triggerKey,
  (next, prev) => {
    if (next === prev) return
    if (!canTriggerSentenceTimescan.value) return
    clearViewTriggerDelay()
    pendingViewTrigger.value = false
    viewTriggerHasRun = true
    runSentenceTimescan()
  },
)

watch(canTriggerSentenceTimescan, (next) => {
  if (!next || !pendingViewTrigger.value) return
  runViewTriggerNow()
})

watch(overlayTextWidthPx, (next) => {
  if (next <= 0 || !pendingViewTrigger.value) return
  runViewTriggerNow()
})

watch(sentenceOverlayRevealPx, (next, prev) => {
  if (!props.autoTriggerOnView || !props.viewTriggerOnce) return
  if (next !== 0) return
  if (!(typeof prev === "number" && prev > 0)) return
  viewTriggerHasRun = false
  pendingViewTrigger.value = true
  maybeRunViewTrigger()
})

watch(
  () => props.overlayText,
  () => {
    if (!props.viewTriggerOnce) {
      viewTriggerHasRun = false
    }
    nextTick(() => {
      syncOverlayTextWidth()
      maybeRunViewTrigger()
    })
  },
  { immediate: true },
)

onMounted(() => {
  nextTick(() => {
    syncOverlayTextWidth()
    syncClassGlyphScale()
    setupViewTriggerObserver()
    setupViewTriggerFallback()
    maybeRunViewTrigger()
  })

  if (typeof ResizeObserver !== "function") {
    return
  }

  const measureEl = overlayMeasureRef.value
  if (!measureEl) {
    return
  }

  overlayResizeObserver = new ResizeObserver(() => {
    syncOverlayTextWidth()
    syncClassGlyphScale()
    maybeRunViewTrigger()
  })
  overlayResizeObserver.observe(measureEl)
})

onBeforeUnmount(() => {
  clearViewTriggerDelay()
  clearViewTriggerFallbackChecks()
  teardownViewTriggerFallbackListeners()
  teardownViewTriggerObserver()
  if (!overlayResizeObserver) {
    return
  }
  overlayResizeObserver.disconnect()
  overlayResizeObserver = null
})

defineExpose({
  trigger: runSentenceTimescan,
})
</script>

<template>
  <div
    ref="timescanRootRef"
    class="timescan-sentence"
    :class="{ 'timescan-sentence-framed': framed }"
  >
    <div
      v-if="showButton"
      class="sentence-controls"
    >
      <button
        type="button"
        class="flicker-button"
        :disabled="!canTriggerSentenceTimescan"
        @click="runSentenceTimescan"
      >
        {{ buttonLabel }}
      </button>
    </div>

    <p
      v-if="!hasTokens"
      class="pool-status pool-status-error"
    >
      {{ emptyMessage }}
    </p>

    <div
      v-else
      class="sentence-box"
    >
      <div
        class="sentence-stage"
        :style="sentenceStageStyle"
      >
        <span
          ref="overlayMeasureRef"
          class="sentence-overlay-measure"
          aria-hidden="true"
        >
          {{ overlayText }}
        </span>
        <p class="sentence-overlay">
          <span
            class="sentence-overlay-reveal"
            :style="sentenceOverlayRevealStyle"
          >
            {{ overlayText }}
          </span>
        </p>
        <p
          v-if="usesStripAsset"
          class="sentence-strip-line"
          :style="sentenceStripLineStyle"
          aria-hidden="true"
        >
          <span
            class="sentence-glyph-strip sentence-glyph-strip-base"
            :style="sentenceStripBaseStyle"
          ></span>
          <span
            v-for="(layerStyle, layerIndex) in sentenceStripFlickerLayerStyles"
            :key="`strip-flicker-${layerIndex}`"
            class="sentence-glyph-strip sentence-glyph-strip-flicker"
            :style="layerStyle"
          ></span>
        </p>
        <p
          v-else
          class="sentence-line"
        >
          <span
            v-for="(entry, index) in sentenceGlyphEntries"
            :key="`sentence-${entry.glyphIndex}-${index}`"
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
                :key="`flicker-${entry.glyphIndex}-${variantIndex}`"
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

<style scoped>
.timescan-sentence {
  display: inline-flex;
  flex-direction: column;
  gap: var(--timescan-gap, 10px);
  color: var(--timescan-ink, #b9d2ef);
  overflow: visible;
}

.timescan-sentence-framed .sentence-box {
  padding: 10px;
  border: 1px solid #2f4f73;
  border-radius: 12px;
  background: #111820;
  overflow-x: auto;
}

.timescan-sentence:not(.timescan-sentence-framed) .sentence-box {
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
}

.sentence-box,
.sentence-stage {
  min-width: 0;
  overflow: visible;
}

.pool-status {
  margin: 0;
  color: #88a6c5;
}

.pool-status-error {
  color: #ff8686;
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

.sentence-strip-line {
  margin: 0;
  position: relative;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
  contain: paint;
  isolation: isolate;
}

.timescan-layout-center .sentence-strip-line {
  left: 50%;
  transform: translateX(-50%);
}

.timescan-layout-left .sentence-strip-line {
  left: 0;
  transform: none;
}

.sentence-stage {
  --sentence-ink: var(--timescan-ink, rgba(187, 223, 255, 0.95));
  --sentence-glow: var(--timescan-glow, rgba(109, 196, 255, 0.35));
  position: relative;
  min-height: var(--timescan-min-height, 52px);
  padding-block: var(--timescan-vertical-pad, 0.16em);
  overflow: visible;
}

.sentence-overlay {
  margin: 0;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: visible;
  pointer-events: none;
  z-index: 1;
}

.sentence-overlay-reveal {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  color: var(--sentence-ink);
  font-size: var(--timescan-overlay-font-size, 1.3rem);
  line-height: var(--timescan-overlay-line-height, 1);
  letter-spacing: var(--timescan-overlay-letter-spacing, 0.03em);
  padding-block: var(--timescan-reveal-bleed-block, 0.16em 0.24em);
  margin-block: var(--timescan-reveal-bleed-margin-block, -0.16em -0.24em);
  text-shadow: 0 0 12px var(--sentence-glow);
  transition: opacity 60ms steps(1, end);
}

.sentence-overlay-measure {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  pointer-events: none;
  visibility: hidden;
  color: transparent;
  font-size: var(--timescan-overlay-font-size, 1.3rem);
  line-height: var(--timescan-overlay-line-height, 1);
  letter-spacing: var(--timescan-overlay-letter-spacing, 0.03em);
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

.sentence-glyph-strip {
  position: absolute;
  left: 0;
  bottom: 0;
  display: block;
  width: 100%;
  height: 100%;
  background-color: var(--sentence-ink);
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: left bottom;
  -webkit-mask-position: left bottom;
  mask-size: auto 100%;
  -webkit-mask-size: auto 100%;
  will-change: opacity, clip-path;
}

.sentence-glyph-strip-flicker {
  opacity: 0;
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
