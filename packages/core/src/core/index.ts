/**
 * Core Module - Render Object Hierarchy
 *
 * This module exports the core render object classes that form
 * the foundation of the Kinema animation framework.
 *
 * @module core
 */

// Abstract base class
export { RenderObject } from './RenderObject';

// Concrete render object types
export { VectorObject } from './VectorObject';

export { TextObject } from './TextObject';

export { GroupObject } from './GroupObject';

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
  FontConfig,
} from '../types';

export type {
  SceneConfig,
  SceneSnapshot,
  AnimationConfig,
  InterpolationResult,
  CompositionType,
  EasingFunction,
} from '../types';

// Re-export constants
export { DEFAULT_TRANSFORM, DEFAULT_SCENE_CONFIG } from '../types';

// Re-export direction constants
export { ORIGIN, UP, DOWN, LEFT, RIGHT, IN, OUT } from '../types';

// Re-export utility functions
export { generateObjectId, isPoint3D, isAlpha } from '../types';

// Re-export utility functions from utils
export { clamp, lerp, lerpPoint } from '../types/utils';
