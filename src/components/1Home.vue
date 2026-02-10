<script setup>
import { ref } from "vue"
import TranslatingLine from "./TranslatingLine.vue"
import CoolSciFiTranslation from "./coolscifitranslation.vue"

const lineRef = ref(null)
const lineText = ref(
  "This is a test text meant to be shown after Ithkuil translation glitch effect.",
)

function replayTransition() {
  lineRef.value?.replay()
}
</script>

<template>
  <section class="home-container">
    <h1>Home</h1>
    <p class="intro">Type one line, then replay the line render.</p>

    <label class="editor-label" for="line-text">Line Text</label>
    <textarea
      id="line-text"
      v-model="lineText"
      class="editor-input"
      rows="2"
      spellcheck="false"
    ></textarea>

    <TranslatingLine ref="lineRef" :text="lineText" />

    <button type="button" class="replay-button" @click="replayTransition">
      Replay Transition
    </button>

    <section class="pool-section">
      <h2>Cool Sci-Fi Translation Pool</h2>
      <CoolSciFiTranslation />
    </section>
  </section>
</template>

<style scoped>
.home-container {
  width: min(960px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.intro {
  margin: 0;
  color: rgba(219, 236, 252, 0.72);
}

.editor-label {
  margin-top: 6px;
  font-size: 0.8rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(173, 208, 240, 0.72);
}

.editor-input {
  width: 100%;
  min-height: 76px;
  resize: vertical;
  border-radius: 10px;
  border: 1px solid rgba(170, 200, 235, 0.34);
  background: rgba(7, 12, 17, 0.88);
  color: rgba(232, 243, 255, 0.94);
  padding: 0.75rem 0.9rem;
  font: inherit;
}

.editor-input:focus {
  outline: none;
  border-color: #67c8ff;
  box-shadow: 0 0 0 3px rgba(103, 200, 255, 0.22);
}

.replay-button {
  justify-self: start;
  border: 1px solid rgba(170, 200, 235, 0.4);
  border-radius: 999px;
  background: rgba(9, 18, 26, 0.92);
  color: rgba(227, 242, 255, 0.96);
  padding: 0.55rem 1rem;
  cursor: pointer;
  font: inherit;
}

.replay-button:hover {
  border-color: rgba(137, 214, 255, 0.82);
}

.pool-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(137, 214, 255, 0.2);
}

.pool-section h2 {
  margin: 0 0 10px;
  font-size: 1.1rem;
  color: rgba(225, 238, 255, 0.96);
}
</style>
