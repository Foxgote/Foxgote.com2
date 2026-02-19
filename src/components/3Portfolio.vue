<script setup>
import { computed, onMounted, ref } from "vue"
import glyphPool from "@/glyphPool/pool.gen"
import TimescanSentence from "./TimescanSentence.vue"

const PORTFOLIO_HEADING_TEXT = "Portfolio"
const PORTFOLIO_LEAD_TEXT = "Your gateway to all things Foxgote."
const portfolioHeadingTimescanRef = ref(null)
const portfolioLeadTimescanRef = ref(null)

function hashString32(input) {
  let hash = 2166136261
  const str = String(input || "")
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickPhraseGlyphs(text) {
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) return []
  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${text}`)
  const phrase = phrases[seed % phrases.length]
  return Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
}

const portfolioHeadingTokens = computed(() => pickPhraseGlyphs(PORTFOLIO_HEADING_TEXT))
const portfolioLeadTokens = computed(() => pickPhraseGlyphs(PORTFOLIO_LEAD_TEXT))

onMounted(() => {
  requestAnimationFrame(() => {
    portfolioHeadingTimescanRef.value?.trigger?.()
    portfolioLeadTimescanRef.value?.trigger?.()
  })
})
</script>

<template>
  <div class="home-container">
    <h1 class="portfolio-timescan-heading">
      <TimescanSentence
        ref="portfolioHeadingTimescanRef"
        class="timescan-base timescan-h1 timescan-layout-center"
        :overlay-text="PORTFOLIO_HEADING_TEXT"
        :glyph-tokens="portfolioHeadingTokens"
        :glyph-scale="1.4"
        :show-button="false"
      />
    </h1>
    <TimescanSentence
      ref="portfolioLeadTimescanRef"
      class="timescan-base timescan-h2 timescan-layout-center portfolio-timescan-lead"
      :overlay-text="PORTFOLIO_LEAD_TEXT"
      :glyph-tokens="portfolioLeadTokens"
      :show-button="false"
    />
    <router-link
      to="/about"
      class="about-link"
    >
      Learn more about us
    </router-link>
  </div>
</template>

<style scoped>
.portfolio-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.portfolio-timescan-lead {
  width: 100%;
}
</style>
