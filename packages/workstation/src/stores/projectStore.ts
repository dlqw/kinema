/**
 * Project State Management
 *
 * Manages project state using Zustand with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectDocument, ProjectScene, ProjectSettings } from '../types/project';

export interface ProjectInfo {
  path: string | null;
  name: string;
  modified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectState {
  currentProject: ProjectInfo | null;
  currentProjectData: ProjectDocument | null;
  selectedSceneId: string | null;
  recentProjects: ProjectInfo[];
  isLoading: boolean;
  error: string | null;
  setCurrentProject: (project: ProjectInfo | null) => void;
  replaceProjectData: (project: ProjectDocument | null) => void;
  updateProject: (updates: Partial<ProjectInfo>) => void;
  setModified: (modified: boolean) => void;
  addToRecent: (project: ProjectInfo) => void;
  removeFromRecent: (path: string) => void;
  clearRecentProjects: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectScene: (sceneId: string | null) => void;
  createProject: (name: string, path?: string) => Promise<boolean>;
  openProject: (path?: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  closeProject: () => Promise<boolean>;
  updateProjectName: (name: string) => Promise<boolean>;
  updateProjectSettings: (updates: Partial<ProjectSettings>) => Promise<boolean>;
  addScene: () => Promise<boolean>;
  updateScene: (sceneId: string, updates: Partial<ProjectScene>) => Promise<boolean>;
  duplicateScene: (sceneId: string) => Promise<boolean>;
  removeScene: (sceneId: string) => Promise<boolean>;
}

const MAX_RECENT_PROJECTS = 10;

function createSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultScene(index: number): ProjectScene {
  return {
    id: createSceneId(),
    name: `Scene ${String(index + 1).padStart(2, '0')}`,
    duration: 3,
    notes: '',
    enabled: true,
  };
}

function normalizeProjectDocument(project: ProjectDocument): ProjectDocument {
  const scenes = project.scenes.length > 0 ? project.scenes : [createDefaultScene(0)];
  return {
    ...project,
    updatedAt: project.updatedAt || new Date().toISOString(),
    scenes,
    settings: {
      width: project.settings.width,
      height: project.settings.height,
      fps: project.settings.fps,
      backgroundColor: project.settings.backgroundColor,
    },
  };
}

function toProjectInfo(
  project: ProjectDocument,
  path: string | null,
  modified = false,
): ProjectInfo {
  return {
    path,
    name: project.name,
    modified,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

async function syncProjectDocument(
  project: ProjectDocument,
): Promise<{ success: boolean; error?: string }> {
  const result = await window.api.updateProjectDocument(project);
  return { success: result.success, error: result.error };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      currentProjectData: null,
      selectedSceneId: null,
      recentProjects: [],
      isLoading: false,
      error: null,

      setCurrentProject: (project) => {
        set({ currentProject: project, error: null });
      },

      replaceProjectData: (project) => {
        set({
          currentProjectData: project ? normalizeProjectDocument(project) : null,
          selectedSceneId: project?.scenes[0]?.id ?? null,
        });
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
            currentProject: {
              ...currentProject,
              modified,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      addToRecent: (project) => {
        const { recentProjects } = get();
        const filtered = recentProjects.filter((item) => item.path !== project.path);
        set({ recentProjects: [project, ...filtered].slice(0, MAX_RECENT_PROJECTS) });
      },

      removeFromRecent: (path) => {
        const { recentProjects } = get();
        set({ recentProjects: recentProjects.filter((project) => project.path !== path) });
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

      selectScene: (sceneId) => {
        set({ selectedSceneId: sceneId });
      },

      createProject: async (name, path) => {
        set({ isLoading: true, error: null });
        try {
          const result = await window.api.createProject(name, path || '');
          if (result.success && result.project) {
            const document = normalizeProjectDocument(result.project);
            const projectInfo = toProjectInfo(document, result.path ?? null);
            set({
              currentProject: projectInfo,
              currentProjectData: document,
              selectedSceneId: document.scenes[0]?.id ?? null,
              isLoading: false,
            });
            get().addToRecent(projectInfo);
            return true;
          }
          if (!result.canceled) {
            set({ error: result.error || 'Failed to create project', isLoading: false });
          } else {
            set({ isLoading: false });
          }
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
            const document = normalizeProjectDocument(result.project);
            const projectInfo = toProjectInfo(document, result.path ?? null);
            set({
              currentProject: projectInfo,
              currentProjectData: document,
              selectedSceneId: document.scenes[0]?.id ?? null,
              isLoading: false,
            });
            get().addToRecent(projectInfo);
            return true;
          }
          if (!result.canceled) {
            set({ error: result.error || 'Failed to open project', isLoading: false });
          } else {
            set({ isLoading: false });
          }
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
            const refreshed = await window.api.getProjectState();
            const nextDocument = refreshed?.document ?? get().currentProjectData;
            const nextInfo = nextDocument
              ? toProjectInfo(nextDocument, result.path ?? currentProject.path, false)
              : {
                  ...currentProject,
                  path: result.path ?? currentProject.path,
                  modified: false,
                  updatedAt: new Date().toISOString(),
                };

            set({
              currentProject: nextInfo,
              currentProjectData: nextDocument
                ? normalizeProjectDocument(nextDocument)
                : get().currentProjectData,
              isLoading: false,
            });
            get().addToRecent(nextInfo);
            return true;
          }
          if (!result.canceled) {
            set({ error: result.error || 'Failed to save project', isLoading: false });
          } else {
            set({ isLoading: false });
          }
          return false;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          return false;
        }
      },

      saveProjectAs: async () => {
        const { currentProject } = get();
        if (!currentProject) {
          set({ error: 'No project to save' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const result = await window.api.saveProjectAs();
          if (result.success) {
            const refreshed = await window.api.getProjectState();
            const nextDocument = refreshed?.document ?? get().currentProjectData;
            const nextInfo = nextDocument
              ? toProjectInfo(nextDocument, result.path ?? currentProject.path, false)
              : {
                  ...currentProject,
                  path: result.path ?? currentProject.path,
                  modified: false,
                  updatedAt: new Date().toISOString(),
                };

            set({
              currentProject: nextInfo,
              currentProjectData: nextDocument
                ? normalizeProjectDocument(nextDocument)
                : get().currentProjectData,
              isLoading: false,
            });
            get().addToRecent(nextInfo);
            return true;
          }
          if (!result.canceled) {
            set({ error: result.error || 'Failed to save project', isLoading: false });
          } else {
            set({ isLoading: false });
          }
          return false;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          return false;
        }
      },

      closeProject: async () => {
        try {
          const result = await window.api.closeProject();
          if (result.success) {
            set({
              currentProject: null,
              currentProjectData: null,
              selectedSceneId: null,
              error: null,
            });
            return true;
          }
          set({ error: result.error || 'Failed to close project' });
          return false;
        } catch (error) {
          set({ error: String(error) });
          return false;
        }
      },

      updateProjectName: async (name) => {
        const { currentProjectData, currentProject } = get();
        if (!currentProjectData || !currentProject) {
          return false;
        }

        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          name,
          updatedAt: new Date().toISOString(),
        });
        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to update project' });
        }
        return result.success;
      },

      updateProjectSettings: async (updates) => {
        const { currentProjectData, currentProject } = get();
        if (!currentProjectData || !currentProject) {
          return false;
        }

        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          updatedAt: new Date().toISOString(),
          settings: {
            ...currentProjectData.settings,
            ...updates,
          },
        });
        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to update project settings' });
        }
        return result.success;
      },

      addScene: async () => {
        const { currentProjectData, currentProject } = get();
        if (!currentProjectData || !currentProject) {
          return false;
        }

        const nextScene = createDefaultScene(currentProjectData.scenes.length);
        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          updatedAt: new Date().toISOString(),
          scenes: [...currentProjectData.scenes, nextScene],
        });
        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          selectedSceneId: nextScene.id,
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to add scene' });
        }
        return result.success;
      },

      updateScene: async (sceneId, updates) => {
        const { currentProjectData, currentProject } = get();
        if (!currentProjectData || !currentProject) {
          return false;
        }

        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          updatedAt: new Date().toISOString(),
          scenes: currentProjectData.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...updates } : scene,
          ),
        });
        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to update scene' });
        }
        return result.success;
      },

      duplicateScene: async (sceneId) => {
        const { currentProjectData, currentProject } = get();
        if (!currentProjectData || !currentProject) {
          return false;
        }

        const sourceScene = currentProjectData.scenes.find((scene) => scene.id === sceneId);
        if (!sourceScene) {
          return false;
        }

        const duplicate: ProjectScene = {
          ...sourceScene,
          id: createSceneId(),
          name: `${sourceScene.name} Copy`,
        };

        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          updatedAt: new Date().toISOString(),
          scenes: [...currentProjectData.scenes, duplicate],
        });
        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          selectedSceneId: duplicate.id,
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to duplicate scene' });
        }
        return result.success;
      },

      removeScene: async (sceneId) => {
        const { currentProjectData, currentProject, selectedSceneId } = get();
        if (!currentProjectData || !currentProject || currentProjectData.scenes.length <= 1) {
          return false;
        }

        const nextScenes = currentProjectData.scenes.filter((scene) => scene.id !== sceneId);
        const nextSelectedScene =
          selectedSceneId === sceneId ? (nextScenes[0]?.id ?? null) : selectedSceneId;
        const nextDocument = normalizeProjectDocument({
          ...currentProjectData,
          updatedAt: new Date().toISOString(),
          scenes: nextScenes,
        });

        set({
          currentProjectData: nextDocument,
          currentProject: toProjectInfo(nextDocument, currentProject.path, true),
          selectedSceneId: nextSelectedScene,
          error: null,
        });

        const result = await syncProjectDocument(nextDocument);
        if (!result.success) {
          set({ error: result.error || 'Failed to remove scene' });
        }
        return result.success;
      },
    }),
    {
      name: 'kinema-project',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
      }),
    },
  ),
);
