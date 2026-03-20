/**
 * Language State Management
 *
 * Manages language preference using Zustand with persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LanguageCode = 'en' | 'zh'

export interface LanguageState {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (language) => {
        set({ language })
      },

      toggleLanguage: () => {
        const { language } = get()
        set({ language: language === 'en' ? 'zh' : 'en' })
      }
    }),
    {
      name: 'animaker-language'
    }
  )
)
