<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
import barlite from "./assets/img/barlite.png"
import welcomeSignMarkup from "./assets/img/welcomesign2.svg?raw"

const barliteRef = ref(null)
const navAnchorRef = ref(null)
const welcomeSignRef = ref(null)
const route = useRoute()
const routeTransitionName = ref("route-slide-left")

const NEON_FLICKER_DURATION_MS = 1800
const ENABLE_NEON_FLICKER = false

let rafId = 0
let io = null
let scrollEffectEnabled = false
let anchorIsIntersecting = true
let neonFlickerTimeoutId = 0

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const routeOrder = {
  "/": 0,
  "/services": 1,
  "/portfolio": 2,
  "/contact": 3,
  "/projects": 4,
}

watch(
  () => route.path,
  (toPath, fromPath) => {
    const toIndex = routeOrder[toPath] ?? 0
    const fromIndex = routeOrder[fromPath] ?? 0
    routeTransitionName.value = toIndex < fromIndex ? "route-slide-right" : "route-slide-left"
  },
)

function updateScrollEffect() {
  const el = barliteRef.value
  if (!el) return

  const h = el.offsetHeight || window.innerHeight
  const y = window.scrollY || 0

  const cutoff = 0.85
  const progress = clamp01(y / h)
  const p = Math.min(progress, cutoff)

  const blurPx = p * 18
  const dim = 0.15 + p * 0.55


  const navAlpha = clamp01((progress - 0.15) / 0.35)

  const parallax_speed = 0.12
  const parallax_limit = 100
  const parallax = Math.min(y * parallax_speed, parallax_limit)

  document.documentElement.style.setProperty("--barlite-y", `${parallax}px`)
  document.documentElement.style.setProperty("--barlite-blur", `${blurPx}px`)
  document.documentElement.style.setProperty("--barlite-dim", `${dim}`)
  document.documentElement.style.setProperty("--nav-alpha", `${navAlpha}`)
}

function onScroll() {
  if (!scrollEffectEnabled) {
    if ((window.scrollY || 0) <= 0) return
    scrollEffectEnabled = true
    applyStickyState()
  }
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateScrollEffect)
}

function applyStickyState() {
  const stickyActive = scrollEffectEnabled && !anchorIsIntersecting
  document.documentElement.style.setProperty("--sticky-on", stickyActive ? "1" : "0")
  document.documentElement.style.setProperty("--sticky-pe", stickyActive ? "auto" : "none")
}

function resetReloadScrollPosition() {
  const navEntries = typeof performance.getEntriesByType === "function"
    ? performance.getEntriesByType("navigation")
    : []
  const navEntry = navEntries.length > 0 ? navEntries[0] : null
  const legacyReload = performance.navigation?.type === 1
  if (navEntry?.type !== "reload" && !legacyReload) return
  if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  })
}

function onNavClick(event) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest(".nav-link")) return
  if (ENABLE_NEON_FLICKER) triggerNeonFlicker()
  if (scrollEffectEnabled) return
  scrollEffectEnabled = true
  applyStickyState()
  onScroll()
}

function triggerNeonFlicker() {
  const sign = welcomeSignRef.value
  if (!sign) return

  sign.classList.remove("is-flickering")
  // Force reflow so the CSS animation restarts on repeated clicks.
  void sign.offsetWidth
  sign.classList.add("is-flickering")

  window.clearTimeout(neonFlickerTimeoutId)
  neonFlickerTimeoutId = window.setTimeout(() => {
    sign.classList.remove("is-flickering")
    neonFlickerTimeoutId = 0
  }, NEON_FLICKER_DURATION_MS)
}

onMounted(() => {
  scrollEffectEnabled = false
  anchorIsIntersecting = true
  welcomeSignRef.value?.classList.remove("is-flickering")
  applyStickyState()
  resetReloadScrollPosition()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll)

  // Toggle sticky nav when the hero-bottom nav leaves the top area.
  const anchor = navAnchorRef.value
  if (anchor) {

    const NAV_H = 64
io = new IntersectionObserver(([entry]) => {
  anchorIsIntersecting = entry.isIntersecting
  applyStickyState()
}, {
  threshold: 0,
  rootMargin: `-${NAV_H}px 0px 0px 0px`
})
    io.observe(anchor)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  window.removeEventListener("resize", onScroll)
  cancelAnimationFrame(rafId)
  window.clearTimeout(neonFlickerTimeoutId)
  if (io) io.disconnect()
})
</script>

