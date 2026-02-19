<template>
  <section
    class="service-detail-window"
    role="dialog"
    aria-modal="true"
    aria-labelledby="music-teaching-detail-title"
  >
    <header class="service-detail-header">
      <p class="service-detail-kicker">Service Detail</p>
      <h2 id="music-teaching-detail-title">Music Teaching</h2>
      <p class="service-detail-summary">
        Personalized coaching blocks designed around your goals and pace.
      </p>
    </header>

    <ul class="service-detail-list">
      <li>One-on-one lesson formats for focused progress.</li>
      <li>Beginner through advanced support.</li>
      <li>Technique, songwriting, and live performance coaching.</li>
      <li>Structured weekly plans with practical milestones.</li>
    </ul>

    <footer class="service-detail-actions">
      <RouterLink
        to="/contact"
        class="service-detail-action-link"
      >
        Contact Me
      </RouterLink>
    </footer>
  </section>
</template>

<style scoped>
.service-detail-window {
  width: min(860px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  border-radius: 20px 20px 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 11, 13, 0.72);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.48),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: clamp(1.45rem, 2.6vw, 2.2rem) clamp(1.05rem, 2.2vw, 1.8rem)
    clamp(1.05rem, 2.2vw, 1.8rem);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  overflow: auto;
}

.service-detail-header {
  display: grid;
  gap: 0.35rem;
}

.service-detail-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: rgba(212, 161, 94, 0.9);
}

h2 {
  margin: 0;
  font-size: clamp(1.3rem, 3.2vw, 2rem);
  line-height: 1.05;
  letter-spacing: 0.02em;
  color: rgba(255, 235, 208, 0.96);
}

.service-detail-summary {
  margin: 0.2rem 0 0;
  color: rgba(255, 220, 180, 0.82);
}

.service-detail-list {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.45rem;
  color: rgba(255, 232, 205, 0.88);
  align-content: start;
}

.service-detail-actions {
  margin-top: 0.35rem;
  display: flex;
  justify-content: flex-end;
}

.service-detail-action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.3rem;
  padding: 0.46rem 0.96rem;
  border: 1px solid rgba(255, 220, 180, 0.6);
  border-radius: 2px;
  background: rgba(10, 11, 13, 0.58);
  color: rgba(255, 235, 208, 0.94);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.35);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.service-detail-action-link:hover,
.service-detail-action-link:focus-visible {
  border-color: rgba(255, 235, 208, 0.84);
  color: rgba(255, 247, 232, 1);
  transform: translate(-1px, -1px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(255, 220, 180, 0.35),
    0 8px 14px rgba(0, 0, 0, 0.32);
}

.service-detail-action-link:active {
  transform: translate(0, 0);
}

</style>
