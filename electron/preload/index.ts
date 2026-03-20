/**
 * Electron Preload Script
 *
 * Bridges the main process and renderer process with secure IPC.
 * Exposes protected APIs to the renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron'

/**
 * Electron APIs exposed to renderer process
 */
const electronAPI = {
  // Window management
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Application info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
  },

  // Project management (to be implemented)
  project: {
    create: (config: unknown) => ipcRenderer.invoke('project:create', config),
    open: (path: string) => ipcRenderer.invoke('project:open', path),
    save: (data: unknown) => ipcRenderer.invoke('project:save', data),
    saveAs: (data: unknown, path: string) => ipcRenderer.invoke('project:saveAs', data, path),
    getRecent: () => ipcRenderer.invoke('project:getRecent')
  },

  // File system (to be implemented)
  fs: {
    selectFile: (filters: unknown) => ipcRenderer.invoke('fs:selectFile', filters),
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
    readTextFile: (path: string) => ipcRenderer.invoke('fs:readTextFile', path),
    writeTextFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeTextFile', path, content)
  }
}

/**
 * Expose APIs to renderer via contextBridge
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

/**
 * Type definitions for renderer process
 */
export type ElectronAPI = typeof electronAPI
