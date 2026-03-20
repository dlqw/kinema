/**
 * 变换动画示例
 *
 * 这个示例展示了如何：
 * 1. 使用 MoveAnimation 移动对象
 * 2. 使用 RotateAnimation 旋转对象
 * 3. 使用 ScaleAnimation 缩放对象
 * 4. 组合多个变换创建复杂动画
 *
 * @module examples/intermediate/transform
 */

import {
  createScene,
  Scene
} from '../../../../packages/core/src/types/scene';
import {
  VectorObject
} from '../../../../packages/core/src/types/objects';
import {
  MoveAnimation,
  RotateAnimation,
  ScaleAnimation,
  FadeInAnimation,
  AnimationGroup,
  CompositionType
} from '../../../../packages/core/src/types/animation';
import {
  smooth,
  easeInOut,
  easeInCubic,
  easeOutCubic,
  easeOutBack,
  bounce
} from '../../../../packages/core/src/types/easing';

/**
 * 创建移动动画示例
 *
 * 展示对象在不同方向上的移动
 *
 * @returns 配置好动画的场景
 */
export function createMoveAnimationExample(): Scene {
  // ============================================
  // 创建场景
  // ============================================

  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // ============================================
  // 创建对象 - 使用网格布局展示不同移动方向
  // ============================================

  // 创建四个圆形，分别向不同方向移动
  const circles: VectorObject[] = [
    VectorObject.circle(0.3, { x: -3, y: 2, z: 0 }, undefined, { color: '#e74c3c', opacity: 1 }),  // 红色
    VectorObject.circle(0.3, { x: 3, y: 2, z: 0 }, undefined, { color: '#3498db', opacity: 1 }),   // 蓝色
    VectorObject.circle(0.3, { x: -3, y: -2, z: 0 }, undefined, { color: '#2ecc71', opacity: 1 }), // 绿色
    VectorObject.circle(0.3, { x: 3, y: -2, z: 0 }, undefined, { color: '#f39c12', opacity: 1 })   // 黄色
  ];

  let currentScene: Scene = scene.addObjects(...circles);

  // ============================================
  // 创建移动动画
  // ============================================

  // 圆 1：向右移动
  const moveRight: MoveAnimation = new MoveAnimation(
    circles[0],
    { x: 3, y: 2, z: 0 },  // 目标位置
    {
      duration: 2,
      easing: smooth,
      name: 'move-right'
    }
  );

  // 圆 2：向左移动
  const moveLeft: MoveAnimation = new MoveAnimation(
    circles[1],
    { x: -3, y: 2, z: 0 },
    {
      duration: 2,
      easing: smooth,
      name: 'move-left'
    }
  );

  // 圆 3：向上移动
  const moveUp: MoveAnimation = new MoveAnimation(
    circles[2],
    { x: -3, y: 2, z: 0 },
    {
      duration: 2,
      easing: smooth,
      name: 'move-up'
    }
  );

  // 圆 4：对角线移动（右下）
  const moveDiagonal: MoveAnimation = new MoveAnimation(
    circles[3],
    { x: 0, y: -2, z: 0 },
    {
      duration: 2,
      easing: easeInOut,  // 使用不同的缓动
      name: 'move-diagonal'
    }
  );

  // ============================================
  // 调度动画
  // ============================================

  currentScene = currentScene.schedule(moveRight, 0);
  currentScene = currentScene.schedule(moveLeft, 0);
  currentScene = currentScene.schedule(moveUp, 0);
  currentScene = currentScene.schedule(moveDiagonal, 0);

  return currentScene;
}

/**
 * 创建旋转动画示例
 *
 * 展示绕不同轴的旋转效果
 *
 * @returns 配置好动画的场景
 */
export function createRotateAnimationExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建三个矩形，分别绕不同轴旋转
  const rects: VectorObject[] = [
    VectorObject.rectangle(1.5, 1.5, { x: -3, y: 0, z: 0 }, undefined, { color: '#e74c3c', opacity: 1 }),
    VectorObject.rectangle(1.5, 1.5, { x: 0, y: 0, z: 0 }, undefined, { color: '#3498db', opacity: 1 }),
    VectorObject.rectangle(1.5, 1.5, { x: 3, y: 0, z: 0 }, undefined, { color: '#2ecc71', opacity: 1 })
  ];

  let currentScene: Scene = scene.addObjects(...rects);

  // 矩形 1：绕 Z 轴旋转（2D 平面旋转）
  const rotateZ: RotateAnimation = new RotateAnimation(
    rects[0],
    'z',
    360,
    {
      duration: 3,
      easing: smooth,
      name: 'rotate-z'
    }
  );

  // 矩形 2：绕 X 轴旋转（3D 翻转效果）
  const rotateX: RotateAnimation = new RotateAnimation(
    rects[1],
    'x',
    360,
    {
      duration: 3,
      easing: smooth,
      name: 'rotate-x'
    }
  );

  // 矩形 3：绕 Y 轴旋转（3D 翻转效果）
  const rotateY: RotateAnimation = new RotateAnimation(
    rects[2],
    'y',
    360,
    {
      duration: 3,
      easing: smooth,
      name: 'rotate-y'
    }
  );

  currentScene = currentScene.schedule(rotateZ, 0);
  currentScene = currentScene.schedule(rotateX, 0);
  currentScene = currentScene.schedule(rotateY, 0);

  return currentScene;
}

