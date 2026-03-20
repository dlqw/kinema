/**
 * 淡入淡出效果示例
 *
 * 这个示例展示了如何：
 * 1. 创建淡入动画（透明度从 0 到 1）
 * 2. 创建淡出动画（透明度从 1 到 0）
 * 3. 组合淡入淡出效果
 * 4. 创建闪烁/脉冲效果
 *
 * @module examples/basic/fade
 */

import {
  createScene,
  Scene
} from '../../../../packages/core/src/types/scene';
import {
  VectorObject
} from '../../../../packages/core/src/types/objects';
import {
  FadeInAnimation,
  FadeOutAnimation,
  AnimationGroup,
  CompositionType
} from '../../../../packages/core/src/types/animation';
import {
  smooth,
  easeInSine,
  easeOutSine,
  linear
} from '../../../../packages/core/src/types/easing';

/**
 * 创建基础淡入淡出示例
 *
 * @returns 配置好动画的场景
 */
export function createFadeExample(): Scene {
  // ============================================
  // 第一步：创建场景和对象
  // ============================================

  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建三个矩形，分别展示不同的淡入淡出效果
  const rect1: VectorObject = VectorObject.rectangle(
    1.5, 1,              // 宽度、高度
    { x: -3, y: 1, z: 0 },  // 位置
    undefined,
    { color: '#e74c3c', opacity: 0 }  // 初始透明度为 0
  );

  const rect2: VectorObject = VectorObject.rectangle(
    1.5, 1,
    { x: 0, y: 1, z: 0 },
    undefined,
    { color: '#3498db', opacity: 0 }
  );

  const rect3: VectorObject = VectorObject.rectangle(
    1.5, 1,
    { x: 3, y: 1, z: 0 },
    undefined,
    { color: '#2ecc71', opacity: 0 }
  );

  let currentScene: Scene = scene.addObjects(rect1, rect2, rect3);

  // ============================================
  // 第二步：创建淡入动画
  // ============================================

  // 矩形 1：平滑淡入
  const fadeIn1: FadeInAnimation = new FadeInAnimation(rect1, {
    duration: 1.0,
    easing: smooth,       // 平滑的 S 曲线
    name: 'fade-in-smooth'
  });

  // 矩形 2：慢速开始淡入
  const fadeIn2: FadeInAnimation = new FadeInAnimation(rect2, {
    duration: 1.0,
    easing: easeInSine,   // 开始慢，逐渐加快
    delay: 0.3,          // 延迟 0.3 秒开始
    name: 'fade-in-ease-in'
  });

  // 矩形 3：快速开始淡入
  const fadeIn3: FadeInAnimation = new FadeInAnimation(rect3, {
    duration: 1.0,
    easing: easeOutSine,  // 开始快，逐渐减慢
    delay: 0.6,
    name: 'fade-in-ease-out'
  });

  // 调度淡入动画
  currentScene = currentScene.schedule(fadeIn1, 0);
  currentScene = currentScene.schedule(fadeIn2, 0);
  currentScene = currentScene.schedule(fadeIn3, 0);

  // ============================================
  // 第三步：创建淡出动画
  // ============================================

  // 矩形 1：平滑淡出
  const fadeOut1: FadeOutAnimation = new FadeOutAnimation(rect1, {
    duration: 1.0,
    easing: smooth,
    name: 'fade-out-smooth'
  });

  // 矩形 2：快速淡出
  const fadeOut2: FadeOutAnimation = new FadeOutAnimation(rect2, {
    duration: 0.5,
    easing: easeInSine,
    name: 'fade-out-fast'
  });

  // 矩形 3：慢速淡出
  const fadeOut3: FadeOutAnimation = new FadeOutAnimation(rect3, {
    duration: 1.5,
    easing: easeOutSine,
    name: 'fade-out-slow'
  });

  // 调度淡出动画（在淡入完成后）
  currentScene = currentScene.schedule(fadeOut1, 1.5);
  currentScene = currentScene.schedule(fadeOut2, 1.8);
  currentScene = currentScene.schedule(fadeOut3, 2.0);

  return currentScene;
}

