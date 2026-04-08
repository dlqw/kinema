/**
 * 示例代码类型定义
 *
 * 提供示例代码中使用的类型和辅助函数
 * 确保示例代码可以独立编译和运行
 *
 * @module examples/types
 */

import type {
  Point3D,
  BoundingBox,
  Transform,
  ObjectId,
  EasingFunction,
  Alpha,
} from '../../../packages/core/src/types/core';
import type {
  RenderObjectState,
  AnimationConfig,
  InterpolationResult,
} from '../../../packages/core/src/types/core';
import type { SceneConfig } from '../../../packages/core/src/types/scene';
import type { CompositionType } from '../../../packages/core/src/types/animation';

/**
 * 重新导出核心类型
 */
export type {
  Point3D,
  BoundingBox,
  Transform,
  ObjectId,
  EasingFunction,
  Alpha,
  RenderObjectState,
  AnimationConfig,
  InterpolationResult,
  SceneConfig,
  CompositionType,
};

/**
 * 示例专用的简化类型
 */

/**
 * 移动动画配置
 */
export interface MoveAnimationConfig extends AnimationConfig {
  readonly deltaX?: number;
  readonly deltaY?: number;
  readonly deltaZ?: number;
  readonly targetPosition?: Point3D;
}

/**
 * 旋转动画配置
 */
export interface RotateAnimationConfig extends AnimationConfig {
  readonly axis: 'x' | 'y' | 'z';
  readonly degrees: number;
}

/**
 * 缩放动画配置
 */
export interface ScaleAnimationConfig extends AnimationConfig {
  readonly scaleFactor?: number;
  readonly targetScale?: Point3D;
}

/**
 * 渲染选项
 */
export interface RenderOptions {
  readonly autoplay?: boolean;
  readonly loop?: boolean;
  readonly showBounds?: boolean;
  readonly showGrid?: boolean;
}

/**
 * 导出枚举
 */
export { CompositionType } from '../../../packages/core/src/types/animation';
export { GeometryType } from '../../../packages/core/src/types/objects';
