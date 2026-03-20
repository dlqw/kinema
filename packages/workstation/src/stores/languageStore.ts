/**
 * Language Store
 *
 * Manages application language preference and persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageCode } from '../i18n'

interface LanguageState {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

/**
 * Language preference store with persistence
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',

      setLanguage: (language: LanguageCode) => {
        set({ language })
      }
    }),
    {
      name: 'animaker-language'
    }
  )
)
