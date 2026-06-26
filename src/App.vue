<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
import heroHome from "./assets/img/barlite.png"
import heroServices from "./assets/img/services.jpg"
import heroPortfolio from "./assets/img/toni-pykalaniemi-kb3d-cyberpunkcity-cmp-v019-0020.jpg"
import heroContact from "./assets/img/neil-ross-west-kayro-mezzotint.jpg"
import heroProjects from "./assets/img/luis-carrasco-hotel-04.jpg"

const barliteRef = ref(null)
const navAnchorRef = ref(null)
const route = useRoute()
const routeTransitionName = ref("route-slide-left")

const HERO_FADE_DURATION_MS = 700
const NAV_SCROLL_DURATION_MS = 2000
const NAV_SCROLL_VIEWPORT_TOP_PAD_PX = 64
const NAV_SCROLL_ANCHOR_EPSILON_PX = 2
const NAV_SCROLL_MIN_DISTANCE_PX = 4
const NAV_SCROLL_CANCEL_EVENTS = ["wheel", "touchmove", "pointerdown", "keydown"]
const PASSIVE_EVENT_LISTENER_OPTIONS = { passive: true }
const ROUTE_TRANSITION_CLASS_CLEANUP_MS = 420
const ROUTE_TRANSITION_CLASSES = [
  "route-slide-left-enter-active",
  "route-slide-left-enter-from",
  "route-slide-left-enter-to",
  "route-slide-left-leave-active",
  "route-slide-left-leave-from",
  "route-slide-left-leave-to",
  "route-slide-right-enter-active",
  "route-slide-right-enter-from",
  "route-slide-right-enter-to",
  "route-slide-right-leave-active",
  "route-slide-right-leave-from",
  "route-slide-right-leave-to",
]
const ROUTE_HERO_URLS = {
  "/": heroHome,
  "/services": heroServices,
  "/portfolio": heroPortfolio,
  "/contact": heroContact,
  "/projects": heroProjects,
}
const ROUTE_THEME_KEYS = {
  "/": "home",
  "/services": "services",
  "/portfolio": "portfolio",
  "/contact": "contact",
  "/projects": "projects",
}

let rafId = 0
let scrollEffectEnabled = false
let heroFadeTimeoutId = 0
let navSmoothScrollRafId = 0
let navSmoothScrollCancelListenersActive = false
let routeTransitionCleanupIds = []

function isInSection(path, sectionPath) {
  if (typeof path !== "string") return false
  return path === sectionPath || path.startsWith(`${sectionPath}/`)
}

function normalizeRoutePath(path) {
  if (typeof path !== "string") return "/"
  if (isInSection(path, "/services")) return "/services"
  if (isInSection(path, "/portfolio")) return "/portfolio"
  if (isInSection(path, "/contact")) return "/contact"
  if (isInSection(path, "/projects")) return "/projects"
  return "/"
}

const baseHeroUrl = ref(ROUTE_HERO_URLS[normalizeRoutePath(route.path)] || heroHome)
const overlayHeroUrl = ref("")
const heroOverlayActive = ref(false)

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
    const toIndex = routeOrder[normalizeRoutePath(toPath)] ?? 0
    const fromIndex = routeOrder[normalizeRoutePath(fromPath)] ?? 0
    if (toIndex === fromIndex) return
    routeTransitionName.value = toIndex < fromIndex ? "route-slide-right" : "route-slide-left"
  },
)

function heroUrlForPath(path) {
  return ROUTE_HERO_URLS[normalizeRoutePath(path)] || heroHome
}

function transitionHeroForPath(path) {
  const nextHeroUrl = heroUrlForPath(path)
  if (nextHeroUrl === baseHeroUrl.value) {
    return
  }

  window.clearTimeout(heroFadeTimeoutId)
  overlayHeroUrl.value = nextHeroUrl
  heroOverlayActive.value = false

  requestAnimationFrame(() => {
    heroOverlayActive.value = true
  })

  heroFadeTimeoutId = window.setTimeout(() => {
    baseHeroUrl.value = nextHeroUrl
    overlayHeroUrl.value = ""
    heroOverlayActive.value = false
    heroFadeTimeoutId = 0
  }, HERO_FADE_DURATION_MS)
}

function applyRouteTheme(path) {
  const themeKey = ROUTE_THEME_KEYS[normalizeRoutePath(path)] || "home"
  document.documentElement.setAttribute("data-route-theme", themeKey)
}

watch(
  () => route.path,
  (toPath) => {
    transitionHeroForPath(toPath)
    applyRouteTheme(toPath)
  },
  { immediate: true },
)

function routeViewKey(path) {
  return normalizeRoutePath(path)
}