/**
 * 创建缩放动画示例
 *
 * 展示不同类型的缩放效果
 *
 * @returns 配置好动画的场景
 */
export function createScaleAnimationExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建多个对象展示不同缩放效果
  const objects: VectorObject[] = [
    // 1. 均匀放大
    VectorObject.circle(0.3, { x: -4, y: 2, z: 0 }, undefined, { color: '#e74c3c', opacity: 1 }),
    // 2. 均匀缩小
    VectorObject.circle(0.6, { x: -1.5, y: 2, z: 0 }, undefined, { color: '#e67e22', opacity: 1 }),
    // 3. 水平拉伸
    VectorObject.circle(0.4, { x: 1, y: 2, z: 0 }, undefined, { color: '#f39c12', opacity: 1 }),
    // 4. 垂直拉伸
    VectorObject.circle(0.4, { x: 3.5, y: 2, z: 0 }, undefined, { color: '#2ecc71', opacity: 1 }),
    // 5. 弹跳效果
    VectorObject.circle(0.4, { x: 0, y: -1.5, z: 0 }, undefined, { color: '#3498db', opacity: 1 })
  ];

  let currentScene: Scene = scene.addObjects(...objects);

  // 1. 均匀放大（0.3 → 1.0）
  const scaleUp: ScaleAnimation = new ScaleAnimation(
    objects[0],
    { x: 2, y: 2, z: 1 },  // 放大 2 倍
    {
      duration: 2,
      easing: easeOutCubic,
      name: 'scale-up'
    }
  );

  // 2. 均匀缩小（0.6 → 0.2）
  const scaleDown: ScaleAnimation = new ScaleAnimation(
    objects[1],
    { x: 0.33, y: 0.33, z: 1 },  // 缩小到 1/3
    {
      duration: 2,
      easing: easeInCubic,
      name: 'scale-down'
    }
  );

  // 3. 水平拉伸
  const stretchHorizontal: ScaleAnimation = new ScaleAnimation(
    objects[2],
    { x: 2, y: 1, z: 1 },
    {
      duration: 2,
      easing: easeOutBack,  // 带回弹效果
      name: 'stretch-horizontal'
    }
  );

  // 4. 垂直拉伸
  const stretchVertical: ScaleAnimation = new ScaleAnimation(
    objects[3],
    { x: 1, y: 2, z: 1 },
    {
      duration: 2,
      easing: easeOutBack,
      name: 'stretch-vertical'
    }
  );

  // 5. 弹跳缩放效果（缩放序列）
  const bounceScaleGroup: AnimationGroup = new AnimationGroup(
    objects[4],
    [
      // 放大
      new ScaleAnimation(objects[4], { x: 1.5, y: 1.5, z: 1 }, {
        duration: 0.4,
        easing: easeOutBack
      }),
      // 缩小
      new ScaleAnimation(objects[4], { x: 0.8, y: 0.8, z: 1 }, {
        duration: 0.3,
        easing: easeOutBack
      }),
      // 恢复
      new ScaleAnimation(objects[4], { x: 1, y: 1, z: 1 }, {
        duration: 0.3,
        easing: bounce  // 弹跳效果
      })
    ],
    CompositionType.Sequence,
    { duration: 1, easing: smooth }
  );

  // 调度所有动画
  currentScene = currentScene.schedule(scaleUp, 0);
  currentScene = currentScene.schedule(scaleDown, 0);
  currentScene = currentScene.schedule(stretchHorizontal, 0);
  currentScene = currentScene.schedule(stretchVertical, 0);
  currentScene = currentScene.schedule(bounceScaleGroup, 0);

  return currentScene;
}

/**
 * 创建组合变换示例
 *
 * 展示如何同时应用多个变换
 *
 * @returns 配置好动画的场景
 */
