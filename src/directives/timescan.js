import { createApp, h, nextTick, ref } from "vue"
import TimescanSentence from "@/components/TimescanSentence.vue"

let glyphPoolCache = null
let glyphPoolLoadPromise = null

function hashString32(input) {
  let hash = 2166136261
  const str = String(input || "")
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickPhrase(text, pool, minGlyphs = 1) {
  const phrases = Array.isArray(pool?.phrases) ? pool.phrases : []
  if (!phrases.length) {
    return null
  }
  const seed = hashString32(`${pool?.seed ?? "seed"}:${text}`)
  const startIndex = seed % phrases.length
  const minimumGlyphs = Math.max(1, Math.floor(Number(minGlyphs) || 1))

  if (minimumGlyphs <= 1) {
    return phrases[startIndex]
  }

  for (let offset = 0; offset < phrases.length; offset++) {
    const candidate = phrases[(startIndex + offset) % phrases.length]
    const glyphCount = Array.isArray(candidate?.glyphs) ? candidate.glyphs.length : 0
    if (glyphCount >= minimumGlyphs) {
      return candidate
    }
  }

  return phrases[startIndex]
}

function resolveTokensFromPool(text, pool, minGlyphs = 1) {
  const phrase = pickPhrase(text, pool, minGlyphs)
  return Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
}

async function loadGlyphPool() {
  if (glyphPoolCache) {
    return glyphPoolCache
  }
  if (!glyphPoolLoadPromise) {
    glyphPoolLoadPromise = import("@/glyphPool/pool.gen")
      .then((module) => {
        glyphPoolCache = module?.default ?? module?.glyphPool ?? null
        return glyphPoolCache
      })
      .catch((error) => {
        glyphPoolLoadPromise = null
        throw error
      })
  }
  return glyphPoolLoadPromise
}

async function resolveTokens(text, options = {}) {
  try {
    const pool = await loadGlyphPool()
    return resolveTokensFromPool(text, pool, options?.minGlyphs)
  } catch {
    return []
  }
}

function getTextFromBinding(el, binding) {
  const value = binding?.value
  if (typeof value === "string") {
    return value.trim()
  }
  const provided = value?.text
  if (typeof provided === "string") {
    return provided.trim()
  }
  return String(el.textContent || "").trim()
}

function getTextFromValue(binding) {
  const value = binding?.value
  if (typeof value === "string") {
    return value.trim()
  }
  const provided = value?.text
  if (typeof provided === "string") {
    return provided.trim()
  }
  return ""
}

function hasTextValue(binding) {
  const value = binding?.value
  if (typeof value === "string") {
    return true
  }
  return typeof value?.text === "string"
}

function parseTrigger(binding) {
  if (binding?.modifiers?.hover) return "hover"
  if (binding?.modifiers?.intersect) return "intersect"
  if (binding?.modifiers?.click) return "click"
  return binding?.value?.trigger || "click"
}

function parseIntersectionOptions(binding) {
  const rawThreshold = Number(binding?.value?.threshold)
  const threshold = Number.isFinite(rawThreshold)
    ? Math.min(1, Math.max(0, rawThreshold))
    : 0.01
  const rootMargin =
    typeof binding?.value?.rootMargin === "string"
      ? binding.value.rootMargin
      : "0px"
  return { threshold, rootMargin }
}

function parseTriggerDelayMs(binding) {
  const raw = binding?.value?.delayMs ?? binding?.value?.delay
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, parsed)
}

function ensureOverlayHost(el) {
  const mountHost = document.createElement("span")
  mountHost.setAttribute("data-timescan-overlay", "true")
  mountHost.setAttribute("aria-hidden", "true")
  mountHost.style.position = "absolute"
  mountHost.style.inset = "0"
  mountHost.style.display = "block"
  mountHost.style.width = "100%"
  mountHost.style.height = "100%"
  mountHost.style.pointerEvents = "none"
  mountHost.style.overflow = "visible"
  mountHost.style.zIndex = "1"

  const computedPosition = window.getComputedStyle(el).position
  const restorePosition = computedPosition === "static" ? el.style.position : null
  if (computedPosition === "static") {
    el.style.position = "relative"
  }

  el.appendChild(mountHost)
  return { mountHost, restorePosition }
}

