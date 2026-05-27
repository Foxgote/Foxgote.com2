<script setup>
import { computed } from "vue"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  homeContent,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const HOME_VIEW_TRIGGER_DELAY_MS = 1100
const HOME_VIEW_TRIGGER_THRESHOLD = 0.2
const HOME_VIEW_TRIGGER_ROOT_MARGIN = "0px"

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const homeHeadingTokens = computed(() => buildTimescanTokens("home.heading"))
const homeLeadTokens = computed(() => buildTimescanTokens("home.lead"))
</script>

<template>
  <section class="content-page home-page">
    <header class="page-hero">
      <h1 class="home-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="homeContent.heading"
          asset-key="home.heading"
          :glyph-tokens="homeHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="HOME_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="HOME_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="HOME_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <TimescanSentence
        class="timescan-base timescan-h2 timescan-layout-center home-timescan-lead"
        :overlay-text="homeContent.lead"
        asset-key="home.lead"
        :glyph-tokens="homeLeadTokens"
        :auto-trigger-on-view="true"
        :view-trigger-threshold="HOME_VIEW_TRIGGER_THRESHOLD"
        :view-trigger-root-margin="HOME_VIEW_TRIGGER_ROOT_MARGIN"
        :view-trigger-delay-ms="HOME_VIEW_TRIGGER_DELAY_MS"
        :show-button="false"
      />
      <p class="page-intro">
        {{ homeContent.intro }}
      </p>
      <div class="page-actions">
        <RouterLink
          v-for="action in homeContent.actions"
          :key="action.to"
          class="page-action-link"
          :to="action.to"
        >
          {{ action.label }}
        </RouterLink>
      </div>
    </header>

    <section class="content-card-grid">
      <article
        v-for="highlight in homeContent.highlights"
        :key="highlight.title"
        class="content-card"
      >
        <h2>{{ highlight.title }}</h2>
        <p>{{ highlight.body }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.home-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.home-timescan-lead {
  width: 100%;
}
</style>
