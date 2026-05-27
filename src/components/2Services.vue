<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { RouterView, useRoute, useRouter } from "vue-router"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  serviceBulletAssetKey,
  serviceImageAssetKey,
  serviceTitleAssetKey,
  servicesContent,
} from "@/content/siteContent"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"

const SERVICES_HEADER_VIEW_TRIGGER_THRESHOLD = 0.2
const SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD = 0.2
const SERVICES_VIEW_TRIGGER_ROOT_MARGIN = "0px"
const SERVICES_VIEW_TRIGGER_DELAY_MS = 1100
const SERVICE_DETAIL_DRAG_CLOSE_THRESHOLD_PX = 120
const SERVICE_DETAIL_DRAG_CLICK_DEADZONE_PX = 6
const SERVICES_ROUTE_PATH = "/services"

const SERVICE_CARD_ROUTE_NAME_BY_ID = {
  "studio-rental": "ServiceStudioRental",
  "music-teaching": "ServiceMusicTeaching",
  "other-services": "ServiceOtherServices",
}

const router = useRouter()
const route = useRoute()

const isWithinServicesRoute = computed(() => {
  return route.path === SERVICES_ROUTE_PATH || route.path.startsWith(`${SERVICES_ROUTE_PATH}/`)
})

const isServiceDetailOpen = computed(() => {
  return isWithinServicesRoute.value && route.path !== SERVICES_ROUTE_PATH
})
const serviceDetailDragOffsetPx = ref(0)
const isServiceDetailDragging = ref(false)

let serviceDetailDragStartY = 0
let serviceDetailDragPointerId = null
let serviceDetailDragMoved = false

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const servicesEyebrowTokens = computed(() => buildTimescanTokens("services.eyebrow"))

const servicesHeadingTokens = computed(() => buildTimescanTokens("services.heading"))

const servicesLeadTokens = computed(() => buildTimescanTokens("services.lead"))

const servicesCards = computed(() => {
  return servicesContent.cards.map((card) => {
    const titleAssetKey = serviceTitleAssetKey(card.id)
    const imageAssetKey = serviceImageAssetKey(card.id)

    return {
      ...card,
      to: { name: SERVICE_CARD_ROUTE_NAME_BY_ID[card.id] },
      titleAssetKey,
      imageAssetKey,
      titleTokens: buildTimescanTokens(titleAssetKey),
      imageTokens: buildTimescanTokens(imageAssetKey),
      bulletItems: card.bullets.map((text, index) => {
        const assetKey = serviceBulletAssetKey(card.id, index)
        return {
          id: `${card.id}-bullet-${index}`,
          text,
          assetKey,
          tokens: buildTimescanTokens(assetKey),
        }
      }),
    }
  })
})

function closeServiceDetail() {
  if (!isServiceDetailOpen.value) return
  router.replace({ name: "Services" })
}

function clearServiceDetailDragListeners() {
  window.removeEventListener("pointermove", onServiceDetailHandlePointerMove)
  window.removeEventListener("pointerup", onServiceDetailHandlePointerUp)
  window.removeEventListener("pointercancel", onServiceDetailHandlePointerUp)
}

function resetServiceDetailDragState() {
  isServiceDetailDragging.value = false
  serviceDetailDragOffsetPx.value = 0
  serviceDetailDragStartY = 0
  serviceDetailDragPointerId = null
  serviceDetailDragMoved = false
}

function onServiceDetailHandlePointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return
  serviceDetailDragStartY = event.clientY
  serviceDetailDragPointerId = event.pointerId ?? null
  serviceDetailDragMoved = false
  isServiceDetailDragging.value = true
  serviceDetailDragOffsetPx.value = 0
  clearServiceDetailDragListeners()
  window.addEventListener("pointermove", onServiceDetailHandlePointerMove)
  window.addEventListener("pointerup", onServiceDetailHandlePointerUp)
  window.addEventListener("pointercancel", onServiceDetailHandlePointerUp)
}

