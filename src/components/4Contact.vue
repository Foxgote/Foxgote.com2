<script setup>
import { computed } from "vue"
import {
  contactContent,
  getTimescanGlyphOptions,
  getTimescanText,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const CONTACT_VIEW_TRIGGER_DELAY_MS = 1100
const CONTACT_VIEW_TRIGGER_THRESHOLD = 0.2
const CONTACT_VIEW_TRIGGER_ROOT_MARGIN = "0px"

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const contactHeadingTokens = computed(() => buildTimescanTokens("contact.heading"))
const contactLeadTokens = computed(() => buildTimescanTokens("contact.lead"))
</script>

<template>
  <section class="content-page contact-page">
    <header class="page-hero">
      <h1 class="contact-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="contactContent.heading"
          asset-key="contact.heading"
          :glyph-tokens="contactHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="CONTACT_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="CONTACT_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="CONTACT_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <TimescanSentence
        class="timescan-base timescan-h2 timescan-layout-center contact-timescan-lead"
        :overlay-text="contactContent.lead"
        asset-key="contact.lead"
        :glyph-tokens="contactLeadTokens"
        :auto-trigger-on-view="true"
        :view-trigger-threshold="CONTACT_VIEW_TRIGGER_THRESHOLD"
        :view-trigger-root-margin="CONTACT_VIEW_TRIGGER_ROOT_MARGIN"
        :view-trigger-delay-ms="CONTACT_VIEW_TRIGGER_DELAY_MS"
        :show-button="false"
      />
      <p class="page-intro">
        {{ contactContent.intro }}
      </p>
      <div class="page-actions">
        <a
          class="page-action-link"
          :href="contactContent.emailHref"
        >
          {{ contactContent.actionLabel }}
        </a>
      </div>
    </header>

    <section class="content-card-grid">
      <article
        v-for="note in contactContent.notes"
        :key="note.title"
        class="content-card"
      >
        <h2>{{ note.title }}</h2>
        <p>{{ note.body }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.contact-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.contact-timescan-lead {
  width: 100%;
}
</style>
