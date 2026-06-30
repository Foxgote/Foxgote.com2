<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { RouterView, useRoute, useRouter } from "vue-router"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  servicesContent,
} from "@/content/siteContent"
import { imageForKey } from "@/content/contentMedia"
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
  return servicesContent.cards.map((card) => ({
    ...card,
    action: card.detail?.ctaLabel || "View Details",
    contactTo: { name: "Contact", query: { service: card.id } },
    thumbnailSrc: imageForKey(card.thumbnailKey || "services"),
    to: { name: SERVICE_CARD_ROUTE_NAME_BY_ID[card.id] },
  }))
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

    <section class="content-card-grid services-grid">
      <article
        v-for="card in servicesCards"
        :key="card.id"
        class="content-card service-card-link"
        :class="{ 'is-detail-active': route.name === SERVICE_CARD_ROUTE_NAME_BY_ID[card.id] }"
      >
        <RouterLink
          class="service-card-main"
          :to="card.to"
          :aria-label="`Open ${card.title} details`"
        >
          <span class="content-card-kicker">{{ card.imageLabel }}</span>
          <h2>{{ card.title }}</h2>
          <span
            class="service-card-thumbnail"
            aria-hidden="true"
          >
            <img
              :src="card.thumbnailSrc"
              alt=""
            />
          </span>
          <p>{{ card.summary }}</p>
        </RouterLink>
        <RouterLink
          class="content-card-action service-card-action"
          :to="card.contactTo"
          :aria-label="`${card.action} on the contact page`"
        >
          {{ card.action }}
        </RouterLink>
      </article>
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
  width: 100%;
  margin: 0;
}

.service-card-link {
  position: relative;
  min-height: 17.25rem;
  align-content: start;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform-origin: center;
  will-change: transform;
  transition:
    transform 170ms ease,
    border-color 170ms ease,
    background 170ms ease;
}

.service-card-main {
  min-width: 0;
  display: grid;
  gap: 0.62rem;
  color: inherit;
  text-decoration: none;
}

.service-card-main::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
}

.service-card-main > *,
.service-card-action {
  position: relative;
  z-index: 1;
}

.service-card-main:focus-visible {
  outline: none;
}

.service-card-link p {
  min-height: 4.65em;
}

.service-card-thumbnail {
  width: 100%;
  min-height: 4.6rem;
  aspect-ratio: 16 / 7;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(255, 220, 180, 0.14);
  border-radius: 4px;
  background:
    linear-gradient(135deg, rgba(255, 220, 180, 0.08), transparent 48%),
    rgba(8, 8, 10, 0.42);
}

.service-card-thumbnail img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  filter: saturate(0.92) contrast(1.04) brightness(0.74);
}

.service-card-action {
  align-self: end;
  justify-self: start;
  margin-top: 1.1rem;
}

.service-card-link:hover,
.service-card-link:focus-within,
.service-card-link.is-detail-active {
  border-color: rgba(255, 220, 180, 0.26);
  background: linear-gradient(160deg, rgba(22, 17, 12, 0.62), rgba(9, 9, 11, 0.78));
}

.service-card-link:focus-within {
  outline: 2px solid rgba(255, 220, 180, 0.36);
  outline-offset: 3px;
}

.service-card-link.is-detail-active {
  border-color: rgba(255, 220, 180, 0.32);
  background: linear-gradient(160deg, rgba(24, 18, 12, 0.68), rgba(9, 9, 11, 0.82));
}

.service-card-main:hover ~ .service-card-action,
.service-card-main:focus-visible ~ .service-card-action {
  border-color: rgba(255, 235, 208, 0.84);
  color: rgba(255, 247, 232, 1);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(255, 220, 180, 0.24),
    0 8px 14px rgba(0, 0, 0, 0.32);
}

.service-card-action:active {
  transform: scale(0.94);
  border-color: rgba(255, 220, 180, 0.18);
  background: rgba(5, 5, 7, 0.42);
  color: rgba(205, 184, 164, 0.78);
  box-shadow: none;
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
    gap: 0.85rem;
  }
}

@media (max-width: 700px) {
  .services-page {
    padding-top: 1.35rem;
    padding-bottom: 2rem;
  }

  .services-grid {
    gap: 0.75rem;
  }

  .service-card-link {
    min-height: auto;
  }

  .service-card-link p {
    min-height: 0;
  }
}
</style>


