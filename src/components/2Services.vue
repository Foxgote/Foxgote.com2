<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import glyphPool from "@/glyphPool/pool.gen"
import TimescanSentence from "./TimescanSentence.vue"

const SERVICES_HEADING_TEXT = "Select your choice"
const SERVICES_TRIGGER_DELAY_MS = 1000
const SERVICES_TRIGGER_THRESHOLD = 0.2
const SERVICES_MIN_GLYPHS = 8

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

const servicesHeadingRef = ref(null)
const servicesHeadingTimescanRef = ref(null)

const servicesHeadingTokens = computed(() => {
  const phrase = pickPhrase(SERVICES_HEADING_TEXT, SERVICES_MIN_GLYPHS)
  return Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
})

let servicesHeadingObserver = null
let servicesHeadingDelayId = 0
let servicesHeadingTriggered = false

function clearServicesHeadingDelay() {
  if (!servicesHeadingDelayId) return
  window.clearTimeout(servicesHeadingDelayId)
  servicesHeadingDelayId = 0
}

function runServicesHeadingTimescan() {
  if (servicesHeadingTriggered) return
  const trigger = servicesHeadingTimescanRef.value?.trigger
  if (typeof trigger !== "function") return
  servicesHeadingTriggered = true
  trigger()
}

function scheduleServicesHeadingTimescan() {
  if (servicesHeadingTriggered || servicesHeadingDelayId) return
  servicesHeadingDelayId = window.setTimeout(() => {
    servicesHeadingDelayId = 0
    runServicesHeadingTimescan()
  }, SERVICES_TRIGGER_DELAY_MS)
}

onMounted(() => {
  const target = servicesHeadingRef.value
  if (!target) return

  servicesHeadingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (servicesHeadingTriggered) return
        if (entry.isIntersecting) {
          scheduleServicesHeadingTimescan()
          return
        }
        clearServicesHeadingDelay()
      })
    },
    { threshold: SERVICES_TRIGGER_THRESHOLD },
  )

  servicesHeadingObserver.observe(target)

  requestAnimationFrame(() => {
    if (servicesHeadingTriggered) return
    if (viewportVisibilityRatio(target) < SERVICES_TRIGGER_THRESHOLD) return
    scheduleServicesHeadingTimescan()
  })
})

onBeforeUnmount(() => {
  clearServicesHeadingDelay()
  if (servicesHeadingObserver) {
    servicesHeadingObserver.disconnect()
    servicesHeadingObserver = null
  }
})
</script>

<template>
  <section class="services-page">
    <header class="services-header">
      <p class="eyebrow">Services</p>
      <h1
        ref="servicesHeadingRef"
        class="services-timescan-heading"
      >
        <TimescanSentence
          ref="servicesHeadingTimescanRef"
          class="services-heading-timescan"
          :overlay-text="SERVICES_HEADING_TEXT"
          :glyph-tokens="servicesHeadingTokens"
          :show-button="false"
        />
      </h1>
      <p class="lead">Choose the lane that fits your session and goals.</p>
    </header>

    <section class="services-grid">
      <article class="service-card">
        <header class="service-card-head">
          <div>Studio Rental</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Studio rental image placeholder"
        >
          <span>Studio PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Hourly and half-day booking windows</li>
          <li>Control room plus live room access</li>
          <li>Add-on engineer support available</li>
          <li>Late-night sessions by request</li>
        </ul>
      </article>

      <article class="service-card">
        <header class="service-card-head">
          <div>Music Teaching</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Music teaching image placeholder"
        >
          <span>Teaching PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Private one-on-one lesson blocks</li>
          <li>Beginner through advanced coaching</li>
          <li>Technique, songwriting, and performance</li>
          <li>Structured plans with weekly goals</li>
        </ul>
      </article>

      <article class="service-card">
        <header class="service-card-head">
          <div>Other Services</div>
        </header>
        <div
          class="card-image-slot"
          role="img"
          aria-label="Other services image placeholder"
        >
          <span>Other PNG</span>
        </div>
        <ul class="service-bullets">
          <li>Vocal tracking and comp preparation</li>
          <li>Demo polish and arrangement feedback</li>
          <li>Mix-ready stem export workflow</li>
          <li>Custom project support by scope</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.services-page {
  width: 100%;
  margin: 0 auto;
  padding: 2.25rem 10%;
  display: grid;
  gap: 1.6rem;
}

.services-header {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
}

.services-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.services-heading-timescan {
  --timescan-gap: 0;
  --timescan-ink: rgba(255, 205, 145, 0.98);
  --timescan-glow: rgba(255, 186, 109, 0.24);
  --timescan-overlay-font-size: clamp(1.9rem, 4.8vw, 3rem);
  --timescan-min-height: clamp(44px, 6.5vw, 62px);
}

.services-heading-timescan :deep(.sentence-stage) {
  margin: 0 auto;
}

.services-heading-timescan :deep(.sentence-line) {
  justify-content: center;
}

.eyebrow {
  margin-top: 32px;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(212, 161, 94, 0.92);
}

.lead {
  margin: 0.3rem 0 0;
  color: rgba(255, 220, 180, 0.72);
  font-size: 1.05rem;
}

.services-grid {
  display: grid;
  width: 100%;
  margin: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.75rem, 2vw, 2rem);
  justify-items: center;
}

.service-card {
  width: min(100%, 340px);
  height: min(100%, 520px);
  display: grid;
  align-content: start;
  gap: 0.85rem;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: linear-gradient(rgba(10, 11, 13, 0.4));
  box-shadow:
    10px 18px 26px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(212, 161, 94, 0.06);
}

.service-card-head {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 1.2rem 0 0;
  text-align: center;
  font-size: 1.2rem;
  color: rgba(255, 237, 214, 0.95);
}

.service-card {
  margin: 0;
  font-size: 1.2rem;
  color: rgba(255, 237, 214, 0.95);
  letter-spacing: 0.01em;
}

.card-image-slot {
  min-height: 220px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.card-image-slot span {
  font-size: 0.83rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-bullets {
  margin: 1.5rem;
  justify-self: center;
  display: block;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.5rem;
  color: rgba(255, 220, 180, 0.8);
  font-size: 0.93rem;
  list-style-type: none;
}

@media (max-width: 980px) {
  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .services-page {
    padding: 1.35rem 0.8rem 2rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .service-card {
    min-height: auto;
    max-width: none;
  }

  .card-image-slot {
    min-height: 200px;
  }
}
</style>
