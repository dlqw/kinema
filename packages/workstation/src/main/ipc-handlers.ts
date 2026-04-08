/**
 * IPC Handlers for Electron main process
 *
 * Handles all IPC communication between main and renderer processes
 */

import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { basename, extname, join } from 'node:path';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { ProjectDocument, ProjectScene, ProjectSettings } from '../types/project';

// Project state management
interface ProjectState {
  path: string | null;
  name: string | null;
  modified: boolean;
  data: ProjectDocument | null;
}

interface RenderRequest {
  format?: 'render-plan' | 'project-snapshot';
  width?: number;
  height?: number;
  fps?: number;
  quality?: number;
  outputPath?: string;
}

let currentProject: ProjectState = {
  path: null,
  name: null,
  modified: false,
  data: null,
};

// Settings storage
interface Settings {
  theme: 'light' | 'dark';
  locale: string;
  recentProjects: string[];
}

const defaultSettings: Settings = {
  theme: 'dark',
  locale: 'en',
  recentProjects: [],
};

let settings: Settings = { ...defaultSettings };
let activeRenderJob: { cancelled: boolean } | null = null;

function createSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultScene(index = 0): ProjectScene {
  return {
    id: createSceneId(),
    name: `Scene ${String(index + 1).padStart(2, '0')}`,
    duration: 3,
    notes: '',
    enabled: true,
  };
}

function normalizeScene(scene: unknown, index: number): ProjectScene {
  if (typeof scene !== 'object' || scene === null) {
    return createDefaultScene(index);
  }

  const value = scene as Partial<ProjectScene>;
  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createSceneId(),
    name:
      typeof value.name === 'string' && value.name.trim().length > 0
        ? value.name
        : `Scene ${String(index + 1).padStart(2, '0')}`,
    duration:
      typeof value.duration === 'number' && Number.isFinite(value.duration) && value.duration > 0
        ? value.duration
        : 3,
    notes: typeof value.notes === 'string' ? value.notes : '',
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
  };
}

function normalizeSettings(settingsValue: unknown): ProjectSettings {
  if (typeof settingsValue !== 'object' || settingsValue === null) {
    return {
      width: 1920,
      height: 1080,
      fps: 30,
      backgroundColor: '#0f172a',
    };
  }

  const value = settingsValue as Partial<ProjectSettings>;
  return {
    width:
      typeof value.width === 'number' && Number.isFinite(value.width) && value.width >= 320
        ? Math.floor(value.width)
        : 1920,
    height:
      typeof value.height === 'number' && Number.isFinite(value.height) && value.height >= 240
        ? Math.floor(value.height)
        : 1080,
    fps:
      typeof value.fps === 'number' && Number.isFinite(value.fps) && value.fps >= 1
        ? Math.floor(value.fps)
        : 30,
    backgroundColor:
      typeof value.backgroundColor === 'string' && value.backgroundColor.length > 0
        ? value.backgroundColor
        : '#0f172a',
  };
}

function normalizeProjectDocument(
  projectData: Partial<ProjectDocument>,
  fallbackName: string,
): ProjectDocument {
  const createdAt = projectData.createdAt ?? new Date().toISOString();
  const scenes = Array.isArray(projectData.scenes)
    ? projectData.scenes.map((scene, index) => normalizeScene(scene, index))
    : [createDefaultScene(0)];

  return {
    version: projectData.version ?? '0.1.0',
    name:
      typeof projectData.name === 'string' && projectData.name.trim().length > 0
        ? projectData.name
        : fallbackName,
    createdAt,
    updatedAt: projectData.updatedAt ?? createdAt,
    scenes: scenes.length > 0 ? scenes : [createDefaultScene(0)],
    settings: normalizeSettings(projectData.settings),
  };
}

function ensureExtension(filePath: string, extension: string): string {
  return filePath.toLowerCase().endsWith(extension) ? filePath : `${filePath}${extension}`;
}

function buildDefaultProjectData(name: string): ProjectDocument {
  return normalizeProjectDocument({ name }, name);
}

function syncCurrentProject(filePath: string, projectData: ProjectDocument): void {
  currentProject = {
    path: filePath,
    name: projectData.name,
    modified: false,
    data: projectData,
  };
}

function getProjectDisplayName(filePath: string, projectData: Partial<ProjectDocument>): string {
  return projectData.name?.trim() || basename(filePath, extname(filePath));
}

async function resolveProjectOpenPath(requestedPath?: string): Promise<string | null> {
  if (requestedPath && requestedPath.trim().length > 0) {
    return requestedPath;
  }

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Kinema Project', extensions: ['kinema'] }],
    title: 'Open Kinema Project',
  });

  if (result.canceled || result.filePaths.length === 0 || !result.filePaths[0]) {
    return null;
  }

  return result.filePaths[0];
}

