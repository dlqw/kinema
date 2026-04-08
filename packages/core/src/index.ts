/**
 * Kinema Core Package
 *
 * Main entry point for the Kinema animation framework core.
 * Exports all core classes, types, and utilities.
 *
 * @module core
 */

// Type definitions - must be first
export type {
  // Core types
  Alpha,
  AnimationConfig,
  BoundingBox,
  EasingFunction,
  InterpolationResult,
  ObjectId,
  Point2D,
  Point3D,
  RenderObjectState,
  SceneConfig,
  Transform,
} from './types';

// Core render objects
export { GroupObject, RenderObject, TextObject, VectorObject } from './core';

// Animations
export {
  Animation,
  AnimationBuilder,
  AnimationGroup,
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  RotateAnimation,
  TransformAnimation,
  createAnimationConfig,
} from './animation';

// Scene management
export { Scene, SceneBuilder, createScene, sceneBuilder } from './scene';

// Easing functions
export {
  back,
  bounce,
  cubicBezier,
  custom,
  easeIn,
  easeInCirc,
  easeInCubic,
  easeInExpo,
  easeInFunctions,
  easeInOut,
  easeInOutCirc,
  easeInOutCubic,
  easeInOutExpo,
  easeInOutFunctions,
  easeInOutQuart,
  easeInOutQuint,
  easeInOutSine,
  easeOut,
  easeOutCirc,
  easeOutCubic,
  easeOutExpo,
  easeOutFunctions,
  easeOutQuart,
  easeOutQuint,
  easeOutSine,
  elastic,
  jumpBy,
  linear,
  smooth,
  smoother,
  specialFunctions,
  thereAndBack,
  thereAndBackWithPause,
} from './easing';

// Factory functions
export * from './factory';

// High-level API
export * from './api';

// Rendering system
export * from './render';

// Effects system
export * from './effects';

// Utilities
export { clamp, lerp } from './utils';

// Export system
export * from './export';
