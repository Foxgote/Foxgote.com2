<script setup>
import { computed } from "vue"
import {
  chunkTimescanText,
  getTimescanGlyphOptions,
  getTimescanText,
  timescanLineAssetKey,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  assetKey: {
    type: String,
    required: true,
  },
  sentenceClass: {
    type: String,
    default: "timescan-base timescan-p timescan-layout-left",
  },
  glyphScale: {
    type: Number,
    default: null,
  },
  maxChars: {
    type: Number,
    default: 34,
  },
  viewTriggerDelayMs: {
    type: Number,
    default: 1100,
  },
  viewTriggerThreshold: {
    type: Number,
    default: 0.2,
  },
  viewTriggerRootMargin: {
    type: String,
    default: "0px",
  },
})

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const lines = computed(() =>
  chunkTimescanText(props.text, props.maxChars).map((line, index) => {
    const key = timescanLineAssetKey(props.assetKey, index)
    return {
      key,
      text: line,
      tokens: buildTimescanTokens(key),
    }
  }),
)
</script>

<template>
  <span class="timescan-text">
    <TimescanSentence
      v-for="line in lines"
      :key="line.key"
      :class="sentenceClass"
      :overlay-text="line.text"
      :asset-key="line.key"
      :glyph-tokens="line.tokens"
      :glyph-scale="glyphScale"
      :auto-trigger-on-view="true"
      :view-trigger-threshold="viewTriggerThreshold"
      :view-trigger-root-margin="viewTriggerRootMargin"
      :view-trigger-delay-ms="viewTriggerDelayMs"
      :show-button="false"
    />
  </span>
</template>

<style scoped>
.timescan-text {
  min-width: 0;
  display: grid;
  gap: var(--timescan-text-gap, 0.14rem);
}

.timescan-text :deep(.timescan-sentence),
.timescan-text :deep(.sentence-box),
.timescan-text :deep(.sentence-stage) {
  max-width: 100%;
}
</style>
