const CONTACT_EMAIL = "hello@foxgote.com"
export const TIMESCAN_TEXT_LINE_MAX_CHARS = 34

export const homeContent = {
  heading: "Foxgote",
  lead: "Studio time, lessons, and project support.",
  intro:
    "Book the room for focused writing, sharpen your playing with one-on-one coaching, or bring a rough idea in and leave with a clearer next step.",
  actions: [
    { label: "Explore Services", to: "/services" },
    { label: "Start A Booking", to: "/contact" },
  ],
  highlights: [
    {
      title: "Studio Time",
      body:
        "Reserve a practical creative room for tracking, writing, rehearsal, or a focused production block.",
    },
    {
      title: "Music Coaching",
      body:
        "Private sessions for technique, theory, songwriting, performance, and steady practice momentum.",
    },
    {
      title: "Project Support",
      body:
        "Feedback, stem prep, demo polish, and release-minded help for independent songs and sessions.",
    },
  ],
}

export const servicesContent = {
  eyebrow: "Services",
  heading: "Choose your session",
  lead: "Pick the path that fits the session.",
  cards: [
    {
      id: "studio-rental",
      title: "Studio Rental",
      imageLabel: "Room Booking",
      imageAriaLabel: "Studio rental booking marker",
      summary:
        "A flexible creative room for writing, rehearsal, vocal tracking, and focused recording blocks.",
      bullets: [
        "Hourly, half-day, and full-day blocks",
        "Control room plus live room access",
        "Setup support available on request",
        "Evening sessions when scheduling allows",
      ],
      detail: {
        kicker: "Service Detail",
        summary:
          "Book the room, lock in your schedule, and keep session flow simple.",
        bullets: [
          "Use the space for writing, rehearsal, vocal tracking, or a focused record day.",
          "Choose a booking window that fits the session instead of overcommitting the day.",
          "Add setup or engineer support when the session needs a faster start.",
          "Bring references, stems, or rough demos so the room time turns into usable progress.",
        ],
        ctaLabel: "Ask About Studio Time",
      },
    },
    {
      id: "music-teaching",
      title: "Music Teaching",
      imageLabel: "Focused Lessons",
      imageAriaLabel: "Music teaching session marker",
      summary:
        "One-on-one coaching for players and writers who want structure without losing the spark.",
      bullets: [
        "Private one-on-one coaching",
        "Beginner through advanced pacing",
        "Technique, theory, and songwriting",
        "Practice plans with weekly goals",
      ],
      detail: {
        kicker: "Service Detail",
        summary:
          "Personalized coaching blocks designed around your goals, pace, and sound.",
        bullets: [
          "Bring a song, a technique problem, or a blank slate and build the lesson from there.",
          "Work through playing, theory, writing, performance, or recording confidence.",
          "Keep each session anchored to a short list of useful next actions.",
          "Leave with practice notes that make the week between lessons easier to use.",
        ],
        ctaLabel: "Ask About Lessons",
      },
    },
    {
      id: "other-services",
      title: "Production Support",
      imageLabel: "Project Help",
      imageAriaLabel: "Production support marker",
      summary:
        "Scoped help for demos, vocals, arrangements, stems, and the messy middle of finishing work.",
      bullets: [
        "Vocal tracking and comp prep",
        "Demo polish and arrangement feedback",
        "Mix-ready stem export workflow",
        "Custom support by project scope",
      ],
      detail: {
        kicker: "Service Detail",
        summary:
          "Flexible support services for focused releases and cleaner delivery.",
        bullets: [
          "Tighten a demo with arrangement, tone, and structure feedback.",
          "Prepare stems, comp vocals, or organize files before mixing.",
          "Set a practical scope for the part of the project that needs help now.",
          "Turn scattered session material into something easier to finish or hand off.",
        ],
        ctaLabel: "Scope A Project",
      },
    },
  ],
}

