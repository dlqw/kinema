/**
 * Timeline Controller - High-level playback control
 *
 * Provides convenient controller interface for timeline manipulation
 * with support for play/pause/stop, seeking, and speed control.
 *
 * @module timeline/TimelineController
 */

import type { Scene, Animation } from '../types';
import { Timeline, TimelineConfig, PlaybackState, TimelineDirection, TimelineEventType, TimelineEventListener } from './Timeline';

/**
 * Controller state snapshot for undo/redo
 */
export interface ControllerState {
  currentTime: number;
  state: PlaybackState;
  direction: TimelineDirection;
  speed: number;
  loop: boolean;
}

/**
 * Timeline Controller - High-level timeline control
 *
 * Provides convenient methods for controlling animation playback
 * with automatic state management and event handling.
 *
 * @example
 * ```typescript
 * const controller = new TimelineController({
 *   duration: 10,
 *   fps: 60
 * });
 *
 * // Basic playback
 * controller.play();
 * controller.pause();
 * controller.stop();
 *
 * // Seeking
 * controller.seek(5);
 * controller.seekToFrame(300);
 * controller.seekToProgress(0.5);
 *
 * // Speed control
 * controller.setSpeed(0.5); // Half speed
 * controller.setSpeed(2);   // Double speed
 *
 * // Direction control
 * controller.reverse();
 * controller.toggleDirection();
 *
 * // Event listeners
 * controller.on('play', () => console.log('Playing'));
 * controller.on('keyframe', (event) => console.log('Keyframe at', event.time));
 * ```
 */
export class TimelineController {
  private timeline: Timeline;
  private stateHistory: ControllerState[] = [];
  private maxHistorySize: number = 100;

  constructor(config: TimelineConfig) {
    this.timeline = new Timeline(config);
  }

  // ==========================================================================
  // Timeline Access
  // ==========================================================================

  /**
   * Get the underlying timeline
   */
  getTimeline(): Timeline {
    return this.timeline;
  }

  /**
   * Get current time
   */
  getTime(): number {
    return this.timeline.getTime();
  }

  /**
   * Get timeline duration
   */
  getDuration(): number {
    return this.timeline.getDuration();
  }

  /**
   * Get playback progress [0, 1]
   */
  getProgress(): number {
    return this.timeline.getProgress();
  }

  /**
   * Get current frame number
   */
  getCurrentFrame(): number {
    return this.timeline.getCurrentFrame();
  }

  /**
   * Get total frames
   */
  getTotalFrames(): number {
    return this.timeline.getTotalFrames();
  }

  /**
   * Get current state
   */
  getState(): PlaybackState {
    return this.timeline.getState();
  }

  /**
   * Get playback speed
   */
  getSpeed(): number {
    return this.timeline.getSpeed();
  }

  /**
   * Get direction
   */
  getDirection(): TimelineDirection {
    return this.timeline.getDirection();
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.timeline.isPlaying();
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.timeline.isPaused();
  }

  // ==========================================================================
  // Playback Control
  // ==========================================================================

  /**
   * Start or resume playback
   */
  play(): void {
    this.saveState();
    this.timeline.play();
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.saveState();
    this.timeline.pause();
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    this.saveState();
    this.timeline.stop();
  }

  /**
   * Toggle play/pause
   */
  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  // ==========================================================================
  // Seeking
  // ==========================================================================

  /**
   * Jump to specific time
   */
  seek(time: number): void {
    this.saveState();
    this.timeline.seek(time);
  }

  /**
   * Jump to specific frame
   */
  seekToFrame(frame: number): void {
    this.saveState();
    this.timeline.seekToFrame(frame);
  }

  /**
   * Jump to progress position [0, 1]
   */
  seekToProgress(progress: number): void {
    this.seek(progress * this.getDuration());
  }

  /**
   * Jump to beginning
   */
  seekToStart(): void {
    this.seek(0);
  }

  /**
   * Jump to end
   */
  seekToEnd(): void {
    this.seek(this.getDuration());
  }

