/**
 * Time Marker - Timeline markers and labels
 *
 * Provides time-based markers for organizing and navigating animations.
 *
 * @module timeline/TimeMarker
 */

import type { Timeline, TimelineEventListener } from './Timeline';

/**
 * Marker types
 */
export enum MarkerType {
  /** Section marker */
  Section = 'section',
  /** Event marker */
  Event = 'event',
  /** Label marker */
  Label = 'label',
  /** Beat marker for rhythm */
  Beat = 'beat',
}

/**
 * Time marker configuration
 */
export interface TimeMarkerConfig {
  /** Marker name */
  name: string;
  /** Time in seconds */
  time: number;
  /** Marker type */
  type?: MarkerType;
  /** Optional data */
  data?: unknown;
  /** Color for visualization */
  color?: string;
  /** Whether to show in timeline UI */
  visible?: boolean;
}

/**
 * Time marker - marks a specific point in time
 *
 * @example
 * ```typescript
 * const marker = new TimeMarker({
 *   name: 'intro',
 *   time: 0,
 *   type: MarkerType.Section,
 *   color: '#ff0000'
 * });
 * ```
 */
export class TimeMarker {
  readonly name: string;
  readonly time: number;
  readonly type: MarkerType;
  readonly data?: unknown;
  readonly color: string;
  visible: boolean;
  triggered: boolean = false;

  constructor(config: TimeMarkerConfig) {
    this.name = config.name;
    this.time = config.time;
    this.type = config.type ?? MarkerType.Label;
    this.data = config.data;
    this.color = config.color ?? '#ffffff';
    this.visible = config.visible ?? true;
  }

  /**
   * Check if marker has been triggered
   */
  isTriggered(): boolean {
    return this.triggered;
  }

  /**
   * Mark as triggered
   */
  trigger(): void {
    this.triggered = true;
  }

  /**
   * Reset trigger state
   */
  reset(): void {
    this.triggered = false;
  }

  /**
   * Create a copy with updated properties
   */
  withUpdates(updates: Partial<TimeMarkerConfig>): TimeMarker {
    return new TimeMarker({
      name: updates.name ?? this.name,
      time: updates.time ?? this.time,
      type: updates.type ?? this.type,
      data: updates.data ?? this.data,
      color: updates.color ?? this.color,
      visible: updates.visible ?? this.visible,
    });
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `TimeMarker(${this.name}, ${this.time}s, type=${this.type})`;
  }
}

/**
 * Marker collection - manages multiple time markers
 *
 * @example
 * ```typescript
 * const collection = new MarkerCollection();
 *
 * collection
 *   .add('intro', 0, MarkerType.Section)
 *   .add('chorus', 10, MarkerType.Section)
 *   .add('beat', 0.5, MarkerType.Beat)
 *   .add('beat', 1.0, MarkerType.Beat)
 *   .add('beat', 1.5, MarkerType.Beat);
 *
 * // Find markers
 * const introMarkers = collection.inRange(0, 5);
 * const beatMarkers = collection.byType(MarkerType.Beat);
 * ```
 */
export class MarkerCollection {
  private markers: Map<string, TimeMarker> = new Map();

  /**
   * Add a marker
   *
   * @param name - Marker name
   * @param time - Marker time
   * @param type - Marker type
   * @param data - Optional data
   * @returns The created marker
   */
  add(name: string, time: number, type: MarkerType = MarkerType.Label, data?: unknown): TimeMarker {
    const marker = new TimeMarker({ name, time, type, data });
    this.markers.set(name, marker);
    return marker;
  }

  /**
   * Add multiple markers
   */
  addAll(
    markers: Array<{
      name: string;
      time: number;
      type?: MarkerType;
      data?: unknown;
    }>,
  ): MarkerCollection {
    for (const marker of markers) {
      this.add(marker.name, marker.time, marker.type, marker.data);
    }
    return this;
  }

  /**
   * Remove a marker
   */
  remove(name: string): boolean {
    return this.markers.delete(name);
  }

  /**
   * Get a marker by name
   */
  get(name: string): TimeMarker | undefined {
    return this.markers.get(name);
  }

  /**
   * Check if a marker exists
   */
  has(name: string): boolean {
    return this.markers.has(name);
  }

  /**
   * Get all markers
   */
  getAll(): TimeMarker[] {
    return Array.from(this.markers.values()).sort((a, b) => a.time - b.time);
  }

