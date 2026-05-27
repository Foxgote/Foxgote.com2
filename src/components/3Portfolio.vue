<script setup>
import { computed } from "vue"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  portfolioContent,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const PORTFOLIO_VIEW_TRIGGER_DELAY_MS = 1500
const PORTFOLIO_VIEW_TRIGGER_THRESHOLD = 0.2
const PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN = "0px"

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const portfolioHeadingTokens = computed(() =>
  buildTimescanTokens("portfolio.heading"),
)
const portfolioLeadTokens = computed(() => buildTimescanTokens("portfolio.lead"))
</script>

<template>
  <section class="content-page portfolio-page">
    <header class="page-hero">
      <h1 class="portfolio-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="portfolioContent.heading"
          asset-key="portfolio.heading"
          :glyph-tokens="portfolioHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="PORTFOLIO_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="PORTFOLIO_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <TimescanSentence
        class="timescan-base timescan-h2 timescan-layout-center portfolio-timescan-lead"
        :overlay-text="portfolioContent.lead"
        asset-key="portfolio.lead"
        :glyph-tokens="portfolioLeadTokens"
        :auto-trigger-on-view="true"
        :view-trigger-threshold="PORTFOLIO_VIEW_TRIGGER_THRESHOLD"
        :view-trigger-root-margin="PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN"
        :view-trigger-delay-ms="PORTFOLIO_VIEW_TRIGGER_DELAY_MS"
        :show-button="false"
      />
      <p class="page-intro">
        {{ portfolioContent.intro }}
      </p>
    </header>

    <section class="content-card-grid">
      <RouterLink
        v-for="entry in portfolioContent.entries"
        :key="entry.title"
        class="content-card content-card-link"
        :to="entry.to"
      >
        <span class="content-card-kicker">{{ entry.label }}</span>
        <h2>{{ entry.title }}</h2>
        <p>{{ entry.body }}</p>
        <span class="content-card-action">{{ entry.action }}</span>
      </RouterLink>
    </section>
  </section>
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
