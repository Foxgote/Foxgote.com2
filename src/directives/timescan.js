import { createApp, h, ref } from "vue"
import TimescanSentence from "@/components/TimescanSentence.vue"
import glyphPool from "@/glyphPool/pool.gen"

function hashString32(input) {
  let hash = 2166136261
  const str = String(input || "")
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickPhrase(text) {
  const phrases = Array.isArray(glyphPool?.phrases) ? glyphPool.phrases : []
  if (!phrases.length) {
    return null
  }
  const seed = hashString32(`${glyphPool?.seed ?? "seed"}:${text}`)
  return phrases[seed % phrases.length]
}

function resolveTokens(text) {
  const phrase = pickPhrase(text)
  return Array.isArray(phrase?.glyphs) ? phrase.glyphs : []
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

function parseTrigger(binding) {
  if (binding?.modifiers?.hover) return "hover"
  if (binding?.modifiers?.intersect) return "intersect"
  if (binding?.modifiers?.click) return "click"
  return binding?.value?.trigger || "click"
}

function buildAppState(el, binding) {
  const overlayText = getTextFromBinding(el, binding)
  const tokens = resolveTokens(overlayText)
  const overlayRef = ref(overlayText)
  const tokensRef = ref(tokens)
  const widthRef = ref(0)

  const options = typeof binding?.value === "object" ? binding.value : {}
  const framed = Boolean(options?.framed)
  const showButton = Boolean(options?.showButton)
  const buttonLabel = options?.label || "Trigger Sentence Timescan"
  const emptyMessage = options?.emptyMessage || ""

  const app = createApp({
    render() {
      return h(TimescanSentence, {
        overlayText: overlayRef.value,
        glyphTokens: tokensRef.value,
        containerWidth: widthRef.value,
        framed,
        showButton,
        buttonLabel,
        emptyMessage,
      })
    },
  })

  el.innerHTML = ""
  const instance = app.mount(el)

  const trigger = () => {
    if (typeof instance?.trigger === "function") {
      instance.trigger()
    }
  }

  return {
    app,
    instance,
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
  }
}

function attachTriggers(el, state) {
  if (!state) return
  const handlers = {}

  if (state.triggerMode === "hover") {
    handlers.mouseenter = () => state.trigger()
    el.addEventListener("mouseenter", handlers.mouseenter)
  } else if (state.triggerMode === "click") {
    handlers.click = () => state.trigger()
    el.addEventListener("click", handlers.click)
  }

  let intersectionObserver = null
  if (state.triggerMode === "intersect") {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            state.trigger()
          }
        })
      },
      { threshold: 0.2 },
    )
    intersectionObserver.observe(el)
  }

  return { handlers, intersectionObserver }
}

function attachResizeObserver(el, state) {
  if (!state) return null
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
  if (state.intersectionObserver) {
    state.intersectionObserver.disconnect()
  }
  if (state.resizeObserver) {
    state.resizeObserver.disconnect()
  }
  if (state.app) {
    state.app.unmount()
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
    state.resizeObserver = resizeObserver

    el.__timescanState = state
    el.__timescanTrigger = state.trigger
  },
  updated(el, binding) {
    const state = el.__timescanState
    if (!state) {
      return
    }

    const newText = getTextFromValue(binding)
    if (newText && newText !== state.overlayRef.value) {
      state.overlayRef.value = newText
      state.tokensRef.value = resolveTokens(newText)
    }
  },
  beforeUnmount(el) {
    cleanup(el)
  },
}