function viewportVisibilityRatio(el) {
  const rect = el.getBoundingClientRect()
  const viewportHeight =
    window.innerHeight || document.documentElement?.clientHeight || 0
  const viewportWidth =
    window.innerWidth || document.documentElement?.clientWidth || 0

  if (viewportHeight <= 0 || viewportWidth <= 0) {
    return 0
  }

  const visibleHeight =
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
  const visibleWidth =
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)

  if (visibleHeight <= 0 || visibleWidth <= 0) {
    return 0
  }

  const elementArea = Math.max(1, rect.height * rect.width)
  const visibleArea = visibleHeight * visibleWidth
  return Math.max(0, Math.min(1, visibleArea / elementArea))
}

function buildAppState(el, binding) {
  const overlayText = getTextFromBinding(el, binding)
  const overlayRef = ref(overlayText)
  const tokensRef = ref([])
  const widthRef = ref(0)
  const triggerKeyRef = ref(0)
  const { mountHost, restorePosition } = ensureOverlayHost(el)

  const options = typeof binding?.value === "object" ? binding.value : {}
  const framed = Boolean(options?.framed)
  const showButton = Boolean(options?.showButton)
  const buttonLabel = options?.label || "Trigger Sentence Timescan"
  const emptyMessage = options?.emptyMessage || ""
  const triggerDelayMs = parseTriggerDelayMs(binding)
  const tokenMinGlyphs = Math.max(1, Math.floor(Number(options?.minGlyphs) || 1))

  const app = createApp({
    render() {
      return h(TimescanSentence, {
        overlayText: overlayRef.value,
        glyphTokens: tokensRef.value,
        containerWidth: widthRef.value,
        triggerKey: triggerKeyRef.value,
        framed,
        showButton,
        buttonLabel,
        emptyMessage,
      })
    },
  })

  const instance = app.mount(mountHost)

  let tokenResolveRunId = 0
  let destroyed = false
  let pendingTrigger = false

  const triggerNow = () => {
    triggerKeyRef.value += 1
  }

  const trigger = () => {
    if (!tokensRef.value.length) {
      pendingTrigger = true
      return
    }
    pendingTrigger = false
    triggerNow()
  }

  const clearPendingTrigger = () => {
    pendingTrigger = false
  }

  const resolveTokensForText = async (text) => {
    const runId = ++tokenResolveRunId
    const tokens = await resolveTokens(text, { minGlyphs: tokenMinGlyphs })
    if (destroyed || runId !== tokenResolveRunId) {
      return
    }
    tokensRef.value = tokens
    if (pendingTrigger && tokens.length) {
      pendingTrigger = false
      const scheduledRunId = runId
      nextTick(() => {
        if (destroyed || scheduledRunId !== tokenResolveRunId) {
          return
        }
        triggerNow()
      })
    }
  }

  const markDestroyed = () => {
    destroyed = true
    tokenResolveRunId++
  }

  resolveTokensForText(overlayText)

  return {
    app,
    instance,
    binding,
    overlayRef,
    tokensRef,
    widthRef,
    trigger,
    sourceText: overlayText,
    framed,
    showButton,
    buttonLabel,
    emptyMessage,
    triggerMode: parseTrigger(binding),
    triggerDelayMs,
    tokenMinGlyphs,
    mountHost,
    restorePosition,
    resolveTokensForText,
    clearPendingTrigger,
    markDestroyed,
  }
}

