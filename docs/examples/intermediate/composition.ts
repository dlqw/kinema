/**
 * 动画组合示例
 *
 * 这个示例展示了如何：
 * 1. 使用并行动画（Parallel）同时执行多个动画
 * 2. 使用顺序动画（Sequence）依次执行多个动画
 * 3. 使用延迟动画（Lagged）创建级联效果
 * 4. 嵌套组合创建复杂的动画序列
 *
 * @module examples/intermediate/composition
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
  FadeOutAnimation,
  AnimationGroup,
  CompositionType
} from '../../../../packages/core/src/types/animation';
import {
  smooth,
  easeInOut,
  easeInCubic,
  easeOutCubic,
  easeOutBack,
  elastic
} from '../../../../packages/core/src/types/easing';

/**
 * 创建并行动画示例
 *
 * 展示多个动画同时执行的效果
 * 例如：一个对象同时移动和旋转（像车轮滚动）
 *
 * @returns 配置好动画的场景
 */
export function createParallelExample(): Scene {
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
  // 示例 1：车轮滚动效果
  // ============================================

  // 创建车轮（圆形）
  const wheel: VectorObject = VectorObject.circle(
    0.5,
    { x: -4, y: 0, z: 0 },
    { color: '#f39c12', width: 0.08 },
    { color: '#e67e22', opacity: 1 }
  );

  let currentScene: Scene = scene.addObject(wheel);

  // 创建并行动画组：同时移动和旋转
  const wheelRollGroup: AnimationGroup = new AnimationGroup(
    wheel,
    [
      // 向右移动
      new MoveAnimation(wheel, { x: 0, y: 0, z: 0 }, {
        duration: 2,
        easing: smooth,
        name: 'wheel-move'
      }),
      // 同时旋转（模拟滚动）
      new RotateAnimation(wheel, 'z', 720, {
        duration: 2,
        easing: smooth,
        name: 'wheel-rotate'
      })
    ],
    CompositionType.Parallel,  // 并行执行
    {
      duration: 2,
      easing: smooth,
      name: 'wheel-roll-group'
    }
  );

  currentScene = currentScene.schedule(wheelRollGroup, 0);

  // ============================================
  // 示例 2：变形动画
  // ============================================

  const box: VectorObject = VectorObject.rectangle(
    1, 1,
    { x: 2, y: 0, z: 0 },
    { color: '#3498db', width: 0.05 },
    { color: '#2980b9', opacity: 1 }
  );

  currentScene = currentScene.addObject(box);

  // 同时改变位置、旋转和缩放
  const transformGroup: AnimationGroup = new AnimationGroup(
    box,
    [
      new MoveAnimation(box, { x: 4, y: 2, z: 0 }, {
        duration: 2,
        easing: easeInOut,
        name: 'box-move'
      }),
      new RotateAnimation(box, 'z', 180, {
        duration: 2,
        easing: easeInOut,
        name: 'box-rotate'
      }),
      new ScaleAnimation(box, { x: 1.5, y: 1.5, z: 1 }, {
        duration: 2,
        easing: easeInOut,
        name: 'box-scale'
      })
    ],
    CompositionType.Parallel,
    { duration: 2, easing: easeInOut }
  );

  currentScene = currentScene.schedule(transformGroup, 0);

  return currentScene;
}

/**
 * 创建顺序动画示例
 *
 * 展示动画按顺序依次执行的效果
 * 例如：一个多步骤的动画序列
 *
 * @returns 配置好动画的场景
 */
