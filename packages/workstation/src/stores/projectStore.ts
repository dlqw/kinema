/**
 * Project Store
 *
 * Manages current project state and recent projects.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProjectData {
  version: string
  name: string
  createdAt: string
  scenes: unknown[]
  settings: Record<string, unknown>
}

export interface ProjectState {
  // Current project
  currentProject: ProjectData | null
  projectPath: string | null
  isModified: boolean

  // Recent projects
  recentProjects: Array<{ path: string; name: string; modifiedAt: string }>

  // Actions
  setCurrentProject: (project: ProjectData, path: string) => void
  closeProject: () => void
  markModified: () => void
  clearModified: () => void
  addRecentProject: (path: string, name: string) => void
  removeRecentProject: (path: string) => void
  clearRecentProjects: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projectPath: null,
      isModified: false,
      recentProjects: [],

      setCurrentProject: (project, path) => {
        set({
          currentProject: project,
          projectPath: path,
          isModified: false
        })
        get().addRecentProject(path, project.name)
      },

      closeProject: () => {
        set({
          currentProject: null,
          projectPath: null,
          isModified: false
        })
      },

      markModified: () => {
        set({ isModified: true })
      },

      clearModified: () => {
        set({ isModified: false })
      },

      addRecentProject: (path, name) => {
        const { recentProjects } = get()
        // Remove existing entry if present
        const filtered = recentProjects.filter(p => p.path !== path)
        // Add to front
        const updated = [
          { path, name, modifiedAt: new Date().toISOString() },
          ...filtered
        ].slice(0, 10) // Keep last 10

        set({ recentProjects: updated })
      },

      removeRecentProject: (path) => {
        const { recentProjects } = get()
        set({ recentProjects: recentProjects.filter(p => p.path !== path) })
      },

      clearRecentProjects: () => {
        set({ recentProjects: [] })
      }
    }),
    {
      name: 'animaker-project'
    }
  )
)