function attachTriggers(el, state) {
  if (!state) return
  const handlers = {}
  let delayedTriggerId = 0

  const runWithOptionalDelay = () => {
    if (delayedTriggerId) {
      window.clearTimeout(delayedTriggerId)
      delayedTriggerId = 0
    }

    if (state.triggerDelayMs > 0) {
      delayedTriggerId = window.setTimeout(() => {
        delayedTriggerId = 0
        state.trigger()
      }, state.triggerDelayMs)
      return
    }

    state.trigger()
  }

  if (state.triggerMode === "hover") {
    handlers.mouseenter = () => runWithOptionalDelay()
    el.addEventListener("mouseenter", handlers.mouseenter)
  } else if (state.triggerMode === "click") {
    handlers.click = () => runWithOptionalDelay()
    el.addEventListener("click", handlers.click)
  }

  let intersectionObserver = null
  if (state.triggerMode === "intersect") {
    const { threshold, rootMargin } = parseIntersectionOptions(state.binding)
    let hasIntersectTriggered = false
    const requiredVisibleRatio = threshold > 0 ? threshold : 0.001

    const maybeTriggerIntersect = () => {
      if (hasIntersectTriggered) return
      if (viewportVisibilityRatio(el) < requiredVisibleRatio) return
      hasIntersectTriggered = true
      runWithOptionalDelay()
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasIntersectTriggered) return
          hasIntersectTriggered = true
          runWithOptionalDelay()
        })
      },
      { threshold, rootMargin },
    )
    intersectionObserver.observe(el)

    requestAnimationFrame(() => {
      maybeTriggerIntersect()
    })

    handlers.windowScroll = () => maybeTriggerIntersect()
    handlers.windowResize = () => maybeTriggerIntersect()
    window.addEventListener("scroll", handlers.windowScroll, { passive: true })
    window.addEventListener("resize", handlers.windowResize)
  }

  return { handlers, intersectionObserver, clearDelayedTrigger: () => {
    if (delayedTriggerId) {
      window.clearTimeout(delayedTriggerId)
      delayedTriggerId = 0
    }
  } }
}

function attachResizeObserver(el, state) {
  if (!state) return null
  state.widthRef.value = Math.max(0, Math.round(el.getBoundingClientRect().width))

  if (typeof ResizeObserver !== "function") {
    return null
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const width = Math.max(0, Math.round(entry.contentRect.width))
    state.widthRef.value = width
  })
  observer.observe(el)
  return observer
}

function cleanup(el) {
  const state = el.__timescanState
  if (!state) return

  if (state.handlers?.mouseenter) {
    el.removeEventListener("mouseenter", state.handlers.mouseenter)
  }
  if (state.handlers?.click) {
    el.removeEventListener("click", state.handlers.click)
  }
  if (state.handlers?.windowScroll) {
    window.removeEventListener("scroll", state.handlers.windowScroll)
  }
  if (state.handlers?.windowResize) {
    window.removeEventListener("resize", state.handlers.windowResize)
  }
  if (state.intersectionObserver) {
    state.intersectionObserver.disconnect()
  }
  if (state.clearDelayedTrigger) {
    state.clearDelayedTrigger()
  }
  if (state.resizeObserver) {
    state.resizeObserver.disconnect()
  }
  if (state.markDestroyed) {
    state.markDestroyed()
  }
  if (state.app) {
    state.app.unmount()
  }
  if (state.mountHost?.parentNode === el) {
    state.mountHost.remove()
  }
  if (state.restorePosition !== null) {
    el.style.position = state.restorePosition
  }

  delete el.__timescanState
  delete el.__timescanTrigger
}

export default {
  mounted(el, binding) {
    const text = getTextFromBinding(el, binding)
    if (!text) {
      return
    }

    const state = buildAppState(el, binding)
    const triggers = attachTriggers(el, state)
    const resizeObserver = attachResizeObserver(el, state)

    state.handlers = triggers?.handlers
    state.intersectionObserver = triggers?.intersectionObserver
    state.clearDelayedTrigger = triggers?.clearDelayedTrigger
    state.resizeObserver = resizeObserver

    el.__timescanState = state
    el.__timescanTrigger = state.trigger
  },
  updated(el, binding) {
    const state = el.__timescanState
    if (!state) {
      return
    }

    if (!hasTextValue(binding)) {
      return
    }

    const newText = getTextFromValue(binding)
    if (newText !== state.overlayRef.value) {
      state.overlayRef.value = newText
      state.resolveTokensForText?.(newText)
    }
  },
  beforeUnmount(el) {
    cleanup(el)
  },
}