export function createSequenceExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建一个英雄角色（用圆形表示）
  const hero: VectorObject = VectorObject.circle(
    0.5,
    { x: -4, y: 0, z: 0 },
    { color: '#e74c3c', width: 0.05 },
    { color: '#c0392b', opacity: 0 }
  );

  let currentScene: Scene = scene.addObject(hero);

  // 创建一个完整的入场动画序列
  const entranceSequence: AnimationGroup = new AnimationGroup(
    hero,
    [
      // 步骤 1：淡入
      new FadeInAnimation(hero, {
        duration: 0.5,
        easing: smooth,
        name: 'step-1-fade-in'
      }),

      // 步骤 2：移动到中心
      new MoveAnimation(hero, { x: 0, y: 0, z: 0 }, {
        duration: 1,
        easing: easeInOut,
        name: 'step-2-move-center'
      }),

      // 步骤 3：放大亮相
      new ScaleAnimation(hero, { x: 1.5, y: 1.5, z: 1 }, {
        duration: 0.5,
        easing: easeOutBack,
        name: 'step-3-scale-up'
      }),

      // 步骤 4：旋转一圈
      new RotateAnimation(hero, 'z', 360, {
        duration: 1,
        easing: smooth,
        name: 'step-4-rotate'
      }),

      // 步骤 5：缩小恢复正常
      new ScaleAnimation(hero, { x: 1, y: 1, z: 1 }, {
        duration: 0.5,
        easing: smooth,
        name: 'step-5-scale-down'
      }),

      // 步骤 6：淡出
      new FadeOutAnimation(hero, {
        duration: 0.5,
        easing: smooth,
        name: 'step-6-fade-out'
      })
    ],
    CompositionType.Sequence,  // 顺序执行
    {
      duration: 0.5 + 1 + 0.5 + 1 + 0.5 + 0.5,  // 总时长
      easing: smooth,
      name: 'entrance-sequence'
    }
  );

  currentScene = currentScene.schedule(entranceSequence, 0);

  return currentScene;
}

/**
 * 创建延迟动画示例
 *
 * 展示延迟执行创建的波浪/级联效果
 *
 * @returns 配置好动画的场景
 */
export function createLaggedExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建一排圆形
  const circles: VectorObject[] = [];
  const colors: string[] = ['#e74c3c', '#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'];

  for (let i: number = 0; i < 6; i++) {
    const circle: VectorObject = VectorObject.circle(
      0.3,
      { x: -3.5 + i * 1.5, y: 0, z: 0 },
      { color: '#ecf0f1', width: 0.02 },
      { color: colors[i], opacity: 1 }
    );
    circles.push(circle);
  }

  let currentScene: Scene = scene.addObjects(...circles);

  // 为每个圆形创建相同的动画
  const animations = circles.map((circle, index) => {
    return new MoveAnimation(circle, { x: -3.5 + index * 1.5, y: 2, z: 0 }, {
      duration: 1.5,
      easing: easeOutCubic,
      name: `circle-move-${index}`
    });
  });

  // 创建延迟动画组
  const laggedGroup: AnimationGroup = new AnimationGroup(
    circles[0],  // 主目标（实际不会被使用）
    animations,
    CompositionType.Lagged,  // 延迟执行
    {
      duration: 1.5 + 0.15 * (animations.length - 1),  // 总时长 = 动画时长 + 延迟
      easing: easeOutCubic,
      name: 'lagged-wave'
    }
  );

  currentScene = currentScene.schedule(laggedGroup, 0);

  // 创建第二组波浪（向下移动）
  const animationsDown = circles.map((circle, index) => {
    return new MoveAnimation(circle, { x: -3.5 + index * 1.5, y: -2, z: 0 }, {
      duration: 1.5,
      easing: easeInCubic,
      name: `circle-move-down-${index}`
    });
  });

  const laggedGroupDown: AnimationGroup = new AnimationGroup(
    circles[0],
    animationsDown,
    CompositionType.Lagged,
    {
      duration: 1.5 + 0.15 * (animationsDown.length - 1),
      easing: easeInCubic,
      name: 'lagged-wave-down'
    }
  );

  currentScene = currentScene.schedule(laggedGroupDown, 2);

  return currentScene;
}

/**
 * 创建嵌套组合示例
 *
 * 展示如何嵌套组合创建复杂动画
 *
 * @returns 配置好动画的场景
 */
