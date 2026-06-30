// Edit this file when you want to change site copy, links, and portfolio entries.
// Keep ids stable unless you also want to regenerate related Timescan assets.
const CONTACT_EMAIL = "hello@foxgote.com"

export const contentStorage = {
  media: {
    // Image files live in src/assets/img. Add new files there, then point keys here.
    fallbackImageKey: "portfolio",
    images: {
      home: {
        src: "../assets/img/barlite.png",
        alt: "Foxgote studio bar interior",
      },
      services: {
        src: "../assets/img/services.jpg",
        alt: "Studio services thumbnail",
      },
      portfolio: {
        src: "../assets/img/toni-pykalaniemi-kb3d-cyberpunkcity-cmp-v019-0020.jpg",
        alt: "Cinematic city portfolio thumbnail",
      },
      contact: {
        src: "../assets/img/neil-ross-west-kayro-mezzotint.jpg",
        alt: "Contact page visual thumbnail",
      },
      projects: {
        src: "../assets/img/luis-carrasco-hotel-04.jpg",
        alt: "Architectural project thumbnail",
      },
    },
    routeHeroKeys: {
      "/": "home",
      "/services": "services",
      "/portfolio": "portfolio",
      "/contact": "contact",
      "/projects": "projects",
    },
  },

  home: {
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
  },

  services: {
    eyebrow: "Services",
    heading: "Choose your session",
    lead: "Pick the path that fits the session.",
    cards: [
      {
        id: "studio-rental",
        title: "Studio Rental",
        thumbnailKey: "services",
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
        thumbnailKey: "portfolio",
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
        thumbnailKey: "projects",
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
  },

  portfolio: {
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
          "A place for performance videos, session clips, walkthroughs, or release visuals when the channel links are ready.",
        action: "Open Videos",
        videos: [
          {
            title: "Session Reel",
            imageKey: "portfolio",
            embedUrl: "https://www.youtube.com/embed/WEu_QQdiHZI",
            linkUrl: "https://www.youtube.com/watch?v=WEu_QQdiHZI",
          },
          {
            title: "Performance Clip",
            imageKey: "projects",
            embedUrl: "https://www.youtube.com/embed/WEu_QQdiHZI",
            linkUrl: "https://www.youtube.com/watch?v=WEu_QQdiHZI",
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
            duration: "00:02",
            durationSeconds: 2,
            imageKey: "services",
            src: "/audio/foxgote-test-sample.mp3",
          },
          {
            title: "Lesson Motif",
            artist: "Foxgote",
            meta: "Teaching example",
            duration: "00:02",
            durationSeconds: 2,
            imageKey: "portfolio",
            src: "/audio/foxgote-test-sample.mp3",
          },
          {
            title: "Stem Rough",
            artist: "Foxgote",
            meta: "Production sample",
            duration: "00:02",
            durationSeconds: 2,
            imageKey: "projects",
            src: "/audio/foxgote-test-sample.mp3",
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
  },

  projects: {
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
  },

  contact: {
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
  },
}
