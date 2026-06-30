<script setup>
import { computed, ref } from "vue"
import {
  portfolioContent,
  portfolioShowcaseTextAssetKey,
  portfolioVideoTextAssetKey,
} from "@/content/siteContent"
import { imageForKey } from "@/content/contentMedia"
import TimescanText from "./TimescanText.vue"

const MEDIA_SCROLL_PREVIEW_CYCLES = 3
const MEDIA_SCROLL_DRAG_THRESHOLD_PX = 6
const DRAGGABLE_MEDIA_PANEL_IDS = new Set(["artworks", "videos"])

const activeAudioIndex = ref(null)
const audioRefs = ref([])
const audioProgress = ref(0)
const audioDuration = ref(0)
const isAudioPlaying = ref(false)
const activeVideoEmbedKey = ref(defaultVideoEmbedKey())
const draggingMediaPanelId = ref(null)
let mediaScrollDragState = null
let shouldSuppressMediaClick = false

const audioSamples = computed(() =>
  portfolioContent.showcases.find((panel) => panel.id === "audio")?.audioSamples || [],
)
const activeAudioTrack = computed(() => {
  const index = activeAudioIndex.value
  return Number.isInteger(index) ? audioSamples.value[index] || null : null
})
const activeAudioDuration = computed(() =>
  audioDuration.value || activeAudioTrack.value?.durationSeconds || 1,
)

function artworkPreviewItems(panel) {
  const artworks = panel.artworks || []
  return Array.from({ length: MEDIA_SCROLL_PREVIEW_CYCLES }, () => artworks).flat()
}

function videoPreviewItems(panel) {
  const videos = panel.videos || []
  return Array.from({ length: MEDIA_SCROLL_PREVIEW_CYCLES }, () => videos).flat()
}

function videoItemKey(video, videoIndex) {
  return `${video.title}-${videoIndex}`
}

function defaultVideoEmbedKey() {
  const videoPanel = portfolioContent.showcases.find((panel) => panel.id === "videos")
  const firstEmbedIndex = (videoPanel?.videos || []).findIndex((video) => video.embedUrl)
  if (firstEmbedIndex < 0) return ""
  return videoItemKey(videoPanel.videos[firstEmbedIndex], firstEmbedIndex)
}

function canEmbedVideo(panel, video) {
  return Boolean(video.embedUrl && (panel.videos?.length || 0) > 0)
}

function isVideoEmbedActive(panel, video, videoIndex) {
  return canEmbedVideo(panel, video)
    && activeVideoEmbedKey.value === videoItemKey(video, videoIndex)
}

function videoEmbedUrl(video) {
  if (!video.embedUrl) return ""
  try {
    const url = new URL(video.embedUrl, window.location.origin)
    url.searchParams.set("autoplay", "1")
    url.searchParams.set("mute", "1")
    url.searchParams.set("playsinline", "1")
    url.searchParams.set("rel", "0")
    return url.toString()
  } catch {
    const separator = video.embedUrl.includes("?") ? "&" : "?"
    return `${video.embedUrl}${separator}autoplay=1&mute=1&playsinline=1&rel=0`
  }
}

function activateVideoEmbed(panel, video, videoIndex) {
  if (!canEmbedVideo(panel, video)) return
  activeVideoEmbedKey.value = videoItemKey(video, videoIndex)
}

function isDraggableMediaPanel(panelId) {
  return DRAGGABLE_MEDIA_PANEL_IDS.has(panelId)
}

function startMediaScrollDrag(panelId, event) {
  if (!isDraggableMediaPanel(panelId)) return
  if (event.pointerType !== "mouse" || event.button !== 0) return

  const element = event.currentTarget
  if (!(element instanceof HTMLElement)) return

  mediaScrollDragState = {
    element,
    panelId,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: element.scrollLeft,
    dragging: false,
  }

  if (typeof element.setPointerCapture === "function") {
    element.setPointerCapture(event.pointerId)
  }
}

function moveMediaScrollDrag(event) {
  const state = mediaScrollDragState
  if (!state || state.pointerId !== event.pointerId) return

  const deltaX = event.clientX - state.startX
  const deltaY = event.clientY - state.startY

  if (!state.dragging) {
    if (Math.abs(deltaX) < MEDIA_SCROLL_DRAG_THRESHOLD_PX) return
    if (Math.abs(deltaX) < Math.abs(deltaY)) return

    state.dragging = true
    shouldSuppressMediaClick = true
    draggingMediaPanelId.value = state.panelId
  }

  event.preventDefault()
  state.element.scrollLeft = state.startScrollLeft - deltaX
}

