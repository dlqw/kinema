/**
 * Timeline - Precise timeline control system
 *
 * Provides timeline management for animation playback with support
 * for forward/reverse playback, time scaling, and event triggering.
 *
 * @module timeline/Timeline
 */

/**
 * Timeline direction
 */
export enum TimelineDirection {
  Forward = 1,
  Backward = -1,
}

/**
 * Playback state
 */
export enum PlaybackState {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
  Seeking = 'seeking',
}

/**
 * Timeline event types
 */
export enum TimelineEventType {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Seek = 'seek',
  Keyframe = 'keyframe',
  Marker = 'marker',
  Loop = 'loop',
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  /** Duration in seconds */
  duration: number;
  /** Frame rate */
  fps: number;
  /** Auto-loop on end */
  loop?: boolean;
  /** Time scale (1 = normal, 0.5 = half speed, 2 = double speed) */
  timeScale?: number;
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  type: TimelineEventType;
  time: number;
  data?: unknown;
}

/**
 * Event listener for timeline events
 */
export type TimelineEventListener = (event: TimelineEvent) => void;

/**
 * Main Timeline class for animation playback control
 *
 * @example
 * ```typescript
 * const timeline = new Timeline({
 *   duration: 10,
 *   fps: 60,
 *   loop: true
 * });
 *
 * timeline.play();
 * timeline.setSpeed(0.5); // Half speed
 * timeline.seek(5); // Jump to 5 seconds
 * ```
 */
export class Timeline {
  private config: TimelineConfig;
  private currentTime: number = 0;
  private state: PlaybackState = PlaybackState.Stopped;
  private direction: TimelineDirection = TimelineDirection.Forward;
  private playbackSpeed: number = 1;
  private listeners: Set<TimelineEventListener> = new Set();
  private eventQueue: TimelineEvent[] = [];
  private keyframes: Map<number, Keyframe> = new Map();
  private markers: Map<string, TimeMarker> = new Map();
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(config: TimelineConfig) {
    this.config = {
      timeScale: 1,
      loop: false,
      ...config,
    };
  }

  // ==========================================================================
  // Playback Control
  // ==========================================================================

  /**
   * Start or resume playback
   */
  play(): void {
    if (this.state === PlaybackState.Playing) return;

    this.state = PlaybackState.Playing;
    this.lastFrameTime = performance.now();
    this.startTick();

    this.emit({
      type: TimelineEventType.Play,
      time: this.currentTime,
    });
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.state !== PlaybackState.Playing) return;

    this.state = PlaybackState.Paused;
    this.stopTick();

