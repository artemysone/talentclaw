export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "talentclaw-theme"

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system"
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.remove("light", "dark")

  if (theme === "light") {
    root.classList.add("light")
  } else if (theme === "dark") {
    root.classList.add("dark")
  }
  // "system" — no class, let @media (prefers-color-scheme) handle it
}

export function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}