async function resolveProjectSavePath(forcePrompt: boolean): Promise<string | null> {
  if (!forcePrompt && currentProject.path) {
    return currentProject.path;
  }

  const defaultName = currentProject.name ?? 'Untitled';
  const defaultPath = currentProject.path ?? `${defaultName}.kinema`;
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Kinema Project', extensions: ['kinema'] }],
    defaultPath,
    title: forcePrompt ? 'Save Kinema Project As' : 'Save Kinema Project',
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return ensureExtension(result.filePath, '.kinema');
}

function emitToAllWindows(channel: string, payload: unknown): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, payload);
  });
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function assertRenderActive(job: { cancelled: boolean }): void {
  if (job.cancelled) {
    throw new Error('Render cancelled');
  }
}

async function writeProjectToPath(filePath: string): Promise<void> {
  if (!currentProject.data) {
    throw new Error('No project data available');
  }

  currentProject.data = normalizeProjectDocument(
    {
      ...currentProject.data,
      name: getProjectDisplayName(filePath, currentProject.data),
      updatedAt: new Date().toISOString(),
    },
    getProjectDisplayName(filePath, currentProject.data),
  );
  await writeFile(filePath, JSON.stringify(currentProject.data, null, 2));
  syncCurrentProject(filePath, currentProject.data);
  addToRecentProjects(filePath);
}

// ============================================================================
// Project Management IPC Handlers
// ============================================================================

ipcMain.handle('project:create', async (_event, name: string, path: string) => {
  try {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (!path || path.trim().length === 0) {
      // Open directory picker if no path provided
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select project location',
      });

      if (result.canceled || result.filePaths.length === 0 || !result.filePaths[0]) {
        return { success: false, canceled: true };
      }

      path = result.filePaths[0];
    }

    // Create project directory
    const projectDir = join(path, name);
    await mkdir(projectDir, { recursive: true });

    // Create project file structure
    const projectFile = join(projectDir, `${name}.kinema`);
    const projectData = buildDefaultProjectData(name);

    await writeFile(projectFile, JSON.stringify(projectData, null, 2));

    syncCurrentProject(projectFile, projectData);

    // Add to recent projects
    addToRecentProjects(projectFile);

    return { success: true, path: projectFile, project: projectData };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create project' };
  }
});

ipcMain.handle('project:open', async (_event, requestedPath?: string) => {
  try {
    const filePath = await resolveProjectOpenPath(requestedPath);
    if (!filePath) {
      return { success: false, canceled: true };
    }

    const content = await readFile(filePath, 'utf-8');
    const rawData = JSON.parse(content) as Partial<ProjectDocument>;
    const projectData = normalizeProjectDocument(rawData, getProjectDisplayName(filePath, rawData));

    syncCurrentProject(filePath, projectData);

    // Add to recent projects
    addToRecentProjects(filePath);

    return { success: true, project: projectData, path: filePath };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to open project' };
  }
});

ipcMain.handle('project:get-state', async () => {
  if (!currentProject.data) {
    return null;
  }

  return {
    path: currentProject.path,
    modified: currentProject.modified,
    document: currentProject.data,
  };
});

ipcMain.handle('project:update', async (_event, project: Partial<ProjectDocument>) => {
  try {
    if (!currentProject.data) {
      throw new Error('No project is currently open');
    }

    const nextDocument = normalizeProjectDocument(
      {
        ...currentProject.data,
        ...project,
        updatedAt: new Date().toISOString(),
      },
      currentProject.name ?? currentProject.data.name,
    );

    currentProject = {
      ...currentProject,
      name: nextDocument.name,
      modified: true,
      data: nextDocument,
    };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update project' };
  }
});

ipcMain.handle('project:save', async () => {
  try {
    const filePath = await resolveProjectSavePath(false);
    if (!filePath) {
      return { success: false, canceled: true };
    }

    await writeProjectToPath(filePath);

    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to save project' };
  }
});

ipcMain.handle('project:save-as', async () => {
  try {
    const filePath = await resolveProjectSavePath(true);
    if (!filePath) {
      return { success: false, canceled: true };
    }

    await writeProjectToPath(filePath);

    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to save project' };
  }
});

ipcMain.handle('project:close', async () => {
  currentProject = {
    path: null,
    name: null,
    modified: false,
    data: null,
  };
  return { success: true };
});

ipcMain.handle('dialog:select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select project location',
    });

    if (result.canceled || result.filePaths.length === 0 || !result.filePaths[0]) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to select directory' };
  }
});

// ============================================================================
// Video Operations IPC Handlers
// ============================================================================

