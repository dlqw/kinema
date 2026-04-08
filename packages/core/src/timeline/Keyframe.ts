/**
 * Keyframe System - Time-based keyframe management
 *
 * Provides keyframe creation, interpolation, and event triggering.
 *
 * @module timeline/Keyframe
 */

import type { RenderObject, Transform, Point3D } from '../types';

/**
 * Keyframe interpolation types
 */
export enum KeyframeInterpolation {
  Linear = 'linear',
  Step = 'step',
  Smooth = 'smooth',
  Cubic = 'cubic',
}

/**
 * Keyframe easing function
 */
export type KeyframeEasing = (t: number) => number;

/**
 * Keyframe definition
 */
export interface KeyframeDefinition {
  /** Keyframe time in seconds */
  time: number;
  /** Target transform state */
  transform: Partial<Transform>;
  /** Interpolation method */
  interpolation?: KeyframeInterpolation;
  /** Easing function */
  easing?: KeyframeEasing;
}

/**
 * Keyframe track for animating a property
 *
 * @example
 * ```typescript
 * const track = KeyframeTrack.create('position')
 *   .at(0, { x: 0, y: 0, z: 0 })
 *   .at(1, { x: 100, y: 0, z: 0 }, KeyframeInterpolation.Smooth)
 *   .at(2, { x: 200, y: 100, z: 0 });
 *
 * const value = track.evaluate(0.5);
 * ```
 */
export class KeyframeTrack {
  private keyframes: Map<number, KeyframeDefinition> = new Map();

  constructor(
    public readonly property: string,
    public readonly target: RenderObject,
  ) {}

  /**
   * Create a new keyframe track
   */
  static create(property: string, target: RenderObject): KeyframeTrack {
    return new KeyframeTrack(property, target);
  }

  /**
   * Add or update a keyframe
   */
  at(
    time: number,
    transform: Partial<Transform>,
    options: {
      interpolation?: KeyframeInterpolation;
      easing?: KeyframeEasing;
    } = {},
  ): KeyframeTrack {
    const keyframe: KeyframeDefinition = {
      time,
      transform,
      interpolation: options.interpolation ?? KeyframeInterpolation.Linear,
    };
    if (options.easing !== undefined) {
      keyframe.easing = options.easing;
    }

    this.keyframes.set(time, keyframe);
    return this;
  }

  /**
   * Remove a keyframe at time
   */
  removeAt(time: number): KeyframeTrack {
    this.keyframes.delete(time);
    return this;
  }

  /**
   * Get all keyframes sorted by time
   */
  getKeyframes(): KeyframeDefinition[] {
    return Array.from(this.keyframes.values()).sort((a, b) => a.time - b.time);
  }

  /**
   * Get keyframe times
   */
  getTimes(): number[] {
    return Array.from(this.keyframes.keys()).sort((a, b) => a - b);
  }

  /**
   * Evaluate the track at a given time
   */
  evaluate(time: number): Partial<Transform> | undefined {
    const times = this.getTimes();

    if (times.length === 0) return undefined;

    const firstTime = times[0]!;
    const lastTime = times[times.length - 1]!;

    // Before first keyframe
    if (time <= firstTime) {
      return this.keyframes.get(firstTime)?.transform;
    }

    // After last keyframe
    if (time >= lastTime) {
      return this.keyframes.get(lastTime)?.transform;
    }

    // Find surrounding keyframes
    let i = 0;
    while (i < times.length - 1 && times[i + 1]! <= time) {
      i++;
    }

    const startTime = times[i]!;
    const endTime = times[i + 1]!;
    const startKeyframe = this.keyframes.get(startTime)!;
    const endKeyframe = this.keyframes.get(endTime)!;

    // Calculate progress between keyframes
    const duration = endTime - startTime;
    const progress = (time - startTime) / duration;

    // Apply easing
    const easedProgress = startKeyframe.easing ? startKeyframe.easing(progress) : progress;

    // Interpolate based on method
    return this.interpolate(
      startKeyframe.transform,
      endKeyframe.transform,
      easedProgress,
      startKeyframe.interpolation ?? KeyframeInterpolation.Linear,
    );
  }

