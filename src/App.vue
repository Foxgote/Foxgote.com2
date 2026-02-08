<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
import barlite from "./assets/img/barlite.png"
import welcomeSignMarkup from "./assets/img/welcomesign2.svg?raw"

const barliteRef = ref(null)
const navAnchorRef = ref(null)
const route = useRoute()
const routeTransitionName = ref("route-slide-left")

let rafId = 0
let io = null
let scrollEffectEnabled = false
let anchorIsIntersecting = true

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
  if (!scrollEffectEnabled) return
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
  if (scrollEffectEnabled) return
  scrollEffectEnabled = true
  applyStickyState()
  onScroll()
}

onMounted(() => {
  scrollEffectEnabled = false
  anchorIsIntersecting = true
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
        <div id="sticky-spacer" aria-hidden="true"></div>
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
  margin: 0 1rem 2rem;
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
}

.welcome-sign :deep(svg) {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
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
.welcome-sign :deep(#blue-tube){
  filter: brightness(90%);
}
.welcome-sign :deep(#blue-solid2),
.welcome-sign :deep(#blue-solid1),
.welcome-sign :deep(#blue-tube){
    transform: translate(-6.7%,-15%);
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
  gap: 1.7rem;
  justify-content: center;
  align-items: center;    
}
.nav-link {
  opacity: 0.7;
  transition: opacity 150ms ease, color 150ms ease;
}

.nav-link:hover {
  opacity: 1;
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

.sticky-spacer {
  height: var(--nav-h);
}
</style>
