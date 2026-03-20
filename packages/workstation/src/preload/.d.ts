import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Project management
      createProject: (name: string, path: string) => Promise<any>
      openProject: (path: string) => Promise<any>
      saveProject: () => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
      closeProject: () => Promise<{ success: boolean }>

      // Video operations
      renderVideo: (config: any) => Promise<string>
      cancelRender: () => Promise<void>

      // Theme and i18n
      getTheme: () => Promise<string>
      setTheme: (theme: string) => Promise<void>
      getLocale: () => Promise<string>
      setLocale: (locale: string) => Promise<void>

      // Events
      onThemeChange: (callback: (theme: string) => void) => (() => void) | undefined
      onLocaleChange: (callback: (locale: string) => void) => (() => void) | undefined
      onRenderProgress: (callback: (progress: number) => void) => (() => void) | undefined
    }
  }
}
