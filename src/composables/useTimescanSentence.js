import { computed, onBeforeUnmount, ref, watch } from "vue"

const DEFAULTS = {
  glyphHeight: 52,
  glyphGapPx: 3,
  glyphsPerSecond: 36,
  flickerSteps: 9,
  effectDurationMs: 200,
  precomputedFrames: 4,
}
const MAX_RENDER_GLYPHS = 240
const MIN_RENDER_HEIGHT_PX = 8
const MIN_RENDER_WIDTH_PX = 4
const MIN_EFFECTIVE_GAP_PX = 0.5

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
  const sourceGlyphTokens = computed(() => unwrapGlyphTokens(config.glyphTokens))
  const containerWidth = computed(() => {
    const value =
      typeof config.containerWidth === "object"
        ? config.containerWidth?.value
        : config.containerWidth
    return toNumber(value, 0)
  })
  const glyphScaleMultiplier = computed(() => {
    const value =
      typeof config.glyphScale === "object"
        ? config.glyphScale?.value
        : config.glyphScale
    return Math.max(0.1, toNumber(value, 1))
  })
  const stripAssetHeight = computed(() => {
    const value =
      typeof config.stripAssetHeight === "object"
        ? config.stripAssetHeight?.value
        : config.stripAssetHeight
    return Math.max(1, toNumber(value, config.glyphHeight))
  })
  const stripSafeStops = computed(() => {
    const value =
      typeof config.stripSafeStops === "object"
        ? config.stripSafeStops?.value
        : config.stripSafeStops
    return Array.isArray(value)
      ? value.map((stop) => toNumber(stop, 0)).filter((stop) => stop > 0)
      : []
  })
  const overlayTextWidth = computed(() => {
    const value =
      typeof config.overlayTextWidth === "object"
        ? config.overlayTextWidth?.value
        : config.overlayTextWidth
    return Math.max(0, toNumber(value, 0))
  })
  const baseGlyphHeightPx = computed(() =>
    Math.max(12, config.glyphHeight * glyphScaleMultiplier.value),
  )
  const baseGapPx = computed(() =>
    Math.max(
      0,
      config.glyphGapPx *
        glyphScaleMultiplier.value *
        (glyphScaleMultiplier.value < 1 ? 0.75 : 1),
    ),
  )

  const sentenceFlickerVariants = ref([])
  const sentenceFlickerActiveLayer = ref([])
  const sentenceFlickerVisible = ref([])
  const sentenceConsumedHidden = ref([])
  const sentenceOverlayRevealPx = ref(0)
  const sentenceStripFlickerActiveLayer = ref(-1)
  const sentenceStripFlickerLeftPx = ref(0)
  const sentenceStripFlickerRightPx = ref(0)

  let sentenceTimescanRunId = 0
  let sentenceTimescanRafId = 0
  let sentenceTimescanStartTimestamp = 0

  function glyphRenderSize(entry, targetHeight) {
    const width = toNumber(entry?.width, 1)
    const height = Math.max(1, toNumber(entry?.height, 1))
    const renderHeight = Math.max(MIN_RENDER_HEIGHT_PX, Math.round(targetHeight))
    const renderWidth = Math.max(
      MIN_RENDER_WIDTH_PX,
      Math.round((width / height) * renderHeight),
    )

    return { renderWidth, renderHeight }
  }

  const baseSlotWidthsPx = computed(() =>
    sourceGlyphTokens.value.map(
      (entry) => glyphRenderSize(entry, baseGlyphHeightPx.value).renderWidth,
    ),
  )

  const baseScanTotalWidthPx = computed(() => {
    if (!baseSlotWidthsPx.value.length) {
      return 0
    }
    const glyphWidths = baseSlotWidthsPx.value.reduce((sum, width) => sum + width, 0)
    const gapWidths = Math.max(0, baseSlotWidthsPx.value.length - 1) * baseGapPx.value
    return glyphWidths + gapWidths
  })

  const glyphScale = computed(() => {
    if (!containerWidth.value || !baseScanTotalWidthPx.value) {
      return 1
    }
    return containerWidth.value / baseScanTotalWidthPx.value
  })

  const effectiveGlyphHeight = computed(() =>
    Math.max(12, baseGlyphHeightPx.value * glyphScale.value),
  )

  const effectiveGapPx = computed(() =>
    Math.max(MIN_EFFECTIVE_GAP_PX, baseGapPx.value * glyphScale.value),
  )

  const glyphTokens = computed(() => {
    const sourceEntries = sourceGlyphTokens.value
    if (!sourceEntries.length) {
      return []
    }

    const targetWidth = overlayTextWidth.value
    if (!targetWidth) {
      return sourceEntries
    }

    const gap = effectiveGapPx.value
    const sourceWidths = sourceEntries.map(
      (entry) => glyphRenderSize(entry, effectiveGlyphHeight.value).renderWidth,
    )
    let sourceWidth = 0
    for (let index = 0; index < sourceWidths.length; index++) {
      sourceWidth += sourceWidths[index]
      if (index > 0) {
        sourceWidth += gap
      }
    }

    if (sourceWidth > targetWidth) {
      const trimmedEntries = []
      let trimmedWidth = 0

      for (let index = 0; index < sourceEntries.length; index++) {
        const entryWidth = sourceWidths[index]
        const nextWidth =
          trimmedWidth + (trimmedEntries.length > 0 ? gap : 0) + entryWidth
        if (nextWidth > targetWidth && trimmedEntries.length > 0) {
          break
        }

        trimmedEntries.push(sourceEntries[index])
        trimmedWidth = nextWidth
      }

      return trimmedEntries.length ? trimmedEntries : [sourceEntries[0]]
    }

    if (sourceWidth >= targetWidth) {
      return sourceEntries
    }

    const buildExtendedEntry = (entry, cycle, step) => {
      if (!entry || cycle <= 0) {
        return entry
      }

      const uniqueFiles = []
      const baseFile = String(entry?.file || "")
      if (baseFile) {
        uniqueFiles.push(baseFile)
      }

      const variantFiles = Array.isArray(entry?.flickerVariants)
        ? entry.flickerVariants.map((file) => String(file || "")).filter(Boolean)
        : []
      for (let index = 0; index < variantFiles.length; index++) {
        const file = variantFiles[index]
        if (!uniqueFiles.includes(file)) {
          uniqueFiles.push(file)
        }
      }

      if (uniqueFiles.length <= 1) {
        return entry
      }

      let fileIndex = (cycle + step) % uniqueFiles.length
      if (uniqueFiles[fileIndex] === baseFile) {
        fileIndex = (fileIndex + 1) % uniqueFiles.length
      }

      return {
        ...entry,
        file: uniqueFiles[fileIndex],
      }
    }

    const extendedEntries = []
    let extendedWidth = 0
    let cycle = 0

    while (
      extendedEntries.length < MAX_RENDER_GLYPHS &&
      extendedWidth < targetWidth
    ) {
      const isReverse = cycle % 2 === 1
      const cycleOffset = cycle % sourceEntries.length

      for (let step = 0; step < sourceEntries.length; step++) {
        if (
          extendedEntries.length >= MAX_RENDER_GLYPHS ||
          extendedWidth >= targetWidth
        ) {
          break
        }

        const sourceIndex = isReverse
          ? (cycleOffset - step + sourceEntries.length) % sourceEntries.length
          : (cycleOffset + step) % sourceEntries.length
        const sourceEntry = sourceEntries[sourceIndex]

        if (extendedEntries.length > 0) {
          extendedWidth += gap
        }
        extendedEntries.push(buildExtendedEntry(sourceEntry, cycle, step))
        extendedWidth += sourceWidths[sourceIndex]
      }

      cycle++
    }

    return extendedEntries.length ? extendedEntries : sourceEntries
  })

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
  const sentenceTotalWidthPx = computed(() =>
    overlayTextWidth.value > 0
      ? overlayTextWidth.value
      : sentenceScanTotalWidthPx.value,
  )
  const sentenceStripEdgePadPx = computed(() =>
    Math.max(8, Math.min(18, effectiveGlyphHeight.value * 0.2)),
  )
  const sentenceUnsnappedStripWidthPx = computed(() =>
    Math.max(sentenceTotalWidthPx.value, sentenceScanTotalWidthPx.value) +
    sentenceStripEdgePadPx.value,
  )
  const scaledStripSafeStopsPx = computed(() => {
    const stops = stripSafeStops.value
    if (!stops.length) return []
    const scale = effectiveGlyphHeight.value / stripAssetHeight.value
    return stops.map((stop) => stop * scale)
  })
  const sentenceStripWidthPx = computed(() =>
    scaledStripSafeStopsPx.value.find(
      (stop) => stop >= sentenceUnsnappedStripWidthPx.value,
    ) || sentenceUnsnappedStripWidthPx.value,
  )

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
    width: `${Math.max(1, sentenceTotalWidthPx.value)}px`,
  }))

  const sentenceStripHeightPx = computed(() => effectiveGlyphHeight.value)

  const sentenceOverlayRevealStyle = computed(() => {
    const clippedWidth = Math.max(
      0,
      Math.min(sentenceOverlayRevealPx.value, sentenceTotalWidthPx.value),
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
    sentenceStripFlickerActiveLayer.value = -1
    sentenceStripFlickerLeftPx.value = 0
    sentenceStripFlickerRightPx.value = 0
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

  function glyphLeftEdgePx(index) {
    if (index <= 0) return 0
    return (sentenceRevealWidthsByIndexPx.value[index - 1] || 0) + effectiveGapPx.value
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
      let firstActiveIndex = -1
      let lastActiveIndex = -1
      let stripActiveLayer = -1

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
        if (firstActiveIndex === -1) {
          firstActiveIndex = index
        }
        lastActiveIndex = index
        stripActiveLayer = activeLayer

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

      if (firstActiveIndex >= 0 && lastActiveIndex >= firstActiveIndex) {
        sentenceStripFlickerActiveLayer.value = stripActiveLayer
        sentenceStripFlickerLeftPx.value = glyphLeftEdgePx(firstActiveIndex)
        sentenceStripFlickerRightPx.value =
          sentenceRevealWidthsByIndexPx.value[lastActiveIndex] ||
          sentenceStripFlickerLeftPx.value
      } else {
        sentenceStripFlickerActiveLayer.value = -1
        sentenceStripFlickerLeftPx.value = 0
        sentenceStripFlickerRightPx.value = 0
      }

      if (elapsedMs >= finalGlyphFinishMs) {
        sentenceOverlayRevealPx.value = sentenceStripWidthPx.value
        sentenceStripFlickerActiveLayer.value = -1
        sentenceStripFlickerLeftPx.value = 0
        sentenceStripFlickerRightPx.value = 0
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
    sentenceStripHeightPx,
    sentenceFlickerVisible,
    sentenceFlickerVariants,
    sentenceFlickerActiveLayer,
    sentenceConsumedHidden,
    sentenceOverlayRevealPx,
    sentenceStripFlickerActiveLayer,
    sentenceStripFlickerLeftPx,
    sentenceStripFlickerRightPx,
    sentenceTotalWidthPx,
    sentenceStripWidthPx,
    runSentenceTimescan,
    stopSentenceTimescan,
    canTriggerSentenceTimescan,
  }
}