    this.emit({
      type: TimelineEventType.Pause,
      time: this.currentTime,
    });
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.state === PlaybackState.Playing) return;

    this.state = PlaybackState.Playing;
    this.lastFrameTime = performance.now();
    this.startTick();
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this.state = PlaybackState.Stopped;
    this.stopTick();
    this.currentTime = 0;

    this.emit({
      type: TimelineEventType.Stop,
      time: this.currentTime,
    });
  }

  /**
   * Jump to a specific time
   */
  seek(time: number): void {
    const previousTime = this.currentTime;
    this.currentTime = Math.max(0, Math.min(time, this.config.duration));

    this.emit({
      type: TimelineEventType.Seek,
      time: this.currentTime,
      data: { previousTime },
    });

    this.checkKeyframes(previousTime, this.currentTime);
    this.checkMarkers(this.currentTime);
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return this.state;
  }

  /**
   * Check if timeline is playing
   */
  isPlaying(): boolean {
    return this.state === PlaybackState.Playing;
  }

  /**
   * Check if timeline is paused
   */
  isPaused(): boolean {
    return this.state === PlaybackState.Paused;
  }

  // ==========================================================================
  // Time Control
  // ==========================================================================

  /**
   * Get current time
   */
  getTime(): number {
    return this.currentTime;
  }

  /**
   * Get timeline duration
   */
  getDuration(): number {
    return this.config.duration;
  }

  /**
   * Get playback progress [0, 1]
   */
  getProgress(): number {
    return this.currentTime / this.config.duration;
  }

  /**
   * Get total number of frames
   */
  getTotalFrames(): number {
    return Math.floor(this.config.duration * this.config.fps);
  }

  /**
   * Get current frame number
   */
  getCurrentFrame(): number {
    return Math.floor(this.currentTime * this.config.fps);
  }

  /**
   * Jump to a specific frame
   */
  seekToFrame(frame: number): void {
    this.seek(frame / this.config.fps);
  }

  /**
   * Get time for a frame number
   */
  getTimeForFrame(frame: number): number {
    return frame / this.config.fps;
  }

  /**
   * Get frame number for a time
   */
  getFrameForTime(time: number): number {
    return Math.floor(time * this.config.fps);
  }

  // ==========================================================================
  // Speed and Direction
  // ==========================================================================

  /**
   * Get playback speed multiplier
   */
  getSpeed(): number {
    return this.playbackSpeed;
  }

  /**
   * Set playback speed
   *
   * @param speed - Speed multiplier (0.5 = half, 1 = normal, 2 = double)
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
  }

  /**
   * Get playback direction
   */
  getDirection(): TimelineDirection {
    return this.direction;
  }

  /**
   * Set playback direction
   */
  setDirection(direction: TimelineDirection): void {
    this.direction = direction;
  }

  /**
   * Reverse playback direction
   */
  reverse(): void {
    this.direction =
      this.direction === TimelineDirection.Forward
        ? TimelineDirection.Backward
        : TimelineDirection.Forward;
  }

  /**
   * Toggle forward/backward playback
   */
  toggleDirection(): void {
    this.direction =
      this.direction === TimelineDirection.Forward
        ? TimelineDirection.Backward
        : TimelineDirection.Forward;
  }

  // ==========================================================================
  // Keyframes
  // ==========================================================================

  /**
   * Add a keyframe at a specific time
   *
   * @param time - Keyframe time
   * @param callback - Function to call when keyframe is reached
   * @returns Keyframe ID
   */
  addKeyframe(time: number, callback: () => void): string {
    const id = `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const keyframe = new Keyframe(id, time, callback);
    this.keyframes.set(time, keyframe);
    return id;
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(id: string): boolean {
    for (const [time, kf] of this.keyframes) {
      if (kf.id === id) {
        this.keyframes.delete(time);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all keyframes
   */
  getKeyframes(): Map<number, Keyframe> {
    return new Map(this.keyframes);
  }

  /**
   * Check and trigger keyframes
   */
  private checkKeyframes(previousTime: number, currentTime: number): void {
    const isForward = currentTime > previousTime;

    for (const [time, keyframe] of this.keyframes) {
      const shouldTrigger = isForward
        ? previousTime < time && currentTime >= time
        : previousTime > time && currentTime <= time;

      if (shouldTrigger) {
        keyframe.trigger();

        this.emit({
          type: TimelineEventType.Keyframe,
          time,
          data: { keyframeId: keyframe.id },
        });
      }
    }
  }

  // ==========================================================================
  // Markers
  // ==========================================================================

  /**
   * Add a marker at a specific time
   *
   * @param name - Marker name
   * @param time - Marker time
   * @param data - Optional data to attach
   * @returns True if marker was added
   */
  addMarker(name: string, time: number, data?: unknown): boolean {
    if (this.markers.has(name)) return false;

    const marker = new TimeMarker(name, time, data);
    this.markers.set(name, marker);
    return true;
  }

  /**
   * Remove a marker
   */
  removeMarker(name: string): boolean {
    return this.markers.delete(name);
  }

  /**
   * Get a marker by name
   */
  getMarker(name: string): TimeMarker | undefined {
    return this.markers.get(name);
  }

  /**
   * Get all markers
   */
  getMarkers(): Map<string, TimeMarker> {
    return new Map(this.markers);
  }

  /**
   * Jump to a marker
   */
  goToMarker(name: string): boolean {
    const marker = this.markers.get(name);
    if (marker) {
      this.seek(marker.time);
      return true;
    }
    return false;
  }

  /**
   * Check and trigger markers
   */
  private checkMarkers(currentTime: number): void {
    for (const [name, marker] of this.markers) {
      if (Math.abs(currentTime - marker.time) < 0.001 && !marker.triggered) {
        marker.trigger();

        this.emit({
          type: TimelineEventType.Marker,
          time: marker.time,
          data: { markerName: name, markerData: marker.data },
        });
      }
    }
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Get timeline configuration
   */
  getConfig(): Readonly<TimelineConfig> {
    return this.config;
  }

  /**
   * Check if timeline is looping
   */
  isLooping(): boolean {
    return this.config.loop ?? false;
  }

  /**
   * Set loop mode
   */
  setLoop(enabled: boolean): void {
    this.config.loop = enabled;
  }

  /**
   * Toggle loop mode
   */
  toggleLoop(): void {
    this.config.loop = !(this.config.loop ?? false);

    this.emit({
      type: TimelineEventType.Loop,
      time: this.currentTime,
      data: { enabled: this.config.loop },
    });
  }

  /**
   * Get frame rate
   */
  getFPS(): number {
    return this.config.fps;
  }

  /**
   * Get time scale
   */
  getTimeScale(): number {
    return this.config.timeScale ?? 1;
  }

  /**
   * Set time scale (slow motion vs fast forward)
   */
  setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(0.1, Math.min(10, scale));
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Add event listener
   */
  on(listener: TimelineEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  off(listener: TimelineEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: TimelineEvent): void {
    this.eventQueue.push(event);

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Timeline event listener error:', error);
      }
    }
  }

  /**
   * Get event queue
   */
  getEventQueue(): ReadonlyArray<TimelineEvent> {
    return [...this.eventQueue];
  }

  /**
   * Clear event queue
   */
  clearEventQueue(): void {
    this.eventQueue = [];
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Start the tick loop
   */
  private startTick(): void {
    if (this.animationFrameId !== null) return;

    const tick = () => {
      if (this.state === PlaybackState.Playing) {
        this.update();
      }

      if (this.state === PlaybackState.Playing) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Stop the tick loop
   */
  private stopTick(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update timeline state
   */
  private update(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Apply time scale and speed
    const scaledDelta = deltaTime * (this.config.timeScale ?? 1) * this.playbackSpeed;

    // Update current time based on direction
    const newTime = this.currentTime + scaledDelta * this.direction;

    // Handle loop
    if (newTime >= this.config.duration) {
      if (this.config.loop) {
        this.currentTime = 0;
        this.checkKeyframes(this.config.duration, 0);
      } else {
        this.currentTime = this.config.duration;
        this.pause();
      }
    } else if (newTime < 0) {
      if (this.config.loop) {
        this.currentTime = this.config.duration;
        this.checkKeyframes(0, this.config.duration);
      } else {
        this.currentTime = 0;
        this.pause();
      }
    } else {
      const previousTime = this.currentTime;
      this.currentTime = newTime;
      this.checkKeyframes(previousTime, newTime);
    }

    this.checkMarkers(this.currentTime);
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `Timeline(time=${this.currentTime.toFixed(2)}s, state=${this.state}, speed=${this.playbackSpeed}x)`;
  }
}

/**
 * Keyframe class
 */
class Keyframe {
  constructor(
    public readonly id: string,
    public readonly time: number,
    private readonly callback: () => void,
  ) {}

  trigger(): void {
    this.callback();
  }
}

/**
 * TimeMarker class
 */
class TimeMarker {
  constructor(
    public readonly name: string,
    public readonly time: number,
    public readonly data?: unknown,
    public triggered: boolean = false,
  ) {}

  trigger(): void {
    this.triggered = true;
  }
}

/**
 * Default export
 */
export default Timeline;
