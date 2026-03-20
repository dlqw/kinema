/**
 * IPC Handlers for Electron main process
 *
 * Handles all IPC communication between main and renderer processes
 */

import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { join } from 'node:path'
import { writeFile, readFile, mkdir, existsSync } from 'node:fs/promises'

// Project state management
interface ProjectState {
  path: string | null
  name: string | null
  modified: boolean
  data: any
}

let currentProject: ProjectState = {
  path: null,
  name: null,
  modified: false,
  data: null
}

// Settings storage
interface Settings {
  theme: 'light' | 'dark'
  locale: string
  recentProjects: string[]
}

const defaultSettings: Settings = {
  theme: 'dark',
  locale: 'en',
  recentProjects: []
}

let settings: Settings = { ...defaultSettings }

// ============================================================================
// Project Management IPC Handlers
// ============================================================================

ipcMain.handle('project:create', async (_event, name: string, path: string) => {
  try {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required')
    }

    if (!path || path.trim().length === 0) {
      // Open directory picker if no path provided
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select project location'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      path = result.filePaths[0]
    }

    // Create project directory
    const projectDir = join(path, name)
    await mkdir(projectDir, { recursive: true })

    // Create project file structure
    const projectFile = join(projectDir, `${name}.animaker`)
    const projectData = {
      version: '0.1.0',
      name,
      createdAt: new Date().toISOString(),
      scenes: [],
      settings: {}
    }

    await writeFile(projectFile, JSON.stringify(projectData, null, 2))

    // Update current project state
    currentProject = {
      path: projectFile,
      name,
      modified: false,
      data: projectData
    }

    // Add to recent projects
    addToRecentProjects(projectFile)

    return { success: true, path: projectFile }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create project' }
  }
})

ipcMain.handle('project:open', async (_event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'AniMaker Project', extensions: ['animaker'] }],
      title: 'Open AniMaker Project'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    const projectData = JSON.parse(content)

    // Update current project state
    currentProject = {
      path: filePath,
      name: projectData.name,
      modified: false,
      data: projectData
    }

    // Add to recent projects
    addToRecentProjects(filePath)

    return { success: true, project: projectData, path: filePath }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to open project' }
  }
})

ipcMain.handle('project:save', async () => {
  try {
    if (!currentProject.path) {
      // No project open, show save dialog
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'AniMaker Project', extensions: ['animaker'] }],
        title: 'Save AniMaker Project'
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      currentProject.path = result.filePath
    }

    // Save project data
    await writeFile(currentProject.path, JSON.stringify(currentProject.data, null, 2))
    currentProject.modified = false

    return { success: true, path: currentProject.path }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to save project' }
  }
})

ipcMain.handle('project:close', async () => {
  currentProject = {
    path: null,
    name: null,
    modified: false,
    data: null
  }
  return { success: true }
})

// ============================================================================
// Video Operations IPC Handlers
// ============================================================================

ipcMain.handle('video:render', async (_event, config: any) => {
  try {
    // TODO: Implement video rendering
    console.log('Video render config:', config)
    return { success: true, outputPath: '' }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to render video' }
  }
})

ipcMain.handle('video:cancel', async () => {
  try {
    // TODO: Implement render cancellation
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to cancel render' }
  }
})

// ============================================================================
// Theme and Settings IPC Handlers
// ============================================================================

ipcMain.handle('theme:get', async () => {
  return settings.theme
})

ipcMain.handle('theme:set', async (_event, theme: string) => {
  if (theme === 'light' || theme === 'dark') {
    settings.theme = theme
    await saveSettings()

    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('theme:changed', theme)
    })

    return { success: true }
  }
  return { success: false, error: 'Invalid theme' }
})

ipcMain.handle('locale:get', async () => {
  return settings.locale
})

ipcMain.handle('locale:set', async (_event, locale: string) => {
  if (typeof locale === 'string' && locale.length > 0) {
    settings.locale = locale
    await saveSettings()

    // Notify all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('locale:changed', locale)
    })

    return { success: true }
  }
  return { success: false, error: 'Invalid locale' }
})

// ============================================================================
// Settings Storage
// ============================================================================

const SETTINGS_FILE = 'animaker-settings.json'

async function saveSettings(): Promise<void> {
  try {
    const userDataPath = join(app.getPath('userData'), SETTINGS_FILE)
    await writeFile(userDataPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

async function loadSettings(): Promise<void> {
  try {
    const userDataPath = join(app.getPath('userData'), SETTINGS_FILE)
    if (existsSync(userDataPath)) {
      const content = await readFile(userDataPath, 'utf-8')
      const loaded = JSON.parse(content)
      settings = { ...defaultSettings, ...loaded }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    settings = { ...defaultSettings }
  }
}

function addToRecentProjects(path: string): void {
  const index = settings.recentProjects.indexOf(path)
  if (index > -1) {
    settings.recentProjects.splice(index, 1)
  }
  settings.recentProjects.unshift(path)
  settings.recentProjects = settings.recentProjects.slice(0, 10) // Keep last 10
  saveSettings()
}

// ============================================================================
// Exports
// ============================================================================

export {
  currentProject,
  settings,
  loadSettings,
  saveSettings
}