function onServiceDetailHandlePointerMove(event) {
  if (!isServiceDetailDragging.value) return
  if (serviceDetailDragPointerId !== null && event.pointerId !== serviceDetailDragPointerId) return

  const deltaY = Math.max(0, event.clientY - serviceDetailDragStartY)
  serviceDetailDragOffsetPx.value = deltaY
  if (deltaY > SERVICE_DETAIL_DRAG_CLICK_DEADZONE_PX) {
    serviceDetailDragMoved = true
  }
}

function onServiceDetailHandlePointerUp(event) {
  if (!isServiceDetailDragging.value) return
  if (serviceDetailDragPointerId !== null && event.pointerId !== serviceDetailDragPointerId) return

  const shouldClose = serviceDetailDragOffsetPx.value >= SERVICE_DETAIL_DRAG_CLOSE_THRESHOLD_PX
  clearServiceDetailDragListeners()
  resetServiceDetailDragState()
  if (shouldClose) {
    closeServiceDetail()
  }
}

function onServiceDetailHandleClick(event) {
  if (serviceDetailDragMoved) {
    event.preventDefault()
    serviceDetailDragMoved = false
    return
  }
  closeServiceDetail()
}

watch(
  isServiceDetailOpen,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    if (!isOpen) {
      clearServiceDetailDragListeners()
      resetServiceDetailDragState()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearServiceDetailDragListeners()
  resetServiceDetailDragState()
  document.body.style.overflow = ""
})
</script>

<template>
  <section class="services-page">
    <header class="services-header">
      <div class="eyebrow">
        <TimescanSentence
          class="timescan-base timescan-h6 timescan-layout-center"
          :overlay-text="servicesContent.eyebrow"
          asset-key="services.eyebrow"
          :glyph-tokens="servicesEyebrowTokens"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </div>
      <h1 class="services-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="servicesContent.heading"
          asset-key="services.heading"
          :glyph-tokens="servicesHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_HEADER_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <div class="lead">
        <TimescanSentence
          class="timescan-base timescan-h2 timescan-layout-center"
          :overlay-text="servicesContent.lead"
          asset-key="services.lead"
          :glyph-tokens="servicesLeadTokens"
          :glyph-scale="0.6"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </div>
    </header>

    <section class="services-grid">
      <RouterLink
        v-for="card in servicesCards"
        :key="card.id"
        class="service-card-link"
        :to="card.to"
        :aria-label="`Open ${card.title} details`"
      >
        <article class="service-card">
          <header class="service-card-head">
            <TimescanSentence
              class="timescan-base timescan-h3 timescan-layout-center"
              :overlay-text="card.title"
              :asset-key="card.titleAssetKey"
              :glyph-tokens="card.titleTokens"
              :auto-trigger-on-view="true"
              :view-trigger-threshold="SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD"
              :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
              :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
              :show-button="false"
            />
          </header>
          <div
            class="card-image-slot"
            role="img"
            :aria-label="card.imageAriaLabel"
          >
            <TimescanSentence
              class="timescan-base timescan-caption timescan-layout-center"
              :overlay-text="card.imageLabel"
              :asset-key="card.imageAssetKey"
              :glyph-tokens="card.imageTokens"
              :auto-trigger-on-view="true"
              :view-trigger-threshold="SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD"
              :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
              :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
              :show-button="false"
            />
          </div>
          <ul class="service-bullets">
            <li
              v-for="bullet in card.bulletItems"
              :key="bullet.id"
            >
              <TimescanSentence
                class="timescan-base timescan-p timescan-layout-left"
                :overlay-text="bullet.text"
                :asset-key="bullet.assetKey"
                :glyph-tokens="bullet.tokens"
                :auto-trigger-on-view="true"
                :view-trigger-threshold="SERVICES_CONTENT_VIEW_TRIGGER_THRESHOLD"
                :view-trigger-root-margin="SERVICES_VIEW_TRIGGER_ROOT_MARGIN"
                :view-trigger-delay-ms="SERVICES_VIEW_TRIGGER_DELAY_MS"
                :show-button="false"
              />
            </li>
          </ul>
        </article>
      </RouterLink>
    </section>

    <RouterView v-slot="{ Component, route: detailRoute }">
      <Transition name="service-detail-backdrop" appear>
        <div
          v-if="Component"
          :key="`${detailRoute.fullPath}-backdrop`"
          class="service-detail-backdrop"
          aria-hidden="true"
        ></div>
      </Transition>
      <Transition name="service-detail-sheet" appear>
        <div
          v-if="Component"
          :key="detailRoute.fullPath"
          class="service-detail-overlay"
          :class="{ 'is-dragging': isServiceDetailDragging }"
          :style="{ '--service-detail-drag-y': `${serviceDetailDragOffsetPx}px` }"
          @click.self="closeServiceDetail"
        >
          <div class="service-detail-frame">
            <button
              type="button"
              class="service-detail-dismiss-handle"
              aria-label="Close service detail"
              @click="onServiceDetailHandleClick"
              @pointerdown="onServiceDetailHandlePointerDown"
            ></button>
            <component :is="Component" />
          </div>
        </div>
      </Transition>
    </RouterView>
  </section>
