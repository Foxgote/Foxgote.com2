<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue"
import glyphPool from "@/glyphPool/pool.gen"
import TimescanSentence from "./TimescanSentence.vue"

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: "span",
  },
  delayMs: {
    type: Number,
    default: 1000,
  },
  threshold: {
    type: Number,
    default: 0.2,
  },
  rootMargin: {
    type: String,
    default: "0px",
  },
  minGlyphs: {
    type: Number,
    default: 1,
  },
  glyphHeight: {
    type: Number,
    default: 52,
  },
  fitToWidth: {
    type: Boolean,
    default: false,
  },
  timescanClass: {
    type: [String, Array, Object],
    default: "",
  },
})

const attrs = useAttrs()
const hostRef = ref(null)
const triggerKey = ref(0)
const hostWidthPx = ref(0)

let observer = null
let delayId = 0
let hasTriggered = false
let fallbackRafId = 0
let resizeObserver = null

function hashString32(input) {
  let hash = 2166136261
  const str = String(input || "")
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickPhrase(text, minGlyphs = 1) {
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) return null

  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${text}`)
  const startIndex = seed % phrases.length
  const minimumGlyphs = Math.max(1, Math.floor(Number(minGlyphs) || 1))

  if (minimumGlyphs <= 1) {
    return phrases[startIndex]
  }

  for (let offset = 0; offset < phrases.length; offset++) {
    const candidate = phrases[(startIndex + offset) % phrases.length]
    const glyphCount = Array.isArray(candidate?.glyphs) ? candidate.glyphs.length : 0
    if (glyphCount >= minimumGlyphs) {
      return candidate
    }
  }

  return phrases[startIndex]
}

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

const glyphTokens = computed(() => {
  const phrase = pickPhrase(props.text, props.minGlyphs)
  return Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
})

const clampedThreshold = computed(() => {
  const value = Number(props.threshold)
  if (!Number.isFinite(value)) return 0.2
  return Math.max(0, Math.min(1, value))
})

const clampedDelayMs = computed(() => {
  const value = Number(props.delayMs)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
})

const requiredVisibleRatio = computed(() =>
  clampedThreshold.value > 0 ? clampedThreshold.value : 0.001,
)

const containerWidthPx = computed(() => (props.fitToWidth ? hostWidthPx.value : 0))

function clearDelay() {
  if (!delayId) return
  window.clearTimeout(delayId)
  delayId = 0
}

function runTimescan() {
  if (hasTriggered) return
  hasTriggered = true
  triggerKey.value += 1
}

function scheduleTimescan() {
  if (hasTriggered || delayId) return

  if (clampedDelayMs.value <= 0) {
    runTimescan()
    return
  }

  delayId = window.setTimeout(() => {
    delayId = 0
    runTimescan()
  }, clampedDelayMs.value)
}

function maybeTrigger() {
  if (hasTriggered) return
  const host = hostRef.value
  if (!host) return
  if (viewportVisibilityRatio(host) < requiredVisibleRatio.value) return
  scheduleTimescan()
}

function onWindowScroll() {
  maybeTrigger()
}

function onWindowResize() {
  syncHostWidth()
  maybeTrigger()
}

function setupIntersectionObserver() {
  const host = hostRef.value
  if (!host) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (hasTriggered) return
        const ratio = Number(entry?.intersectionRatio)
        const visibleRatio = Number.isFinite(ratio)
          ? ratio
          : viewportVisibilityRatio(host)

        if (entry.isIntersecting && visibleRatio >= requiredVisibleRatio.value) {
          scheduleTimescan()
          return
        }
        clearDelay()
      })
    },
    {
      threshold: clampedThreshold.value,
      rootMargin: props.rootMargin,
    },
  )

  observer.observe(host)
}

function teardownIntersectionObserver() {
  if (!observer) return
  observer.disconnect()
  observer = null
}

function syncHostWidth() {
  const host = hostRef.value
  if (!host) return
  const width = Math.round(host.getBoundingClientRect().width || host.clientWidth || 0)
  hostWidthPx.value = Math.max(0, width)
}

function setupResizeObserver() {
  const host = hostRef.value
  if (!host) return
  if (typeof ResizeObserver !== "function") return
  resizeObserver = new ResizeObserver(() => {
    syncHostWidth()
  })
  resizeObserver.observe(host)
}

function teardownResizeObserver() {
  if (!resizeObserver) return
  resizeObserver.disconnect()
  resizeObserver = null
}

function resetTriggerState() {
  hasTriggered = false
  clearDelay()
  if (fallbackRafId) {
    cancelAnimationFrame(fallbackRafId)
    fallbackRafId = 0
  }
  fallbackRafId = requestAnimationFrame(() => {
    fallbackRafId = 0
    maybeTrigger()
  })
}

onMounted(() => {
  syncHostWidth()
  setupIntersectionObserver()
  setupResizeObserver()
  window.addEventListener("scroll", onWindowScroll, { passive: true })
  window.addEventListener("resize", onWindowResize)
  resetTriggerState()
})

onBeforeUnmount(() => {
  clearDelay()
  if (fallbackRafId) {
    cancelAnimationFrame(fallbackRafId)
    fallbackRafId = 0
  }
  teardownIntersectionObserver()
  teardownResizeObserver()
  window.removeEventListener("scroll", onWindowScroll)
  window.removeEventListener("resize", onWindowResize)
})

watch(
  () => [props.text, props.threshold, props.rootMargin, props.delayMs, props.minGlyphs],
  () => {
    resetTriggerState()
    teardownIntersectionObserver()
    setupIntersectionObserver()
  },
)
</script>

<template>
  <component
    :is="tag"
    ref="hostRef"
    v-bind="attrs"
  >
    <TimescanSentence
      :trigger-key="triggerKey"
      :overlay-text="text"
      :glyph-tokens="glyphTokens"
      :container-width="containerWidthPx"
      :glyph-height="props.glyphHeight"
      :show-button="false"
      :class="timescanClass"
    />
  </component>
</template>
