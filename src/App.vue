<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { RouterLink, RouterView } from "vue-router"
import barlite from "./assets/img/barlite.png"

const barliteRef = ref(null)
const navAnchorRef = ref(null)

let rafId = 0
let io = null

const clamp01 = (v) => Math.min(1, Math.max(0, v))

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
      <div class="barlite-inner">
        <div class="barlite-card">
          <p>Studio etc etc</p>
        </div>
      </div>

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
      <RouterView />
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
  overflow: hidden;
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

.barlite-inner{
  grid-row: 1;
  align-self: end;
  padding: 0 1.75rem 3rem; 
}

.barlite-card {
  width: min(720px, 100%);
  background: rgba(10, 11, 13, 0.68);
  border: 1px solid rgba(255, 200, 140, 0.10);
  border-radius: 18px;

  padding: 2.2rem;
  backdrop-filter: blur(10px);
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
  position: relative; 
  left: auto;
  right: auto;
  bottom: auto;
  margin: 0;
}

/* Sticky nav that takes over */
.nav-sticky {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
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
.sticky-spacer {
  height: var(--nav-h);
}
</style>
