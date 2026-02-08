import { createRouter, createWebHistory } from "vue-router"
import Home from "./components/1Home.vue"
import Services from "./components/2Services.vue"
import Portfolio from "./components/3Portfolio.vue"
import Contact from "./components/4Contact.vue"
import Projects from "./components/5Projects.vue"

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/services", name: "Services", component: Services },
  { path: "/portfolio", name: "Portfolio", component: Portfolio },
  { path: "/contact", name: "Contact", component: Contact },
  { path: "/projects", name: "Projects", component: Projects },
]

function smoothScrollToElement(selector, duration = 800) {
  const el = document.querySelector(selector)
  if (!el) return

  const start = window.scrollY
  const end = el.getBoundingClientRect().top + window.scrollY
  const distance = end - start
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
    if (progress < 1) requestAnimationFrame(scroll)
  }

  requestAnimationFrame(scroll)
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
    if (savedPosition) return savedPosition
    const isInitialNavigation = from.matched.length === 0
    if (isInitialNavigation && isReloadNavigation()) return { left: 0, top: 0 }
    if (isInitialNavigation) return { left: 0, top: 0 }

    requestAnimationFrame(() => smoothScrollToElement("#content-top", 1500))
    return false
  },
})
