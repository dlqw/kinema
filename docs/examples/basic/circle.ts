/**
 * 旋转的圆形
 *
 * 这个示例展示了如何：
 * 1. 创建一个带有填充和描边的圆形
 * 2. 应用旋转动画
 * 3. 使用不同的缓动函数控制旋转速度
 *
 * @module examples/basic/circle
 */

import {
  createScene,
  Scene
} from '../../../../packages/core/src/types/scene';
import {
  VectorObject
} from '../../../../packages/core/src/types/objects';
import {
  RotateAnimation,
  FadeInAnimation
} from '../../../../packages/core/src/types/animation';
import {
  smooth,
  easeInOutCubic,
  linear
} from '../../../../packages/core/src/types/easing';

/**
 * 创建旋转圆形示例
 *
 * @returns 配置好动画的场景
 */
export function createRotatingCircleExample(): Scene {
  // ============================================
  // 第一步：创建场景
  // ============================================

  const scene: Scene = createScene({
    width: 1280,           // 场景宽度（像素）
    height: 720,           // 场景高度（像素）
    backgroundColor: '#1a1a2e',  // 深蓝色背景
    fps: 60                // 每秒 60 帧
  });

  // ============================================
  // 第二步：创建圆形对象
  // ============================================

  // 定义圆形的样式
  const circleStroke = {
    color: '#3498db',      // 蓝色描边
    width: 0.05            // 描边宽度（相对于场景）
  };

  const circleFill = {
    color: '#2980b9',      // 深蓝色填充
    opacity: 0.8           // 填充透明度
  };

  // 创建半径为 1 的圆形
  // 注意：在 AniMaker 中，尺寸是相对于场景的归一化坐标
  const circle: VectorObject = VectorObject.circle(
    1.0,                   // 半径
    { x: 0, y: 0, z: 0 }, // 圆心位置（场景中心）
    circleStroke,         // 描边样式
    circleFill            // 填充样式
  );

  // 将圆形添加到场景
  let currentScene: Scene = scene.addObject(circle);

  // ============================================
  // 第三步：创建动画
  // ============================================

  // 动画 1：淡入效果（0 到 0.5 秒）
  const fadeIn: FadeInAnimation = new FadeInAnimation(circle, {
    duration: 0.5,        // 持续时间：0.5 秒
    easing: smooth,       // 使用平滑缓动
    name: 'fade-in'       // 动画名称（用于调试）
  });

  // 动画 2：旋转 360 度（0.5 到 2.5 秒）
  const rotateFull: RotateAnimation = new RotateAnimation(
    circle,               // 目标对象
    'z',                  // 绕 Z 轴旋转（垂直于屏幕）
    360,                  // 旋转角度（度）
    {
      duration: 2.0,      // 持续时间：2 秒
      easing: smooth,     // 平滑加速和减速
      name: 'rotate-full'
    }
  );

  // 动画 3：反向旋转（2.5 到 4 秒）
  const rotateBack: RotateAnimation = new RotateAnimation(
    circle,
    'z',
    -360,                 // 反向旋转
    {
      duration: 1.5,
      easing: easeInOutCubic,  // 使用不同的缓动效果
      name: 'rotate-back'
    }
  );

  // 动画 4：快速旋转（4 到 5 秒）
  const rotateFast: RotateAnimation = new RotateAnimation(
    circle,
    'z',
    720,                  // 旋转两圈
    {
      duration: 1.0,
      easing: linear,     // 匀速旋转
      name: 'rotate-fast'
    }
  );

  // ============================================
  // 第四步：调度动画到时间线
  // ============================================

  // 立即开始淡入动画
  currentScene = currentScene.schedule(fadeIn, 0);

  // 淡入完成后开始旋转（延迟 0.5 秒）
  currentScene = currentScene.schedule(rotateFull, 0.5);

  // 第一轮旋转完成后开始反向旋转（延迟 2.5 秒）
  currentScene = currentScene.schedule(rotateBack, 2.5);

  // 反向旋转完成后开始快速旋转（延迟 4 秒）
  currentScene = currentScene.schedule(rotateFast, 4);

  return currentScene;
}

/**
 * 创建多个旋转圆形的示例
 * 展示如何同时动画化多个对象
 *
 * @returns 配置好动画的场景
 */
export function createMultipleCirclesExample(): Scene {
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#0f0f1e',
    fps: 60
  });

  // 创建三个不同颜色的圆形
  const colors = [
    { fill: '#e74c3c', stroke: '#c0392b' },  // 红色
    { fill: '#3498db', stroke: '#2980b9' },  // 蓝色
    { fill: '#2ecc71', stroke: '#27ae60' }   // 绿色
  ];

  const circles: VectorObject[] = colors.map((color, index) => {
    return VectorObject.circle(
      0.5,
      { x: -2 + index * 2, y: 0, z: 0 },  // 水平排列
      { color: color.stroke, width: 0.05 },
      { color: color.fill, opacity: 0.8 }
    ).withPosition(-2 + index * 2, 0, 0);  // 设置初始位置
  });

  // 添加所有圆形到场景
  let currentScene: Scene = scene.addObjects(...circles);

  // 为每个圆形创建旋转动画
  circles.forEach((circle, index) => {
    const rotate: RotateAnimation = new RotateAnimation(
      circle,
      'z',
      360,
      {
        duration: 2 + index * 0.5,  // 每个圆形的旋转速度不同
        easing: smooth,
        name: `rotate-circle-${index}`
      }
    );

    // 淡入动画
    const fadeIn: FadeInAnimation = new FadeInAnimation(circle, {
      duration: 0.5,
      easing: smooth,
      name: `fade-in-circle-${index}`
    });

    // 调度动画
    currentScene = currentScene.schedule(fadeIn, index * 0.2);  // 错开淡入时间
    currentScene = currentScene.schedule(rotate, 0.5);
  });

  return currentScene;
}

/**
 * 主函数 - 当直接运行此文件时执行
 */
export function main(): void {
  console.log('====================================');
  console.log('旋转圆形示例');
  console.log('====================================');
  console.log('');
  console.log('本示例展示了：');
  console.log('1. 如何创建带有样式的圆形');
  console.log('2. 如何应用旋转动画');
  console.log('3. 如何使用不同的缓动函数');
  console.log('4. 如何调度多个动画到时间线');
  console.log('');
  console.log('运行方式：');
  console.log('  import { createRotatingCircleExample } from "./circle";');
  console.log('  const scene = createRotatingCircleExample();');
  console.log('  // 使用渲染器渲染场景...');
  console.log('');

  // 创建示例场景
  const exampleScene: Scene = createRotatingCircleExample();

  console.log('场景已创建！');
  console.log('  - 宽度:', exampleScene.config.width);
  console.log('  - 高度:', exampleScene.config.height);
  console.log('  - 背景色:', exampleScene.config.backgroundColor);
  console.log('  - 帧率:', exampleScene.config.fps, 'fps');
  console.log('  - 对象数量:', exampleScene.getObjects().length);
  console.log('');

  // 创建多圆形示例
  const multipleScene: Scene = createMultipleCirclesExample();
  console.log('多圆形场景已创建！');
  console.log('  - 对象数量:', multipleScene.getObjects().length);
}

// 当直接运行此文件时，执行主函数
if (require.main === module) {
  main();
}
