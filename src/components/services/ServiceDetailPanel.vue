<script setup>
import { computed } from "vue"
import { getServiceById } from "@/content/siteContent"
import { imageAltForKey, imageForKey } from "@/content/contentMedia"

const props = defineProps({
  serviceId: {
    type: String,
    required: true,
  },
})

const service = computed(() => getServiceById(props.serviceId))
const detail = computed(() => service.value?.detail || {})
const galleryItems = computed(() => {
  return (detail.value?.gallery || [])
    .map((item) => ({
      ...item,
      alt: item.alt || imageAltForKey(item.imageKey),
      src: imageForKey(item.imageKey),
    }))
    .filter((item) => item.src)
})
const contactTo = computed(() => ({
  name: "Contact",
  query: { service: props.serviceId },
  hash: "#scroll-effect-anchor",
}))
</script>

<template>
  <section
    v-if="service"
    class="service-detail-window"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="`${service.id}-detail-title`"
  >
    <header class="service-detail-header">
      <p class="service-detail-kicker">{{ detail.kicker }}</p>
      <h2 :id="`${service.id}-detail-title`">{{ service.title }}</h2>
      <p class="service-detail-summary">
        {{ detail.summary }}
      </p>
    </header>

    <div
      v-if="galleryItems.length"
      class="service-detail-gallery"
      :aria-label="`${service.title} preview images`"
    >
      <article
        v-for="item in galleryItems"
        :key="`${service.id}-${item.label}`"
        class="service-detail-gallery-item"
      >
        <img
          :src="item.src"
          :alt="item.alt"
        />
        <div class="service-detail-gallery-copy">
          <h3>{{ item.label }}</h3>
          <p>{{ item.caption }}</p>
        </div>
      </article>
    </div>

    <ul class="service-detail-list">
      <li
        v-for="item in detail.bullets"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>

    <div class="service-detail-fit-grid">
      <section
        v-if="detail.bestFor?.length"
        class="service-detail-fit-section"
      >
        <h3>Best For</h3>
        <ul>
          <li
            v-for="item in detail.bestFor"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>

      <section
        v-if="detail.notIdealFor?.length"
        class="service-detail-fit-section is-muted"
      >
        <h3>Not Ideal For</h3>
        <ul>
          <li
            v-for="item in detail.notIdealFor"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>
    </div>

    <footer class="service-detail-actions">
      <RouterLink
        :to="contactTo"
        class="service-detail-action-link"
      >
        {{ detail.ctaLabel }}
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
  grid-template-rows: auto auto auto auto auto;
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

h2,
h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0;
}

h2 {
  font-size: clamp(1.3rem, 3.2vw, 2rem);
  line-height: 1.05;
  color: rgba(255, 235, 208, 0.96);
}

h3 {
  font-size: 0.74rem;
  line-height: 1;
  text-transform: uppercase;
  color: rgba(255, 235, 208, 0.9);
}

.service-detail-summary {
  margin: 0.2rem 0 0;
  color: rgba(255, 220, 180, 0.82);
}

.service-detail-gallery {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 0.65rem;
}

.service-detail-gallery-item {
  position: relative;
  min-height: 8.5rem;
  display: grid;
  align-content: end;
  overflow: hidden;
  border: 1px solid rgba(255, 220, 180, 0.14);
  border-radius: 8px;
  background: rgba(8, 8, 10, 0.48);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.service-detail-gallery-item:first-child {
  min-height: 10rem;
}

.service-detail-gallery-item img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.02) brightness(1.03);
  transform: scale(1.01);
}

.service-detail-gallery-item::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 7, 9, 0.04) 0%, rgba(6, 7, 9, 0.74) 100%),
    linear-gradient(90deg, rgba(20, 90, 58, 0.12), rgba(212, 161, 94, 0.06));
}

.service-detail-gallery-copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.32rem;
  padding: 0.75rem;
}

.service-detail-gallery-copy p {
  margin: 0;
  color: rgba(255, 224, 190, 0.78);
  font-size: 0.78rem;
  line-height: 1.35;
}

.service-detail-list,
.service-detail-fit-section ul {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  color: rgba(255, 232, 205, 0.88);
  align-content: start;
}

.service-detail-list {
  gap: 0.45rem;
}

.service-detail-fit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.service-detail-fit-section {
  min-width: 0;
  display: grid;
  gap: 0.55rem;
  border: 1px solid rgba(255, 220, 180, 0.12);
  border-radius: 8px;
  padding: 0.85rem;
  background: rgba(10, 11, 13, 0.34);
}

.service-detail-fit-section ul {
  gap: 0.36rem;
  color: rgba(255, 224, 190, 0.8);
  font-size: 0.92rem;
  line-height: 1.45;
}

.service-detail-fit-section.is-muted {
  border-color: rgba(255, 220, 180, 0.08);
  background: rgba(8, 8, 10, 0.22);
}

.service-detail-fit-section.is-muted h3 {
  color: rgba(255, 220, 180, 0.68);
}

.service-detail-fit-section.is-muted ul {
  color: rgba(255, 224, 190, 0.62);
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

@media (max-width: 640px) {
  .service-detail-gallery {
    grid-template-columns: 1fr;
  }

  .service-detail-gallery-item,
  .service-detail-gallery-item:first-child {
    min-height: 8.25rem;
  }

  .service-detail-fit-grid {
    grid-template-columns: 1fr;
  }

  .service-detail-actions {
    justify-content: stretch;
  }

  .service-detail-action-link {
    width: 100%;
  }
}
</style>
