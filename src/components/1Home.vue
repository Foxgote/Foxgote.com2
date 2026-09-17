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
      <div class="lesson-note" aria-label="Lesson prices">
        <p><strong>Free trial</strong><span aria-hidden="true"> · </span>S$35/hour at my studio<span aria-hidden="true"> · </span>S$60/hour at your place</p>
        <p>Ubi, Singapore 410633. The same hourly rates at every skill level.</p>
        <p>Free trials at my studio or your place — message me to arrange a time.</p>
      </div>
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
.lesson-note {
  width: min(720px, 100%);
  margin: 0.65rem auto 0.35rem;
  padding: 0.9rem 0;
  border-block: 1px solid rgba(255, 220, 180, 0.16);
  color: rgba(255, 228, 196, 0.84);
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.8;
}
.lesson-note p { margin: 0; }
.lesson-note strong { color: var(--accent); font-weight: 600; }
.lesson-note p + p { margin-top: 0.25rem; font-size: 0.8rem; color: rgba(255, 220, 180, 0.65); }
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