export function createNestedCompositionExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建多个对象
  const center: VectorObject = VectorObject.circle(
    0.8,
    { x: 0, y: 0, z: 0 },
    { color: '#e74c3c', width: 0.05 },
    { color: '#c0392b', opacity: 0 }
  );

  const orbit1: VectorObject = VectorObject.circle(
    0.3,
    { x: 2, y: 0, z: 0 },
    undefined,
    { color: '#3498db', opacity: 0 }
  );

  const orbit2: VectorObject = VectorObject.circle(
    0.3,
    { x: -2, y: 0, z: 0 },
    undefined,
    { color: '#2ecc71', opacity: 0 }
  );

  let currentScene: Scene = scene.addObjects(center, orbit1, orbit2);

  // ============================================
  // 第一阶段：所有对象淡入
  // ============================================

  const fadeInStage: AnimationGroup = new AnimationGroup(
    center,
    [
      new FadeInAnimation(center, { duration: 0.5, easing: smooth }),
      new FadeInAnimation(orbit1, { duration: 0.5, easing: smooth }),
      new FadeInAnimation(orbit2, { duration: 0.5, easing: smooth })
    ],
    CompositionType.Parallel,
    { duration: 0.5, easing: smooth }
  );

  currentScene = currentScene.schedule(fadeInStage, 0);

  // ============================================
  // 第二阶段：中心旋转 + 轨道对象公转
  // ============================================

  const centerRotate: RotateAnimation = new RotateAnimation(center, 'z', 360, {
    duration: 3,
    easing: smooth
  });

  const orbit1Move: MoveAnimation = new MoveAnimation(orbit1, { x: -2, y: 0, z: 0 }, {
    duration: 3,
    easing: smooth
  });

  const orbit2Move: MoveAnimation = new MoveAnimation(orbit2, { x: 2, y: 0, z: 0 }, {
    duration: 3,
    easing: smooth
  });

  const orbitStage: AnimationGroup = new AnimationGroup(
    center,
    [centerRotate, orbit1Move, orbit2Move],
    CompositionType.Parallel,
    { duration: 3, easing: smooth }
  );

  currentScene = currentScene.schedule(orbitStage, 0.5);

  // ============================================
  // 第三阶段：聚拢效果
  // ============================================

  const convergeStage: AnimationGroup = new AnimationGroup(
    center,
    [
      new MoveAnimation(center, { x: 0, y: 0, z: 0 }, {
        duration: 1,
        easing: easeOutBack
      }),
      new MoveAnimation(orbit1, { x: 0.8, y: 0, z: 0 }, {
        duration: 1,
        easing: easeOutBack
      }),
      new MoveAnimation(orbit2, { x: -0.8, y: 0, z: 0 }, {
        duration: 1,
        easing: easeOutBack
      }),
      new ScaleAnimation(center, { x: 1.5, y: 1.5, z: 1 }, {
        duration: 1,
        easing: elastic
      })
    ],
    CompositionType.Parallel,
    { duration: 1, easing: easeOutBack }
  );

  currentScene = currentScene.schedule(convergeStage, 3.5);

  // ============================================
  // 第四阶段：爆炸扩散
  // ============================================

  const explodeStage: AnimationGroup = new AnimationGroup(
    center,
    [
      new ScaleAnimation(center, { x: 0.5, y: 0.5, z: 1 }, {
        duration: 0.5,
        easing: easeInCubic
      }),
      new MoveAnimation(orbit1, { x: 4, y: 2, z: 0 }, {
        duration: 0.8,
        easing: easeOutCubic
      }),
      new MoveAnimation(orbit2, { x: -4, y: -2, z: 0 }, {
        duration: 0.8,
        easing: easeOutCubic
      }),
      new FadeOutAnimation(center, { duration: 0.5, easing: smooth })
    ],
    CompositionType.Parallel,
    { duration: 0.8, easing: easeOutCubic }
  );

  currentScene = currentScene.schedule(explodeStage, 4.5);

  return currentScene;
}

/**
 * 创建复杂编排示例
 *
 * 展示一个完整的复杂动画编排
 *
 * @returns 配置好动画的场景
 */