<template>
  <div class="app">
    <!-- Sticky nav (hidden until hero nav scrolls away) -->
    <nav id="site-nav" class="nav nav-sticky" @click.capture="onNavClick">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/services" class="nav-link">Services</RouterLink>
        <RouterLink to="/portfolio" class="nav-link">Portfolio</RouterLink>
        <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
        <RouterLink to="/projects" class="nav-link">Projects</RouterLink>
      </div>
    </nav>

    <header
      ref="barliteRef"
      class="barlite"
      :style="{ '--barlite-url': `url(${barlite})` }"
    >
      <figure
        ref="welcomeSignRef"
        class="welcome-sign"
        role="img"
        aria-label="Welcome neon sign"
        v-html="welcomeSignMarkup"
      ></figure>

      <!-- Invisible anchor zone (just a sensor) -->
      <div ref="navAnchorRef" class="nav-anchor" aria-hidden="true"></div>

      <!-- Hero-bottom nav -->
      <nav class="nav nav-hero" @click.capture="onNavClick">
        <div class="nav-inner">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/services" class="nav-link">Services</RouterLink>
          <RouterLink to="/portfolio" class="nav-link">Portfolio</RouterLink>
          <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
          <RouterLink to="/projects" class="nav-link">Projects</RouterLink>
        </div>
      </nav>
    </header>

    <main class="content">
        <div id="content-top" aria-hidden="true"></div>
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition :name="routeTransitionName" mode="out-in">
          <component :is="Component" :key="currentRoute.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
#content-top {
  height: 0;
}
.barlite{
  height: calc(100vh-var(--nav-h));
  min-height: 620px;
  position: relative;
  overflow: visible;
  display: grid;
  grid-template-rows: 1fr auto; /* content then nav */
}
@supports (height: 100dvh) {
  .barlite {
    height: calc(100dvh - var(--nav-h));
  }
}

.barlite::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: var(--barlite-url);
  background-size: cover;
  background-position: center;
  filter: blur(var(--barlite-blur, 0px));
  transform: translateY(calc(var(--barlite-y, 0px) * -1 + 50px)) scale(1.12);
  z-index: -2;
}

.barlite::after {
  content: "";
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, var(--barlite-dim, 0.2));
  z-index: -1;
}
.welcome-sign {
  display: flex;
  justify-content: center;
  align-items: center;
  grid-row: 1;
  justify-self: start;
  align-self: end;
  width: clamp(280px, 45vw, 600px);
  margin: 0 0rem 0rem;
  padding: 0.75rem 1rem;
  padding-left: clamp(0.45rem, 1.4vw, 1rem);
  position: relative;
  pointer-events: none;
  isolation: isolate;
}

.welcome-sign::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  transform: translate(-5%,0) scale(1.6,1.6);

  filter:blur(40px);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4);
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  animation: slab-fade-in 1500ms ease-out 250ms both;
}

