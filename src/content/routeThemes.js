export const routeThemePalettes = {
  home: {
    label: "About / brass studio room",
    primary: "#d4a15e",
    soft: "rgba(34, 124, 76, 0.22)",
    glow: "rgba(54, 154, 98, 0.18)",
    navBorder: "rgba(212, 161, 94, 0.16)",
  },
  services: {
    label: "Services / green studio light",
    primary: "#d8a45f",
    soft: "rgba(34, 124, 76, 0.24)",
    glow: "rgba(65, 176, 112, 0.18)",
    navBorder: "rgba(216, 164, 95, 0.17)",
  },
  portfolio: {
    label: "Portfolio / cyberpunk signage",
    primary: "#ff9a63",
    soft: "rgba(255, 154, 99, 0.18)",
    glow: "rgba(255, 154, 99, 0.14)",
    navBorder: "rgba(255, 154, 99, 0.15)",
  },
  contact: {
    label: "Contact / warm call-to-action",
    primary: "#d4a15e",
    soft: "rgba(212, 161, 94, 0.18)",
    glow: "rgba(255, 176, 96, 0.16)",
    navBorder: "rgba(255, 200, 140, 0.12)",
  },
  projects: {
    label: "Projects / violet hidden-work lane",
    primary: "#b6a2ff",
    soft: "rgba(182, 162, 255, 0.18)",
    glow: "rgba(182, 162, 255, 0.16)",
    navBorder: "rgba(182, 162, 255, 0.16)",
  },
}

export const fallbackRouteTheme = routeThemePalettes.home

export function routeThemeForKey(themeKey) {
  return routeThemePalettes[themeKey] || fallbackRouteTheme
}