function cleanupRouteTransitionClasses(el) {
  if (!(el instanceof Element)) return
  el.classList.remove(...ROUTE_TRANSITION_CLASSES)
}

function scheduleRouteTransitionClassCleanup(el) {
  const cleanupId = window.setTimeout(() => {
    routeTransitionCleanupIds = routeTransitionCleanupIds.filter((id) => id !== cleanupId)
    cleanupRouteTransitionClasses(el)
  }, ROUTE_TRANSITION_CLASS_CLEANUP_MS)
  routeTransitionCleanupIds.push(cleanupId)
}

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
  }
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateScrollEffect)
}

function stopNavSmoothScrollAnimation() {
  if (navSmoothScrollRafId) cancelAnimationFrame(navSmoothScrollRafId)
  navSmoothScrollRafId = 0
  removeNavSmoothScrollCancelListeners()
}

function addNavSmoothScrollCancelListeners() {
  if (navSmoothScrollCancelListenersActive) return
  NAV_SCROLL_CANCEL_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, stopNavSmoothScrollAnimation, PASSIVE_EVENT_LISTENER_OPTIONS)
  })
  navSmoothScrollCancelListenersActive = true
}

function removeNavSmoothScrollCancelListeners() {
  if (!navSmoothScrollCancelListenersActive) return
  NAV_SCROLL_CANCEL_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, stopNavSmoothScrollAnimation, PASSIVE_EVENT_LISTENER_OPTIONS)
  })
  navSmoothScrollCancelListenersActive = false
}

function isAtOrBelowNavAnchor(selector = ".nav-anchor") {
  const anchor = document.querySelector(selector)
  if (!anchor) return false

  const anchorDocY = anchor.getBoundingClientRect().top + window.scrollY
  const gateLineDocY = window.scrollY + NAV_SCROLL_VIEWPORT_TOP_PAD_PX
  return gateLineDocY >= anchorDocY - NAV_SCROLL_ANCHOR_EPSILON_PX
}

function smoothScrollToElement(selector, duration = NAV_SCROLL_DURATION_MS, offset = 0) {
  const el = document.querySelector(selector)
  if (!el) return

  stopNavSmoothScrollAnimation()

  const start = window.scrollY
  const rawEnd = el.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_VIEWPORT_TOP_PAD_PX - offset
  const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const end = Math.max(0, Math.min(rawEnd, maxTop))
  if (end <= start) return

  const distance = end - start
  if (distance < NAV_SCROLL_MIN_DISTANCE_PX) return
  let startTime = null
  addNavSmoothScrollCancelListeners()

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function scroll(currentTime) {
    if (startTime === null) startTime = currentTime
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = easeInOutQuad(progress)
    window.scrollTo(0, start + distance * ease)
    if (progress < 1) {
      navSmoothScrollRafId = requestAnimationFrame(scroll)
      return
    }
    navSmoothScrollRafId = 0
    removeNavSmoothScrollCancelListeners()
  }

  navSmoothScrollRafId = requestAnimationFrame(scroll)
}

function pathFromNavLink(linkEl) {
  try {
    return new URL(linkEl.href, window.location.origin).pathname
  } catch {
    return ""
  }
}

function triggerHeroScrollIfAboveAnchor() {
  if (isAtOrBelowNavAnchor()) return
  requestAnimationFrame(() => {
    if (isAtOrBelowNavAnchor()) return
    smoothScrollToElement(".nav-anchor", NAV_SCROLL_DURATION_MS, 0)
  })
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
  const navLink = event.target.closest(".nav-link")
  if (!(navLink instanceof HTMLAnchorElement)) return

  const targetPath = pathFromNavLink(navLink)
  const isSameSectionSelection =
    normalizeRoutePath(targetPath) === normalizeRoutePath(route.path)
  if (isSameSectionSelection) {
    triggerHeroScrollIfAboveAnchor()
  }

  if (scrollEffectEnabled) return
  scrollEffectEnabled = true
  onScroll()
}

onMounted(() => {
  scrollEffectEnabled = false
  resetReloadScrollPosition()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  window.removeEventListener("resize", onScroll)
  cancelAnimationFrame(rafId)
  stopNavSmoothScrollAnimation()
  routeTransitionCleanupIds.forEach((id) => window.clearTimeout(id))
  routeTransitionCleanupIds = []
  window.clearTimeout(heroFadeTimeoutId)
})
</script>