  /**
   * Skip forward by specified time
   */
  skipForward(seconds: number): void {
    this.seek(this.getTime() + seconds);
  }

  /**
   * Skip backward by specified time
   */
  skipBackward(seconds: number): void {
    this.seek(this.getTime() - seconds);
  }

  /**
   * Skip forward by specified number of frames
   */
  skipFramesForward(frames: number): void {
    this.seekToFrame(this.getCurrentFrame() + frames);
  }

  /**
   * Skip backward by specified number of frames
   */
  skipFramesBackward(frames: number): void {
    this.seekToFrame(this.getCurrentFrame() - frames);
  }

  /**
   * Step forward one frame
   */
  stepForward(): void {
    this.skipFramesForward(1);
  }

  /**
   * Step backward one frame
   */
  stepBackward(): void {
    this.skipFramesBackward(1);
  }

  // ==========================================================================
  // Speed Control
  // ==========================================================================

  /**
   * Set playback speed
   *
   * @param speed - Speed multiplier (0.1 to 10)
   */
  setSpeed(speed: number): void {
    this.timeline.setSpeed(speed);
  }

  /**
   * Set common preset speeds
   */
  slower(): void {
    this.setSpeed(this.getSpeed() / 2);
  }

  faster(): void {
    this.setSpeed(this.getSpeed() * 2);
  }

  /**
   * Reset to normal speed
   */
  normalSpeed(): void {
    this.setSpeed(1);
  }

  /**
   * Set quarter speed
   */
  quarterSpeed(): void {
    this.setSpeed(0.25);
  }

  /**
   * Set half speed
   */
  halfSpeed(): void {
    this.setSpeed(0.5);
  }

  /**
   * Set double speed
   */
  doubleSpeed(): void {
    this.setSpeed(2);
  }

  /**
   * Set quadruple speed
   */
  quadrupleSpeed(): void {
    this.setSpeed(4);
  }

  // ==========================================================================
  // Direction Control
  // ==========================================================================

  /**
   * Set direction
   */
  setDirection(direction: TimelineDirection): void {
    this.timeline.setDirection(direction);
  }

  /**
   * Reverse direction
   */
  reverse(): void {
    this.timeline.reverse();
  }

  /**
   * Toggle direction
   */
  toggleDirection(): void {
    this.timeline.toggleDirection();
  }

  /**
   * Play in reverse
   */
  playReverse(): void {
    this.setDirection(TimelineDirection.Backward);
    this.play();
  }

  // ==========================================================================
  // Loop Control
  // ==========================================================================

  /**
   * Enable loop mode
   */
  enableLoop(): void {
    this.timeline.setLoop(true);
  }

  /**
   * Disable loop mode
   */
  disableLoop(): void {
    this.timeline.setLoop(false);
  }

  /**
   * Toggle loop mode
   */
  toggleLoop(): void {
    this.timeline.toggleLoop();
  }

  /**
   * Check if looping is enabled
   */
  isLooping(): boolean {
    return this.timeline.isLooping();
  }

  // ==========================================================================
= // Keyframes and Markers
  // ==========================================================================

  /**
   * Add a keyframe
   */
  addKeyframe(time: number, callback: () => void): string {
    return this.timeline.addKeyframe(time, callback);
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(id: string): boolean {
    return this.timeline.removeKeyframe(id);
  }

  /**
   * Add a marker
   */
  addMarker(name: string, time: number, data?: unknown): boolean {
    return this.timeline.addMarker(name, time, data);
  }

  /**
   * Remove a marker
   */
  removeMarker(name: string): boolean {
    return this.timeline.removeMarker(name);
  }

  /**
   * Go to a marker
   */
  goToMarker(name: string): boolean {
    return this.timeline.goToMarker(name);
  }

  /**
   * Get a marker
   */
  getMarker(name: string): { time: number; data?: unknown } | undefined {
    const marker = this.timeline.getMarker(name);
    return marker ? { time: marker.time, data: marker.data } : undefined;
  }

  /**
   * Get all markers
   */
  getAllMarkers(): Map<string, { time: number; data?: unknown }> {
    const markers = this.timeline.getMarkers();
    const result = new Map<string, { time: number; data?: unknown }>();
    for (const [name, marker] of markers) {
      result.set(name, { time: marker.time, data: marker.data });
    }
    return result;
  }

  // ==========================================================================
  // Undo/Redo
  // ==========================================================================

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.stateHistory.length === 0) return false;

