import { computed, onBeforeUnmount, ref, watch } from "vue"

const DEFAULTS = {
  glyphHeight: 52,
  glyphGapPx: 3,
  glyphsPerSecond: 36,
  flickerSteps: 9,
  effectDurationMs: 200,
  precomputedFrames: 15,
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function unwrapGlyphTokens(input) {
  if (!input) return []
  const value = Array.isArray(input?.value) ? input.value : input
  return Array.isArray(value) ? value : []
}

export function useTimescanSentence(options = {}) {
  const config = { ...DEFAULTS, ...options }
  const glyphTokens = computed(() => unwrapGlyphTokens(config.glyphTokens))
  const containerWidth = computed(() => {
    const value =
      typeof config.containerWidth === "object"
        ? config.containerWidth?.value
        : config.containerWidth
    return toNumber(value, 0)
  })

  const sentenceFlickerVariants = ref([])
  const sentenceFlickerActiveLayer = ref([])
  const sentenceFlickerVisible = ref([])
  const sentenceConsumedHidden = ref([])
  const sentenceOverlayRevealPx = ref(0)

  let sentenceTimescanRunId = 0
  let sentenceTimescanRafId = 0
  let sentenceTimescanStartTimestamp = 0

  function glyphRenderSize(entry, targetHeight) {
    const width = toNumber(entry?.width, 1)
    const height = Math.max(1, toNumber(entry?.height, 1))
    const renderHeight = Math.max(16, Math.round(targetHeight))
    const renderWidth = Math.max(12, Math.round((width / height) * renderHeight))

    return { renderWidth, renderHeight }
  }

  const baseSlotWidthsPx = computed(() =>
    glyphTokens.value.map(
      (entry) => glyphRenderSize(entry, config.glyphHeight).renderWidth,
    ),
  )

  const baseScanTotalWidthPx = computed(() => {
    if (!baseSlotWidthsPx.value.length) {
      return 0
    }
    const glyphWidths = baseSlotWidthsPx.value.reduce((sum, width) => sum + width, 0)
    const gapWidths =
      Math.max(0, baseSlotWidthsPx.value.length - 1) * config.glyphGapPx
    return glyphWidths + gapWidths
  })

  const glyphScale = computed(() => {
    if (!containerWidth.value || !baseScanTotalWidthPx.value) {
      return 1
    }
    return containerWidth.value / baseScanTotalWidthPx.value
  })

  const effectiveGlyphHeight = computed(() =>
    Math.max(12, config.glyphHeight * glyphScale.value),
  )

  const effectiveGapPx = computed(() =>
    Math.max(1, config.glyphGapPx * glyphScale.value),
  )

  function sentenceGlyphStyle(entry) {
    const { renderWidth, renderHeight } = glyphRenderSize(
      entry,
      effectiveGlyphHeight.value,
    )
    return {
      width: `${renderWidth}px`,
      height: `${renderHeight}px`,
    }
  }

  function sentenceGlyphMaskStyle(entry, file) {
    const maskUrl = `url("${file}")`
    return {
      ...sentenceGlyphStyle(entry),
      maskImage: maskUrl,
      WebkitMaskImage: maskUrl,
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center center",
      WebkitMaskPosition: "center center",
      maskSize: "contain",
      WebkitMaskSize: "contain",
    }
  }

  const sentenceSlotWidthsPx = computed(() =>
    glyphTokens.value.map(
      (entry) => glyphRenderSize(entry, effectiveGlyphHeight.value).renderWidth,
    ),
  )

  const sentenceScanTotalWidthPx = computed(() => {
    if (!sentenceSlotWidthsPx.value.length) {
      return 0
    }
    const glyphWidths = sentenceSlotWidthsPx.value.reduce((sum, width) => sum + width, 0)
    const gapWidths =
      Math.max(0, sentenceSlotWidthsPx.value.length - 1) * effectiveGapPx.value
    return glyphWidths + gapWidths
  })

  const sentenceRevealWidthsByIndexPx = computed(() => {
    const revealWidths = []
    let consumedWidth = 0

    sentenceSlotWidthsPx.value.forEach((width, index) => {
      consumedWidth += width
      revealWidths.push(consumedWidth + index * effectiveGapPx.value)
    })

    return revealWidths
  })

  const sentenceStageStyle = computed(() => ({
    width: `${Math.max(1, sentenceScanTotalWidthPx.value)}px`,
  }))

  const sentenceOverlayRevealStyle = computed(() => {
    const clippedWidth = Math.max(
      0,
      Math.min(sentenceOverlayRevealPx.value, sentenceScanTotalWidthPx.value),
    )

    return {
      width: `${clippedWidth}px`,
      opacity: clippedWidth > 0 ? 1 : 0,
    }
  })

  const canTriggerSentenceTimescan = computed(() => glyphTokens.value.length > 0)

  function hideAllSentenceFlickers() {
    sentenceFlickerVisible.value = Array.from(
      { length: glyphTokens.value.length },
      () => false,
    )
    sentenceFlickerActiveLayer.value = Array.from(
      { length: glyphTokens.value.length },
      () => -1,
    )
  }

  function getFlickerVariantsForEntry(entry) {
    const providedVariants = Array.isArray(entry?.flickerVariants)
      ? entry.flickerVariants.map((file) => String(file || "")).filter(Boolean)
      : []

    if (config.precomputedFrames <= 0) {
      return providedVariants
    }

    if (providedVariants.length >= config.precomputedFrames) {
      return providedVariants.slice(0, config.precomputedFrames)
    }

    const fallback = String(entry?.file || "")
    const variants = providedVariants.slice()
    while (variants.length < config.precomputedFrames) {
      variants.push(fallback)
    }
    return variants
  }

  function resetSentenceFlickerVariants() {
    sentenceFlickerVariants.value = glyphTokens.value.map((entry) =>
      getFlickerVariantsForEntry(entry),
    )
  }

  function resetSentenceConsumedHidden() {
    sentenceConsumedHidden.value = Array.from(
      { length: glyphTokens.value.length },
      () => false,
    )
  }

  function revealSentenceOverlayThroughIndex(index) {
    const revealWidth = sentenceRevealWidthsByIndexPx.value[index] || 0
    sentenceOverlayRevealPx.value = Math.max(sentenceOverlayRevealPx.value, revealWidth)
  }

  function clearSentenceTimescanAnimation() {
    if (sentenceTimescanRafId) {
      cancelAnimationFrame(sentenceTimescanRafId)
      sentenceTimescanRafId = 0
    }
    sentenceTimescanStartTimestamp = 0
  }

  function stopSentenceTimescan() {
    sentenceTimescanRunId++
    clearSentenceTimescanAnimation()
    resetSentenceFlickerVariants()
    hideAllSentenceFlickers()
    resetSentenceConsumedHidden()
    sentenceOverlayRevealPx.value = 0
  }

  function runSentenceTimescan() {
    sentenceTimescanRunId++
    const runId = sentenceTimescanRunId
    clearSentenceTimescanAnimation()
    resetSentenceFlickerVariants()
    hideAllSentenceFlickers()
    resetSentenceConsumedHidden()
    sentenceOverlayRevealPx.value = 0

    if (!glyphTokens.value.length) {
      return
    }

    const glyphCount = glyphTokens.value.length
    const scanStepMs = Math.max(1, 1000 / config.glyphsPerSecond)
    const glyphDurationMs = Math.max(1, config.effectDurationMs)
    const stepDurationMs = Math.max(1, glyphDurationMs / Math.max(1, config.flickerSteps))
    const finalGlyphFinishMs = (glyphCount - 1) * scanStepMs + glyphDurationMs

    const animate = (timestamp) => {
      if (runId !== sentenceTimescanRunId) {
        return
      }

      if (!sentenceTimescanStartTimestamp) {
        sentenceTimescanStartTimestamp = timestamp
      }

      const elapsedMs = timestamp - sentenceTimescanStartTimestamp
      let furthestCompletedIndex = -1

      for (let index = 0; index < glyphCount; index++) {
        const startMs = index * scanStepMs
        const endMs = startMs + glyphDurationMs

        if (elapsedMs < startMs) {
          if (sentenceFlickerVisible.value[index]) {
            sentenceFlickerVisible.value[index] = false
          }
          if (sentenceFlickerActiveLayer.value[index] !== -1) {
            sentenceFlickerActiveLayer.value[index] = -1
          }
          if (sentenceConsumedHidden.value[index]) {
            sentenceConsumedHidden.value[index] = false
          }
          continue
        }

        if (elapsedMs >= endMs) {
          furthestCompletedIndex = index
          if (sentenceFlickerVisible.value[index]) {
            sentenceFlickerVisible.value[index] = false
          }
          if (sentenceFlickerActiveLayer.value[index] !== -1) {
            sentenceFlickerActiveLayer.value[index] = -1
          }
          if (!sentenceConsumedHidden.value[index]) {
            sentenceConsumedHidden.value[index] = true
          }
          continue
        }

        const variants = sentenceFlickerVariants.value[index] || []
        if (!variants.length) {
          furthestCompletedIndex = index
          if (sentenceFlickerVisible.value[index]) {
            sentenceFlickerVisible.value[index] = false
          }
          if (sentenceFlickerActiveLayer.value[index] !== -1) {
            sentenceFlickerActiveLayer.value[index] = -1
          }
          if (!sentenceConsumedHidden.value[index]) {
            sentenceConsumedHidden.value[index] = true
          }
          continue
        }

        const stepIndex = Math.min(
          config.flickerSteps - 1,
          Math.floor((elapsedMs - startMs) / stepDurationMs),
        )
        const activeLayer = stepIndex % variants.length

        if (!sentenceFlickerVisible.value[index]) {
          sentenceFlickerVisible.value[index] = true
        }
        if (sentenceFlickerActiveLayer.value[index] !== activeLayer) {
          sentenceFlickerActiveLayer.value[index] = activeLayer
        }
        if (sentenceConsumedHidden.value[index]) {
          sentenceConsumedHidden.value[index] = false
        }
      }

      if (furthestCompletedIndex >= 0) {
        revealSentenceOverlayThroughIndex(furthestCompletedIndex)
      }

      if (elapsedMs >= finalGlyphFinishMs) {
        sentenceTimescanRafId = 0
        sentenceTimescanStartTimestamp = 0
        return
      }

      sentenceTimescanRafId = requestAnimationFrame(animate)
    }

    sentenceTimescanRafId = requestAnimationFrame(animate)
  }

  watch(
    glyphTokens,
    (entries) => {
      if (!entries.length) {
        stopSentenceTimescan()
        return
      }
      stopSentenceTimescan()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopSentenceTimescan()
  })

  return {
    sentenceGlyphEntries: glyphTokens,
    sentenceGlyphMaskStyle,
    sentenceOverlayRevealStyle,
    sentenceStageStyle,
    sentenceFlickerVisible,
    sentenceFlickerVariants,
    sentenceFlickerActiveLayer,
    sentenceConsumedHidden,
    sentenceOverlayRevealPx,
    runSentenceTimescan,
    stopSentenceTimescan,
    canTriggerSentenceTimescan,
  }
}