export function createCombinedTransformExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建一个火箭形状（使用矩形组合）
  const rocketBody: VectorObject = VectorObject.rectangle(
    0.4, 1.2,
    { x: 0, y: 0, z: 0 },
    { color: '#ecf0f1', width: 0.02 },
    { color: '#bdc3c7', opacity: 0 }
  );

  const rocketFin1: VectorObject = VectorObject.rectangle(
    0.3, 0.4,
    { x: -0.15, y: 0.4, z: 0 },
    { color: '#e74c3c', width: 0.02 },
    { color: '#c0392b', opacity: 0 }
  );

  const rocketFin2: VectorObject = VectorObject.rectangle(
    0.3, 0.4,
    { x: 0.15, y: 0.4, z: 0 },
    { color: '#e74c3c', width: 0.02 },
    { color: '#c0392b', opacity: 0 }
  );

  let currentScene: Scene = scene.addObjects(rocketBody, rocketFin1, rocketFin2);

  // 阶段 1：淡入
  const fadeInAll: AnimationGroup = new AnimationGroup(
    rocketBody,
    [
      new FadeInAnimation(rocketBody, { duration: 0.5, easing: smooth }),
      new FadeInAnimation(rocketFin1, { duration: 0.5, easing: smooth }),
      new FadeInAnimation(rocketFin2, { duration: 0.5, easing: smooth })
    ],
    CompositionType.Parallel
  );

  // 阶段 2：发射（向上移动 + 旋转 + 缩放）
  const launchGroup: AnimationGroup = new AnimationGroup(
    rocketBody,
    [
      // 向上移动
      new MoveAnimation(rocketBody, { x: 0, y: 3, z: 0 }, {
        duration: 2,
        easing: easeInCubic
      }),
      // 轻微旋转
      new RotateAnimation(rocketBody, 'z', 45, {
        duration: 2,
        easing: smooth
      }),
      // 翼跟随移动
      new MoveAnimation(rocketFin1, { x: -0.15, y: 3.4, z: 0 }, {
        duration: 2,
        easing: easeInCubic
      }),
      new MoveAnimation(rocketFin2, { x: 0.15, y: 3.4, z: 0 }, {
        duration: 2,
        easing: easeInCubic
      })
    ],
    CompositionType.Parallel
  );

  // 阶段 3：旋转返回
  const returnGroup: AnimationGroup = new AnimationGroup(
    rocketBody,
    [
      new MoveAnimation(rocketBody, { x: 0, y: 0, z: 0 }, {
        duration: 1.5,
        easing: easeOutCubic
      }),
      new RotateAnimation(rocketBody, 'z', -45, {
        duration: 1.5,
        easing: smooth
      }),
      new MoveAnimation(rocketFin1, { x: -0.15, y: 0.4, z: 0 }, {
        duration: 1.5,
        easing: easeOutCubic
      }),
      new MoveAnimation(rocketFin2, { x: 0.15, y: 0.4, z: 0 }, {
        duration: 1.5,
        easing: easeOutCubic
      })
    ],
    CompositionType.Parallel
  );

  // 调度动画序列
  currentScene = currentScene.schedule(fadeInAll, 0);
  currentScene = currentScene.schedule(launchGroup, 0.5);
  currentScene = currentScene.schedule(returnGroup, 2.5);

  return currentScene;
}

/**
 * 创建路径移动示例
 *
 * 展示对象沿路径移动的动画
 *
 * @returns 配置好动画的场景
 */
export function createPathAnimationExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建一个小球
  const ball: VectorObject = VectorObject.circle(
    0.3,
    { x: -4, y: 0, z: 0 },
    { color: '#e74c3c', width: 0.05 },
    { color: '#c0392b', opacity: 1 }
  );

  let currentScene: Scene = scene.addObject(ball);

  // 创建沿路径移动的动画序列（近似圆形路径）
  const pathPoints: Array<{ x: number; y: number; z: number }> = [
    { x: -4, y: 0, z: 0 },   // 起点（左）
    { x: -2, y: 2, z: 0 },   // 上左
    { x: 0, y: 3, z: 0 },    // 顶
    { x: 2, y: 2, z: 0 },    // 上右
    { x: 4, y: 0, z: 0 },    // 右
    { x: 2, y: -2, z: 0 },   // 下右
    { x: 0, y: -3, z: 0 },   // 底
    { x: -2, y: -2, z: 0 },  // 下左
    { x: -4, y: 0, z: 0 }    // 回到起点
  ];

  // 为每个路径段创建移动动画
  pathPoints.forEach((point, index) => {
    if (index === 0) return;  // 跳过起点

    const moveAlongPath: MoveAnimation = new MoveAnimation(
      ball,
      point,
      {
        duration: 0.5,
        easing: smooth,
        name: `path-segment-${index}`
      }
    );

    currentScene = currentScene.schedule(moveAlongPath, index * 0.5);
  });

  return currentScene;
}

/**
 * 主函数
 */
export function main(): void {
  console.log('====================================');
  console.log('变换动画示例');
  console.log('====================================');
  console.log('');
  console.log('本示例展示了：');
  console.log('1. 移动动画（MoveAnimation）');
  console.log('2. 旋转动画（RotateAnimation）');
  console.log('3. 缩放动画（ScaleAnimation）');
  console.log('4. 组合变换');
  console.log('5. 路径移动');
  console.log('');
  console.log('可用函数：');
  console.log('  - createMoveAnimationExample()');
  console.log('  - createRotateAnimationExample()');
  console.log('  - createScaleAnimationExample()');
  console.log('  - createCombinedTransformExample()');
  console.log('  - createPathAnimationExample()');
  console.log('');
}

// 当直接运行此文件时，执行主函数
if (require.main === module) {
  main();
}
