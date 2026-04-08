/**
 * Scene Type Definitions
 *
 * This file defines scene-related types and interfaces.
 * Scenes act as containers for render objects and manage animation playback.
 *
 * @module types/scene
 */

import type { RenderObject, ObjectId, Point3D } from './core';
import type { Animation } from './animation';

/**
 * ============================================================================
 * Scene Configuration
 * ============================================================================
 */

/**
 * Scene configuration options
 */
export interface SceneConfig {
  /** Scene width in pixels */
  width: number;
  /** Scene height in pixels */
  height: number;
  /** Background color (CSS color string) */
  backgroundColor?: string;
  /** Frames per second for animation */
  fps: number;
}

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE_CONFIG: SceneConfig = Object.freeze({
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  fps: 60,
});

/**
 * ============================================================================
 * Scene State
 * ============================================================================
 */

/**
 * Scene snapshot for undo/redo functionality
 */
export interface SceneSnapshot {
  /** Snapshot time */
  readonly time: number;
  /** Objects in the scene */
  readonly objects: ReadonlyArray<RenderObject>;
  /** Optional metadata */
  readonly metadata?: ReadonlyMap<string, unknown>;
}

/**
 * Scene state at a specific point in time
 */
export interface SceneState {
  /** Current time */
  readonly time: number;
  /** All render objects */
  readonly objects: ReadonlyMap<ObjectId, RenderObject>;
  /** Active animations */
  readonly activeAnimations: ReadonlySet<Animation>;
  /** Animation queue */
  readonly animationQueue: ReadonlyArray<{
    animation: Animation;
    startTime: number;
  }>;
}

/**
 * ============================================================================
 * Scene Class
 * ============================================================================
 */

/**
 * Scene - container and orchestrator for animations
 *
 * Scenes manage render objects and control animation playback.
 * All scene operations are immutable - they return new scene instances.
 */
export class Scene {
  private readonly _objects: Map<ObjectId, RenderObject>;
  private readonly _currentTime: number;
  private readonly _animationQueue: Array<{
    animation: Animation;
    startTime: number;
  }>;
  private readonly _activeAnimations: Set<Animation>;

  /**
   * Creates a new Scene instance
   *
   * @param config - Scene configuration
   * @param id - Optional scene identifier
   * @param objects - Internal: objects map for cloning
   * @param currentTime - Internal: current time for cloning
   * @param animationQueue - Internal: animation queue for cloning
   * @param activeAnimations - Internal: active animations for cloning
   * @internal
   */
  constructor(
    /** Scene configuration */
    public readonly config: SceneConfig,
    /** Unique scene identifier */
    public readonly id: string = `scene-${Date.now()}-${Math.random()}`,
    objects?: Map<ObjectId, RenderObject>,
    currentTime?: number,
    animationQueue?: Array<{ animation: Animation; startTime: number }>,
    activeAnimations?: Set<Animation>,
  ) {
    this._objects = objects ?? new Map();
    this._currentTime = currentTime ?? 0;
    this._animationQueue = animationQueue ?? [];
    this._activeAnimations = activeAnimations ?? new Set();
  }

  /**
   * Get objects map
   */
  get objects(): Map<ObjectId, RenderObject> {
    return this._objects;
  }

  /**
   * Get current time
   */
  get currentTime(): number {
    return this._currentTime;
  }

  /**
   * Get animation queue
   */
  get animationQueue(): Array<{ animation: Animation; startTime: number }> {
    return this._animationQueue;
  }

  /**
   * Get active animations
   */
  get activeAnimations(): Set<Animation> {
    return this._activeAnimations;
  }

  /**
   * Get current scene time
   */
  getTime(): number {
    return this.currentTime;
  }

  /**
   * Get all objects in the scene (sorted by z-index)
   */
  getObjects(): ReadonlyArray<RenderObject> {
    return Array.from(this.objects.values()).sort(
      (a, b) => a.getState().z_index - b.getState().z_index,
    );
  }

