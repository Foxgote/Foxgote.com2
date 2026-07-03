// Edit this file when you want to change site copy, links, and portfolio entries.
// Keep ids stable unless you also want to regenerate related Timescan assets.
const CONTACT_EMAIL = "hello@foxgote.com"

export const contentStorage = {
  media: {
    // Image files live in src/assets/img. Add new files there, then point keys here.
    fallbackImageKey: "portfolio",
    images: {
      home: {
        src: "../assets/img/studio/studio-wide-door-cables.jpg",
        alt: "Wide view of the Foxgote private music room with instruments, desk, and studio wall",
      },
      services: {
        src: "../assets/img/studio/studio-room-main.jpg",
        alt: "Foxgote private music room with desk, drums, guitars, and recording setup",
      },
      studioEquipment: {
        src: "../assets/img/studio/studio-equipment-detail.jpg",
        alt: "Foxgote instrument corner with bass, drums, pedals, amps, and guitars",
      },
      studioWriting: {
        src: "../assets/img/studio/studio-writing-lesson-detail.jpg",
        alt: "Foxgote writing desk with guitar, speakers, and music books",
      },
      studioWide: {
        src: "../assets/img/studio/studio-wide-door-cables.jpg",
        alt: "Wide Foxgote room view with guitars, drums, desk, and cable storage",
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
    heading: "About Me",
    lead: "Piano, guitar, theory, and creative work.",
    intro:
      "I am a teacher-musician with 15 years in classical piano, 8 years on guitar, and 6 years teaching music performance and theory at a well-known music school. Foxgote is where lessons, private room sessions, and creative projects meet.",
    actions: [
      { label: "Explore Services", to: "/services" },
      { label: "Start A Conversation", to: "/contact" },
    ],
    highlights: [
      {
        title: "Player And Teacher",
        body:
          "Classical piano is the main spine, guitar is the second language, and saxophone, flute, and drums add useful side perspectives.",
      },
      {
        title: "Lessons With Structure",
        body:
          "Qualified to teach piano and guitar, with performance, theory, and practice plans shaped around the student in front of me.",
      },
      {
        title: "Creative Systems",
        body:
          "Programming, physics, math, art, games, and the occasional cooking detour stay in the background as tools for sharper creative work.",
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
        title: "Studio Time",
        thumbnailKey: "services",
        imageLabel: "Room Booking",
        imageAriaLabel: "Studio time booking marker",
        summary:
          "A private home-studio room for focused writing, practice, demo tracking, and small creative sessions.",
        bullets: [
          "Private room for focused music work",
          "Guitar, bass, MIDI, and e-drum friendly",
          "Good for demos, practice, and writing",
          "Availability by request and schedule",
        ],
        detail: {
          kicker: "Service Detail",
          summary:
            "Book a practical private music room without pretending it is a commercial studio floor.",
          bullets: [
            "Use the room for writing, quiet rehearsal, demo tracking, arrangement work, or focused practice.",
            "Bring references, rough demos, tabs, charts, stems, or a clear target for the session.",
            "Ask ahead if you need help setting up instruments, DAW routing, or a basic recording workflow.",
          ],
          bestFor: [
            "Solo players and small creative sessions",
            "Piano/guitar writing, MIDI parts, e-drums, bass, and demo work",
            "People who want a private room with instruments close by",
          ],
          notIdealFor: [
            "Full band volume or live acoustic drums",
            "Commercial soundproof isolation claims",
            "Large DJ/live mixer setups",
          ],
          ctaLabel: "Ask About Availability",
        },
      },
      {
        id: "music-teaching",
        title: "Music Teaching",
        thumbnailKey: "studioWriting",
        imageLabel: "Focused Lessons",
        imageAriaLabel: "Music teaching session marker",
        summary:
          "Piano and guitar lessons with theory, performance, and practice structure built around your goals.",
        bullets: [
          "Piano and guitar teaching",
          "Theory and performance coaching",
          "Beginner through advanced pacing",
          "Practice plans with useful next steps",
        ],
        detail: {
          kicker: "Service Detail",
          summary:
            "One-on-one music coaching from a teacher with 6 years of performance and theory teaching experience.",
          bullets: [
            "Build piano or guitar technique with clear musical purpose instead of isolated drills only.",
            "Use theory to understand songs, chords, rhythm, phrasing, and performance choices.",
            "Bring exam work, personal songs, technique blocks, or a blank slate and shape the lesson from there.",
          ],
          bestFor: [
            "Piano or guitar students who want structure",
            "Players who need theory to become usable",
            "Performance confidence, practice planning, and musical problem solving",
          ],
          notIdealFor: [
            "Students looking for a one-size-fits-all syllabus",
            "Production-only sessions with no playing or theory goal",
          ],
          ctaLabel: "Ask About Lessons",
        },
      },
      {
        id: "other-services",
        title: "Project Support",
        thumbnailKey: "studioEquipment",
        imageLabel: "Project Help",
        imageAriaLabel: "Project support marker",
        summary:
          "Scoped help for demos, arrangements, session organization, art/game ideas, and unfinished creative work.",
        bullets: [
          "Demo and arrangement feedback",
          "Session cleanup and file organization",
          "Art, game, and site-adjacent support",
          "Scope set by the project",
        ],
        detail: {
          kicker: "Service Detail",
          summary:
            "Flexible support for the messy middle of a creative project, without overselling production mastery.",
          bullets: [
            "Tighten a demo with arrangement, tone, structure, and next-step feedback.",
            "Clean up sessions, notes, references, stems, or project materials before the next handoff.",
            "Use the wider Foxgote skillset for art/game/site thinking when the project crosses media.",
          ],
          bestFor: [
            "Rough ideas that need structure",
            "Demo review and arrangement direction",
            "Creative projects that touch music, art, games, or web work",
          ],
          notIdealFor: [
            "Full-service label, management, or final commercial mix promises",
            "Projects with no clear scope or decision maker",
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
            statusLabel: "WIP",
            alt: "Cinematic city render placeholder for a future artwork entry",
          },
          {
            title: "Room Light Study",
            year: "2026",
            imageKey: "services",
            statusLabel: "WIP",
            alt: "Studio room placeholder for a future artwork entry",
          },
          {
            title: "Project Frame",
            year: "2026",
            imageKey: "projects",
            statusLabel: "SOON",
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
            statusLabel: "SAMPLE PENDING",
            embedUrl: "",
            linkUrl: "",
          },
          {
            title: "Performance Clip",
            imageKey: "projects",
            statusLabel: "SAMPLE PENDING",
            embedUrl: "",
            linkUrl: "",
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
            duration: "TBD",
            durationSeconds: 1,
            imageKey: "services",
            statusLabel: "SAMPLE PENDING",
            src: "",
          },
          {
            title: "Lesson Motif",
            artist: "Foxgote",
            meta: "Teaching example",
            duration: "TBD",
            durationSeconds: 1,
            imageKey: "studioWriting",
            statusLabel: "SAMPLE PENDING",
            src: "",
          },
          {
            title: "Stem Rough",
            artist: "Foxgote",
            meta: "Production sample",
            duration: "TBD",
            durationSeconds: 1,
            imageKey: "studioEquipment",
            statusLabel: "SAMPLE PENDING",
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
          "Studio time, teaching, and project support are separated into quick choices so visitors can find the right kind of session.",
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
      "These are living project lanes rather than a finished archive: each one points toward work that can become releases, lessons, tools, or better studio sessions.",
    items: [
      {
        title: "Private Room Workflow",
        status: "Building",
        body:
          "A repeatable process for booking notes, setup choices, reference tracks, and clean handoff after a private room session.",
      },
      {
        title: "Lesson Paths",
        status: "Active",
        body:
          "Modular practice arcs for piano, guitar, theory, and performance so each student can move with purpose.",
      },
      {
        title: "Demo And Project Support",
        status: "Scoping",
        body:
          "A practical lane for turning rough recordings, project notes, and scattered references into cleaner next steps.",
      },
      {
        title: "Art And Game Work",
        status: "WIP",
        body:
          "A holding lane for visual pieces, game experiments, and playable or watchable samples as they become ready to show.",
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