  /**
   * Interpolate between two keyframes
   */
  private interpolate(
    start: Partial<Transform>,
    end: Partial<Transform>,
    t: number,
    method: KeyframeInterpolation,
  ): Partial<Transform> {
    switch (method) {
      case KeyframeInterpolation.Step:
        return t < 0.5 ? start : end;

      case KeyframeInterpolation.Smooth:
        return this.smoothInterpolate(start, end, t);

      case KeyframeInterpolation.Cubic:
        return this.cubicInterpolate(start, end, t);

      case KeyframeInterpolation.Linear:
      default:
        return this.linearInterpolate(start, end, t);
    }
  }

  /**
   * Linear interpolation
   */
  private linearInterpolate(
    start: Partial<Transform>,
    end: Partial<Transform>,
    t: number,
  ): Partial<Transform> {
    const lerp = (s: number | undefined, e: number | undefined): number | undefined => {
      if (s === undefined || e === undefined) return undefined;
      return s + (e - s) * t;
    };

    const lerpPoint = (s: Point3D | undefined, e: Point3D | undefined): Point3D | undefined => {
      if (s === undefined && e === undefined) return undefined;
      if (s === undefined) return e;
      if (e === undefined) return s;
      return {
        x: lerp(s.x, e.x) ?? 0,
        y: lerp(s.y, e.y) ?? 0,
        z: lerp(s.z, e.z) ?? 0,
      };
    };

    // Use type assertion to work around readonly properties
    const result = {} as {
      position?: Point3D;
      rotation?: Point3D;
      scale?: Point3D;
      opacity?: number;
    };

    // Only add properties that exist in either start or end
    if (start.position !== undefined || end.position !== undefined) {
      const pos = lerpPoint(start.position, end.position);
      if (pos) result.position = pos;
    }

    if (start.rotation !== undefined || end.rotation !== undefined) {
      const rot = lerpPoint(start.rotation, end.rotation);
      if (rot) result.rotation = rot;
    }

    if (start.scale !== undefined || end.scale !== undefined) {
      const sc = lerpPoint(start.scale, end.scale);
      if (sc) result.scale = sc;
    }

    const opacity = lerp(start.opacity, end.opacity);
    if (opacity !== undefined) {
      result.opacity = opacity;
    }

    return result as Partial<Transform>;
  }
  /**
   * Smooth interpolation (S-curve)
   */
  private smoothInterpolate(
    start: Partial<Transform>,
    end: Partial<Transform>,
    t: number,
  ): Partial<Transform> {
    const smooth = (v: number): number => v * v * (3 - 2 * v);
    return this.linearInterpolate(start, end, smooth(t));
  }

  /**
   * Cubic interpolation
   */
  private cubicInterpolate(
    start: Partial<Transform>,
    end: Partial<Transform>,
    t: number,
  ): Partial<Transform> {
    const cubic = (v: number): number => v * v * v * (v * (v * 6 - 15) + 10);
    return this.linearInterpolate(start, end, cubic(t));
  }

  /**
   * Clone the track
   */
  clone(): KeyframeTrack {
    const cloned = new KeyframeTrack(this.property, this.target);
    for (const [time, keyframe] of this.keyframes) {
      cloned.keyframes.set(time, { ...keyframe });
    }
    return cloned;
  }

  /**
   * Get time range
   */
  getRange(): { min: number; max: number } | undefined {
    const times = this.getTimes();
    if (times.length === 0) return undefined;
    const first = times[0];
    const last = times[times.length - 1];
    if (first === undefined || last === undefined) return undefined;
    return {
      min: first,
      max: last,
    };
  }
}

