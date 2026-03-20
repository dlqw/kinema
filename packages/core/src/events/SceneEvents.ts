/**
 * Scene Events
 *
 * Events emitted during scene lifecycle and object management
 *
 * @module events
 */

import type { ObjectId } from '../types/core';
import type { EventData, EventEmitter } from './EventEmitter';

/**
 * Scene initialization event data
 */
export interface SceneInitData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Scene name
   */
  sceneName: string;

  /**
   * Canvas dimensions
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Background configuration
   */
  background?: {
    color?: string;
    image?: string;
  };
}

/**
 * Object added to scene event data
 */
export interface ObjectAddedData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Object that was added
   */
  object: any;

  /**
   * Object identifier
   */
  objectId: ObjectId;

  /**
   * Parent object (if added as child)
   */
  parentId?: ObjectId;

  /**
   * Index in parent's children array
   */
  index: number;

  /**
   * Timestamp when added
   */
  timestamp: number;
}

/**
 * Object removed from scene event data
 */
export interface ObjectRemovedData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Object that was removed
   */
  object: any;

  /**
   * Object identifier
   */
  objectId: ObjectId;

  /**
   * Parent object it was removed from
   */
  parentId?: ObjectId;

  /**
   * Index where object was before removal
   */
  index: number;

  /**
   * Timestamp when removed
   */
  timestamp: number;
}

/**
 * Object property changed event data
 */
export interface ObjectChangedData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Object identifier
   */
  objectId: ObjectId;

  /**
   * Property name that changed
   */
  property: string;

  /**
   * Previous value
   */
  oldValue: any;

  /**
   * New value
   */
  newValue: any;

  /**
   * Timestamp when changed
   */
  timestamp: number;
}

/**
 * Frame render event data
 */
export interface FrameRenderData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Frame number (0-indexed)
   */
  frameNumber: number;

  /**
   * Current timestamp in milliseconds
   */
  timestamp: number;

  /**
   * Delta time from previous frame in milliseconds
   */
  deltaTime: number;

  /**
   * Frames per second
   */
  fps: number;

  /**
   * Number of objects rendered
   */
  objectCount: number;

  /**
   * Rendering context (if applicable)
   */
  context?: any;
}

/**
 * Before frame render event data
 */
export interface BeforeFrameRenderData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Frame number about to render
   */
  frameNumber: number;

  /**
   * Current timestamp
   */
  timestamp: number;

  /**
   * Delta time from previous frame
   */
  deltaTime: number;

  /**
   * Objects scheduled to render
   */
  scheduledObjects: number;
}

/**
 * After frame render event data
 */
export interface AfterFrameRenderData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Frame number that was rendered
   */
  frameNumber: number;

  /**
   * Current timestamp
   */
  timestamp: number;

  /**
   * Delta time from previous frame
   */
  deltaTime: number;

  /**
   * Number of objects actually rendered
   */
  renderedObjects: number;

  /**
   * Render time in milliseconds
   */
  renderTime: number;
}

/**
 * Scene update event data
 */
export interface SceneUpdateData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Current timestamp
   */
  timestamp: number;

  /**
   * Delta time from last update
   */
  deltaTime: number;

  /**
   * Total elapsed scene time
   */
  elapsedTime: number;

  /**
   * Current scene time (accounting for time scale)
   */
  sceneTime: number;

  /**
   * Time scale multiplier
   */
  timeScale: number;
}

/**
 * Scene pause event data
 */
export interface ScenePauseData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Timestamp when paused
   */
  timestamp: number;

  /**
   * Total elapsed time when paused
   */
  elapsedTime: number;
}

/**
 * Scene resume event data
 */
export interface SceneResumeData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Timestamp when resumed
   */
  timestamp: number;

  /**
   * Total elapsed time at resume
   */
  elapsedTime: number;

  /**
   * Pause duration in milliseconds
   */
  pauseDuration: number;
}

/**
 * Scene clear event data
 */
export interface SceneClearData {
  /**
   * Scene identifier
   */
  sceneId: string;

  /**
   * Number of objects removed
   */
  objectsRemoved: number;

  /**
   * Timestamp when cleared
   */
  timestamp: number;
}

/**
 * Scene events map
 */
export interface SceneEvents {
  /**
   * Emitted when scene is initialized
   */
  init: SceneInitData;

  /**
   * Emitted when an object is added to the scene
   */
  objectAdded: ObjectAddedData;

  /**
   * Emitted when an object is removed from the scene
   */
  objectRemoved: ObjectRemovedData;

  /**
   * Emitted when an object property changes
   */
  objectChanged: ObjectChangedData;

  /**
   * Emitted after each frame is rendered
   */
  frameRender: FrameRenderData;

  /**
   * Emitted before frame rendering starts
   */
  beforeFrameRender: BeforeFrameRenderData;

  /**
   * Emitted after frame rendering completes
   */
  afterFrameRender: AfterFrameRenderData;

  /**
   * Emitted on each scene update tick
   */
  update: SceneUpdateData;

  /**
   * Emitted when scene is paused
   */
  pause: ScenePauseData;

  /**
   * Emitted when scene resumes from pause
   */
  resume: SceneResumeData;

  /**
   * Emitted when scene is cleared
   */
  clear: SceneClearData;
}

/**
 * Scene event emitter type
 */
export type SceneEventEmitter = EventEmitter<SceneEvents>;

/**
 * Helper type for scene event handler
 */
export type SceneEventHandler<K extends keyof SceneEvents> = (
  data: EventData<SceneEvents[K]>
) => void | Promise<void>;

/**
 * Scene event names
 */
export const SceneEventNames = {
  INIT: 'init',
  OBJECT_ADDED: 'objectAdded',
  OBJECT_REMOVED: 'objectRemoved',
  OBJECT_CHANGED: 'objectChanged',
  FRAME_RENDER: 'frameRender',
  BEFORE_FRAME_RENDER: 'beforeFrameRender',
  AFTER_FRAME_RENDER: 'afterFrameRender',
  UPDATE: 'update',
  PAUSE: 'pause',
  RESUME: 'resume',
  CLEAR: 'clear',
} as const;

/**
 * Create object added event data helper
 */
export function createObjectAddedData(
  sceneId: string,
  object: any,
  objectId: ObjectId,
  parentId: ObjectId | undefined,
  index: number,
  timestamp: number
): ObjectAddedData {
  return {
    sceneId,
    object,
    objectId,
    parentId,
    index,
    timestamp,
  };
}

/**
 * Create object removed event data helper
 */
export function createObjectRemovedData(
  sceneId: string,
  object: any,
  objectId: ObjectId,
  parentId: ObjectId | undefined,
  index: number,
  timestamp: number
): ObjectRemovedData {
  return {
    sceneId,
    object,
    objectId,
    parentId,
    index,
    timestamp,
  };
}

/**
 * Create frame render event data helper
 */
export function createFrameRenderData(
  sceneId: string,
  frameNumber: number,
  timestamp: number,
  deltaTime: number,
  fps: number,
  objectCount: number,
  context?: any
): FrameRenderData {
  return {
    sceneId,
    frameNumber,
    timestamp,
    deltaTime,
    fps,
    objectCount,
    context,
  };
}

/**
 * Create scene update event data helper
 */
export function createSceneUpdateData(
  sceneId: string,
  timestamp: number,
  deltaTime: number,
  elapsedTime: number,
  sceneTime: number,
  timeScale: number
): SceneUpdateData {
  return {
    sceneId,
    timestamp,
    deltaTime,
    elapsedTime,
    sceneTime,
    timeScale,
  };
}
