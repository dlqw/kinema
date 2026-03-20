/**
 * Event type definitions for AniMaker
 * Defines event system types
 */

/**
 * Base event interface
 */
export interface Event {
  type: string;
  timestamp: number;
  target?: string; // node id
  bubbles?: boolean;
}

/**
 * Mouse event
 */
export interface MouseEvent extends Event {
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseenter' | 'mouseleave';
  x: number;
  y: number;
  button?: number;
  buttons?: number;
}

/**
 * Keyboard event
 */
export interface KeyboardEvent extends Event {
  type: 'keydown' | 'keyup' | 'keypress';
  key: string;
  code: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * Touch event
 */
export interface TouchEvent extends Event {
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  touches: Array<{ x: number; y: number; identifier: number }>;
  changedTouches: Array<{ x: number; y: number; identifier: number }>;
}

/**
 * Animation event
 */
export interface AnimationEvent extends Event {
  type: 'animationstart' | 'animationend' | 'animationupdate';
  animationId: string;
  progress?: number;
}

/**
 * Scene event
 */
export interface SceneEvent extends Event {
  type: 'sceneready' | 'sceneupdate' | 'scenerender';
  sceneId: string;
}

/**
 * Event listener function
 */
export type EventListener<T extends Event = Event> = (event: T) => void;

/**
 * Event emitter interface
 */
export interface EventEmitter {
  on<T extends Event = Event>(event: string, listener: EventListener<T>): void;
  off<T extends Event = Event>(event: string, listener: EventListener<T>): void;
  emit<T extends Event = Event>(event: T): void;
  once<T extends Event = Event>(event: string, listener: EventListener<T>): void;
  removeAllListeners(event?: string): void;
}
