/**
 * Scene - Animation container and orchestrator
 *
 * Scenes manage render objects and control animation playback.
 * All scene operations are immutable - they return new scene instances.
 *
 * @module scene/Scene
 */

import type {
  ObjectId,
  SceneConfig,
  SceneSnapshot,
  Point3D,
  DEFAULT_SCENE_CONFIG
} from '../types';
import type { RenderObject } from '../core';
import type { Animation, InterpolationResult } from '../animation';

/**
 * Scene acts as a container and director for animations.
 *
 * Scenes manage the lifecycle of render objects and animations,
 * providing methods for adding/removing objects and scheduling
 * animations for playback.
 *
 * @example
 * ```typescript
 * // Create a scene
 * const scene = new Scene({ width: 1920, height: 1080, fps: 60 });
 *
 * // Add objects
 * const withCircle = scene.addObject(circle);
 *
 * // Schedule animations
 * const animated = withCircle.schedule(fadeIn, 0).schedule(rotate, 1);
 *
 * // Update to specific time
 * const frameAt1Second = animated.updateTo(1.0);
 * ```
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
    public readonly config: SceneConfig,
    public readonly id: string = `scene-${Date.now()}-${Math.random()}`,
    objects?: Map<ObjectId, RenderObject>,
    currentTime?: number,
    animationQueue?: Array<{ animation: Animation; startTime: number }>,
    activeAnimations?: Set<Animation>
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

  // ==========================================================================
  // Time Management
  // ==========================================================================

  /**
   * Get current scene time
   */
  getTime(): number {
    return this.currentTime;
  }

  /**
   * Get scene FPS
   */
  get fps(): number {
    return this.config.fps;
  }

  /**
   * Get scene dimensions
   */
  get dimensions(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  // ==========================================================================
  // Object Management
  // ==========================================================================

  /**
   * Get all objects sorted by z-index
   */
  getObjects(): ReadonlyArray<RenderObject> {
    return Array.from(this.objects.values())
      .sort((a, b) => a.zIndex - b.zIndex);
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
    return this.getObjects().filter(obj => obj.visible);
  }

  /**
   * Add a single object
   */
  addObject(object: RenderObject): Scene {
    const newObjects = new Map(this.objects);
    newObjects.set(object.getState().id, object);
    return this.clone({ objects: newObjects });
  }

  /**
   * Add multiple objects
   */
  addObjects(...objects: RenderObject[]): Scene {
    const newObjects = new Map(this.objects);
    for (const obj of objects) {
      newObjects.set(obj.getState().id, obj);
    }
    return this.clone({ objects: newObjects });
  }

  /**
   * Remove an object by ID
   */
  removeObject(objectId: ObjectId): Scene {
    const newObjects = new Map(this.objects);
    newObjects.delete(objectId);
    return this.clone({ objects: newObjects });
  }

  /**
   * Remove multiple objects
   */
  removeObjects(...objectIds: ObjectId[]): Scene {
    const newObjects = new Map(this.objects);
    for (const id of objectIds) {
      newObjects.delete(id);
    }
    return this.clone({ objects: newObjects });
  }

  /**
   * Clear all objects
   */
  clear(): Scene {
    return this.clone({ objects: new Map() });
  }

  // ==========================================================================
  // Animation Scheduling
  // ==========================================================================

  /**
   * Schedule a single animation
   */
  schedule(animation: Animation, delay: number = 0): Scene {
    const startTime = this.currentTime + delay;
    const newQueue = [...this.animationQueue, { animation, startTime }];
    return this.clone({ animationQueue: newQueue });
  }

  /**
   * Schedule multiple animations simultaneously
   */
  scheduleAll(animations: ReadonlyArray<Animation>, delay: number = 0): Scene {
    const startTime = this.currentTime + delay;
    const newQueue = [
      ...this.animationQueue,
      ...animations.map(anim => ({ animation: anim, startTime }))
    ];
    return this.clone({ animationQueue: newQueue });
  }

  /**
   * Get scheduled animation count
   */
  get scheduledAnimationCount(): number {
    return this.animationQueue.length;
  }

  /**
   * Get active animation count
   */
  get activeAnimationCount(): number {
    return this.activeAnimations.size;
  }

  // ==========================================================================
  // Time Progression
  // ==========================================================================

  /**
   * Update scene to a specific time
   */
  updateTo(targetTime: number): Scene {
    if (targetTime <= this.currentTime) {
      return this;
    }

    const newObjects = new Map(this.objects);
    const newActiveAnimations = new Set<Animation>();

    // Process queued animations
    for (const { animation, startTime } of this.animationQueue) {
      if (startTime >= this.currentTime && startTime < targetTime) {
        newActiveAnimations.add(animation);
      }
    }

    // Update active animations
    for (const animation of this.activeAnimations) {
      const animStartTime = this.currentTime - animation.getTotalDuration();
      const elapsedTime = targetTime - animStartTime;
      const { object, complete } = animation.interpolate(elapsedTime);

      if (!complete) {
        newObjects.set(object.getState().id, object);
        newActiveAnimations.add(animation);
      }

      if (complete && animation.removeOnComplete) {
        newObjects.delete(object.getState().id);
      }
    }

    // Filter animation queue
    const newQueue = this.animationQueue.filter(
      ({ startTime }) => startTime >= targetTime
    );

    return this.clone({
      objects: newObjects,
      currentTime: targetTime,
      animationQueue: newQueue,
      activeAnimations: newActiveAnimations
    });
  }

  /**
   * Advance time by a delta
   */
  advance(deltaTime: number): Scene {
    return this.updateTo(this.currentTime + deltaTime);
  }

  /**
   * Reset scene to time 0
   */
  reset(): Scene {
    return new Scene(this.config, this.id);
  }

  // ==========================================================================
  // Frame Generation
  // ==========================================================================

  /**
   * Get frame at specific time
   */
  getFrame(time: number): ReadonlyArray<RenderObject> {
    const sceneAtTime = this.updateTo(time);
    return sceneAtTime.getVisibleObjects();
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): ReadonlyArray<RenderObject> {
    return this.getVisibleObjects();
  }

  /**
   * Get total number of frames for a duration
   */
  getFrameCount(duration: number): number {
    return Math.floor(duration * this.config.fps);
  }

  // ==========================================================================
  // Snapshot and State Management
  // ==========================================================================

  /**
   * Create a snapshot of current state
   */
  createSnapshot(): SceneSnapshot {
    return {
      time: this.currentTime,
      objects: Array.from(this.objects.values()),
      metadata: new Map()
    };
  }

  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(snapshot: SceneSnapshot): Scene {
    const newObjects = new Map(
      snapshot.objects.map(obj => [obj.getState().id, obj])
    );

    return this.clone({
      objects: newObjects,
      currentTime: snapshot.time
    });
  }

  /**
   * Save current state for undo/redo
   */
  saveState(): SceneState {
    return {
      time: this.currentTime,
      objects: new Map(this.objects),
      animationQueue: [...this.animationQueue],
      activeAnimations: new Set(this.activeAnimations)
    };
  }

  /**
   * Restore saved state
   */
  restoreState(state: SceneState): Scene {
    return this.clone({
      objects: new Map(state.objects),
      currentTime: state.time,
      animationQueue: [...state.animationQueue],
      activeAnimations: new Set(state.activeAnimations)
    });
  }

  // ==========================================================================
  // Hit Testing and Queries
  // ==========================================================================

  /**
   * Find objects at a point
   */
  findObjectsAtPoint(point: Point3D): ReadonlyArray<RenderObject> {
    return this.getObjects().filter(obj => obj.containsPoint(point));
  }

  /**
   * Get topmost object at a point
   */
  getObjectAtPoint(point: Point3D): RenderObject | undefined {
    const objects = this.findObjectsAtPoint(point);
    return objects[objects.length - 1];
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Clone with partial updates (internal)
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
      updates.objects ?? this._objects,
      updates.currentTime ?? this._currentTime,
      updates.animationQueue ?? this._animationQueue,
      updates.activeAnimations ?? this._activeAnimations
    );
  }

  /**
   * Get a string representation
   */
  toString(): string {
    return `Scene(id="${this.id}", objects=${this.objects.size}, time=${this.currentTime.toFixed(2)}s)`;
  }

  /**
   * Get JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      config: this.config,
      time: this.currentTime,
      objectCount: this.objects.size,
      scheduledAnimations: this.animationQueue.length,
      activeAnimations: this.activeAnimations.size
    };
  }
}

/**
 * Scene state for undo/redo
 */
