import type { ElectronAPI } from '@electron-toolkit/preload';
import type { ProjectDocument, ProjectSnapshot } from './project';

interface CommandResult {
  success: boolean;
  canceled?: boolean;
  error?: string;
}

interface ProjectCommandResult extends CommandResult {
  path?: string | null;
  project?: ProjectDocument;
}

interface DirectoryCommandResult extends CommandResult {
  path?: string;
}

type ExportPreset = 'render-plan' | 'project-snapshot';

interface RenderRequest {
  format: ExportPreset;
  width: number;
  height: number;
  fps: number;
  quality: number;
  outputPath?: string;
}

interface RenderCommandResult extends CommandResult {
  outputPath?: string;
}

interface WorkstationApi {
  createProject: (name: string, path: string) => Promise<ProjectCommandResult>;
  openProject: (path?: string) => Promise<ProjectCommandResult>;
  getProjectState: () => Promise<ProjectSnapshot | null>;
  updateProjectDocument: (project: ProjectDocument) => Promise<CommandResult>;
  saveProject: () => Promise<ProjectCommandResult>;
  saveProjectAs: () => Promise<ProjectCommandResult>;
  closeProject: () => Promise<CommandResult>;
  selectDirectory: () => Promise<DirectoryCommandResult>;
  renderVideo: (config: RenderRequest) => Promise<RenderCommandResult>;
  cancelRender: () => Promise<CommandResult>;
  getTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<CommandResult>;
  getLocale: () => Promise<string>;
  setLocale: (locale: string) => Promise<CommandResult>;
  onThemeChange: (callback: (theme: string) => void) => () => void;
  onLocaleChange: (callback: (locale: string) => void) => () => void;
  onRenderProgress: (callback: (progress: number) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: WorkstationApi;
  }
}

export {};
