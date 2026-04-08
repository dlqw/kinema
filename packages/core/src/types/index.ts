/**
 * Kinema Core Types
 *
 * Central type definitions for the Kinema animation framework.
 * All types are designed with immutability and type safety in mind.
 *
 * @module types
 */

// Core types (base types - no conflicts)
export type {
  ObjectId,
  Time,
  Alpha,
  Point3D,
  Point2D,
  BoundingBox,
  Transform,
  StrokeStyle,
  FillStyle,
  FontConfig,
  RenderObjectState,
  SceneConfig,
  SceneSnapshot,
  RenderObject,
  Animation,
  RGB,
  RGBA,
} from './core';

export {
  DEFAULT_TRANSFORM,
  GeometryType,
  ORIGIN,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  IN,
  OUT,
  generateObjectId,
  isPoint3D,
  isAlpha,
} from './core';

// Animation types (excluding what's already exported from core)
export type {
  EasingFunction,
  AnimationConfig,
  InterpolationResult,
  CompositionType,
  TimelineEventType,
  TimelineEvent,
} from './animation';

export {
  Animation as AnimationBase,
  AnimationBuilder,
  AnimationGroup,
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  RotateAnimation,
  ScaleAnimation,
  TransformAnimation,
  Timeline,
  smooth,
} from './animation';

// Scene types (excluding what's already exported from core)
export type { SceneState } from './scene';

export { Scene, SceneBuilder, createScene, sceneBuilder, DEFAULT_SCENE_CONFIG } from './scene';

// Object types (excluding what's already exported from core)
export {
  RenderObject as RenderObjectBase,
  VectorObject,
  TextObject,
  GroupObject,
  generateObjectId as generateObjectIdFromObjects,
} from './objects';

// Utilities (only type utilities, not implementation)
export {
  generateObjectId as generateObjectIdFromUtils,
  isObjectId,
  isTime,
  isPoint3D as isPoint3DUtil,
  isPoint2D,
  isRenderObject,
  isAnimation as isAnimationUtil,
  isEasingFunction as isEasingFunctionUtil,
  isScene,
  clamp,
  lerp,
  lerpPoint,
  lerpTransform,
  mapRange,
  distance,
  distance2D,
  angle,
  normalizeAngle,
  boundingBoxFromPoints,
  pointInBoundingBox,
  mergeBoundingBoxes,
  hexToRgb as hexToRgbUtil,
  rgbToHex as rgbToHexUtil,
  lerpColor,
  unique,
  flatten,
  chunk,
  inRange,
  nonEmpty,
  DEFAULT_TRANSFORM as DEFAULT_TRANSFORM_UTIL,
  ZERO_POINT,
  UNIT_POINT,
  UP as UP_UTIL,
  DOWN as DOWN_UTIL,
  LEFT as LEFT_UTIL,
  RIGHT as RIGHT_UTIL,
  FORWARD,
  BACK,
  PI,
  TAU,
  DEG_TO_RAD,
  RAD_TO_DEG,
} from './utils';

// Easing functions
export * from './easing';
