<script setup>
import { computed, defineExpose, watch } from "vue"
import { useTimescanSentence } from "@/composables/useTimescanSentence"

const props = defineProps({
  overlayText: {
    type: String,
    required: true,
  },
  glyphTokens: {
    type: Array,
    required: true,
  },
  containerWidth: {
    type: Number,
    default: 0,
  },
  framed: {
    type: Boolean,
    default: false,
  },
  showButton: {
    type: Boolean,
    default: false,
  },
  buttonLabel: {
    type: String,
    default: "Trigger Sentence Timescan",
  },
  emptyMessage: {
    type: String,
    default: "Glyph pool is empty.",
  },
  triggerKey: {
    type: Number,
    default: 0,
  },
})

const tokens = computed(() => props.glyphTokens ?? [])
const width = computed(() => props.containerWidth ?? 0)

const {
  sentenceGlyphEntries,
  sentenceGlyphMaskStyle,
  sentenceOverlayRevealStyle,
  sentenceStageStyle,
  sentenceFlickerVisible,
  sentenceFlickerVariants,
  sentenceFlickerActiveLayer,
  sentenceConsumedHidden,
  runSentenceTimescan,
  canTriggerSentenceTimescan,
} = useTimescanSentence({ glyphTokens: tokens, containerWidth: width })

const hasTokens = computed(() => sentenceGlyphEntries.value.length > 0)

watch(
  () => props.triggerKey,
  (next, prev) => {
    if (next === prev) return
    if (!canTriggerSentenceTimescan.value) return
    runSentenceTimescan()
  },
)

defineExpose({
  trigger: runSentenceTimescan,
})
</script>

<template>
  <div
    class="timescan-sentence"
    :class="{ 'timescan-sentence-framed': framed }"
  >
    <div
      v-if="showButton"
      class="sentence-controls"
    >
      <button
        type="button"
        class="flicker-button"
        :disabled="!canTriggerSentenceTimescan"
        @click="runSentenceTimescan"
      >
        {{ buttonLabel }}
      </button>
    </div>

    <p
      v-if="!hasTokens"
      class="pool-status pool-status-error"
    >
      {{ emptyMessage }}
    </p>

    <div
      v-else
      class="sentence-box"
    >
      <div
        class="sentence-stage"
        :style="sentenceStageStyle"
      >
        <p class="sentence-overlay">
          <span
            class="sentence-overlay-reveal"
            :style="sentenceOverlayRevealStyle"
          >
            {{ overlayText }}
          </span>
        </p>
        <p class="sentence-line">
          <span
            v-for="(entry, index) in sentenceGlyphEntries"
            :key="`sentence-${entry.glyphIndex}-${index}`"
            class="sentence-glyph-slot"
          >
            <span
              class="sentence-glyph sentence-glyph-mask"
              :class="{
                'sentence-glyph-hidden':
                  sentenceFlickerVisible[index] || sentenceConsumedHidden[index],
              }"
              :style="sentenceGlyphMaskStyle(entry, entry.file)"
              aria-hidden="true"
            ></span>
            <span
              v-if="sentenceFlickerVisible[index] && sentenceFlickerVariants[index]?.length"
              class="sentence-glyph-flicker-stack"
              aria-hidden="true"
            >
              <span
                v-for="(variantFile, variantIndex) in sentenceFlickerVariants[index]"
                :key="`flicker-${entry.glyphIndex}-${variantIndex}`"
                class="sentence-glyph sentence-glyph-mask sentence-glyph-flicker-layer"
                :class="{
                  'sentence-glyph-flicker-active':
                    sentenceFlickerActiveLayer[index] === variantIndex,
                }"
                :style="sentenceGlyphMaskStyle(entry, variantFile)"
              ></span>
            </span>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timescan-sentence {
  display: inline-flex;
  flex-direction: column;
  gap: var(--timescan-gap, 10px);
  color: var(--timescan-ink, #b9d2ef);
}

.timescan-sentence-framed .sentence-box {
  padding: 10px;
  border: 1px solid #2f4f73;
  border-radius: 12px;
  background: #111820;
  overflow-x: auto;
}

.timescan-sentence:not(.timescan-sentence-framed) .sentence-box {
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
}

.pool-status {
  margin: 0;
  color: #88a6c5;
}

.pool-status-error {
  color: #ff8686;
}

.sentence-controls {
  display: flex;
  justify-content: flex-start;
}

.flicker-button {
  border: 1px solid #2f4f73;
  background: #142435;
  color: #b9d2ef;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font: inherit;
}

.flicker-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sentence-line {
  margin: 0;
  position: relative;
  z-index: 2;
  display: flex;
  gap: 3px;
  align-items: flex-end;
}

.sentence-stage {
  --sentence-ink: var(--timescan-ink, rgba(187, 223, 255, 0.95));
  --sentence-glow: var(--timescan-glow, rgba(109, 196, 255, 0.35));
  position: relative;
  min-height: var(--timescan-min-height, 52px);
}

.sentence-overlay {
  margin: 0;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.sentence-overlay-reveal {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  color: var(--sentence-ink);
  font-size: var(--timescan-overlay-font-size, 1.3rem);
  line-height: var(--timescan-overlay-line-height, 1);
  letter-spacing: var(--timescan-overlay-letter-spacing, 0.03em);
  text-shadow: 0 0 12px var(--sentence-glow);
  transition: opacity 60ms steps(1, end);
}

.sentence-glyph-slot {
  position: relative;
  display: block;
  flex: 0 0 auto;
}

.sentence-glyph {
  display: block;
  flex: 0 0 auto;
}

.sentence-glyph-mask {
  background-color: var(--sentence-ink);
}

.sentence-glyph-hidden {
  opacity: 0;
}

.sentence-glyph-flicker-stack {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sentence-glyph-flicker-layer {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
}

.sentence-glyph-flicker-active {
  opacity: 1;
}
</style>