    const state = this.stateHistory.pop()!;
    this.restoreState(state);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.stateHistory.length > 0;
  }

  /**
   * Clear undo history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Save current state
   */
  private saveState(): void {
    const state: ControllerState = {
      currentTime: this.timeline.getTime(),
      state: this.timeline.getState(),
      direction: this.timeline.getDirection(),
      speed: this.timeline.getSpeed(),
      loop: this.timeline.isLooping()
    };

    this.stateHistory.push(state);

    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Restore a saved state
   */
  private restoreState(state: ControllerState): void {
    this.timeline.seek(state.currentTime);
    if (state.state !== this.timeline.getState()) {
      if (state.state === PlaybackState.Playing) {
        this.timeline.play();
      } else if (state.state === PlaybackState.Paused) {
        this.timeline.pause();
      } else if (state.state === PlaybackState.Stopped) {
        this.timeline.stop();
      }
    }
    this.timeline.setDirection(state.direction);
    this.timeline.setSpeed(state.speed);
    this.timeline.setLoop(state.loop);
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  /**
   * Add event listener for specific type
   */
  on(type: TimelineEventType, listener: TimelineEventListener): void;
  on(listener: TimelineEventListener): void;
  on(type: any, listener: any): any {
    if (typeof type === 'string' && typeof listener === 'function') {
      // Typed listener
      this.timeline.on((event) => {
        if (event.type === type) {
          listener(event);
        }
      });
    } else if (typeof listener === 'function') {
      // Generic listener
      this.timeline.on(listener);
    }
  }

  /**
   * Remove event listener
   */
  off(listener: TimelineEventListener): void {
    this.timeline.off(listener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.timeline.removeAllListeners();
  }

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Execute multiple operations atomically
   */
  batch(operations: (controller: TimelineController) => void): void {
    // Disable state saving during batch
    const originalMaxSize = this.maxHistorySize;
    this.maxHistorySize = 0;

    try {
      operations(this);
    } finally {
      this.maxHistorySize = originalMaxSize;
    }
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot(): ControllerState {
    return {
      currentTime: this.timeline.getTime(),
      state: this.timeline.getState(),
      direction: this.timeline.getDirection(),
      speed: this.timeline.getSpeed(),
      loop: this.timeline.isLooping()
    };
  }

  /**
   * Restore from snapshot
   */
  restoreSnapshot(snapshot: ControllerState): void {
    this.restoreState(snapshot);
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get time range info
   */
  getTimeRange(): {
    current: number;
    duration: number;
    remaining: number;
    progress: number;
  } {
    const current = this.getTime();
    const duration = this.getDuration();
    return {
      current,
      duration,
      remaining: Math.max(0, duration - current),
      progress: current / duration
    };
  }

  /**
   * Get frame range info
   */
  getFrameRange(): {
    current: number;
    total: number;
    remaining: number;
    progress: number;
  } {
    const current = this.getCurrentFrame();
    const total = this.getTotalFrames();
    return {
      current,
      total,
      remaining: Math.max(0, total - current),
      progress: current / total
    };
  }

  /**
   * Get formatted time string
   */
  getFormattedTime(): string {
    const time = this.getTime();
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * this.timeline.getFPS());

    return `${minutes}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  /**
   * Get string representation
   */
  toString(): string {
    const state = this.getState();
    return `TimelineController(${state}, time=${this.getFormattedTime()})`;
  }
}

/**
 * Default export
 */
export default TimelineController;
