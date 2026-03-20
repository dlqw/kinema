/**
 * AniMaker - High-performance 2D animation rendering framework
 *
 * Main entry point for the framework
 */

// Re-export core scene components
export { Scene, Timeline, Circle, Rectangle, Text, Line, Arc, Group } from './scene'
export type {
  SceneConfig,
  RenderObject,
  CircleConfig,
  RectangleConfig,
  TextConfig,
  LineConfig,
  ArcConfig,
  GroupConfig,
  GroupObject,
  AnimationKeyframe,
} from './scene'

// Re-export easing functions
export { Easing } from './easing'

// Re-export core types
export type {
  Vector2D,
  Transform,
  BoundingBox,
  Renderable,
  BlendMode,
  SceneNode,
  AnimationState,
  TweenOptions,
  EasingFunction,
  RenderContext,
  Matrix3x3,
  Color,
  RGB,
  RGBA,
  Size,
} from './types/core'

export type {
  Event,
  MouseEvent,
  KeyboardEvent,
  TouchEvent,
  AnimationEvent,
  SceneEvent,
} from './types/events'

// Re-export enums
export { Easings } from './types/core'

// Re-export utilities
export * from './utils/math'
export * from './utils/color'

// Framework version
export const VERSION = '0.1.0'

/**
 * Creates a new AniMaker application
 * @param canvas - Canvas element to render to
 * @returns Application instance
 */
export function createApp(canvas: HTMLCanvasElement) {
  // Placeholder for future implementation
  return {
    canvas,
    version: VERSION,
  }
}

/**
 * Renders a scene to a canvas element
 */
export function renderToCanvas(
  scene: import('./scene').Scene,
  canvas: HTMLCanvasElement,
  time: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get 2d context')
  canvas.width = scene.width
  canvas.height = scene.height
  scene.render(ctx, time)
}