<template>
  <div class="app">
    <header
      ref="barliteRef"
      class="barlite"
    >
      <div class="hero-bg-stack" aria-hidden="true">
        <div
          class="hero-bg hero-bg-base"
          :style="{ '--hero-url': `url(${baseHeroUrl})` }"
        ></div>
        <div
          v-if="overlayHeroUrl"
          class="hero-bg hero-bg-overlay"
          :class="{ 'hero-bg-overlay-active': heroOverlayActive }"
          :style="{ '--hero-url': `url(${overlayHeroUrl})` }"
        ></div>
        <div class="hero-dim"></div>
      </div>

    </header>

    <nav id="site-nav" class="nav nav-hero" @click.capture="onNavClick">
      <div class="nav-inner">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/services" class="nav-link">Services</RouterLink>
        <RouterLink to="/portfolio" class="nav-link">Portfolio</RouterLink>
        <RouterLink to="/contact" class="nav-link">
          Contact
        </RouterLink>
        <RouterLink to="/projects" class="nav-link">Projects</RouterLink>
      </div>
    </nav>

    <div
      id="scroll-effect-anchor"
      ref="navAnchorRef"
      class="nav-anchor"
      aria-hidden="true"
    ></div>

    <main class="content">
      <div id="content-top" aria-hidden="true"></div>
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition
          :name="routeTransitionName"
          mode="out-in"
          @before-enter="scheduleRouteTransitionClassCleanup"
          @after-enter="cleanupRouteTransitionClasses"
          @enter-cancelled="cleanupRouteTransitionClasses"
          @after-leave="cleanupRouteTransitionClasses"
          @leave-cancelled="cleanupRouteTransitionClasses"
        >
          <component :is="Component" :key="routeViewKey(currentRoute.path)" />
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
  height: calc(100vh - var(--nav-h));
  min-height: 620px;
  position: relative;
  overflow: visible;
  display: grid;
  grid-template-rows: 1fr;
}
@supports (height: 100dvh) {
  .barlite {
    height: calc(100dvh - var(--nav-h));
  }
}

.hero-bg-stack {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image: var(--hero-url);
  background-size: cover;
  background-position: center;
  filter: blur(var(--barlite-blur, 0px));
  transform: translateY(calc(var(--barlite-y, 0px) * -1 + 50px)) scale(1.12);
}

.hero-bg-base {
  z-index: 1;
}

.hero-bg-overlay {
  z-index: 2;
  opacity: 0;
  transition: opacity 700ms ease;
}

.hero-bg-overlay-active {
  opacity: 1;
}

.hero-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--barlite-dim, 0.2));
  z-index: 3;
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
  --nav-gap: clamp(0.65rem, 4vw, 2.6rem);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--nav-inner-pad, 1.75rem);
  display: flex;
  gap: var(--nav-gap);
  justify-content: center;
  align-items: center;    
}
.nav-link {
  flex: 0 0 auto;
  position: relative;
  opacity: 0.7;
  padding-bottom: 0.2rem;
  text-decoration: none;
  white-space: nowrap;
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

/* Bottom-of-hero nav, then sticky in normal document flow */
.nav-hero{
  position: sticky;
  top: 0;
  margin: 0;
  z-index: 40;
}

:global(:root) {
  --nav-inner-pad: 1.75rem;
  --nav-h: 64px;

  --home-colour: #d4a15e;
  --services-colour: #73d4ff;
  --portfolio-colour: #ff9a63;
  --contact-colour: #d4a15e;
  --projects-colour: #b6a2ff;

  --route-colour: var(--home-colour);
}
:global(:root[data-route-theme="home"]) {
  --route-colour: var(--home-colour);
}
:global(:root[data-route-theme="services"]) {
  --route-colour: var(--services-colour);
}
:global(:root[data-route-theme="portfolio"]) {
  --route-colour: var(--portfolio-colour);
}
:global(:root[data-route-theme="contact"]) {
  --route-colour: var(--contact-colour);
}
:global(:root[data-route-theme="projects"]) {
  --route-colour: var(--projects-colour);
}

/* Scroll target sits below the sticky nav, so content starts clear of it. */
.nav-anchor {
  height: 1px;
  pointer-events: none;
}

@media (max-width: 640px) {
  .nav-inner {
    --nav-inner-pad: 0.65rem;
    --nav-gap: clamp(0.84rem, 4.62vw, 1.28rem);
    justify-content: center;
    font-size: clamp(0.72rem, 2.8vw, 0.94rem);
  }
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

@media (max-width: 620px) {
  .content {
    overflow-x: hidden;
    overflow-x: clip;
  }

  .content :deep(.route-slide-left-enter-from),
  .content :deep(.route-slide-right-leave-to),
  .content :deep(.route-slide-left-leave-to),
  .content :deep(.route-slide-right-enter-from) {
    transform: none;
  }
}

</style>
