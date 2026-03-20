/**
 * Events Module
 *
 * Type-safe event system for animation, scene, and rendering events
 *
 * @module events
 */

// Core event emitter
export * from './EventEmitter';

// Animation events
export * from './AnimationEvents';

// Scene events
export * from './SceneEvents';

// Render events
export * from './RenderEvents';

// Re-export commonly used types
import type { EventEmitter, EventData, EventContext, IDisposable } from './EventEmitter';
export type { EventEmitter, EventData, EventContext, IDisposable };

import type {
  AnimationEvents,
  AnimationEventEmitter,
  AnimationEventHandler,
} from './AnimationEvents';
export type { AnimationEvents, AnimationEventEmitter, AnimationEventHandler };

import type { SceneEvents, SceneEventEmitter, SceneEventHandler } from './SceneEvents';
export type { SceneEvents, SceneEventEmitter, SceneEventHandler };

import type { RenderEvents, RenderEventEmitter, RenderEventHandler } from './RenderEvents';
export type { RenderEvents, RenderEventEmitter, RenderEventHandler };

// Event bus
export * from './EventBus';