function finishMediaScrollDrag(event) {
  const state = mediaScrollDragState
  if (!state || state.pointerId !== event.pointerId) return

  if (
    typeof state.element.releasePointerCapture === "function" &&
    state.element.hasPointerCapture?.(event.pointerId)
  ) {
    state.element.releasePointerCapture(event.pointerId)
  }

  mediaScrollDragState = null
  draggingMediaPanelId.value = null
}

function blockDraggedMediaClick(event) {
  if (!shouldSuppressMediaClick) return

  shouldSuppressMediaClick = false
  event.preventDefault()
  event.stopPropagation()
}

function setAudioRef(index, element) {
  if (element) {
    audioRefs.value[index] = element
    return
  }
  delete audioRefs.value[index]
}

function getAudioPlayer() {
  const index = activeAudioIndex.value
  const player = Number.isInteger(index) ? audioRefs.value[index] : null
  return player && typeof player === "object" ? player : null
}

function pauseAudioPlayer() {
  const player = getAudioPlayer()
  if (typeof player?.pause === "function") {
    player.pause()
  }
}

function selectAudioTrack(index) {
  if (index < 0 || index >= audioSamples.value.length) return
  if (activeAudioIndex.value === index) return
  pauseAudioPlayer()
  activeAudioIndex.value = index
  audioProgress.value = 0
  audioDuration.value = 0
  isAudioPlaying.value = false
}

function selectAudioTrackByTitle(title) {
  const index = audioSamples.value.findIndex((track) => track.title === title)
  selectAudioTrack(index)
}

function skipAudioTrack(direction) {
  const count = audioSamples.value.length
  if (!count) return
  const currentIndex = Number.isInteger(activeAudioIndex.value)
    ? activeAudioIndex.value
    : 0
  const nextIndex = (currentIndex + direction + count) % count
  selectAudioTrack(nextIndex)
}

async function toggleAudioPlayback() {
  if (!activeAudioTrack.value) return
  const player = getAudioPlayer()
  if (!activeAudioTrack.value.src || !player || typeof player.play !== "function") return
  if (isAudioPlaying.value) {
    pauseAudioPlayer()
    isAudioPlaying.value = false
    return
  }
  try {
    await player.play()
    isAudioPlaying.value = true
  } catch {
    isAudioPlaying.value = false
  }
}

function updateAudioProgress(event) {
  const nextValue = Number(event.target?.value)
  audioProgress.value = Number.isFinite(nextValue)
    ? Math.max(0, Math.min(activeAudioDuration.value, nextValue))
    : 0
  const player = getAudioPlayer()
  if (player && activeAudioTrack.value?.src) {
    player.currentTime = audioProgress.value
  }
}

function syncAudioMetadata() {
  const player = getAudioPlayer()
  audioDuration.value = Number.isFinite(player?.duration) && player.duration > 0
    ? player.duration
    : 0
}

function syncAudioProgress() {
  const player = getAudioPlayer()
  audioProgress.value = Number.isFinite(player?.currentTime)
    ? player.currentTime
    : 0
}

function finishAudioSample() {
  isAudioPlaying.value = false
  audioProgress.value = activeAudioDuration.value
}

function formatAudioTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0")
  return `${minutes}:${remainingSeconds}`
}
</script>

