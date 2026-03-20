/**
 * Animation Events
 *
 * Events emitted during animation lifecycle
 *
 * @module events
 */

import type { EventData, EventEmitter } from './EventEmitter';

/**
 * Animation start event data
 */
export interface AnimationStartData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Animation type
   */
  animationType: string;

  /**
   * Target object being animated
   */
  target: any;

  /**
   * Animation duration in milliseconds
   */
  duration: number;

  /**
   * Whether animation loops
   */
  loops: boolean;
}

/**
 * Animation update event data
 */
export interface AnimationUpdateData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Current animation progress (0-1)
   */
  progress: number;

  /**
   * Current elapsed time in milliseconds
   */
  elapsedTime: number;

  /**
   * Current interpolated value
   */
  currentValue: any;

  /**
   * Easing value (if applicable)
   */
  easingValue?: number;
}

/**
 * Animation complete event data
 */
export interface AnimationCompleteData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Animation type
   */
  animationType: string;

  /**
   * Target object that was animated
   */
  target: any;

  /**
   * Total elapsed time in milliseconds
   */
  totalTime: number;

  /**
   * Number of loops completed
   */
  loopsCompleted: number;

  /**
   * Whether animation was cancelled
   */
  cancelled: boolean;
}

/**
 * Animation repeat event data
 */
export interface AnimationRepeatData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Current loop number (1-indexed)
   */
  loopNumber: number;

  /**
   * Total number of loops configured
   */
  totalLoops: number | 'infinite';

  /**
   * Elapsed time before this repeat
   */
  elapsedTime: number;
}

/**
 * Animation pause event data
 */
export interface AnimationPauseData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Current progress when paused (0-1)
   */
  progress: number;

  /**
   * Elapsed time when paused
   */
  elapsedTime: number;
}

/**
 * Animation resume event data
 */
export interface AnimationResumeData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Progress at which animation resumed (0-1)
   */
  progress: number;

  /**
   * Elapsed time when resumed
   */
  elapsedTime: number;
}

/**
 * Animation cancel event data
 */
export interface AnimationCancelData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Progress when cancelled (0-1)
   */
  progress: number;

  /**
   * Elapsed time when cancelled
   */
  elapsedTime: number;

  /**
   * Reason for cancellation
   */
  reason?: string;
}

/**
 * Animation error event data
 */
export interface AnimationErrorData {
  /**
   * Animation identifier
   */
  animationId: string;

  /**
   * Error that occurred
   */
  error: Error;

  /**
   * Progress when error occurred
   */
  progress: number;

  /**
   * Elapsed time when error occurred
   */
  elapsedTime: number;
}

/**
 * Animation events map
 */
export interface AnimationEvents {
  /**
   * Emitted when animation starts
   */
  start: AnimationStartData;

  /**
   * Emitted on each animation frame update
   */
  update: AnimationUpdateData;

  /**
   * Emitted when animation completes
   */
  complete: AnimationCompleteData;

  /**
   * Emitted when animation repeats (for looping animations)
   */
  repeat: AnimationRepeatData;

  /**
   * Emitted when animation is paused
   */
  pause: AnimationPauseData;

  /**
   * Emitted when paused animation resumes
   */
  resume: AnimationResumeData;

  /**
   * Emitted when animation is cancelled
   */
  cancel: AnimationCancelData;

  /**
   * Emitted when an error occurs during animation
   */
  error: AnimationErrorData;
}

/**
 * Animation event emitter type
 */
export type AnimationEventEmitter = EventEmitter<AnimationEvents>;

/**
 * Helper type for animation event handler
 */
export type AnimationEventHandler<K extends keyof AnimationEvents> = (
  data: EventData<AnimationEvents[K]>
) => void | Promise<void>;

/**
 * Animation event names
 */
export const AnimationEventNames = {
  START: 'start',
  UPDATE: 'update',
  COMPLETE: 'complete',
  REPEAT: 'repeat',
  PAUSE: 'pause',
  RESUME: 'resume',
  CANCEL: 'cancel',
  ERROR: 'error',
} as const;

/**
 * Create animation event data helper
 */
export function createAnimationEventData(
  animationId: string,
  animationType: string,
  target: any,
  duration: number,
  loops: boolean
): AnimationStartData {
  return {
    animationId,
    animationType,
    target,
    duration,
    loops,
  };
}

/**
 * Create animation update data helper
 */
export function createAnimationUpdateData(
  animationId: string,
  progress: number,
  elapsedTime: number,
  currentValue: any,
  easingValue?: number
): AnimationUpdateData {
  return {
    animationId,
    progress,
    elapsedTime,
    currentValue,
    easingValue,
  };
}

/**
 * Create animation complete data helper
 */
export function createAnimationCompleteData(
  animationId: string,
  animationType: string,
  target: any,
  totalTime: number,
  loopsCompleted: number,
  cancelled: boolean
): AnimationCompleteData {
  return {
    animationId,
    animationType,
    target,
    totalTime,
    loopsCompleted,
    cancelled,
  };
}

/**
 * Create animation repeat data helper
 */
export function createAnimationRepeatData(
  animationId: string,
  loopNumber: number,
  totalLoops: number | 'infinite',
  elapsedTime: number
): AnimationRepeatData {
  return {
    animationId,
    loopNumber,
    totalLoops,
    elapsedTime,
  };
}
