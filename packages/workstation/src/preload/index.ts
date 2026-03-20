import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Project management
  createProject: (name: string, path: string) => ipcRenderer.invoke('project:create', name, path),
  openProject: (path: string) => ipcRenderer.invoke('project:open', path),
  saveProject: () => ipcRenderer.invoke('project:save'),
  closeProject: () => ipcRenderer.invoke('project:close'),

  // Video operations
  renderVideo: (config: any) => ipcRenderer.invoke('video:render', config),
  cancelRender: () => ipcRenderer.invoke('video:cancel'),

  // Theme and i18n
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: string) => ipcRenderer.invoke('theme:set', theme),
  getLocale: () => ipcRenderer.invoke('locale:get'),
  setLocale: (locale: string) => ipcRenderer.invoke('locale:set', locale),

  // Events
  onThemeChange: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme:changed', (_event, theme) => callback(theme))
  },
  onLocaleChange: (callback: (locale: string) => void) => {
    ipcRenderer.on('locale:changed', (_event, locale) => callback(locale))
  },
  onRenderProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('render:progress', (_event, progress) => callback(progress))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