</template>

<style scoped>
.services-page {
  width: 100%;
  margin: 0 auto;
  padding: 2.25rem var(--page-inline-pad, 0);
  display: grid;
  gap: 1.6rem;
}

.services-header {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
}

.services-header :deep(.timescan-sentence) {
  width: 100%;
}

.services-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.eyebrow {
  margin-top: 32px;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(212, 161, 94, 0.92);
}

.lead {
  margin: 0.3rem 0 0;
  color: rgba(255, 220, 180, 0.72);
  font-size: 1.05rem;
}

.services-grid {
  display: grid;
  width: 100%;
  margin: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.75rem, 2vw, 2rem);
  justify-items: center;
}

.service-card-link {
  width: min(100%, 340px);
  display: block;
  position: relative;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.service-card-link:hover,
.service-card-link:focus-visible {
  z-index: 2;
}

.service-card-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(212, 161, 94, 0.42);
}

.service-card {
  width: 100%;
  height: min(100%, 520px);
  margin: 0;
  display: grid;
  align-content: start;
  gap: 0.85rem;
  border-radius: 16px;
  border: 1px solid rgba(212, 161, 94, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: linear-gradient(160deg, rgba(18, 14, 10, 0.52), rgba(8, 8, 10, 0.72));
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(212, 161, 94, 0.05);
  font-size: 1.2rem;
  color: rgba(255, 237, 214, 0.95);
  letter-spacing: 0.01em;
  transform-origin: center;
  transition:
    transform 170ms ease,
    box-shadow 170ms ease,
    border-color 170ms ease,
    background 170ms ease;
  will-change: transform;
}

.service-card-head {
  margin: 1.2rem 0 0;
  text-align: center;
  text-transform: uppercase;
}

.service-card-link:focus-visible .service-card {
  transform: scale(1.035);
  border-color: rgba(212, 161, 94, 0.22);
  box-shadow:
    0 18px 30px rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px rgba(212, 161, 94, 0.1);
}

.service-card-link:active .service-card {
  transform: scale(0.97);
  border-color: rgba(212, 161, 94, 0.12);
  background: linear-gradient(160deg, rgba(13, 10, 8, 0.62), rgba(5, 5, 7, 0.78));
  box-shadow:
    0 7px 14px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(212, 161, 94, 0.04);
  color: rgba(205, 184, 164, 0.74);
}

.service-card-link:active .service-card :deep(.timescan-base) {
  --timescan-ink: rgba(196, 174, 150, 0.72);
  --timescan-glow: rgba(255, 186, 109, 0.1);
}

@media (hover: hover) and (pointer: fine) {
  .service-card-link:hover .service-card {
    transform: scale(1.035);
    border-color: rgba(212, 161, 94, 0.22);
    box-shadow:
      0 18px 30px rgba(0, 0, 0, 0.42),
      inset 0 0 0 1px rgba(212, 161, 94, 0.1);
  }

  .service-card-link:active .service-card {
    transform: scale(0.97);
  }
}

.card-image-slot {
  min-height: 220px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  text-transform: uppercase;
}

.card-image-slot :deep(.timescan-sentence) {
  width: 100%;
}

.service-bullets {
  margin: 1.5rem;
  justify-self: center;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.5rem;
  list-style-type: none;
}

.service-bullets :deep(.timescan-sentence) {
  width: 100%;
}

.service-bullets :deep(.sentence-stage) {
  overflow: hidden;
}

.service-bullets li {
  margin: 0;
  overflow: hidden;
}

.service-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  align-items: end;
  justify-items: center;
  padding: 0;
  background: transparent;
  transform: translateY(0);
  will-change: transform;
}

