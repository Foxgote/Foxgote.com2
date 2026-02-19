import { createRouter, createWebHistory } from "vue-router"

const VIEWPORT_TOP_PAD_PX = 64
const ANCHOR_GATE_EPSILON_PX = 2
const MIN_SCROLL_DISTANCE_PX = 4

let smoothScrollRafId = 0

function isInSection(path, sectionPath) {
  if (typeof path !== "string") return false
  return path === sectionPath || path.startsWith(`${sectionPath}/`)
}

function getRouteSectionPath(path) {
  if (typeof path !== "string") return "/"
  if (isInSection(path, "/services")) return "/services"
  if (isInSection(path, "/portfolio")) return "/portfolio"
  if (isInSection(path, "/contact")) return "/contact"
  if (isInSection(path, "/projects")) return "/projects"
  return "/"
}

const routes = [
  { path: "/", name: "Home", component: () => import("./components/1Home.vue") },
  {
    path: "/services",
    name: "Services",
    component: () => import("./components/2Services.vue"),
    children: [
      {
        path: "studio-rental",
        name: "ServiceStudioRental",
        component: () => import("./components/services/ServiceStudioRentalPanel.vue"),
      },
      {
        path: "music-teaching",
        name: "ServiceMusicTeaching",
        component: () => import("./components/services/ServiceMusicTeachingPanel.vue"),
      },
      {
        path: "other-services",
        name: "ServiceOtherServices",
        component: () => import("./components/services/ServiceOtherServicesPanel.vue"),
      },
    ],
  },
  { path: "/portfolio", name: "Portfolio", component: () => import("./components/3Portfolio.vue") },
  { path: "/contact", name: "Contact", component: () => import("./components/4Contact.vue") },
  { path: "/projects", name: "Projects", component: () => import("./components/5Projects.vue") },
]

function stopSmoothScrollAnimation() {
  if (!smoothScrollRafId) return
  cancelAnimationFrame(smoothScrollRafId)
  smoothScrollRafId = 0
}

function isAtOrBelowNavAnchor(selector = ".nav-anchor") {
  const anchor = document.querySelector(selector)
  if (!anchor) return false

  const anchorDocY = anchor.getBoundingClientRect().top + window.scrollY
  const gateLineDocY = window.scrollY + VIEWPORT_TOP_PAD_PX
  return gateLineDocY >= anchorDocY - ANCHOR_GATE_EPSILON_PX
}

function smoothScrollToElement(selector, duration = 800, offset = 0) {
  const el = document.querySelector(selector)
  if (!el) return

  stopSmoothScrollAnimation()

  const start = window.scrollY
  const rawEnd = el.getBoundingClientRect().top + window.scrollY - VIEWPORT_TOP_PAD_PX - offset
  const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const end = Math.max(0, Math.min(rawEnd, maxTop))
  if (end <= start) return

  const distance = end - start
  if (distance < MIN_SCROLL_DISTANCE_PX) return
  let startTime = null

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
      smoothScrollRafId = requestAnimationFrame(scroll)
      return
    }
    smoothScrollRafId = 0
  }

  smoothScrollRafId = requestAnimationFrame(scroll)
}

function isReloadNavigation() {
  const navEntries =
    typeof performance.getEntriesByType === "function"
      ? performance.getEntriesByType("navigation")
      : []
  const navEntry = navEntries.length ? navEntries[0] : null
  const legacyReload = performance.navigation?.type === 1
  return navEntry?.type === "reload" || legacyReload
}

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    const toSectionPath = getRouteSectionPath(to.path)
    const fromSectionPath = getRouteSectionPath(from.path)

    if (savedPosition) return savedPosition
    const isInitialNavigation = from.matched.length === 0
    if (isInitialNavigation && isReloadNavigation()) return { left: 0, top: 0 }
    if (isInitialNavigation) return { left: 0, top: 0 }

    // Keep scroll stable when opening/closing nested panels inside a section.
    if (toSectionPath === fromSectionPath) {
      stopSmoothScrollAnimation()
      return false
    }

    // Do not trigger smooth hero scroll when we're already at/below the hero nav anchor.
    if (isAtOrBelowNavAnchor()) {
      stopSmoothScrollAnimation()
      return false
    }

    requestAnimationFrame(() => {
      if (isAtOrBelowNavAnchor()) return
      smoothScrollToElement(".welcome-sign", 2000, -178)
    })
    return false
  },
})