/**
 * 创建闪烁效果示例
 *
 * 通过交替的淡入淡出创建闪烁效果
 *
 * @returns 配置好动画的场景
 */
export function createBlinkExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建一个圆形
  const circle: VectorObject = VectorObject.circle(
    0.8,
    { x: 0, y: 0, z: 0 },
    { color: '#f39c12', width: 0.05 },
    { color: '#e67e22', opacity: 0 }
  );

  let currentScene: Scene = scene.addObject(circle);

  // 创建闪烁序列
  const blinkCount: number = 5;  // 闪烁次数
  const blinkDuration: number = 0.3;  // 每次闪烁的持续时间

  for (let i: number = 0; i < blinkCount; i++) {
    const fadeIn: FadeInAnimation = new FadeInAnimation(circle, {
      duration: blinkDuration,
      easing: linear,
      name: `blink-in-${i}`
    });

    const fadeOut: FadeOutAnimation = new FadeOutAnimation(circle, {
      duration: blinkDuration,
      easing: linear,
      name: `blink-out-${i}`
    });

    // 调度闪烁动画
    const startTime: number = i * blinkDuration * 2;
    currentScene = currentScene.schedule(fadeIn, startTime);
    currentScene = currentScene.schedule(fadeOut, startTime + blinkDuration);
  }

  // 最后保持显示状态
  const finalFadeIn: FadeInAnimation = new FadeInAnimation(circle, {
    duration: 0.5,
    easing: smooth,
    name: 'final-fade-in'
  });
  currentScene = currentScene.schedule(finalFadeIn, blinkCount * blinkDuration * 2);

  return currentScene;
}

/**
 * 创建脉冲效果示例
 *
 * 通过淡入淡出结合缩放创建脉冲效果
 *
 * @returns 配置好动画的场景
 */
export function createPulseExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建中心圆形
  const circle: VectorObject = VectorObject.circle(
    1.0,
    { x: 0, y: 0, z: 0 },
    { color: '#9b59b6', width: 0.05 },
    { color: '#8e44ad', opacity: 1 }
  );

  let currentScene: Scene = scene.addObject(circle);

  // 创建脉冲序列（淡入淡出 + 缩放）
  const pulseCount: number = 3;

  for (let i: number = 0; i < pulseCount; i++) {
    const startTime: number = i * 2;

    // 淡出并缩小
    const fadeOut: FadeOutAnimation = new FadeOutAnimation(circle, {
      duration: 0.8,
      easing: easeOutSine,
      name: `pulse-out-${i}`
    });

    // 淡入并放大
    const fadeIn: FadeInAnimation = new FadeInAnimation(circle, {
      duration: 0.8,
      easing: easeInSine,
      name: `pulse-in-${i}`
    });

    currentScene = currentScene.schedule(fadeOut, startTime);
    currentScene = currentScene.schedule(fadeIn, startTime + 0.8);
  }

  return currentScene;
}

/**
 * 创建交叉淡入淡出示例
 *
 * 展示一个对象淡出的同时另一个对象淡入
 *
 * @returns 配置好动画的场景
 */