export const portfolioContent = {
  eyebrow: "Portfolio",
  heading: "A living map of Foxgote work.",
  lead: "Browse selected work and samples.",
  showcases: [
    {
      id: "artworks",
      label: "Visual Work",
      title: "Artwork Archive",
      body:
        "A gallery lane for covers, stills, posters, and visual studies as finished image sets are gathered.",
      action: "Open Artwork",
      artworks: [
        {
          title: "City Render Study",
          year: "2026",
          imageKey: "portfolio",
          alt: "Cinematic city render placeholder for a future artwork entry",
        },
        {
          title: "Room Light Study",
          year: "2026",
          imageKey: "services",
          alt: "Studio room placeholder for a future artwork entry",
        },
        {
          title: "Project Frame",
          year: "2026",
          imageKey: "projects",
          alt: "Architectural frame placeholder for a future artwork entry",
        },
      ],
    },
    {
      id: "videos",
      label: "Video Work",
      title: "Video Reel",
      body:
        "A place for embedded performance videos, session clips, walkthroughs, or release visuals when the channel links are ready.",
      action: "Open Videos",
      videos: [
        {
          title: "Session Reel",
          meta: "YouTube embed pending",
          imageKey: "portfolio",
          embedUrl: "",
        },
        {
          title: "Performance Clip",
          meta: "YouTube embed pending",
          imageKey: "projects",
          embedUrl: "",
        },
      ],
    },
    {
      id: "audio",
      label: "Audio Work",
      title: "Recording Samples",
      body:
        "A compact player lane for mixes, lesson examples, stems, and songs once MP3 exports are ready.",
      action: "Open Audio",
      audioSamples: [
        {
          title: "Midnight Demo",
          artist: "Foxgote",
          meta: "Recording sample",
          duration: "02:42",
          durationSeconds: 162,
          imageKey: "services",
          src: "",
        },
        {
          title: "Lesson Motif",
          artist: "Foxgote",
          meta: "Teaching example",
          duration: "01:36",
          durationSeconds: 96,
          imageKey: "portfolio",
          src: "",
        },
        {
          title: "Stem Rough",
          artist: "Foxgote",
          meta: "Production sample",
          duration: "03:18",
          durationSeconds: 198,
          imageKey: "projects",
          src: "",
        },
      ],
    },
  ],
  entries: [
    {
      title: "Services",
      label: "Bookable paths",
      body:
        "Studio rental, teaching, and production support are separated into quick choices so visitors can find the right kind of session.",
      to: "/services",
      action: "View Services",
    },
    {
      title: "Projects",
      label: "In-progress work",
      body:
        "A short index of active experiments, site work, lesson structures, and release support ideas as they develop.",
      to: "/projects",
      action: "View Projects",
    },
    {
      title: "Contact",
      label: "Start a brief",
      body:
        "Send the kind of session you want, a few dates, and the outcome you need so the next step can be scoped clearly.",
      to: "/contact",
      action: "Start Contact",
    },
  ],
}

export const projectsContent = {
  heading: "Projects",
  lead: "Current builds and creative systems.",
  intro:
    "These are living project lanes rather than a static archive: each one points toward work that can become releases, lessons, or better studio sessions.",
  items: [
    {
      title: "Session Room Workflow",
      status: "Building",
      body:
        "A repeatable process for booking notes, setup choices, reference tracks, and clean handoff after a session.",
    },
    {
      title: "Lesson Paths",
      status: "Active",
      body:
        "Modular practice arcs for technique, songwriting, theory, and performance so each student can move with purpose.",
    },
    {
      title: "Demo-To-Release Support",
      status: "Scoping",
      body:
        "A practical lane for turning rough recordings into organized stems, stronger arrangements, and mix-ready sessions.",
    },
    {
      title: "Foxgote.com",
      status: "In progress",
      body:
        "The site itself: a cinematic navigation system, generated glyph assets, and a growing content structure for the studio.",
    },
  ],
}

export const contactContent = {
  heading: "Contact",
  lead: "Send the next-session brief.",
  intro:
    "Send a concise note with your preferred dates, the service you are considering, and any links or references that explain the sound, lesson goal, or project shape.",
  email: CONTACT_EMAIL,
  channels: [
    {
      id: "whatsapp",
      label: "WhatsApp",
      value: "84849390",
    },
    {
      id: "telegram",
      label: "Telegram",
      value: "@for3staiteall",
    },
    {
      id: "discord",
      label: "Discord",
      value: "Add Discord",
    },
    {
      id: "x",
      label: "X",
      value: "Add X",
    },
    {
      id: "instagram",
      label: "Instagram",
      value: "Add IG",
    },
  ],
  draft: {
    heading: "Email",
    description: "Send the note through the site.",
    subjectFallback: "Booking inquiry",
    emailPlaceholder: "Your email",
    ccPlaceholder: "Optional",
  },
}

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

export function portfolioArtworkTextAssetKey(panelId, index, field) {
  return `portfolio.showcase.${panelId}.artwork.${index}.${field}`
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
    ...(panel.artworks || []).flatMap((artwork, index) => [
      ...lineDefinitions(
        portfolioArtworkTextAssetKey(panel.id, index, "title"),
        artwork.title,
        4,
        12,
        24,
      ),
      ...lineDefinitions(
        portfolioArtworkTextAssetKey(panel.id, index, "year"),
        artwork.year,
        3,
        6,
        12,
      ),
    ]),
    ...(panel.videos || []).flatMap((video, index) => [
      ...lineDefinitions(
        portfolioVideoTextAssetKey(panel.id, index, "title"),
        video.title,
        4,
        12,
        24,
      ),
      ...lineDefinitions(
        portfolioVideoTextAssetKey(panel.id, index, "meta"),
        video.meta,
        4,
        14,
        26,
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