<template>
  <section class="content-page portfolio-page">
    <section class="portfolio-showcase-list">
      <article
        v-for="panel in portfolioContent.showcases"
        :key="panel.id"
        class="portfolio-panel"
        :class="`portfolio-panel--${panel.id}`"
      >
        <header
          class="portfolio-panel-header"
          :id="`portfolio-panel-${panel.id}-label`"
        >
          <span class="portfolio-panel-copy">
            <TimescanText
              class="content-card-kicker portfolio-panel-kicker"
              :text="panel.label"
              :asset-key="portfolioShowcaseTextAssetKey(panel.id, 'label')"
              sentence-class="timescan-base timescan-h6 timescan-layout-left portfolio-kicker-line"
              :max-chars="26"
            />
          </span>
        </header>

        <div
          :id="`portfolio-panel-${panel.id}`"
          class="portfolio-panel-content"
          :class="{ 'is-media-scroll-dragging': draggingMediaPanelId === panel.id }"
          :aria-labelledby="`portfolio-panel-${panel.id}-label`"
          @pointerdown="startMediaScrollDrag(panel.id, $event)"
          @pointermove="moveMediaScrollDrag"
          @pointerup="finishMediaScrollDrag"
          @pointercancel="finishMediaScrollDrag"
          @lostpointercapture="finishMediaScrollDrag"
          @click.capture="isDraggableMediaPanel(panel.id) && blockDraggedMediaClick($event)"
        >
          <div
            v-if="panel.id === 'artworks'"
            class="artwork-strip"
          >
            <figure
              v-for="(artwork, artworkIndex) in artworkPreviewItems(panel)"
              :key="`${artwork.title}-${artworkIndex}`"
              class="artwork-frame"
            >
              <img
                :src="imageForKey(artwork.imageKey)"
                :alt="artwork.alt"
              />
            </figure>
          </div>

          <div
            v-else-if="panel.id === 'videos'"
            class="video-embed-grid"
          >
            <article
              v-for="(video, videoIndex) in videoPreviewItems(panel)"
              :key="`${video.title}-${videoIndex}`"
              class="video-embed-slot"
              :data-video-title="video.title"
              :data-video-copy-index="videoIndex"
            >
              <iframe
                v-if="isVideoEmbedActive(panel, video, videoIndex)"
                :src="videoEmbedUrl(video)"
                :title="video.title"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
              <button
                v-else-if="canEmbedVideo(panel, video)"
                type="button"
                class="video-embed-placeholder"
                :style="{ backgroundImage: `url(${imageForKey(video.imageKey)})` }"
                :aria-label="`Play ${video.title}`"
                @click.stop="activateVideoEmbed(panel, video, videoIndex)"
              >
                <span class="video-play-mark" aria-hidden="true"></span>
              </button>
              <span
                v-else
                class="video-embed-placeholder"
                :style="{ backgroundImage: `url(${imageForKey(video.imageKey)})` }"
              >
                <span class="video-play-mark" aria-hidden="true"></span>
              </span>
              <a
                class="portfolio-video-title-link"
                :class="{ 'is-placeholder': !video.linkUrl }"
                :href="video.linkUrl || '#'"
                target="_blank"
                rel="noreferrer"
                :aria-disabled="!video.linkUrl"
                @click="!video.linkUrl && $event.preventDefault()"
              >
                <TimescanText
                  :text="video.title"
                  :asset-key="portfolioVideoTextAssetKey(panel.id, videoIndex % panel.videos.length, 'title')"
                  sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-caption-title-line"
                  :max-chars="24"
                />
              </a>
            </article>
          </div>

          <div
            v-else-if="panel.id === 'audio'"
            class="audio-showcase"
          >
            <div class="audio-track-list">
              <div
                v-for="(track, index) in panel.audioSamples"
                :key="track.title"
                class="audio-track-shell"
                :class="{ 'is-active': index === activeAudioIndex }"
              >
                <div
                  class="audio-track"
                  :class="{ 'is-active': index === activeAudioIndex }"
                >
                  <div
                    class="audio-track-summary"
                    role="button"
                    tabindex="0"
                    :data-audio-title="track.title"
                    :aria-expanded="index === activeAudioIndex"
                    :aria-controls="index === activeAudioIndex ? `portfolio-audio-player-${index}` : undefined"
                    @click="selectAudioTrackByTitle(track.title)"
                    @keydown.enter.prevent="selectAudioTrackByTitle(track.title)"
                    @keydown.space.prevent="selectAudioTrackByTitle(track.title)"
                  >
                    <img
                      :src="imageForKey(track.imageKey)"
                      :alt="`${track.title} thumbnail`"
                    />
                    <span>
                      <strong>{{ track.title }}</strong>
                      <em>{{ track.artist }}</em>
                    </span>
                    <small>{{ track.duration }}</small>
                  </div>

                  <div
                    :id="`portfolio-audio-player-${index}`"
                    class="audio-player-shell"
                    :class="{ 'is-expanded': index === activeAudioIndex }"
                    :aria-hidden="index !== activeAudioIndex"
                  >
                    <div class="audio-player">
                      <audio
                        :ref="(element) => setAudioRef(index, element)"
                        :src="track.src || undefined"
                        preload="metadata"
                        @loadedmetadata="syncAudioMetadata"
                        @timeupdate="syncAudioProgress"
                        @ended="finishAudioSample"
                      ></audio>
                      <div class="audio-controls">
                        <button
                          class="audio-icon-button previous"
                          type="button"
                          aria-label="Previous sample"
                          :disabled="index !== activeAudioIndex"
                          @click="skipAudioTrack(-1)"
                        ></button>
                        <button
                          class="audio-icon-button play"
                          :class="{ 'is-playing': index === activeAudioIndex && isAudioPlaying }"
                          type="button"
                          :aria-label="isAudioPlaying ? 'Pause sample' : 'Play sample'"
                          :disabled="index !== activeAudioIndex || !track.src"
                          @click="toggleAudioPlayback"
                        ></button>
                        <button
                          class="audio-icon-button next"
                          type="button"
                          aria-label="Next sample"
                          :disabled="index !== activeAudioIndex"
                          @click="skipAudioTrack(1)"
                        ></button>
                      </div>
                      <div class="audio-timeline">
                        <span>{{ formatAudioTime(index === activeAudioIndex ? audioProgress : 0) }}</span>
                        <input
                          type="range"
                          min="0"
                          :max="index === activeAudioIndex ? activeAudioDuration : track.durationSeconds"
                          :value="index === activeAudioIndex ? audioProgress : 0"
                          aria-label="Sample position"
                          :disabled="index !== activeAudioIndex || !track.src"
                          @input="updateAudioProgress"
                        />
                        <span>{{ track.duration }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.portfolio-page {
  --portfolio-panel-inline-pad: clamp(0.85rem, 3vw, 1.25rem);
  --portfolio-showcase-max-width: 1200px;
  width: calc(100% + (var(--app-inline-pad, 0rem) * 2));
  max-width: none;
  margin-block-start: -1px;
  margin-inline: calc(var(--app-inline-pad, 0rem) * -1);
  gap: 0;
  padding: 0 0 3rem;
  overflow-x: clip;
}

.portfolio-showcase-list {
  width: 100%;
  margin-inline: auto;
  display: grid;
  gap: 0;
}

.portfolio-panel {
  width: 100%;
  min-width: 0;
  height: clamp(22rem, 56vh, 38rem);
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid rgba(255, 220, 180, 0.16);
  border-radius: 0;
  background:
    linear-gradient(90deg, rgba(255, 154, 99, 0.08), transparent 34%),
    rgba(10, 11, 13, 0.52);
  box-shadow: none;
  color: rgba(255, 237, 214, 0.92);
}

.portfolio-panel:first-child {
  border-top: 1px solid rgba(255, 220, 180, 0.16);
}

.portfolio-panel--artworks,
.portfolio-panel--videos {
  height: auto;
  grid-template-rows: auto auto;
}

.portfolio-panel-header {
  box-sizing: border-box;
  width: 100%;
  min-height: 3.15rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 220, 180, 0.12);
  padding: 0.7rem var(--portfolio-panel-inline-pad, 0);
  background: transparent;
  color: inherit;
  text-align: left;
}

