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

const props = defineProps({
  overlayText: {
    type: String,
    required: true,
  },
  glyphTokens: {
    type: Array,
    required: true,
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
let viewTriggerHasRun = false
const pendingViewTrigger = ref(false)

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
  if (threshold > 0 && viewportVisibilityRatio(rootEl) < threshold) return
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

const {
  sentenceGlyphEntries,
  sentenceGlyphMaskStyle,
  sentenceOverlayRevealStyle,
  sentenceOverlayRevealPx,
  sentenceStageStyle,
  sentenceFlickerVisible,
  sentenceFlickerVariants,
  sentenceFlickerActiveLayer,
  sentenceConsumedHidden,
  runSentenceTimescan,
  canTriggerSentenceTimescan,
} = useTimescanSentence({
  glyphTokens: tokens,
  containerWidth: width,
  glyphScale,
  overlayTextWidth: overlayTextWidthPx,
})

const hasTokens = computed(() => sentenceGlyphEntries.value.length > 0)

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
        <p class="sentence-line">
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

.sentence-stage {
  --sentence-ink: var(--timescan-ink, rgba(187, 223, 255, 0.95));
  --sentence-glow: var(--timescan-glow, rgba(109, 196, 255, 0.35));
  position: relative;
  min-height: var(--timescan-min-height, 52px);
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
  font-size: var(--timescan-overlay-font-size, 1.3rem);
  line-height: var(--timescan-overlay-line-height, 1);
  letter-spacing: var(--timescan-overlay-letter-spacing, 0.03em);
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