  /**
   * Get object by ID
   */
  getObject(id: ObjectId): RenderObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get visible objects only
   */
  getVisibleObjects(): ReadonlyArray<RenderObject> {
    return this.getObjects().filter((obj) => obj.visible);
  }

  /**
   * Add an object to the scene
   *
   * @param object Object to add
   * @returns New scene instance with the object added
   */
  addObject(object: RenderObject): Scene {
    const newObjects = new Map(this.objects);
    newObjects.set(object.getState().id, object);

    return this.clone({
      objects: newObjects,
    });
  }

  /**
   * Add multiple objects to the scene
   *
   * @param objects Objects to add
   * @returns New scene instance with objects added
   */
  addObjects(...objects: RenderObject[]): Scene {
    const newObjects = new Map(this.objects);
    for (const obj of objects) {
      newObjects.set(obj.getState().id, obj);
    }

    return this.clone({
      objects: newObjects,
    });
  }

  /**
   * Remove an object from the scene
   *
   * @param objectId ID of object to remove
   * @returns New scene instance with object removed
   */
  removeObject(objectId: ObjectId): Scene {
    const newObjects = new Map(this.objects);
    newObjects.delete(objectId);

    return this.clone({
      objects: newObjects,
    });
  }

  /**
   * Remove multiple objects from the scene
   *
   * @param objectIds IDs of objects to remove
   * @returns New scene instance with objects removed
   */
  removeObjects(...objectIds: ObjectId[]): Scene {
    const newObjects = new Map(this.objects);
    for (const id of objectIds) {
      newObjects.delete(id);
    }

    return this.clone({
      objects: newObjects,
    });
  }

  /**
   * Clear all objects from the scene
   *
   * @returns New scene instance with no objects
   */
  clear(): Scene {
    return this.clone({
      objects: new Map(),
    });
  }

  /**
   * Schedule an animation to play
   *
   * @param animation Animation to schedule
   * @param delay Delay before starting (seconds)
   * @returns New scene instance with animation scheduled
   */
  schedule(animation: Animation, delay: number = 0): Scene {
    const startTime = this.currentTime + delay;
    const newQueue = [...this.animationQueue, { animation, startTime }];

    return this.clone({
      animationQueue: newQueue,
    });
  }

  /**
   * Schedule multiple animations to play simultaneously
   *
   * @param animations Animations to schedule
   * @param delay Delay before starting (seconds)
   * @returns New scene instance with animations scheduled
   */
  scheduleAll(animations: ReadonlyArray<Animation>, delay: number = 0): Scene {
    const startTime = this.currentTime + delay;
    const newQueue = [
      ...this.animationQueue,
      ...animations.map((anim) => ({ animation: anim, startTime })),
    ];

    return this.clone({
      animationQueue: newQueue,
    });
  }

  /**
   * Update scene to a specific time
   *
   * @param targetTime Target time in seconds
   * @returns New scene instance at the target time
   */
  updateTo(targetTime: number): Scene {
    if (targetTime <= this.currentTime) {
      return this;
    }

    const newObjects = new Map(this.objects);
    const newActiveAnimations = new Set<Animation>();
    const animationsToProcess: Animation[] = [];

    // Process queued animations - add to process list
    for (const { animation, startTime } of this.animationQueue) {
      if (startTime >= this.currentTime && startTime < targetTime) {
        animationsToProcess.push(animation);
      }
    }

    // Also include currently active animations
    for (const animation of Array.from(this.activeAnimations)) {
      animationsToProcess.push(animation);
    }

    // Update all animations that need processing
    for (const animation of animationsToProcess) {
      // Calculate animation start time relative to scene time
      const animationScheduleTime = this.currentTime;
      const elapsedTime = targetTime - animationScheduleTime;

      const { object, complete } = animation.interpolate(elapsedTime);

      if (!complete) {
        newObjects.set(object.getState().id, object);
        newActiveAnimations.add(animation);
      }

      if (complete && animation.isRemover()) {
        newObjects.delete(object.getState().id);
      }
    }

    // Filter animation queue - remove processed animations
    const newQueue = this.animationQueue.filter(({ startTime }) => startTime >= targetTime);

    return this.clone({
      objects: newObjects,
      currentTime: targetTime,
      animationQueue: newQueue,
      activeAnimations: newActiveAnimations,
    });
  }

