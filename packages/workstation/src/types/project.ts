export interface ProjectScene {
  id: string;
  name: string;
  duration: number;
  notes: string;
  enabled: boolean;
}

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

export interface ProjectDocument {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scenes: ProjectScene[];
  settings: ProjectSettings;
}

export interface ProjectSnapshot {
  path: string | null;
  modified: boolean;
  document: ProjectDocument;
}
