import { contentStorage } from "./contentStorage.js"

const imageModules = import.meta.glob(
  "../assets/img/**/*.{gif,jpeg,jpg,png,webp}",
  {
    eager: true,
    import: "default",
  },
)

export const mediaContent = contentStorage.media

function normalizedImagePath(src) {
  const path = String(src || "").trim().replace(/\\/g, "/")
  if (!path) return ""
  if (path.startsWith("../assets/img/")) return path
  if (path.startsWith("@/assets/img/")) {
    return path.replace("@/assets/img/", "../assets/img/")
  }
  if (path.startsWith("src/assets/img/")) {
    return path.replace("src/assets/img/", "../assets/img/")
  }
  return path
}

function imageEntryForKey(imageKey) {
  const images = mediaContent?.images || {}
  const key = String(imageKey || "")
  return images[key] || images[mediaContent?.fallbackImageKey] || null
}

export function imageForKey(imageKey) {
  const entry = imageEntryForKey(imageKey)
  const src = normalizedImagePath(entry?.src)
  return imageModules[src] || ""
}

export function imageAltForKey(imageKey) {
  return imageEntryForKey(imageKey)?.alt || ""
}

export function routeHeroUrlForPath(path) {
  const routePath = String(path || "/")
  const routeHeroKeys = mediaContent?.routeHeroKeys || {}
  return imageForKey(routeHeroKeys[routePath])
}
