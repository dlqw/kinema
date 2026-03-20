/**
 * Shared Type Definitions
 *
 * Types shared between main, preload, and renderer processes.
 */

export interface ProjectConfig {
  name: string
  version: string
  description?: string
  author?: string
  created: string
  modified: string
}

export interface ProjectData {
  config: ProjectConfig
  scenes: unknown[]
  timeline: unknown
  assets: unknown[]
}

export interface ElectronWindowAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
}

export interface ElectronAppAPI {
  getVersion: () => Promise<string>
  getName: () => Promise<string>
  getPlatform: () => Promise<string>
}

export interface ElectronProjectAPI {
  create: (config: Partial<ProjectConfig>) => Promise<ProjectData>
  open: (path: string) => Promise<ProjectData>
  save: (data: ProjectData) => Promise<string>
  saveAs: (data: ProjectData, path: string) => Promise<string>
  getRecent: () => Promise<string[]>
}

export interface ElectronFsAPI {
  selectFile: (filters: FileFilter[]) => Promise<string | null>
  selectDirectory: () => Promise<string | null>
  readTextFile: (path: string) => Promise<string>
  writeTextFile: (path: string, content: string) => Promise<void>
}

export interface FileFilter {
  name: string
  extensions: string[]
}
