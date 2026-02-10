<script setup>
import CoolSciFiTranslation from "./coolscifitranslation.vue"
</script>

<template>
  <section class="home-container">
    <h1>Home</h1>
    <p class="intro">Browse the generated glyph phrase and slice pool.</p>

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
