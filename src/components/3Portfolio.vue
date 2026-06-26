<script setup>
import { computed, ref } from "vue"
import {
  getTimescanGlyphOptions,
  getTimescanText,
  portfolioArtworkTextAssetKey,
  portfolioAudioTextAssetKey,
  portfolioContent,
  portfolioShowcaseTextAssetKey,
  portfolioTextAssetKey,
  portfolioVideoTextAssetKey,
} from "@/content/siteContent"
import heroPortfolio from "@/assets/img/toni-pykalaniemi-kb3d-cyberpunkcity-cmp-v019-0020.jpg"
import heroProjects from "@/assets/img/luis-carrasco-hotel-04.jpg"
import heroServices from "@/assets/img/services.jpg"
import { buildGlyphSequence } from "@/utils/glyphSequence"
import TimescanSentence from "./TimescanSentence.vue"
import TimescanText from "./TimescanText.vue"

const PORTFOLIO_VIEW_TRIGGER_DELAY_MS = 1100
const PORTFOLIO_VIEW_TRIGGER_THRESHOLD = 0.2
const PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN = "0px"

function buildTimescanTokens(assetKey) {
  return buildGlyphSequence(
    getTimescanText(assetKey),
    getTimescanGlyphOptions(assetKey),
  )
}

const portfolioHeadingTokens = computed(() =>
  buildTimescanTokens("portfolio.heading"),
)
const portfolioLeadTokens = computed(() => buildTimescanTokens("portfolio.lead"))
const expandedPanelIds = ref(new Set())
const activeAudioIndex = ref(0)
const audioRef = ref(null)
const audioProgress = ref(0)
const audioDuration = ref(0)
const isAudioPlaying = ref(false)

const showcaseImages = {
  portfolio: heroPortfolio,
  projects: heroProjects,
  services: heroServices,
}

const audioSamples = computed(() =>
  portfolioContent.showcases.find((panel) => panel.id === "audio")?.audioSamples || [],
)
const activeAudioTrack = computed(() => audioSamples.value[activeAudioIndex.value] || null)
const activeAudioDuration = computed(() =>
  audioDuration.value || activeAudioTrack.value?.durationSeconds || 1,
)

function isPanelExpanded(panelId) {
  return expandedPanelIds.value.has(panelId)
}

function togglePanel(panelId) {
  expandedPanelIds.value = expandedPanelIds.value.has(panelId)
    ? new Set()
    : new Set([panelId])
}

function imageForKey(imageKey) {
  return showcaseImages[imageKey] || heroPortfolio
}

function selectAudioTrack(index) {
  if (index < 0 || index >= audioSamples.value.length) return
  audioRef.value?.pause()
  activeAudioIndex.value = index
  audioProgress.value = 0
  audioDuration.value = 0
  isAudioPlaying.value = false
}

function skipAudioTrack(direction) {
  const count = audioSamples.value.length
  if (!count) return
  const nextIndex = (activeAudioIndex.value + direction + count) % count
  selectAudioTrack(nextIndex)
}

async function toggleAudioPlayback() {
  if (!activeAudioTrack.value) return
  const player = audioRef.value
  if (activeAudioTrack.value.src && player) {
    if (isAudioPlaying.value) {
      player.pause()
      isAudioPlaying.value = false
      return
    }
    try {
      await player.play()
      isAudioPlaying.value = true
    } catch {
      isAudioPlaying.value = false
    }
    return
  }
  isAudioPlaying.value = !isAudioPlaying.value
}

function updateAudioProgress(event) {
  const nextValue = Number(event.target?.value)
  audioProgress.value = Number.isFinite(nextValue)
    ? Math.max(0, Math.min(activeAudioDuration.value, nextValue))
    : 0
  if (audioRef.value && activeAudioTrack.value?.src) {
    audioRef.value.currentTime = audioProgress.value
  }
}

function syncAudioMetadata() {
  const player = audioRef.value
  audioDuration.value = Number.isFinite(player?.duration) && player.duration > 0
    ? player.duration
    : 0
}