/**
 * Keyframe track manager for multiple properties
 *
 * @example
 * ```typescript
 * const manager = new KeyframeManager(object);
 *
 * manager.positionTrack
 *   .at(0, { x: 0, y: 0, z: 0 })
 *   .at(1, { x: 100, y: 50, z: 0 });
 *
 * manager.rotationTrack
 *   .at(0, { x: 0, y: 0, z: 0 })
 *   .at(2, { x: 0, y: 0, z: 360 });
 *
 * // Evaluate all tracks at time
 * const transform = manager.evaluate(1.5);
 * ```
 */
export class KeyframeManager {
  private tracks: Map<string, KeyframeTrack> = new Map();

  constructor(private readonly target: RenderObject) {}

  /**
   * Get or create a track for a property
   */
  getTrack(property: string): KeyframeTrack {
    let track = this.tracks.get(property);
    if (!track) {
      track = KeyframeTrack.create(property, this.target);
      this.tracks.set(property, track);
    }
    return track;
  }

  /**
   * Get position track
   */
  get positionTrack(): KeyframeTrack {
    return this.getTrack('position');
  }

  /**
   * Get rotation track
   */
  get rotationTrack(): KeyframeTrack {
    return this.getTrack('rotation');
  }

  /**
   * Get scale track
   */
  get scaleTrack(): KeyframeTrack {
    return this.getTrack('scale');
  }

  /**
   * Get opacity track
   */
  get opacityTrack(): KeyframeTrack {
    return this.getTrack('opacity');
  }

  /**
   * Evaluate all tracks at a time
   */
  evaluate(time: number): Partial<Transform> {
    const result: Partial<Transform> = {};

    for (const [_property, track] of this.tracks) {
      const value = track.evaluate(time);
      if (value) {
        Object.assign(result, value);
      }
    }

    return result;
  }

  /**
   * Get all tracks
   */
  getAllTracks(): Map<string, KeyframeTrack> {
    return new Map(this.tracks);
  }

  /**
   * Clear all keyframes
   */
  clear(): void {
    this.tracks.clear();
  }
}

/**
 * Create keyframes from an array of definitions
 *
 * @param target - Target object
 * @param keyframes - Array of keyframe definitions
 * @returns KeyframeManager with all keyframes
 */
export function createKeyframes(
  target: RenderObject,
  keyframes: Array<{
    time: number;
    transform: Partial<Transform>;
    interpolation?: KeyframeInterpolation;
    easing?: KeyframeEasing;
  }>,
): KeyframeManager {
  const manager = new KeyframeManager(target);

  // Group keyframes by property
  const byProperty = new Map<
    string,
    Array<{
      time: number;
      transform: Partial<Transform>;
      interpolation?: KeyframeInterpolation;
      easing?: KeyframeEasing;
    }>
  >();

  for (const kf of keyframes) {
    for (const _property of Object.keys(kf.transform)) {
      if (!byProperty.has(_property)) {
        byProperty.set(_property, []);
      }
      const entry: {
        time: number;
        transform: Partial<Transform>;
        interpolation?: KeyframeInterpolation;
        easing?: KeyframeEasing;
      } = {
        time: kf.time,
        transform: { [_property]: kf.transform[_property as keyof Transform] },
      };
      if (kf.interpolation !== undefined) {
        entry.interpolation = kf.interpolation;
      }
      if (kf.easing !== undefined) {
        entry.easing = kf.easing;
      }
      byProperty.get(_property)!.push(entry);
    }
  }

  // Add to tracks
  for (const [_property, kfs] of byProperty) {
    const track = manager.getTrack(_property);
    for (const kf of kfs) {
      const opts: { interpolation?: KeyframeInterpolation; easing?: KeyframeEasing } = {};
      if (kf.interpolation !== undefined) {
        opts.interpolation = kf.interpolation;
      }
      if (kf.easing !== undefined) {
        opts.easing = kf.easing;
      }
      track.at(kf.time, kf.transform as Partial<Transform>, opts);
    }
  }

  return manager;
}

/**
 * Default export
 */
export default KeyframeTrack;