.portfolio-panel-copy {
  display: grid;
  gap: 0;
}

.portfolio-panel-kicker {
  --timescan-text-gap: 0.08rem;
}

.portfolio-panel-content {
  box-sizing: border-box;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-block: auto;
  padding: clamp(0.55rem, 1.4vw, 0.9rem) var(--portfolio-panel-inline-pad, 0);
  scrollbar-width: thin;
}

.portfolio-panel--artworks .portfolio-panel-content,
.portfolio-panel--videos .portfolio-panel-content {
  overflow-y: visible;
  padding-top: clamp(0.35rem, 0.9vw, 0.58rem);
  padding-bottom: clamp(0.35rem, 0.9vw, 0.58rem);
}

.portfolio-panel--artworks .portfolio-panel-content,
.portfolio-panel--videos .portfolio-panel-content {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-inline: contain;
  padding-bottom: clamp(0.8rem, 1.2vw, 1rem);
  scrollbar-color: rgba(212, 161, 94, 0.86) rgba(4, 5, 7, 0.88);
  cursor: grab;
}

.portfolio-panel--videos .portfolio-panel-content {
  padding-bottom: clamp(0.42rem, 0.75vw, 0.62rem);
}

.portfolio-panel--artworks .portfolio-panel-content.is-media-scroll-dragging,
.portfolio-panel--videos .portfolio-panel-content.is-media-scroll-dragging {
  cursor: grabbing;
  user-select: none;
}