export interface SceneState {
  readonly time: number;
  readonly objects: Map<ObjectId, RenderObject>;
  readonly animationQueue: Array<{ animation: Animation; startTime: number }>;
  readonly activeAnimations: Set<Animation>;
}

/**
 * Scene builder for fluent API
 */
export class SceneBuilder {
  private config: Partial<SceneConfig> = {};

  /**
   * Set scene dimensions
   */
  withDimensions(width: number, height: number): SceneBuilder {
    this.config.width = width;
    this.config.height = height;
    return this;
  }

  /**
   * Set frame rate
   */
  withFps(fps: number): SceneBuilder {
    this.config.fps = fps;
    return this;
  }

  /**
   * Set background color
   */
  withBackgroundColor(color: string): SceneBuilder {
    this.config.backgroundColor = color;
    return this;
  }

  /**
   * Build the scene
   */
  build(id?: string): Scene {
    const fullConfig: SceneConfig = {
      width: this.config.width ?? 1920,
      height: this.config.height ?? 1080,
      fps: this.config.fps ?? 60,
      backgroundColor: this.config.backgroundColor
    };

    return new Scene(fullConfig, id);
  }
}

/**
 * Create a scene with default configuration
 */
export function createScene(config?: Partial<SceneConfig>): Scene {
  const fullConfig: SceneConfig = {
    width: config?.width ?? 1920,
    height: config?.height ?? 1080,
    fps: config?.fps ?? 60,
    backgroundColor: config?.backgroundColor
  };

  return new Scene(fullConfig);
}

/**
 * Create a scene builder
 */
export function sceneBuilder(): SceneBuilder {
  return new SceneBuilder();
}

/**
 * Default export
 */
export default Scene;