  /**
   * Create a snapshot of current scene state
   */
  createSnapshot(): SceneSnapshot {
    return {
      time: this.currentTime,
      objects: Array.from(this.objects.values()),
      metadata: new Map(),
    };
  }

  /**
   * Restore scene from a snapshot
   *
   * @param snapshot Snapshot to restore from
   * @returns New scene instance restored from snapshot
   */
  restoreFromSnapshot(snapshot: SceneSnapshot): Scene {
    const newObjects = new Map(snapshot.objects.map((obj) => [obj.getState().id, obj]));

    return this.clone({
      objects: newObjects,
      currentTime: snapshot.time,
    });
  }

  /**
   * Get scene state as a plain object
   */
  getState(): SceneState {
    return {
      time: this.currentTime,
      objects: this.objects,
      activeAnimations: this.activeAnimations,
      animationQueue: this.animationQueue,
    };
  }

  /**
   * Find objects at a specific point
   *
   * @param point Point to check
   * @returns Array of objects containing the point (topmost last)
   */
  findObjectsAtPoint(point: Point3D): ReadonlyArray<RenderObject> {
    return this.getObjects().filter((obj) => obj.containsPoint(point));
  }

  /**
   * Get the topmost object at a specific point
   *
   * @param point Point to check
   * @returns Topmost object or undefined
   */
  getObjectAtPoint(point: Point3D): RenderObject | undefined {
    const objects = this.findObjectsAtPoint(point);
    return objects[objects.length - 1];
  }

  /**
   * Clone scene with partial updates (internal method)
   */
  private clone(updates: {
    objects?: Map<ObjectId, RenderObject>;
    currentTime?: number;
    animationQueue?: Array<{ animation: Animation; startTime: number }>;
    activeAnimations?: Set<Animation>;
  }): Scene {
    return new Scene(
      this.config,
      this.id,
      updates.objects ?? this.objects,
      updates.currentTime ?? this.currentTime,
      updates.animationQueue ?? this.animationQueue,
      updates.activeAnimations ?? this.activeAnimations,
    );
  }
}

/**
 * ============================================================================
 * Scene Builder
 * ============================================================================
 */

/**
 * Builder for creating scenes with a fluent API
 */
export class SceneBuilder {
  private _width?: number;
  private _height?: number;
  private _backgroundColor?: string;
  private _fps?: number;

  /**
   * Set scene dimensions
   */
  withDimensions(width: number, height: number): SceneBuilder {
    this._width = width;
    this._height = height;
    return this;
  }

  /**
   * Set background color
   */
  withBackgroundColor(color: string): SceneBuilder {
    this._backgroundColor = color;
    return this;
  }

  /**
   * Set frame rate
   */
  withFps(fps: number): SceneBuilder {
    this._fps = fps;
    return this;
  }

  /**
   * Build the scene instance
   */
  build(id?: string): Scene {
    // Build config with optional backgroundColor handling
    const config: SceneConfig = {
      width: this._width ?? DEFAULT_SCENE_CONFIG.width,
      height: this._height ?? DEFAULT_SCENE_CONFIG.height,
      fps: this._fps ?? DEFAULT_SCENE_CONFIG.fps,
    };

    // Only add backgroundColor if it was explicitly set
    if (this._backgroundColor !== undefined) {
      Object.assign(config, { backgroundColor: this._backgroundColor });
    }

    return new Scene(config, id);
  }
}

/**
 * ============================================================================
 * Helper Functions
 * ============================================================================
 */

/**
 * Create a new scene with default configuration
 */
export function createScene(config?: Partial<SceneConfig>): Scene {
  const fullConfig: SceneConfig = {
    ...DEFAULT_SCENE_CONFIG,
    ...config,
  };

  return new Scene(fullConfig);
}

/**
 * Create a scene builder
 */
export function sceneBuilder(): SceneBuilder {
  return new SceneBuilder();
}
