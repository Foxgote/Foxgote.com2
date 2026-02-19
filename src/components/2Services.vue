<script setup>
import { computed } from "vue"
import glyphPool from "@/glyphPool/pool.gen"
import TimescanSentence from "./TimescanSentence.vue"

const SERVICES_EYEBROW_TEXT = "Services"
const SERVICES_HEADING_TEXT = "Select your choice"
const SERVICES_LEAD_TEXT = "Choose the lane that fits your session and goals."
const SERVICES_VIEW_TRIGGER_THRESHOLD = 0.2
const SERVICES_VIEW_TRIGGER_ROOT_MARGIN = "0px"
const SERVICES_HEADER_VIEW_TRIGGER_DELAY_MS = 750
const SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS = 120
const SERVICES_MIN_GLYPHS = 8
const SERVICES_TARGET_GLYPHS = 28
const SERVICES_IMAGE_TARGET_GLYPHS = 14
const SERVICES_TITLE_TARGET_GLYPHS = 18
const SERVICES_BULLET_TARGET_GLYPHS = 18

const SERVICES_CARD_DATA = [
  {
    id: "studio-rental",
    title: "Studio Rental",
    imageLabel: "Studio PNG",
    imageAriaLabel: "Studio rental image placeholder",
    bullets: [
      "Hourly and half-day booking windows",
      "Control room plus live room access",
      "Add-on engineer support available",
      "Late-night sessions by request",
    ],
  },
  {
    id: "music-teaching",
    title: "Music Teaching",
    imageLabel: "Teaching PNG",
    imageAriaLabel: "Music teaching image placeholder",
    bullets: [
      "Private one-on-one lesson blocks",
      "Beginner through advanced coaching",
      "Technique, songwriting, and performance",
      "Structured plans with weekly goals",
    ],
  },
  {
    id: "other-services",
    title: "Other Services",
    imageLabel: "Other PNG",
    imageAriaLabel: "Other services image placeholder",
    bullets: [
      "Vocal tracking and comp preparation",
      "Demo polish and arrangement feedback",
      "Mix-ready stem export workflow",
      "Custom project support by scope",
    ],
  },
]

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

function buildGlyphSequence(text, minGlyphs = 1, targetGlyphs = 24) {
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) return []

  const basePhrase = pickPhrase(text, minGlyphs)
  const baseGlyphs = Array.isArray(basePhrase?.glyphs) ? basePhrase.glyphs : []
  if (!baseGlyphs.length) return []

  const targetCount = Math.max(
    1,
    Math.floor(Number(targetGlyphs) || baseGlyphs.length),
  )
  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${text}`)
  const startIndex = seed % phrases.length

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

  pushUniqueGlyphs(baseGlyphs)

  for (let offset = 1; offset < phrases.length; offset++) {
    if (collected.length >= targetCount) break
    const phrase = phrases[(startIndex + offset * 7) % phrases.length]
    const glyphs = Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
    if (!glyphs.length) continue
    pushUniqueGlyphs(glyphs)
  }

  if (collected.length >= targetCount) {
    return collected
  }

  // If uniqueness runs out, top up deterministically from the base phrase.
  while (collected.length < targetCount) {
    collected.push(baseGlyphs[collected.length % baseGlyphs.length])
  }

  return collected
}

const servicesEyebrowTokens = computed(() =>
  buildGlyphSequence(SERVICES_EYEBROW_TEXT, 4, 10),
)

const servicesHeadingTokens = computed(() => {
  return buildGlyphSequence(
    SERVICES_HEADING_TEXT,
    SERVICES_MIN_GLYPHS,
    SERVICES_TARGET_GLYPHS,
  )
})

const servicesLeadTokens = computed(() =>
  buildGlyphSequence(SERVICES_LEAD_TEXT, 6, 20),
)

const servicesCards = computed(() => {
  return SERVICES_CARD_DATA.map((card) => ({
    ...card,
    titleTokens: buildGlyphSequence(
      `${card.id}:title:${card.title}`,
      6,
      SERVICES_TITLE_TARGET_GLYPHS,
    ),
    imageTokens: buildGlyphSequence(
      `${card.id}:image:${card.imageLabel}`,
      4,
      SERVICES_IMAGE_TARGET_GLYPHS,
    ),
    bulletItems: card.bullets.map((text, index) => ({
      id: `${card.id}-bullet-${index}`,
      text,
      tokens: buildGlyphSequence(
        `${card.id}:bullet:${index}:${text}`,
        5,
        SERVICES_BULLET_TARGET_GLYPHS,
      ),
    })),
  }))
})
</script>

<template>
  <section class="services-page">
    <header class="services-header">
      <div class="eyebrow">
        <TimescanSentence
          class="timescan-base timescan-h6 timescan-layout-center"
          :overlay-text="SERVICES_EYEBROW_TEXT"
          :glyph-tokens="servicesEyebrowTokens"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </div>
      <h1 class="services-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="SERVICES_HEADING_TEXT"
          :glyph-tokens="servicesHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_HEADER_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <div class="lead">
        <TimescanSentence
          class="timescan-base timescan-h2 timescan-layout-center"
          :overlay-text="SERVICES_LEAD_TEXT"
          :glyph-tokens="servicesLeadTokens"
          :glyph-scale="0.6"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </div>
    </header>

    <section class="services-grid">
      <article
        v-for="card in servicesCards"
        :key="card.id"
        class="service-card"
      >
        <header class="service-card-head">
          <TimescanSentence
            class="timescan-base timescan-h3 timescan-layout-center"
            :overlay-text="card.title"
            :glyph-tokens="card.titleTokens"
            :auto-trigger-on-view="true"
            :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
            :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
            :view-trigger-delay-ms="SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS"
            :show-button="false"
          />
        </header>
        <div
          class="card-image-slot"
          role="img"
          :aria-label="card.imageAriaLabel"
        >
          <TimescanSentence
            class="timescan-base timescan-caption timescan-layout-center"
            :overlay-text="card.imageLabel"
            :glyph-tokens="card.imageTokens"
            :auto-trigger-on-view="true"
            :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
            :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
            :view-trigger-delay-ms="SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS"
            :show-button="false"
          />
        </div>
        <ul class="service-bullets">
          <li
            v-for="bullet in card.bulletItems"
            :key="bullet.id"
          >
            <TimescanSentence
              class="timescan-base timescan-p timescan-layout-left"
              :overlay-text="bullet.text"
              :glyph-tokens="bullet.tokens"
              :auto-trigger-on-view="true"
              :view-trigger-threshold="SERVICES_VIEW_TRIGGER_THRESHOLD"
              :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
              :view-trigger-delay-ms="SERVICES_CONTENT_VIEW_TRIGGER_DELAY_MS"
              :show-button="false"
            />
          </li>
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

.services-header :deep(.timescan-sentence) {
  width: 100%;
}

.services-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
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
  margin: 1.2rem 0 0;
  text-align: center;
  text-transform: uppercase;
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
  text-transform: uppercase;
}

.card-image-slot :deep(.timescan-sentence) {
  width: 100%;
}

.service-bullets {
  margin: 1.5rem;
  justify-self: center;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.5rem;
  list-style-type: none;
}

.service-bullets :deep(.timescan-sentence) {
  width: 100%;
}

.service-bullets :deep(.sentence-stage) {
  overflow: hidden;
}

.service-bullets li {
  margin: 0;
  overflow: hidden;
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


