const CONTACT_EMAIL = "hello@foxgote.com"

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
  heading: "Portfolio",
  lead: "A living map of Foxgote work.",
  intro:
    "This page collects the practical paths through the site while finished releases, session samples, and project notes are gathered into a sharper showcase.",
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
  emailHref: `mailto:${CONTACT_EMAIL}?subject=Foxgote%20booking%20inquiry`,
  actionLabel: "Email Foxgote",
  notes: [
    {
      title: "For studio time",
      body:
        "Include preferred dates, rough session length, number of people, and what you want recorded or rehearsed.",
    },
    {
      title: "For lessons",
      body:
        "Mention your instrument, current level, goals, and whether you want a single coaching block or recurring sessions.",
    },
    {
      title: "For projects",
      body:
        "Share links, references, rough mixes, or file notes so the project can be scoped before time is booked.",
    },
  ],
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
  definition("portfolio.heading", portfolioContent.heading, 4, 24),
  definition("portfolio.lead", portfolioContent.lead, 5, 24),
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