.welcome-sign :deep(svg) {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
  transform: translate(-5%,23%) scale(1.1,1.1);
  opacity: 0;
  animation: sign-fade-in 2000ms ease-out 1700ms both;
}
.welcome-sign :deep(#yellow-solid1),
.welcome-sign :deep(#blue-solid1) {
  filter: blur(36px);
  opacity: 0.3;
}
.welcome-sign :deep(#yellow-solid2),
.welcome-sign :deep(#blue-solid2) {
  filter: blur(10.5px);
    opacity: 0.7;
}
.welcome-sign :deep(#yellow-tube),
.welcome-sign :deep(#blue-tube){
  filter: brightness(90%);
}
.welcome-sign :deep(#blue-solid2),
.welcome-sign :deep(#blue-solid1),
.welcome-sign :deep(#blue-tube){
    transform: translate(-6.7%,-15%);
}

.welcome-sign.is-flickering :deep(#blue-tube) {
  animation: neon-flicker-high 1800ms linear both;
}

.welcome-sign.is-flickering :deep(#blue-solid2),
.welcome-sign.is-flickering :deep(#blue-medium-glow) {
  animation: neon-flicker-mid 1800ms linear both;
}

.welcome-sign.is-flickering :deep(#blue-solid1),
.welcome-sign.is-flickering :deep(#blue-soft-glow) {
  animation: neon-flicker-low 1800ms linear both;
}

.welcome-sign.is-flickering :deep(#yellow-flicker-a),
.welcome-sign.is-flickering :deep(#yellow-flicker-b) {
  animation: neon-flicker-high 1800ms linear both;
}

.welcome-sign.is-flickering :deep(#yellow-flicker-c) {
  animation: neon-flicker-mid 1800ms linear both;
}

.welcome-sign.is-flickering :deep(#yellow-flicker-d) {
  animation: neon-flicker-low 1800ms linear both;
}

@keyframes slab-fade-in {
  from {
    opacity: 0;
    transform: translate(-5%, 6%) scale(1.45, 1.45);
  }
  to {
    opacity: 1;
    transform: translate(-5%, 0) scale(1.6, 1.6);
  }
}

@keyframes sign-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes neon-flicker-high {
  0% { opacity: 1; }
  9% { opacity: 0.08; }
  12% { opacity: 1; }
  18% { opacity: 0.3; }
  24% { opacity: 1; }
  32% { opacity: 0.1; }
  34% { opacity: 1; }
  47% { opacity: 0.15; }
  49% { opacity: 1; }
  63% { opacity: 0.35; }
  66% { opacity: 1; }
  74% { opacity: 0.2; }
  77% { opacity: 1; }
  88% { opacity: 0.45; }
  90% { opacity: 1; }
  100% { opacity: 1; }
}

@keyframes neon-flicker-mid {
  0% { opacity: 0.7; }
  9% { opacity: 0.04; }
  12% { opacity: 0.7; }
  18% { opacity: 0.2; }
  24% { opacity: 0.7; }
  32% { opacity: 0.08; }
  34% { opacity: 0.7; }
  47% { opacity: 0.12; }
  49% { opacity: 0.7; }
  63% { opacity: 0.22; }
  66% { opacity: 0.7; }
  74% { opacity: 0.14; }
  77% { opacity: 0.7; }
  88% { opacity: 0.3; }
  90% { opacity: 0.7; }
  100% { opacity: 0.7; }
}

@keyframes neon-flicker-low {
  0% { opacity: 0.3; }
  9% { opacity: 0.02; }
  12% { opacity: 0.3; }
  18% { opacity: 0.1; }
  24% { opacity: 0.3; }
  32% { opacity: 0.03; }
  34% { opacity: 0.3; }
  47% { opacity: 0.07; }
  49% { opacity: 0.3; }
  63% { opacity: 0.12; }
  66% { opacity: 0.3; }
  74% { opacity: 0.08; }
  77% { opacity: 0.3; }
  88% { opacity: 0.2; }
  90% { opacity: 0.3; }
  100% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-sign::before,
  .welcome-sign :deep(svg),
  .welcome-sign.is-flickering :deep(#blue-tube),
  .welcome-sign.is-flickering :deep(#blue-solid2),
  .welcome-sign.is-flickering :deep(#blue-medium-glow),
  .welcome-sign.is-flickering :deep(#blue-solid1),
  .welcome-sign.is-flickering :deep(#blue-soft-glow),
  .welcome-sign.is-flickering :deep(#yellow-flicker-a),
  .welcome-sign.is-flickering :deep(#yellow-flicker-b),
  .welcome-sign.is-flickering :deep(#yellow-flicker-c),
  .welcome-sign.is-flickering :deep(#yellow-flicker-d) {
    animation: none !important;
    opacity: 1;
  }
}
/* Shared nav look */
.nav {
  height: var(--nav-h);
  padding: 0;             
  display: flex;
  align-items: center;        /* vertical centering */
  backdrop-filter: blur(14px);
  background: rgba(10, 11, 13, calc(0.35 + var(--nav-alpha, 0) * 0.35));
  border-top: 1px solid rgba(255, 200, 140, 0.10);
}
.nav-inner{
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.75rem;
  display: flex;
  gap: 2.6rem;
  justify-content: center;
  align-items: center;    
}
.nav-link {
  position: relative;
  opacity: 0.7;
  padding-bottom: 0.2rem;
  text-decoration: none;
  transition: opacity 150ms ease, color 150ms ease;
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.24rem;
  height: 2px;
  border-radius: 999px;
  background: var(--accent, #d4a15e);
  transform: scaleX(0);
  transform-origin: var(--underline-origin-x, 50%) 50%;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-inner .nav-link:nth-child(1) { --underline-origin-x: 0%; }
.nav-inner .nav-link:nth-child(3) { --underline-origin-x: 50%; }
.nav-inner .nav-link:nth-child(5) { --underline-origin-x: 100%; }

.nav-link:hover {
  opacity: 1;
}

.nav-link:hover::after,
.nav-link:focus-visible::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
}

.nav-link.router-link-active {
  opacity: 1;
  color: var(--accent, #d4a15e);
}

/* Bottom-of-hero nav */
.nav-hero{
  grid-row: 2;
  position: relative;   /* stop using absolute */
  left: auto;
  right: auto;
  bottom: auto;
  margin: 0;
}

/* Sticky nav that takes over */
.nav-sticky {
  position: sticky;
  top: 0;
  width: 100%;
  margin: 0;
  z-index: 40;

  opacity: var(--sticky-on, 0);
  pointer-events: var(--sticky-pe, none);
  transition: none;
}

/* When sticky is active, allow clicks */
:global(:root) { --sticky-on: 0; --sticky-pe: none; --nav-h: 64px; }
.nav-sticky {
  pointer-events: var(--sticky-pe, none);
}

/* The anchor sits just below the hero nav line */
.nav-anchor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.content :deep(.route-slide-left-enter-active),
.content :deep(.route-slide-left-leave-active),
.content :deep(.route-slide-right-enter-active),
.content :deep(.route-slide-right-leave-active) {
  transition: opacity 280ms ease, transform 280ms ease;
}

.content :deep(.route-slide-left-enter-from),
.content :deep(.route-slide-right-leave-to) {
  opacity: 0;
  transform: translateX(30px);
}

.content :deep(.route-slide-left-leave-to),
.content :deep(.route-slide-right-enter-from) {
  opacity: 0;
  transform: translateX(-30px);
}

</style>