export function createComplexChoreographyExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60
  });

  // 创建多个对象组成的"队伍"
  const dancers: VectorObject[] = [];
  for (let i: number = 0; i < 5; i++) {
    const dancer: VectorObject = VectorObject.circle(
      0.3,
      { x: -3 + i * 1.5, y: -2, z: 0 },
      { color: '#ecf0f1', width: 0.02 },
      { color: `hsl(${200 + i * 30}, 70%, 60%)`, opacity: 0 }
    );
    dancers.push(dancer);
  }

  let currentScene: Scene = scene.addObjects(...dancers);

  // ============================================
  // 第一幕：入场
  // ============================================

  // 依次淡入并跳上舞台
  dancers.forEach((dancer, index) => {
    const jumpInGroup: AnimationGroup = new AnimationGroup(
      dancer,
      [
        new FadeInAnimation(dancer, { duration: 0.3, easing: smooth }),
        new MoveAnimation(dancer, { x: -3 + index * 1.5, y: 0, z: 0 }, {
          duration: 0.5,
          easing: easeOutBack
        })
      ],
      CompositionType.Parallel,
      { duration: 0.5, easing: smooth }
    );

    currentScene = currentScene.schedule(jumpInGroup, index * 0.2);
  });

  // ============================================
  // 第二幕：波浪效果
  // ============================================

  const startTime: number = 1.5;
  dancers.forEach((dancer, index) => {
    const waveMove: MoveAnimation = new MoveAnimation(dancer, {
      x: -3 + index * 1.5,
      y: 1.5,
      z: 0
    }, {
      duration: 1,
      easing: easeInOut
    });

    currentScene = currentScene.schedule(waveMove, startTime + index * 0.15);
  });

  // ============================================
  // 第三幕：旋转圆环
  // ============================================

  const rotateStartTime: number = 3;
  dancers.forEach((dancer, index) => {
    const angle: number = (index / dancers.length) * Math.PI * 2;
    const targetX: number = Math.cos(angle) * 2;
    const targetY: number = Math.sin(angle) * 2;

    const formCircle: MoveAnimation = new MoveAnimation(dancer, {
      x: targetX,
      y: targetY,
      z: 0
    }, {
      duration: 1,
      easing: easeInOut
    });

    currentScene = currentScene.schedule(formCircle, rotateStartTime);
  });

  // ============================================
  // 第四幕：螺旋汇聚
  // ============================================

  const spiralStartTime: number = 4.5;
  dancers.forEach((dancer, index) => {
    const spiralGroup: AnimationGroup = new AnimationGroup(
      dancer,
      [
        new MoveAnimation(dancer, { x: 0, y: 0, z: 0 }, {
          duration: 1.5,
          easing: easeInOutCubic
        }),
        new RotateAnimation(dancer, 'z', 360, {
          duration: 1.5,
          easing: smooth
        }),
        new ScaleAnimation(dancer, { x: 0.3, y: 0.3, z: 1 }, {
          duration: 1.5,
          easing: easeInCubic
        })
      ],
      CompositionType.Parallel,
      { duration: 1.5, easing: easeInOutCubic }
    );

    currentScene = currentScene.schedule(spiralGroup, spiralStartTime + index * 0.1);
  });

  return currentScene;
}

/**
 * 主函数
 */
export function main(): void {
  console.log('====================================');
  console.log('动画组合示例');
  console.log('====================================');
  console.log('');
  console.log('本示例展示了：');
  console.log('1. 并行动画（Parallel）');
  console.log('2. 顺序动画（Sequence）');
  console.log('3. 延迟动画（Lagged）');
  console.log('4. 嵌套组合');
  console.log('5. 复杂编排');
  console.log('');
  console.log('可用函数：');
  console.log('  - createParallelExample()');
  console.log('  - createSequenceExample()');
  console.log('  - createLaggedExample()');
  console.log('  - createNestedCompositionExample()');
  console.log('  - createComplexChoreographyExample()');
  console.log('');
}

// 当直接运行此文件时，执行主函数
if (require.main === module) {
  main();
}