  /**
   * Get markers in a time range
   */
  inRange(startTime: number, endTime: number): TimeMarker[] {
    return this.getAll().filter((m) => m.time >= startTime && m.time <= endTime);
  }

  /**
   * Get markers by type
   */
  byType(type: MarkerType): TimeMarker[] {
    return this.getAll().filter((m) => m.type === type);
  }

  /**
   * Get markers around a time
   */
  around(time: number, delta: number = 0.5): TimeMarker[] {
    return this.inRange(time - delta, time + delta);
  }

  /**
   * Get nearest marker to a time
   */
  nearest(time: number): TimeMarker | undefined {
    const markers = this.getAll();
    if (markers.length === 0) return undefined;

    let nearest = markers[0]!;
    let minDist = Math.abs(time - nearest.time);

    for (const marker of markers) {
      const dist = Math.abs(time - marker.time);
      if (dist < minDist) {
        minDist = dist;
        nearest = marker;
      }
    }

    return nearest;
  }

  /**
   * Get markers sorted by time
   */
  sorted(): TimeMarker[] {
    return this.getAll();
  }

  /**
   * Clear all markers
   */
  clear(): void {
    this.markers.clear();
  }

  /**
   * Get time range covered by markers
   */
  getRange(): { min: number; max: number } | undefined {
    const markers = this.getAll();
    if (markers.length === 0) return undefined;

    const times = markers.map((m) => m.time);
    return {
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }

  /**
   * Clone the collection
   */
  clone(): MarkerCollection {
    const cloned = new MarkerCollection();
    for (const marker of this.getAll()) {
      cloned.add(marker.name, marker.time, marker.type, marker.data);
    }
    return cloned;
  }
}

/**
 * Marker builder for fluent API
 *
 * @example
 * ```typescript
 * const collection = MarkerBuilder.create()
 *   .section('intro', 0)
 *   .section('verse', 4)
 *   .section('chorus', 8)
 *   .beat(0, 0.5, 120) // 120 BPM
 *   .beat(0, 1.0, 120)
 *   .build();
 * ```
 */
export class MarkerBuilder {
  private collection: MarkerCollection = new MarkerCollection();

  /**
   * Create a new marker builder
   */
  static create(): MarkerBuilder {
    return new MarkerBuilder();
  }

  /**
   * Add a section marker
   */
  section(name: string, time: number): MarkerBuilder {
    this.collection.add(name, time, MarkerType.Section);
    return this;
  }

  /**
   * Add an event marker
   */
  event(name: string, time: number, data?: unknown): MarkerBuilder {
    this.collection.add(name, time, MarkerType.Event, data);
    return this;
  }

  /**
   * Add a label marker
   */
  label(name: string, time: number): MarkerBuilder {
    this.collection.add(name, time, MarkerType.Label);
    return this;
  }

  /**
   * Add beat markers for rhythm
   *
   * @param startTime - Start time
   * @param bpm - Beats per minute
   * @param count - Number of beats
   * @param duration - Duration per beat in seconds
   */
  beats(startTime: number, bpm: number, count: number, duration: number = 60 / bpm): MarkerBuilder {
    for (let i = 0; i < count; i++) {
      this.collection.add(`beat_${i}`, startTime + i * duration, MarkerType.Beat, {
        beatIndex: i,
        bpm,
      });
    }
    return this;
  }

  /**
   * Add a single beat
   */
  beat(time: number, bpm?: number): MarkerBuilder {
    this.collection.add('beat', time, MarkerType.Beat, { bpm });
    return this;
  }

  /**
   * Build the marker collection
   */
  build(): MarkerCollection {
    return this.collection;
  }
}

/**
 * Sync markers with a timeline
 *
 * @param timeline - The timeline to sync with
 * @param collection - Marker collection to sync
 * @returns Listener cleanup function
 */
export function syncWithTimeline(timeline: Timeline, collection: MarkerCollection): () => void {
  const listener: TimelineEventListener = (event) => {
    if (event.type === 'seek') {
      // Reset and re-check markers
      for (const marker of collection.getAll()) {
        marker.reset();
      }

      // Check markers at new time
      for (const marker of collection.inRange(event.time - 0.001, event.time + 0.001)) {
        if (Math.abs(marker.time - event.time) < 0.001) {
          marker.trigger();
        }
      }
    }
  };

  timeline.on(listener);

  return () => timeline.off(listener);
}

/**
 * Default export
 */
export default TimeMarker;