function syncAudioProgress() {
  const player = audioRef.value
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
    <header class="page-hero">
      <h1 class="portfolio-timescan-heading">
        <TimescanSentence
          class="timescan-base timescan-h1 timescan-layout-center"
          :overlay-text="portfolioContent.heading"
          asset-key="portfolio.heading"
          :glyph-tokens="portfolioHeadingTokens"
          :glyph-scale="1.4"
          :auto-trigger-on-view="true"
          :view-trigger-threshold="PORTFOLIO_VIEW_TRIGGER_THRESHOLD"
          :view-trigger-root-margin="PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN"
          :view-trigger-delay-ms="PORTFOLIO_VIEW_TRIGGER_DELAY_MS"
          :show-button="false"
        />
      </h1>
      <TimescanSentence
        class="timescan-base timescan-h2 timescan-layout-center portfolio-timescan-lead"
        :overlay-text="portfolioContent.lead"
        asset-key="portfolio.lead"
        :glyph-tokens="portfolioLeadTokens"
        :auto-trigger-on-view="true"
        :view-trigger-threshold="PORTFOLIO_VIEW_TRIGGER_THRESHOLD"
        :view-trigger-root-margin="PORTFOLIO_VIEW_TRIGGER_ROOT_MARGIN"
        :view-trigger-delay-ms="PORTFOLIO_VIEW_TRIGGER_DELAY_MS"
        :show-button="false"
      />
      <div class="page-intro portfolio-intro-timescan">
        <TimescanText
          :text="portfolioContent.intro"
          :asset-key="portfolioTextAssetKey('intro')"
          sentence-class="timescan-base timescan-p timescan-layout-center portfolio-intro-line"
          :max-chars="38"
        />
      </div>
    </header>

    <section class="portfolio-showcase-list">
      <article
        v-for="panel in portfolioContent.showcases"
        :key="panel.id"
        class="portfolio-panel"
        :class="{ 'is-expanded': isPanelExpanded(panel.id) }"
      >
        <button
          class="portfolio-panel-trigger"
          type="button"
          :aria-expanded="isPanelExpanded(panel.id)"
          :aria-controls="`portfolio-panel-${panel.id}`"
          @click="togglePanel(panel.id)"
        >
          <span class="portfolio-panel-copy">
            <TimescanText
              class="content-card-kicker portfolio-panel-kicker"
              :text="panel.label"
              :asset-key="portfolioShowcaseTextAssetKey(panel.id, 'label')"
              sentence-class="timescan-base timescan-h6 timescan-layout-left portfolio-kicker-line"
              :max-chars="26"
            />
            <TimescanText
              class="portfolio-panel-title"
              :text="panel.title"
              :asset-key="portfolioShowcaseTextAssetKey(panel.id, 'title')"
              sentence-class="timescan-base timescan-h3 timescan-layout-left portfolio-panel-title-line"
              :max-chars="28"
            />
            <TimescanText
              class="portfolio-panel-body"
              :text="panel.body"
              :asset-key="portfolioShowcaseTextAssetKey(panel.id, 'body')"
              sentence-class="timescan-base timescan-p timescan-layout-left portfolio-panel-body-line"
              :max-chars="34"
            />
          </span>
          <span
            class="portfolio-panel-icon"
            aria-hidden="true"
          ></span>
        </button>

        <div
          v-show="isPanelExpanded(panel.id)"
          :id="`portfolio-panel-${panel.id}`"
          class="portfolio-panel-content"
        >
          <div
            v-if="panel.id === 'artworks'"
            class="artwork-strip"
          >
            <figure
              v-for="(artwork, artworkIndex) in panel.artworks"
              :key="artwork.title"
              class="artwork-frame"
            >
              <img
                :src="imageForKey(artwork.imageKey)"
                :alt="artwork.alt"
              />
              <figcaption>
                <TimescanText
                  :text="artwork.title"
                  :asset-key="portfolioArtworkTextAssetKey(panel.id, artworkIndex, 'title')"
                  sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-caption-title-line"
                  :max-chars="24"
                />
                <TimescanText
                  :text="artwork.year"
                  :asset-key="portfolioArtworkTextAssetKey(panel.id, artworkIndex, 'year')"
                  sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-caption-meta-line"
                  :max-chars="12"
                />
              </figcaption>
            </figure>
          </div>

          <div
            v-else-if="panel.id === 'videos'"
            class="video-embed-grid"
          >
            <div
              v-for="(video, videoIndex) in panel.videos"
              :key="video.title"
              class="video-embed-slot"
            >
              <iframe
                v-if="video.embedUrl"
                :src="video.embedUrl"
                :title="video.title"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
              <div
                v-else
                class="video-embed-placeholder"
                :style="{ backgroundImage: `url(${imageForKey(video.imageKey)})` }"
              >
                <span class="video-play-mark" aria-hidden="true"></span>
              </div>
              <div class="portfolio-media-caption">
                <TimescanText
                  :text="video.title"
                  :asset-key="portfolioVideoTextAssetKey(panel.id, videoIndex, 'title')"
                  sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-caption-title-line"
                  :max-chars="24"
                />
                <TimescanText
                  :text="video.meta"
                  :asset-key="portfolioVideoTextAssetKey(panel.id, videoIndex, 'meta')"
                  sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-caption-meta-line"
                  :max-chars="26"
                />
              </div>
            </div>
          </div>

          <div
            v-else-if="panel.id === 'audio'"
            class="audio-showcase"
          >
            <div
              v-if="activeAudioTrack"
              class="audio-player"
            >
              <audio
                ref="audioRef"
                :src="activeAudioTrack.src || undefined"
                preload="metadata"
                @loadedmetadata="syncAudioMetadata"
                @timeupdate="syncAudioProgress"
                @ended="finishAudioSample"
              ></audio>
              <img
                class="audio-cover"
                :src="imageForKey(activeAudioTrack.imageKey)"
                :alt="`${activeAudioTrack.title} cover`"
              />
              <div class="audio-main">
                <div class="audio-now-playing">
                  <TimescanText
                    :text="activeAudioTrack.meta"
                    :asset-key="portfolioAudioTextAssetKey(activeAudioIndex, 'meta')"
                    sentence-class="timescan-base timescan-h6 timescan-layout-left portfolio-audio-meta-line"
                    :max-chars="24"
                  />
                  <TimescanText
                    :text="activeAudioTrack.title"
                    :asset-key="portfolioAudioTextAssetKey(activeAudioIndex, 'title')"
                    sentence-class="timescan-base timescan-h3 timescan-layout-left portfolio-audio-title-line"
                    :max-chars="24"
                  />
                  <TimescanText
                    :text="activeAudioTrack.artist"
                    :asset-key="portfolioAudioTextAssetKey(activeAudioIndex, 'artist')"
                    sentence-class="timescan-base timescan-p timescan-layout-left portfolio-audio-artist-line"
                    :max-chars="20"
                  />
                </div>
                <div class="audio-controls">
                  <button
                    class="audio-icon-button previous"
                    type="button"
                    aria-label="Previous sample"
                    @click="skipAudioTrack(-1)"
                  ></button>
                  <button
                    class="audio-icon-button play"
                    :class="{ 'is-playing': isAudioPlaying }"
                    type="button"
                    :aria-label="isAudioPlaying ? 'Pause sample' : 'Play sample'"
                    @click="toggleAudioPlayback"
                  ></button>
                  <button
                    class="audio-icon-button next"
                    type="button"
                    aria-label="Next sample"
                    @click="skipAudioTrack(1)"
                  ></button>
                </div>
                <div class="audio-timeline">
                  <span>{{ formatAudioTime(audioProgress) }}</span>
                  <input
                    type="range"
                    min="0"
                    :max="activeAudioDuration"
                    :value="audioProgress"
                    aria-label="Sample position"
                    @input="updateAudioProgress"
                  />
                  <span>
                    <TimescanText
                      :text="activeAudioTrack.duration"
                      :asset-key="portfolioAudioTextAssetKey(activeAudioIndex, 'duration')"
                      sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-track-duration-line"
                      :max-chars="12"
                    />
                  </span>
                </div>
              </div>
            </div>

            <div class="audio-track-list">
              <button
                v-for="(track, index) in panel.audioSamples"
                :key="track.title"
                class="audio-track"
                :class="{ 'is-active': index === activeAudioIndex }"
                type="button"
                @click="selectAudioTrack(index)"
              >
                <img
                  :src="imageForKey(track.imageKey)"
                  :alt="`${track.title} thumbnail`"
                />
                <span>
                  <TimescanText
                    :text="track.title"
                    :asset-key="portfolioAudioTextAssetKey(index, 'title')"
                    sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-track-title-line"
                    :max-chars="24"
                  />
                  <TimescanText
                    :text="track.artist"
                    :asset-key="portfolioAudioTextAssetKey(index, 'artist')"
                    sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-track-artist-line"
                    :max-chars="20"
                  />
                </span>
                <small>
                  <TimescanText
                    :text="track.duration"
                    :asset-key="portfolioAudioTextAssetKey(index, 'duration')"
                    sentence-class="timescan-base timescan-caption timescan-layout-left portfolio-track-duration-line"
                    :max-chars="12"
                  />
                </small>
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.portfolio-page {
  --page-inline-pad: clamp(0.85rem, 3vw, 1.25rem);
  width: calc(100% + (var(--app-inline-pad, 0rem) * 2));
  margin-inline: calc(var(--app-inline-pad, 0rem) * -1);
  gap: 0;
  padding-inline: 0;
}

.portfolio-page .page-hero {
  padding: 2.4rem var(--page-inline-pad, 0) 2rem;
  border-bottom: 1px solid rgba(255, 220, 180, 0.18);
}

.portfolio-timescan-heading {
  margin: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.portfolio-timescan-lead {
  width: 100%;
}

.portfolio-intro-timescan {
  display: grid;
  justify-items: center;
  gap: 0.14rem;
}

.portfolio-intro-line {
  --timescan-glyph-scale: 0.48;
  --timescan-overlay-font-size: clamp(0.95rem, 2vw, 1.08rem);
  --timescan-overlay-line-height: 1.35;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 28px;
  --timescan-ink: rgba(255, 228, 196, 0.78);
}

.portfolio-showcase-list {
  width: 100%;
  display: grid;
  gap: 0;
}

.portfolio-panel {
  width: 100%;
  min-width: 0;
  overflow: visible;
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

.portfolio-panel-trigger {
  box-sizing: border-box;
  width: 100%;
  min-height: clamp(8.75rem, 16vw, 12rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.6rem;
  gap: clamp(1rem, 2.8vw, 2.8rem);
  align-items: center;
  border: 0;
  padding: clamp(1.25rem, 3vw, 2.2rem) var(--page-inline-pad, 0);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.portfolio-panel-trigger:focus-visible {
  outline: 2px solid rgba(255, 220, 180, 0.36);
  outline-offset: -4px;
}

.portfolio-panel-copy {
  display: grid;
  gap: 0.46rem;
}

.portfolio-panel-kicker {
  --timescan-text-gap: 0.08rem;
}

.portfolio-panel-title {
  color: rgba(255, 238, 220, 0.96);
  font-weight: 700;
}

.portfolio-panel-title-line {
  --timescan-overlay-font-size: clamp(1.05rem, 2vw, 1.32rem);
  --timescan-overlay-line-height: 1.18;
  --timescan-overlay-letter-spacing: 0;
  --timescan-min-height: 40px;
  --timescan-ink: rgba(255, 238, 220, 0.96);
  font-weight: 700;
}

.portfolio-panel-body {
  color: rgba(255, 224, 190, 0.76);
  --timescan-text-gap: 0.1rem;
}

.portfolio-panel-body-line {
  --timescan-glyph-scale: 0.38;
  --timescan-overlay-font-size: 0.95rem;
  --timescan-overlay-line-height: 1.35;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 28px;
  --timescan-ink: rgba(255, 224, 190, 0.76);
}

.portfolio-panel-icon {
  justify-self: end;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 237, 214, 0.9);
  opacity: 0.72;
  -webkit-mask: url("../assets/img/arrow-down-3101.svg") center / contain no-repeat;
  mask: url("../assets/img/arrow-down-3101.svg") center / contain no-repeat;
  transform: rotate(-90deg);
  transition: transform 170ms ease, opacity 170ms ease;
}

.portfolio-panel.is-expanded .portfolio-panel-icon {
  opacity: 0.95;
  transform: rotate(0deg);
}

.portfolio-panel-content {
  box-sizing: border-box;
  padding: 0 var(--page-inline-pad, 0) clamp(1rem, 2vw, 1.25rem);
}

.artwork-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.artwork-frame {
  min-width: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.artwork-frame img,
.audio-cover,
.audio-track img {
  width: 100%;
  object-fit: cover;
  filter: saturate(0.92) contrast(1.05);
}

.artwork-frame img {
  aspect-ratio: 4 / 3;
  border: 1px solid rgba(255, 220, 180, 0.12);
}

.artwork-frame figcaption,
.portfolio-media-caption {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: rgba(255, 225, 190, 0.74);
  font-size: 0.78rem;
  line-height: 1.25;
}

.artwork-frame figcaption > :first-child,
.portfolio-media-caption > :first-child {
  min-width: 0;
  color: rgba(255, 238, 220, 0.92);
  font-weight: 700;
}

.portfolio-caption-title-line {
  --timescan-glyph-scale: 0.34;
  --timescan-overlay-font-size: 0.78rem;
  --timescan-overlay-line-height: 1.25;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 22px;
  --timescan-ink: rgba(255, 238, 220, 0.92);
  font-weight: 700;
}

.portfolio-caption-meta-line {
  --timescan-glyph-scale: 0.34;
  --timescan-overlay-font-size: 0.78rem;
  --timescan-overlay-line-height: 1.25;
  --timescan-overlay-letter-spacing: 0.02em;
  --timescan-min-height: 22px;
  --timescan-ink: rgba(212, 161, 94, 0.84);
}

.video-embed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.video-embed-slot {
  display: grid;
  gap: 0.55rem;
}

.video-embed-slot iframe,
.video-embed-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(255, 220, 180, 0.12);
}

.video-embed-slot iframe {
  display: block;
}

.video-embed-placeholder {
  position: relative;
  overflow: hidden;
  background-position: center;
  background-size: cover;
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
  width: 3.1rem;
  height: 3.1rem;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(255, 229, 198, 0.72);
  border-radius: 50%;
  background: rgba(8, 8, 10, 0.46);
}

.video-play-mark::before {
  content: "";
  position: absolute;
  left: 1.18rem;
  top: 0.86rem;
  border-top: 0.7rem solid transparent;
  border-bottom: 0.7rem solid transparent;
  border-left: 1rem solid rgba(255, 229, 198, 0.9);
}

.portfolio-media-caption {
  align-items: baseline;
}

.portfolio-media-caption > :last-child {
  color: rgba(212, 161, 94, 0.84);
  text-align: right;
}

.audio-showcase {
  display: grid;
  gap: 0.85rem;
}

.audio-player {
  display: grid;
  grid-template-columns: minmax(5.5rem, 7rem) minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  border: 1px solid rgba(255, 220, 180, 0.12);
  padding: 0.75rem;
}

.audio-cover {
  aspect-ratio: 1;
}

.audio-main {
  min-width: 0;
  display: grid;
  gap: 0.68rem;
}

.audio-now-playing {
  min-width: 0;
  display: grid;
  gap: 0.12rem;
}

.portfolio-audio-meta-line {
  --timescan-glyph-scale: 0.4;
  --timescan-overlay-font-size: 0.68rem;
  --timescan-overlay-line-height: 1.2;
  --timescan-overlay-letter-spacing: 0.13em;
  --timescan-min-height: 20px;
  --timescan-ink: rgba(212, 161, 94, 0.88);
  text-transform: uppercase;
}

.portfolio-audio-title-line {
  --timescan-glyph-scale: 0.46;
  --timescan-overlay-font-size: 1.05rem;
  --timescan-overlay-line-height: 1.18;
  --timescan-overlay-letter-spacing: 0;
  --timescan-min-height: 34px;
  --timescan-ink: rgba(255, 238, 220, 0.96);
  font-weight: 700;
}

.portfolio-audio-artist-line,
.portfolio-track-artist-line {
  --timescan-glyph-scale: 0.34;
  --timescan-overlay-font-size: 0.78rem;
  --timescan-overlay-line-height: 1.24;
  --timescan-overlay-letter-spacing: 0.01em;
  --timescan-min-height: 22px;
  --timescan-ink: rgba(255, 224, 190, 0.64);
  font-style: normal;
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
  gap: 0.5rem;
}

.audio-track {
  width: 100%;
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid rgba(255, 220, 180, 0.1);
  padding: 0.5rem;
  background: rgba(10, 11, 13, 0.38);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.audio-track.is-active {
  border-color: rgba(255, 220, 180, 0.34);
  background: rgba(212, 161, 94, 0.08);
}

.audio-track img {
  aspect-ratio: 1;
}

.audio-track span {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
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

.audio-track small {
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

  .portfolio-panel.is-expanded {
    grid-column: auto;
  }
}

@media (max-width: 900px) {
  .portfolio-panel-trigger {
    min-height: 7.8rem;
    grid-template-columns: minmax(0, 1fr) 2.2rem;
  }
}

@media (max-width: 720px) {
  .portfolio-page .page-hero {
    padding-top: 1.45rem;
    padding-bottom: 1.45rem;
  }

  .artwork-strip,
  .video-embed-grid {
    grid-template-columns: 1fr;
  }

  .audio-player {
    grid-template-columns: 4.6rem minmax(0, 1fr);
    gap: 0.7rem;
  }

  .audio-controls {
    gap: 0.35rem;
  }
}

@media (max-width: 620px) {
  .portfolio-panel {
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: thin;
  }

  .portfolio-panel-trigger,
  .portfolio-panel-content {
    min-width: 620px;
  }

  .artwork-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .video-embed-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .portfolio-panel-trigger {
    min-height: 6.8rem;
  }

  .portfolio-panel-body {
    font-size: 0.88rem;
  }

  .audio-player {
    grid-template-columns: minmax(5.5rem, 7rem) minmax(0, 1fr);
  }

  .audio-cover {
    width: 100%;
  }

  .audio-track {
    grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  }
}
</style>