.service-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 68;
  pointer-events: none;
  background: rgba(4, 6, 8, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.service-detail-overlay :deep(.service-detail-window) {
  width: 100vw;
  max-width: 100vw;
  height: min(75vh, calc(100vh - 0.25rem));
  min-height: 58vh;
  max-height: calc(100vh - 0.25rem);
  border-radius: 18px 18px 0 0;
}

.service-detail-frame {
  width: 100vw;
  position: relative;
  transform: translateY(var(--service-detail-drag-y, 0px));
  transition: transform 220ms ease;
}

.service-detail-overlay.is-dragging .service-detail-frame {
  transition: none;
}

.service-detail-dismiss-handle {
  position: absolute;
  top: 0.15rem;
  left: 50%;
  width: min(13.5rem, 58vw);
  height: 2.5rem;
  transform: translateX(-50%);
  border: 0;
  padding: 0;
  background: rgba(255, 237, 214, 0.95);
  -webkit-mask: url("../assets/img/arrow-down-3101.svg") center / contain no-repeat;
  mask: url("../assets/img/arrow-down-3101.svg") center / contain no-repeat;
  opacity: 0.6;
  cursor: pointer;
  touch-action: none;
  z-index: 1;
}

.service-detail-sheet-enter-active,
.service-detail-sheet-leave-active {
  transition: transform 920ms cubic-bezier(0.22, 1, 0.36, 1);
}

.service-detail-sheet-enter-from,
.service-detail-sheet-leave-to {
  transform: translateY(110%);
}

.service-detail-backdrop-enter-active,
.service-detail-backdrop-leave-active {
  transition:
    opacity 520ms ease,
    backdrop-filter 520ms ease,
    -webkit-backdrop-filter 520ms ease,
    background-color 520ms ease;
}

.service-detail-backdrop-enter-from,
.service-detail-backdrop-leave-to {
  opacity: 0;
  background-color: rgba(4, 6, 8, 0);
  backdrop-filter: blur(0);
  -webkit-backdrop-filter: blur(0);
}

.service-detail-backdrop-enter-to,
.service-detail-backdrop-leave-from {
  opacity: 1;
  background-color: rgba(4, 6, 8, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

@media (max-width: 980px) {
  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .services-page {
    padding-top: 1.35rem;
    padding-bottom: 2rem;
  }

  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
    justify-items: stretch;
  }

  .service-card-link {
    width: 100%;
    max-width: none;
  }

  .service-card {
    min-height: auto;
    gap: 0.45rem;
    border-radius: 12px;
    font-size: 0.84rem;
  }

  .service-card-head {
    margin: 0.75rem 0.25rem 0;
  }

  .card-image-slot {
    min-height: 112px;
    border-radius: 9px;
  }

  .service-bullets {
    margin: 0.55rem 0.45rem 0.75rem;
    padding-left: 0;
    gap: 0.32rem;
  }

  .service-card :deep(.timescan-h3) {
    --timescan-overlay-font-size: 0.78rem;
    --timescan-min-height: 20px;
    --timescan-overlay-letter-spacing: 0.06em;
  }

  .service-card :deep(.timescan-caption) {
    --timescan-overlay-font-size: 0.68rem;
    --timescan-min-height: 16px;
  }

  .service-card :deep(.timescan-p) {
    --timescan-overlay-font-size: 0.62rem;
    --timescan-min-height: 15px;
    --timescan-glyph-scale: 0.32;
  }
}
</style>


