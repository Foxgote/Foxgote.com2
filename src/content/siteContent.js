import { contentStorage } from "./contentStorage.js"

export const TIMESCAN_TEXT_LINE_MAX_CHARS = 34

export const homeContent = contentStorage.home
export const servicesContent = contentStorage.services
export const portfolioContent = contentStorage.portfolio
export const projectsContent = contentStorage.projects
export const contactContent = contentStorage.contact

export function getServiceById(serviceId) {
  return servicesContent.cards.find((card) => card.id === serviceId) || null
}

export function serviceTitleAssetKey(serviceId) {
  return `services.${serviceId}.title`
}

export function serviceImageAssetKey(serviceId) {
  return `services.${serviceId}.image`
}

export function serviceBulletAssetKey(serviceId, index) {
  return `services.${serviceId}.bullet.${index}`
}

function serviceTitleTimescanText(card) {
  return `${card.id}:title:${card.title}`
}

function serviceImageTimescanText(card) {
  return `${card.id}:image:${card.imageLabel}`
}

function serviceBulletTimescanText(card, bulletText, index) {
  return `${card.id}:bullet:${index}:${bulletText}`
}

function definition(key, text, minGlyphs, targetGlyphs) {
  return {
    key,
    text,
    minGlyphs,
    targetGlyphs,
  }
}

export function chunkTimescanText(text, maxChars = TIMESCAN_TEXT_LINE_MAX_CHARS) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim()
  const limit = Math.max(12, Math.floor(Number(maxChars) || TIMESCAN_TEXT_LINE_MAX_CHARS))
  if (!normalized) return []

  const words = normalized.split(" ")
  const lines = []
  let currentLine = ""

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length <= limit || !currentLine) {
      currentLine = nextLine
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

export function timescanLineAssetKey(assetKey, index) {
  return `${assetKey}.line.${index}`
}

function lineDefinitions(assetKey, text, minGlyphs, targetGlyphs, maxChars) {
  return chunkTimescanText(text, maxChars).map((line, index) =>
    definition(timescanLineAssetKey(assetKey, index), line, minGlyphs, targetGlyphs),
  )
}

export function portfolioTextAssetKey(field) {
  return `portfolio.${field}`
}

export function portfolioShowcaseTextAssetKey(panelId, field) {
  return `portfolio.showcase.${panelId}.${field}`
}

export function portfolioVideoTextAssetKey(panelId, index, field) {
  return `portfolio.showcase.${panelId}.video.${index}.${field}`
}

export function portfolioAudioTextAssetKey(index, field) {
  return `portfolio.showcase.audio.track.${index}.${field}`
}

export const timescanAssetDefinitions = [
  definition("home.heading", homeContent.heading, 4, 22),
  definition("home.lead", homeContent.lead, 5, 24),
  definition("services.eyebrow", servicesContent.eyebrow, 4, 10),
  definition("services.heading", servicesContent.heading, 8, 28),
  definition("services.lead", servicesContent.lead, 6, 20),
  ...servicesContent.cards.flatMap((card) => [
    definition(serviceTitleAssetKey(card.id), serviceTitleTimescanText(card), 6, 18),
    definition(serviceImageAssetKey(card.id), serviceImageTimescanText(card), 4, 14),
    ...card.bullets.map((bulletText, index) =>
      definition(
        serviceBulletAssetKey(card.id, index),
        serviceBulletTimescanText(card, bulletText, index),
        5,
        18,
      ),
    ),
  ]),
  definition("portfolio.eyebrow", portfolioContent.eyebrow, 4, 10),
  definition("portfolio.heading", portfolioContent.heading, 6, 28),
  definition("portfolio.lead", portfolioContent.lead, 6, 20),
  ...portfolioContent.showcases.flatMap((panel) => [
    ...lineDefinitions(portfolioShowcaseTextAssetKey(panel.id, "label"), panel.label, 3, 8, 26),
    ...lineDefinitions(portfolioShowcaseTextAssetKey(panel.id, "title"), panel.title, 4, 14, 28),
    ...lineDefinitions(portfolioShowcaseTextAssetKey(panel.id, "body"), panel.body, 5, 18, 34),
    ...(panel.videos || []).flatMap((video, index) => [
      ...lineDefinitions(
        portfolioVideoTextAssetKey(panel.id, index, "title"),
        video.title,
        4,
        12,
        24,
      ),
    ]),
    ...(panel.audioSamples || []).flatMap((track, index) => [
      ...lineDefinitions(portfolioAudioTextAssetKey(index, "meta"), track.meta, 4, 12, 24),
      ...lineDefinitions(portfolioAudioTextAssetKey(index, "title"), track.title, 4, 12, 24),
      ...lineDefinitions(portfolioAudioTextAssetKey(index, "artist"), track.artist, 3, 8, 20),
      ...lineDefinitions(portfolioAudioTextAssetKey(index, "duration"), track.duration, 3, 6, 12),
    ]),
  ]),
  definition("projects.heading", projectsContent.heading, 4, 24),
  definition("projects.lead", projectsContent.lead, 5, 24),
  definition("contact.heading", contactContent.heading, 4, 24),
  definition("contact.lead", contactContent.lead, 5, 24),
]

const timescanAssetDefinitionByKey = new Map(
  timescanAssetDefinitions.map((entry) => [entry.key, entry]),
)

export function getTimescanAssetDefinition(key) {
  return timescanAssetDefinitionByKey.get(key) || null
}

export function getTimescanText(key) {
  return getTimescanAssetDefinition(key)?.text || String(key || "")
}

export function getTimescanGlyphOptions(key) {
  const entry = getTimescanAssetDefinition(key)
  return {
    minGlyphs: entry?.minGlyphs ?? 1,
    targetGlyphs: entry?.targetGlyphs ?? 24,
  }
}
