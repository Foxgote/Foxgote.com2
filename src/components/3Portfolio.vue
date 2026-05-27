<script setup>
import { computed } from "vue"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const PORTFOLIO_HEADING_TEXT = "Portfolio"
const PORTFOLIO_LEAD_TEXT = "Your gateway to all things Foxgote."
const PORTFOLIO_HEADING_GLYPHS = 24
const PORTFOLIO_LEAD_GLYPHS = 24
const PORTFOLIO_VIEW_TRIGGER_DELAY_MS = 1500
const PORTFOLIO_VIEW_TRIGGER_THRESHOLD = 0.2
const PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN = "0px"

const portfolioHeadingTokens = computed(() =>
  buildGlyphSequence(PORTFOLIO_HEADING_TEXT, 4, PORTFOLIO_HEADING_GLYPHS),
)
const portfolioLeadTokens = computed(() =>
  buildGlyphSequence(PORTFOLIO_LEAD_TEXT, 5, PORTFOLIO_LEAD_GLYPHS),
)
</script>

<template>
  <div class="home-container">
    <h1 class="portfolio-timescan-heading">
      <TimescanSentence
        class="timescan-base timescan-h1 timescan-layout-center"
        :overlay-text="PORTFOLIO_HEADING_TEXT"
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
      :overlay-text="PORTFOLIO_LEAD_TEXT"
      asset-key="portfolio.lead"
      :glyph-tokens="portfolioLeadTokens"
      :auto-trigger-on-view="true"
      :view-trigger-threshold="PORTFOLIO_VIEW_TRIGGER_THRESHOLD"
      :view-trigger-root-margin="PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN"
      :view-trigger-delay-ms="PORTFOLIO_VIEW_TRIGGER_DELAY_MS"
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
