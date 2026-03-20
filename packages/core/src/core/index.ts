/**
 * Core Module - Render Object Hierarchy
 *
 * This module exports the core render object classes that form
 * the foundation of the AniMaker animation framework.
 *
 * @module core
 */

// Abstract base class
export { RenderObject } from './RenderObject';
export type { RenderObject };

// Concrete render object types
export { VectorObject } from './VectorObject';
export type { VectorObject };

export { TextObject } from './TextObject';
export type { TextObject };

export { GroupObject } from './GroupObject';
export type { GroupObject };

// Re-export commonly used types for convenience
export type {
  ObjectId,
  Point3D,
  Point2D,
  BoundingBox,
  Transform,
  RenderObjectState,
  GeometryType,
  StrokeStyle,
  FillStyle,
  FontConfig
} from '../types';

export type {
  SceneConfig,
  SceneSnapshot,
  AnimationConfig,
  InterpolationResult,
  CompositionType,
  EasingFunction
} from '../types';

// Re-export constants
export { DEFAULT_TRANSFORM, DEFAULT_SCENE_CONFIG } from '../types';

// Re-export direction constants
export { ORIGIN, UP, DOWN, LEFT, RIGHT, IN, OUT } from '../types';

// Re-export utility functions
export {
  generateObjectId,
  isValidAlpha,
  clamp,
  lerp,
  lerpPoint,
  isPoint3D,
  isAlpha
} from '../types';
