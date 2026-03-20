/**
 * Project State Management
 *
 * Manages project state using Zustand with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectInfo {
  path: string | null;
  name: string;
  modified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectState {
  // Current project
  currentProject: ProjectInfo | null;

  // Recent projects
  recentProjects: ProjectInfo[];

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setCurrentProject: (project: ProjectInfo | null) => void;
  updateProject: (updates: Partial<ProjectInfo>) => void;
  setModified: (modified: boolean) => void;
  addToRecent: (project: ProjectInfo) => void;
  removeFromRecent: (path: string) => void;
  clearRecentProjects: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Project operations (via IPC)
  createProject: (name: string, path?: string) => Promise<boolean>;
  openProject: (path?: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  closeProject: () => void;
}

const MAX_RECENT_PROJECTS = 10;

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      recentProjects: [],
      isLoading: false,
      error: null,

      setCurrentProject: (project) => {
        set({ currentProject: project, error: null });
      },

      updateProject: (updates) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: {
              ...currentProject,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      setModified: (modified) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: { ...currentProject, modified },
          });
        }
      },

      addToRecent: (project) => {
        const { recentProjects } = get();
        const filtered = recentProjects.filter((p) => p.path !== project.path);
        const updated = [project, ...filtered].slice(0, MAX_RECENT_PROJECTS);
        set({ recentProjects: updated });
      },

      removeFromRecent: (path) => {
        const { recentProjects } = get();
        set({ recentProjects: recentProjects.filter((p) => p.path !== path) });
      },

      clearRecentProjects: () => {
        set({ recentProjects: [] });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      createProject: async (name, path) => {
        set({ isLoading: true, error: null });
        try {
          const result = await window.api.createProject(name, path || '');
          if (result.success) {
            const project: ProjectInfo = {
              path: result.path,
              name,
              modified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set({ currentProject: project, isLoading: false });
            get().addToRecent(project);
            return true;
          } else if (!result.canceled) {
            set({ error: result.error || 'Failed to create project', isLoading: false });
            return false;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          return false;
        }
      },

      openProject: async (path) => {
        set({ isLoading: true, error: null });
        try {
          const result = await window.api.openProject(path || '');
          if (result.success && result.project) {
            const project: ProjectInfo = {
              path: result.path,
              name: result.project.name || 'Untitled',
              modified: false,
              createdAt: result.project.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set({ currentProject: project, isLoading: false });
            get().addToRecent(project);
            return true;
          } else if (!result.canceled) {
            set({ error: result.error || 'Failed to open project', isLoading: false });
            return false;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          return false;
        }
      },

      saveProject: async () => {
        const { currentProject } = get();
        if (!currentProject) {
          set({ error: 'No project to save' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const result = await window.api.saveProject();
          if (result.success) {
            set({
              currentProject: { ...currentProject, modified: false },
              isLoading: false,
            });
            return true;
          } else if (!result.canceled) {
            set({ error: result.error || 'Failed to save project', isLoading: false });
            return false;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          return false;
        }
      },

      closeProject: () => {
        set({ currentProject: null, error: null });
      },
    }),
    {
      name: 'animaker-project',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
      }),
    }
  )
);