ipcMain.handle('video:render', async (_event, config: RenderRequest) => {
  try {
    if (!currentProject.data || !currentProject.name) {
      throw new Error('Open a project before exporting');
    }
    if (activeRenderJob) {
      throw new Error('Another export is already running');
    }

    const job = { cancelled: false };
    activeRenderJob = job;

    const format = config.format === 'project-snapshot' ? 'project-snapshot' : 'render-plan';
    const suggestedName = currentProject.name.replace(/[<>:"/\\|?*]+/g, '-');
    const defaultExtension = format === 'project-snapshot' ? '.project.json' : '.render.json';
    const result = config.outputPath
      ? { canceled: false, filePath: ensureExtension(config.outputPath, defaultExtension) }
      : await dialog.showSaveDialog({
          title: format === 'project-snapshot' ? 'Export Project Snapshot' : 'Export Render Plan',
          defaultPath: `${suggestedName}${defaultExtension}`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });

    if (result.canceled || !result.filePath) {
      activeRenderJob = null;
      return { success: false, canceled: true };
    }

    const outputPath = ensureExtension(result.filePath, defaultExtension);
    const now = new Date().toISOString();
    const width = Math.max(320, Math.floor(config.width ?? 1920));
    const height = Math.max(240, Math.floor(config.height ?? 1080));
    const fps = Math.max(1, Math.floor(config.fps ?? 30));
    const quality = Math.max(0.1, Math.min(1, config.quality ?? 0.9));

    emitToAllWindows('render:progress', 10);
    await delay(50);
    assertRenderActive(job);

    emitToAllWindows('render:progress', 35);
    const payload = {
      kind: format === 'project-snapshot' ? 'kinema-project-snapshot' : 'kinema-render-plan',
      exportedAt: now,
      project: {
        path: currentProject.path,
        name: currentProject.name,
        createdAt: currentProject.data.createdAt,
        updatedAt: currentProject.data.updatedAt ?? now,
      },
      export: {
        format,
        width,
        height,
        fps,
        quality,
      },
      data: currentProject.data,
    };

    await delay(50);
    assertRenderActive(job);

    emitToAllWindows('render:progress', 75);
    await writeFile(outputPath, JSON.stringify(payload, null, 2));

    await delay(50);
    assertRenderActive(job);
    emitToAllWindows('render:progress', 100);

    activeRenderJob = null;
    return { success: true, outputPath };
  } catch (error: any) {
    activeRenderJob = null;
    return { success: false, error: error?.message || 'Failed to render video' };
  }
});

ipcMain.handle('video:cancel', async () => {
  if (activeRenderJob) {
    activeRenderJob.cancelled = true;
    emitToAllWindows('render:progress', 0);
    activeRenderJob = null;
  }
  return { success: true };
});

// ============================================================================
// Theme and Settings IPC Handlers
// ============================================================================

ipcMain.handle('theme:get', async () => {
  return settings.theme;
});

ipcMain.handle('theme:set', async (_event, theme: string) => {
  if (theme === 'light' || theme === 'dark') {
    settings.theme = theme;
    await saveSettings();

    // Notify all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('theme:changed', theme);
    });

    return { success: true };
  }
  return { success: false, error: 'Invalid theme' };
});

ipcMain.handle('locale:get', async () => {
  return settings.locale;
});

ipcMain.handle('locale:set', async (_event, locale: string) => {
  if (typeof locale === 'string' && locale.length > 0) {
    settings.locale = locale;
    await saveSettings();

    // Notify all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('locale:changed', locale);
    });

    return { success: true };
  }
  return { success: false, error: 'Invalid locale' };
});

// ============================================================================
// Settings Storage
// ============================================================================

const SETTINGS_FILE = 'kinema-settings.json';

async function saveSettings(): Promise<void> {
  try {
    const userDataPath = join(app.getPath('userData'), SETTINGS_FILE);
    await writeFile(userDataPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

async function loadSettings(): Promise<void> {
  try {
    const userDataPath = join(app.getPath('userData'), SETTINGS_FILE);
    if (existsSync(userDataPath)) {
      const content = await readFile(userDataPath, 'utf-8');
      const loaded = JSON.parse(content);
      settings = { ...defaultSettings, ...loaded };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    settings = { ...defaultSettings };
  }
}

function addToRecentProjects(path: string): void {
  const index = settings.recentProjects.indexOf(path);
  if (index > -1) {
    settings.recentProjects.splice(index, 1);
  }
  settings.recentProjects.unshift(path);
  settings.recentProjects = settings.recentProjects.slice(0, 10); // Keep last 10
  void saveSettings();
}

// ============================================================================
// Exports
// ============================================================================

export { currentProject, settings, loadSettings, saveSettings };