.portfolio-panel--artworks .portfolio-panel-content::-webkit-scrollbar,
.portfolio-panel--videos .portfolio-panel-content::-webkit-scrollbar {
  height: 0.78rem;
}

.portfolio-panel--artworks .portfolio-panel-content::-webkit-scrollbar-track,
.portfolio-panel--videos .portfolio-panel-content::-webkit-scrollbar-track {
  background: rgba(4, 5, 7, 0.88);
  border-top: 1px solid rgba(255, 220, 180, 0.08);
}

.portfolio-panel--artworks .portfolio-panel-content::-webkit-scrollbar-thumb,
.portfolio-panel--videos .portfolio-panel-content::-webkit-scrollbar-thumb {
  min-width: 4rem;
  border: 3px solid rgba(4, 5, 7, 0.88);
  border-radius: 999px;
  background: rgba(212, 161, 94, 0.86);
}

.portfolio-panel--artworks .portfolio-panel-content::-webkit-scrollbar-thumb:hover,
.portfolio-panel--videos .portfolio-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 220, 180, 0.92);
}

.portfolio-panel--artworks .portfolio-panel-content::-webkit-scrollbar-button,
.portfolio-panel--videos .portfolio-panel-content::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.artwork-strip {
  width: max-content;
  min-width: 100%;
  display: flex;
  gap: clamp(0.9rem, 1.8vw, 1.35rem);
}

.artwork-frame {
  flex: 0 0 clamp(18rem, 31vw, 24rem);
  margin: 0;
  display: grid;
  gap: 0;
}

.artwork-frame img,
.audio-track img {
  width: 100%;
  object-fit: cover;
  filter: saturate(0.92) contrast(1.05);
}

.artwork-frame img {
  aspect-ratio: 4 / 3;
  border: 1px solid rgba(255, 220, 180, 0.12);
}

.artwork-frame img,
.audio-track img {
  pointer-events: none;
}

:deep(.portfolio-caption-title-line) {
  --timescan-glyph-scale: 0.34;
  --timescan-overlay-font-size: 0.78rem;
  --timescan-overlay-line-height: 1.25;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 22px;
  --timescan-ink: rgba(255, 238, 220, 0.92);
  font-weight: 700;
}

.video-embed-grid {
  width: max-content;
  min-width: 100%;
  display: flex;
  gap: clamp(0.9rem, 1.8vw, 1.35rem);
}

.video-embed-slot {
  flex: 0 0 clamp(24rem, 42vw, 32rem);
  display: grid;
  grid-template-rows: auto min-content;
  align-content: start;
  row-gap: 0;
  min-width: 0;
  color: rgba(255, 225, 190, 0.74);
  text-decoration: none;
}

.video-embed-slot iframe,
.video-embed-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(255, 220, 180, 0.12);
  background: rgba(6, 7, 9, 0.92);
}

.video-embed-slot iframe {
  display: block;
}

.video-embed-placeholder {
  appearance: none;
  position: relative;
  display: block;
  overflow: hidden;
  padding: 0;
  background-position: center;
  background-size: cover;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.video-embed-placeholder:not(button) {
  cursor: default;
}

.video-embed-placeholder:focus-visible {
  outline: 2px solid rgba(255, 220, 180, 0.54);
  outline-offset: 3px;
}

.video-embed-placeholder::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 6, 8, 0.05), rgba(6, 6, 8, 0.7)),
    repeating-linear-gradient(90deg, rgba(255, 220, 180, 0.06) 0 1px, transparent 1px 9px);
}

.video-play-mark {
  position: absolute;
  inset: 50% auto auto 50%;
  z-index: 1;
  width: 2.55rem;
  height: 2.55rem;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(255, 229, 198, 0.72);
  border-radius: 50%;
  background: rgba(8, 8, 10, 0.46);
}

.video-play-mark::before {
  content: "";
  position: absolute;
  left: 0.98rem;
  top: 0.7rem;
  border-top: 0.58rem solid transparent;
  border-bottom: 0.58rem solid transparent;
  border-left: 0.82rem solid rgba(255, 229, 198, 0.9);
}

