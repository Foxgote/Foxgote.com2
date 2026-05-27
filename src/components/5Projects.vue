<script setup>
import { computed } from "vue"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  projectsContent,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const PROJECTS_VIEW_TRIGGER_DELAY_MS = 1100
const PROJECTS_VIEW_TRIGGER_THRESHOLD = 0.2
const PROJECTS_VIEW_TRIGGER_ROOT_MARGIN = "0px"

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const projectsHeadingTokens = computed(() => buildTimescanTokens("projects.heading"))
const projectsLeadTokens = computed(() => buildTimescanTokens("projects.lead"))
</script>

<template>
  <section class="content-page projects-page">
    <header class="page-hero">
      <h1 class="projects-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="projectsContent.heading"
          asset-key="projects.heading"
          :glyph-tokens="projectsHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="PROJECTS_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="PROJECTS_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="PROJECTS_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <TimescanSentence
        class="timescan-base timescan-h2 timescan-layout-center projects-timescan-lead"
        :overlay-text="projectsContent.lead"
        asset-key="projects.lead"
        :glyph-tokens="projectsLeadTokens"
        :auto-trigger-on-view="true"
        :view-trigger-threshold="PROJECTS_VIEW_TRIGGER_THRESHOLD"
        :view-trigger-root-margin="PROJECTS_VIEW_TRIGGER_ROOT_MARGIN"
        :view-trigger-delay-ms="PROJECTS_VIEW_TRIGGER_DELAY_MS"
        :show-button="false"
      />
      <p class="page-intro">
        {{ projectsContent.intro }}
      </p>
    </header>

    <section class="project-list">
      <article
        v-for="project in projectsContent.items"
        :key="project.title"
        class="content-card project-card"
      >
        <div class="project-card-head">
          <h2>{{ project.title }}</h2>
          <span class="project-status">{{ project.status }}</span>
        </div>
        <p>{{ project.body }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.projects-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.projects-timescan-lead {
  width: 100%;
}

.project-list {
  display: grid;
  gap: 0.85rem;
}

.project-card-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.project-status {
  flex: 0 0 auto;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(255, 220, 180, 0.2);
  color: rgba(255, 220, 180, 0.78);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
}

@media (max-width: 560px) {
  .project-card-head {
    display: grid;
    justify-content: start;
  }
}
</style>
