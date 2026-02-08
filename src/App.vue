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
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateScrollEffect)
}

onMounted(() => {
  document.documentElement.style.setProperty("--sticky-on", "0")
  document.documentElement.style.setProperty("--sticky-pe", "none")
  updateScrollEffect()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll)

  // Toggle sticky nav when the hero-bottom nav leaves the top area.
  const anchor = navAnchorRef.value
  if (anchor) {

    const NAV_H = 64
io = new IntersectionObserver(([entry]) => {
  const on = entry.isIntersecting ? "0" : "1"
  document.documentElement.style.setProperty("--sticky-on", on)
  document.documentElement.style.setProperty("--sticky-pe", entry.isIntersecting ? "none" : "auto")
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
    <nav id="site-nav" class="nav nav-sticky">
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
      <nav class="nav nav-hero">
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
  --blur-pad: 120px;
  --blue-soft-opacity: 0.4;
  --blue-medium-opacity: 0.72;
  --blue-tube-opacity: 0.85;
  --blue-hue-rotate: 100deg;
  --blue-saturation: 100%;
  --blue-brightness: 89%;
  --slab-left: 6%;
  --slab-top: 16%;
  --slab-width: 88%;
  --slab-height: 60%;
  --slab-radius: 999px;
  --slab-transform: translate(-1%, 18%) scale(1.08, 1.2);
  --slab-fill-opacity: 0.58;
  --slab-frost-opacity: 0.22;
  --slab-blur: 30px;
  --slab-border-color: transparent;
  --slab-shadow: 0 0 80px rgba(0, 0, 0, 0.45);
  grid-row: 1;
  justify-self: start;
  align-self: end;
  display: block;
  position: relative;
  isolation: isolate;
  margin: 0;
  margin-left: calc(1.75rem - var(--blur-pad));
  margin-bottom: calc(3rem - var(--blur-pad));
  padding: var(--blur-pad);
  width: clamp(360px, 62vw, 1120px);
  max-width: calc(100% - 3.5rem - var(--blur-pad) - var(--blur-pad));
  box-sizing: content-box;
  overflow: visible;
  pointer-events: none;
}

.welcome-sign::before,
.welcome-sign::after {
  content: "";
  position: absolute;
  left: var(--slab-left);
  top: var(--slab-top);
  width: var(--slab-width);
  height: var(--slab-height);
  border-radius: var(--slab-radius);
  transform-origin: center;
  transform: var(--slab-transform);
  pointer-events: none;
}

.welcome-sign::before {
  z-index: 0;
  background:
    radial-gradient(120% 90% at 50% 45%, rgba(0, 0, 0, calc(var(--slab-fill-opacity) + var(--nav-alpha, 0) * 0.15)) 0%, rgba(0, 0, 0, calc(var(--slab-fill-opacity) * 0.78)) 55%, rgba(0, 0, 0, 0) 100%),
    radial-gradient(90% 70% at 22% 52%, rgba(0, 0, 0, calc(var(--slab-fill-opacity) * 0.45)) 0%, rgba(0, 0, 0, 0) 100%),
    radial-gradient(90% 70% at 78% 48%, rgba(0, 0, 0, calc(var(--slab-fill-opacity) * 0.45)) 0%, rgba(0, 0, 0, 0) 100%);
  border: 1px solid var(--slab-border-color);
  box-shadow: var(--slab-shadow);
  filter: blur(var(--slab-blur));
}

.welcome-sign::after {
  z-index: 0;
  background: radial-gradient(120% 100% at 50% 50%, rgba(0, 0, 0, var(--slab-frost-opacity)) 0%, rgba(0, 0, 0, calc(var(--slab-frost-opacity) * 0.55)) 46%, rgba(0, 0, 0, 0) 100%);
  filter: blur(calc(var(--slab-blur) + 10px));
}

.welcome-sign :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  transform-origin: left bottom;
  transform: translate(-6%, 15%) scale(0.8);
  position: relative;
  z-index: 1;
}

.welcome-sign :deep(#yellow-solid1) {
  filter: url("#yellow-soft-glow");
  opacity: 0.56;
}

.welcome-sign :deep(#yellow-solid2) {
  filter: url("#yellow-medium-glow");
  opacity: 0.92;
}

.welcome-sign :deep(#yellow-tube) {
  filter: none;
  opacity: 1;
}

.welcome-sign :deep(#blue-solid1) {
  filter: url("#blue-soft-glow") hue-rotate(var(--blue-hue-rotate)) saturate(var(--blue-saturation)) brightness(var(--blue-brightness));
  opacity: var(--blue-soft-opacity);
}

.welcome-sign :deep(#blue-solid2) {
  filter: url("#blue-medium-glow") hue-rotate(var(--blue-hue-rotate)) saturate(var(--blue-saturation)) brightness(var(--blue-brightness));
  opacity: var(--blue-medium-opacity);
}

.welcome-sign :deep(#blue-tube) {
  filter: hue-rotate(var(--blue-hue-rotate)) saturate(var(--blue-saturation)) brightness(var(--blue-brightness));
  opacity: var(--blue-tube-opacity);
}

.welcome-sign :deep(#blue-solid1),
.welcome-sign :deep(#blue-solid2),
.welcome-sign :deep(#blue-tube) {
  transform-box: fill-box;
  transform-origin: center;
  transform: translate(0.5%,-10%) scale(-1.05, 1);
}

.welcome-sign :deep(#yellow-solid1),
.welcome-sign :deep(#yellow-solid2),
.welcome-sign :deep(#yellow-tube) {
  transform-box: fill-box;
  transform-origin: center;
  transform: translate(2.4%,-14%) scale(1.2, 1.3);
}

@media (max-width: 900px) {
  .welcome-sign {
    width: min(94vw, 1120px);
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