.portfolio-video-title-link {
  display: block;
  min-width: 0;
  margin-top: -0.16rem;
  color: rgba(255, 238, 220, 0.92);
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
}

.portfolio-panel--videos :deep(.portfolio-caption-title-line) {
  --timescan-overlay-line-height: 1.08;
  --timescan-min-height: 18px;
  --timescan-vertical-pad: 0;
}

.portfolio-panel--videos :deep(.portfolio-caption-title-line .sentence-strip-line) {
  height: 18px !important;
}

.portfolio-video-title-link:hover,
.portfolio-video-title-link:focus-visible {
  color: rgba(255, 238, 220, 0.92);
  outline: none;
}

.portfolio-video-title-link:hover + .video-play-mark,
.video-embed-slot:hover .video-play-mark,
.video-embed-slot:focus-within .video-play-mark {
  border-color: rgba(255, 229, 198, 0.95);
  background: rgba(8, 8, 10, 0.62);
}

.audio-showcase {
  display: grid;
  gap: 0.85rem;
}

.audio-player-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 0fr;
  border-top: 0 solid transparent;
  margin-top: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition:
    grid-template-rows 280ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 180ms ease,
    margin-top 280ms cubic-bezier(0.33, 1, 0.68, 1),
    border-top-color 280ms cubic-bezier(0.33, 1, 0.68, 1),
    border-top-width 280ms cubic-bezier(0.33, 1, 0.68, 1),
    visibility 0s linear 280ms;
  visibility: hidden;
  will-change: grid-template-rows, opacity;
}

.audio-player-shell.is-expanded {
  grid-template-rows: 1fr;
  border-top-color: rgba(255, 220, 180, 0.14);
  border-top-width: 1px;
  margin-top: 0.55rem;
  opacity: 1;
  pointer-events: auto;
  transition:
    grid-template-rows 280ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 180ms ease,
    margin-top 280ms cubic-bezier(0.33, 1, 0.68, 1),
    border-top-color 280ms cubic-bezier(0.33, 1, 0.68, 1),
    border-top-width 280ms cubic-bezier(0.33, 1, 0.68, 1),
    visibility 0s;
  visibility: visible;
}

.audio-player {
  min-height: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
  overflow: hidden;
  padding: 0 0.25rem;
  transition:
    padding-top 280ms cubic-bezier(0.33, 1, 0.68, 1),
    padding-bottom 280ms cubic-bezier(0.33, 1, 0.68, 1);
}

.audio-player-shell.is-expanded .audio-player {
  padding-top: 0.55rem;
  padding-bottom: 0.1rem;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.audio-icon-button {
  width: 2.15rem;
  height: 2.15rem;
  position: relative;
  border: 1px solid rgba(255, 220, 180, 0.32);
  border-radius: 50%;
  background: rgba(10, 11, 13, 0.52);
  color: rgba(255, 238, 220, 0.96);
  cursor: pointer;
}

.audio-icon-button:hover,
.audio-icon-button:focus-visible {
  border-color: rgba(255, 238, 220, 0.74);
}

.audio-icon-button:focus-visible {
  outline: 2px solid rgba(255, 220, 180, 0.3);
  outline-offset: 2px;
}

.audio-icon-button.play {
  width: 2.65rem;
  height: 2.65rem;
  border-color: rgba(255, 220, 180, 0.52);
}

.audio-icon-button.play::before {
  content: "";
  position: absolute;
  left: 1.02rem;
  top: 0.78rem;
  border-top: 0.52rem solid transparent;
  border-bottom: 0.52rem solid transparent;
  border-left: 0.78rem solid currentColor;
}

.audio-icon-button.play.is-playing::before,
.audio-icon-button.play.is-playing::after {
  content: "";
  position: absolute;
  top: 0.76rem;
  width: 0.25rem;
  height: 1.1rem;
  border: 0;
  background: currentColor;
}

.audio-icon-button.play.is-playing::before {
  left: 0.94rem;
}

.audio-icon-button.play.is-playing::after {
  left: 1.42rem;
}

.audio-icon-button.previous::before,
.audio-icon-button.next::before {
  content: "";
  position: absolute;
  top: 0.58rem;
  border-top: 0.48rem solid transparent;
  border-bottom: 0.48rem solid transparent;
}

.audio-icon-button.previous::before {
  left: 0.72rem;
  border-right: 0.72rem solid currentColor;
}

.audio-icon-button.next::before {
  left: 0.78rem;
  border-left: 0.72rem solid currentColor;
}

.audio-timeline {
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr) 2.4rem;
  gap: 0.55rem;
  align-items: center;
  color: rgba(255, 224, 190, 0.64);
  font-size: 0.72rem;
}

