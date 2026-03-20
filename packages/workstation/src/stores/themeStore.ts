/**
 * Theme Store
 *
 * Manages application theme (light/dark) and persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  effectiveTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

/**
 * Get system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * Update effective theme based on mode and system preference
 */
function updateEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      effectiveTheme: 'dark',

      setMode: (mode: ThemeMode) => {
        const effectiveTheme = updateEffectiveTheme(mode)
        applyTheme(effectiveTheme)
        set({ mode, effectiveTheme })
      },

      toggleTheme: () => {
        const { mode, effectiveTheme } = get()
        const newMode = effectiveTheme === 'dark' ? 'light' : 'dark'
        applyTheme(newMode)
        set({ mode: newMode, effectiveTheme: newMode })
      }
    }),
    {
      name: 'animaker-theme'
    }
  )
)

// Initialize theme on load
const storedMode = localStorage.getItem('animaker-theme')
if (storedMode) {
  try {
    const { state } = JSON.parse(storedMode)
    const mode = state?.mode || 'dark'
    const effectiveTheme = updateEffectiveTheme(mode)
    applyTheme(effectiveTheme)
  } catch {
    applyTheme('dark')
  }
} else {
  applyTheme('dark')
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { mode } = useThemeStore.getState()
  if (mode === 'system') {
    const effectiveTheme = getSystemTheme()
    applyTheme(effectiveTheme)
    useThemeStore.setState({ effectiveTheme })
  }
})
