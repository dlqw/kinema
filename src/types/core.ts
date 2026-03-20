/**
 * Core type definitions for AniMaker
 * Defines fundamental types used across the framework
 */

/**
 * 2D Vector representation
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Transform component
 * Defines position, rotation, and scale
 */
export interface Transform {
  position: Vector2D;
  rotation: number; // in radians
  scale: Vector2D;
}

/**
 * Bounding box for collision and culling
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Renderable component
 * Defines how a node should be rendered
 */
export interface Renderable {
  visible: boolean;
  opacity: number;
  width: number;
  height: number;
  color: string;
  blendMode?: BlendMode;
}

/**
 * Blend modes for rendering
 */
export type BlendMode =
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

/**
 * Base scene node interface
 */
export interface SceneNode {
  id: string;
  type: string;
  children: SceneNode[];
  transform: Transform;
  renderable?: Renderable;
}

/**
 * Node type enumeration
 */
export enum NodeType {
  NODE = 'node',
  SPRITE = 'sprite',
  SHAPE = 'shape',
  TEXT = 'text',
  CONTAINER = 'container',
}

/**
 * Animation state
 */
export interface AnimationState {
  playing: boolean;
  paused: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
}

/**
 * Tween options
 */
export interface TweenOptions {
  duration?: number; // milliseconds
  delay?: number;
  easing?: EasingFunction;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Easing function signature
 */
export type EasingFunction = (t: number) => number;

/**
 * Common easing functions
 */
export const Easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * Render context interface
 * Abstraction over Canvas 2D context
 */
export interface RenderContext {
  canvas: HTMLCanvasElement;
  clear(): void;
  render(node: SceneNode): void;
  save(): void;
  restore(): void;
  transform(matrix: Matrix3x3): void;
}

/**
 * 3x3 transformation matrix for 2D transformations
 */
export interface Matrix3x3 {
  a: number; // Horizontal scaling
  b: number; // Horizontal skewing
  c: number; // Vertical skewing
  d: number; // Vertical scaling
  e: number; // Horizontal translation
  f: number; // Vertical translation
}

/**
 * Color representation
 */
export type Color = string | RGB | RGBA;

/**
 * RGB color
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * RGBA color
 */
export interface RGBA extends RGB {
  a: number; // 0-1
}

/**
 * Rectangle interface
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Size interface
 */
export interface Size {
  width: number;
  height: number;
}