.audio-timeline input {
  width: 100%;
  accent-color: #d4a15e;
}

.audio-track-list {
  display: grid;
  gap: 0.65rem;
}

.audio-track-shell {
  min-width: 0;
  display: grid;
  gap: 0.5rem;
}

.audio-track {
  width: 100%;
  display: grid;
  gap: 0;
  border: 1px solid rgba(255, 220, 180, 0.1);
  padding: 0.5rem;
  background: rgba(10, 11, 13, 0.38);
  color: inherit;
  text-align: left;
}

.audio-track.is-active {
  border-color: rgba(255, 220, 180, 0.34);
  background: rgba(212, 161, 94, 0.08);
}

.audio-track:has(.audio-track-summary:hover),
.audio-track:has(.audio-track-summary:focus-visible) {
  border-color: rgba(255, 220, 180, 0.26);
}

.audio-track-summary {
  min-width: 0;
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  cursor: pointer;
}

.audio-track-summary:focus-visible {
  outline: 2px solid rgba(255, 220, 180, 0.3);
  outline-offset: 2px;
}

.audio-track-summary img {
  aspect-ratio: 1;
}

.audio-track-summary span {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
}

.audio-track-summary strong {
  overflow: hidden;
  color: rgba(255, 238, 220, 0.92);
  font-size: 0.9rem;
  line-height: 1.2;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-track-summary em {
  overflow: hidden;
  color: rgba(255, 224, 190, 0.64);
  font-size: 0.78rem;
  font-style: normal;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-track-summary > span,
.audio-track-summary small {
  pointer-events: none;
}

.portfolio-track-title-line {
  --timescan-glyph-scale: 0.36;
  --timescan-overlay-font-size: 0.88rem;
  --timescan-overlay-line-height: 1.24;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 24px;
  --timescan-ink: rgba(255, 238, 220, 0.92);
  font-weight: 700;
}

.audio-track-summary small {
  color: rgba(212, 161, 94, 0.78);
}

.portfolio-track-duration-line {
  --timescan-glyph-scale: 0.32;
  --timescan-overlay-font-size: 0.78rem;
  --timescan-overlay-line-height: 1.24;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 22px;
  --timescan-ink: rgba(212, 161, 94, 0.78);
}

@media (min-width: 960px) {
  .portfolio-showcase-list {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

@media (min-width: 1200px) {
  .portfolio-showcase-list {
    width: min(
      calc(100% - (var(--app-inline-pad, 0rem) * 2)),
      var(--portfolio-showcase-max-width)
    );
  }
}

@media (max-width: 900px) {
  .portfolio-panel {
    height: clamp(20rem, 58vh, 34rem);
  }

  .portfolio-panel--artworks,
  .portfolio-panel--videos {
    height: auto;
  }

  .portfolio-panel-header {
    min-height: 3.2rem;
  }
}

@media (max-width: 720px) {
  .artwork-strip,
  .video-embed-grid {
    grid-template-columns: 1fr;
  }

  .artwork-strip,
  .video-embed-grid {
    display: flex;
  }

  .audio-player {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.7rem;
  }

  .audio-controls {
    gap: 0.35rem;
  }
}

@media (max-width: 620px) {
  .portfolio-panel {
    height: auto;
    display: block;
    overflow-x: hidden;
    overflow-y: visible;
  }

  .portfolio-panel-header,
  .portfolio-panel-content {
    width: 100%;
    min-width: 0;
  }

  .portfolio-panel-content {
    overflow-y: visible;
    overscroll-behavior-block: auto;
  }

  .artwork-strip {
    display: flex;
  }

  .artwork-frame {
    flex-basis: min(78vw, 25rem);
  }

  .video-embed-grid {
    display: flex;
  }

  .video-embed-slot {
    flex-basis: min(86vw, 32rem);
  }
}

@media (max-width: 460px) {
  .portfolio-panel-header {
    min-height: 3rem;
  }

  .audio-player {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .audio-track-summary {
    grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .audio-player-shell,
  .audio-player-shell.is-expanded,
  .audio-player {
    transition: none;
  }
}
</style>