export function createCrossFadeExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#2c3e50',
    fps: 60
  });

  // 创建两个重叠的矩形
  const rect1: VectorObject = VectorObject.rectangle(
    2, 2,
    { x: 0, y: 0, z: 0 },
    { color: '#e74c3c', width: 0.05 },
    { color: '#c0392b', opacity: 1 }
  );

  const rect2: VectorObject = VectorObject.rectangle(
    2, 2,
    { x: 0, y: 0, z: 0 },
    { color: '#3498db', width: 0.05 },
    { color: '#2980b9', opacity: 0 }
  );

  let currentScene: Scene = scene.addObjects(rect1, rect2);

  // 创建交叉淡入淡出动画组
  const crossFadeGroup: AnimationGroup = new AnimationGroup(
    rect1,  // 主目标对象
    [
      // 矩形 1 淡出
      new FadeOutAnimation(rect1, {
        duration: 1.5,
        easing: smooth,
        name: 'cross-fade-out'
      }),
      // 矩形 2 淡入（并行执行）
      new FadeInAnimation(rect2, {
        duration: 1.5,
        easing: smooth,
        name: 'cross-fade-in'
      })
    ],
    CompositionType.Parallel,  // 并行执行
    {
      duration: 1.5,
      easing: smooth,
      name: 'cross-fade-group'
    }
  );

  // 调度交叉淡入淡出
  currentScene = currentScene.schedule(crossFadeGroup, 0.5);

  return currentScene;
}

/**
 * 创建完整淡入淡出演示
 * 包含所有效果的组合展示
 *
 * @returns 配置好动画的场景
 */
export function createCompleteFadeDemo(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建多个对象展示不同效果
  const objects: VectorObject[] = [
    VectorObject.circle(0.4, { x: -4, y: 2, z: 0 }, undefined, { color: '#e74c3c', opacity: 0 }),
    VectorObject.circle(0.4, { x: -2, y: 2, z: 0 }, undefined, { color: '#e67e22', opacity: 0 }),
    VectorObject.circle(0.4, { x: 0, y: 2, z: 0 }, undefined, { color: '#f39c12', opacity: 0 }),
    VectorObject.circle(0.4, { x: 2, y: 2, z: 0 }, undefined, { color: '#2ecc71', opacity: 0 }),
    VectorObject.circle(0.4, { x: 4, y: 2, z: 0 }, undefined, { color: '#3498db', opacity: 0 })
  ];

  let currentScene: Scene = scene.addObjects(...objects);

  // 为每个对象创建不同的淡入效果
  objects.forEach((obj, index) => {
    const fadeIn: FadeInAnimation = new FadeInAnimation(obj, {
      duration: 0.8,
      easing: smooth,
      delay: index * 0.15,  // 错开时间
      name: `demo-fade-in-${index}`
    });

    const fadeOut: FadeOutAnimation = new FadeOutAnimation(obj, {
      duration: 0.8,
      easing: smooth,
      name: `demo-fade-out-${index}`
    });

    currentScene = currentScene.schedule(fadeIn, 0);
    currentScene = currentScene.schedule(fadeOut, 2);
  });

  // 添加闪烁提示文字（使用矩形模拟）
  const indicator: VectorObject = VectorObject.rectangle(
    3, 0.3,
    { x: 0, y: -2, z: 0 },
    undefined,
    { color: '#95a5a6', opacity: 0 }
  );

  currentScene = currentScene.addObject(indicator);

  // 闪烁提示
  for (let i: number = 0; i < 3; i++) {
    currentScene = currentScene.schedule(
      new FadeInAnimation(indicator, { duration: 0.3, easing: linear }),
      3.5 + i * 0.6
    );
    currentScene = currentScene.schedule(
      new FadeOutAnimation(indicator, { duration: 0.3, easing: linear }),
      3.8 + i * 0.6
    );
  }

  return currentScene;
}

/**
 * 主函数
 */
export function main(): void {
  console.log('====================================');
  console.log('淡入淡出效果示例');
  console.log('====================================');
  console.log('');
  console.log('本示例展示了：');
  console.log('1. 基础淡入淡出');
  console.log('2. 闪烁效果');
  console.log('3. 脉冲效果');
  console.log('4. 交叉淡入淡出');
  console.log('5. 完整演示');
  console.log('');
  console.log('可用函数：');
  console.log('  - createFadeExample()');
  console.log('  - createBlinkExample()');
  console.log('  - createPulseExample()');
  console.log('  - createCrossFadeExample()');
  console.log('  - createCompleteFadeDemo()');
  console.log('');
}

// 当直接运行此文件时，执行主函数
if (require.main === module) {
  main();
}
