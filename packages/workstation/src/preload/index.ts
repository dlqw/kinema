import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  // Project management
  createProject: (name: string, path: string) => ipcRenderer.invoke('project:create', name, path),
  openProject: (path?: string) => ipcRenderer.invoke('project:open', path),
  getProjectState: () => ipcRenderer.invoke('project:get-state'),
  updateProjectDocument: (project: unknown) => ipcRenderer.invoke('project:update', project),
  saveProject: () => ipcRenderer.invoke('project:save'),
  saveProjectAs: () => ipcRenderer.invoke('project:save-as'),
  closeProject: () => ipcRenderer.invoke('project:close'),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // Video operations
  renderVideo: (config: unknown) => ipcRenderer.invoke('video:render', config),
  cancelRender: () => ipcRenderer.invoke('video:cancel'),

  // Theme and i18n
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: string) => ipcRenderer.invoke('theme:set', theme),
  getLocale: () => ipcRenderer.invoke('locale:get'),
  setLocale: (locale: string) => ipcRenderer.invoke('locale:set', locale),

  // Events
  onThemeChange: (callback: (theme: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme);
    ipcRenderer.on('theme:changed', listener);
    return () => ipcRenderer.removeListener('theme:changed', listener);
  },
  onLocaleChange: (callback: (locale: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, locale: string) => callback(locale);
    ipcRenderer.on('locale:changed', listener);
    return () => ipcRenderer.removeListener('locale:changed', listener);
  },
  onRenderProgress: (callback: (progress: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress);
    ipcRenderer.on('render:progress', listener);
    return () => ipcRenderer.removeListener('render:progress', listener);
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
