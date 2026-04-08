/**
 * 场景5: 应用场景 (4:30 - 5:00)
 *
 * 展示四大应用场景：
 * - 教育视频
 * - 数据可视化
 * - 创意动画
 * - 产品演示
 */

import { Scene, Circle, Rectangle, Text, Group, Line, Arc } from '../../src';
import type { RenderObject, GroupObject } from '../../src';
import { colors, videoConfig } from '../main';
import { Easing } from '../../src/easing';

// Type aliases to avoid DOM type conflicts
type AnimGroup = GroupObject;

// === 教育视频场景 ===

function createEducationDemo(x: number, y: number, width: number, height: number): AnimGroup {
  const container = Group();

  // 背景
  const bg = Rectangle({
    x,
    y,
    width,
    height,
    color: '#1C2128',
    cornerRadius: 16,
    opacity: 0,
  });
  container.add(bg);

  // 标题
  const title = Text({
    x: x + width / 2,
    y: y + 30,
    content: '📚 教育视频',
    fontSize: 24,
    color: colors.brand,
    opacity: 0,
  });
  container.add(title);

  // 勾股定理演示
  // a² + b² = c²
  const formula = Text({
    x: x + width / 2,
    y: y + 80,
    content: 'a² + b² = c²',
    fontSize: 28,
    fontFamily: 'Times New Roman, serif',
    color: colors.text.primary,
    opacity: 0,
  });
  container.add(formula);

  // 正方形 a²
  const squareA = Rectangle({
    x: x + 40,
    y: y + 140,
    width: 60,
    height: 60,
    color: '#FF6B6B',
    opacity: 0,
  });
  container.add(squareA);

  const labelA = Text({
    x: x + 70,
    y: y + 165,
    content: 'a²',
    fontSize: 18,
    color: colors.background,
    opacity: 0,
  });
  container.add(labelA);

  // 正方形 b²
  const squareB = Rectangle({
    x: x + 120,
    y: y + 140,
    width: 80,
    height: 80,
    color: '#4ECDC4',
    opacity: 0,
  });
  container.add(squareB);

  const labelB = Text({
    x: x + 155,
    y: y + 175,
    content: 'b²',
    fontSize: 18,
    color: colors.background,
    opacity: 0,
  });
  container.add(labelB);

  // 正方形 c² (斜边)
  const squareC = Rectangle({
    x: x + 230,
    y: y + 130,
    width: 100,
    height: 100,
    color: '#FFE66D',
    rotation: 45,
    opacity: 0,
  });
  container.add(squareC);

  const labelC = Text({
    x: x + 270,
    y: y + 175,
    content: 'c²',
    fontSize: 18,
    color: colors.background,
    opacity: 0,
  });
  container.add(labelC);

  return container;
}

// === 数据可视化场景 ===

function createDataVizDemo(x: number, y: number, width: number, height: number): AnimGroup {
  const container = Group();

  // 背景
  const bg = Rectangle({
    x,
    y,
    width,
    height,
    color: '#1C2128',
    cornerRadius: 16,
    opacity: 0,
  });
  container.add(bg);

  // 标题
  const title = Text({
    x: x + width / 2,
    y: y + 30,
    content: '📊 数据可视化',
    fontSize: 24,
    color: colors.brand,
    opacity: 0,
  });
  container.add(title);

  // 柱状图
  const barData = [0.7, 0.9, 0.5, 0.8, 0.6];
  const barColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];

  barData.forEach((value, i) => {
    const bar = Rectangle({
      x: x + 40 + i * 55,
      y: y + 220 - value * 120,
      width: 40,
      height: value * 120,
      color: barColors[i],
      cornerRadius: [4, 4, 0, 0],
      opacity: 0,
    });
    container.add(bar);
  });

  return container;
}

// === 创意动画场景 ===

function createCreativeDemo(x: number, y: number, width: number, height: number): AnimGroup {
  const container = Group();

  // 背景
  const bg = Rectangle({
    x,
    y,
    width,
    height,
    color: '#1C2128',
    cornerRadius: 16,
    opacity: 0,
  });
  container.add(bg);

  // 标题
  const title = Text({
    x: x + width / 2,
    y: y + 30,
    content: '🎨 创意动画',
    fontSize: 24,
    color: colors.brand,
    opacity: 0,
  });
  container.add(title);

  // 几何图形组合
  const shapes = [
    { type: 'circle', x: x + 80, y: y + 130, size: 30, color: '#FF6B6B' },
    { type: 'circle', x: x + 200, y: y + 130, size: 25, color: '#4ECDC4' },
    { type: 'circle', x: x + 140, y: y + 180, size: 35, color: '#FFE66D' },
    { type: 'square', x: x + 260, y: y + 150, size: 40, color: '#95E1D3' },
    { type: 'circle', x: x + 320, y: y + 140, size: 28, color: '#F38181' },
  ];

  shapes.forEach((shape) => {
    if (shape.type === 'circle') {
      const circle = Circle({
        x: shape.x,
        y: shape.y,
        radius: shape.size,
        color: shape.color,
        opacity: 0,
      });
      container.add(circle);
    } else {
      const square = Rectangle({
        x: shape.x - shape.size / 2,
        y: shape.y - shape.size / 2,
        width: shape.size,
        height: shape.size,
        color: shape.color,
        opacity: 0,
      });
      container.add(square);
    }
  });

  return container;
}

// === 产品演示场景 ===

function createProductDemo(x: number, y: number, width: number, height: number): AnimGroup {
  const container = Group();

  // 背景
  const bg = Rectangle({
    x,
    y,
    width,
    height,
    color: '#1C2128',
    cornerRadius: 16,
    opacity: 0,
  });
  container.add(bg);

  // 标题
  const title = Text({
    x: x + width / 2,
    y: y + 30,
    content: '📱 产品演示',
    fontSize: 24,
    color: colors.brand,
    opacity: 0,
  });
  container.add(title);

  // 手机框架
  const phone = Rectangle({
    x: x + width / 2 - 60,
    y: y + 70,
    width: 120,
    height: 200,
    color: '#0D1117',
    cornerRadius: 16,
    border: { color: '#30363D', width: 3 },
    opacity: 0,
  });
  container.add(phone);

  // 屏幕内容
  const screen = Rectangle({
    x: x + width / 2 - 50,
    y: y + 85,
    width: 100,
    height: 160,
    color: '#161B22',
    cornerRadius: 4,
    opacity: 0,
  });
  container.add(screen);

  // App 图标
  const appIcon = Circle({
    x: x + width / 2,
    y: y + 130,
    radius: 20,
    color: colors.brand,
    opacity: 0,
  });
  container.add(appIcon);

  // 功能指示点
  const dots = [
    { x: x + width / 2 - 20, y: y + 180 },
    { x: x + width / 2, y: y + 180 },
    { x: x + width / 2 + 20, y: y + 180 },
  ];

  dots.forEach((dot) => {
    const circle = Circle({
      x: dot.x,
      y: dot.y,
      radius: 4,
      color: colors.text.secondary,
      opacity: 0,
    });
    container.add(circle);
  });

  return container;
}

// === 创建完整场景 ===

export function createUseCasesScene(): Scene {
  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 30,
  });

  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 主标题
  const mainTitle = Text({
    x: centerX,
    y: 60,
    content: '✨ 应用场景',
    fontSize: 42,
    color: colors.brand,
    opacity: 0,
  });

  scene.timeline.add({
    target: mainTitle,
    startTime: 0,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 四个场景卡片
  const cardWidth = 420;
  const cardHeight = 280;
  const gap = 40;

  const positions = [
    { x: centerX - cardWidth - gap / 2, y: centerY - 40 }, // 左上
    { x: centerX + gap / 2, y: centerY - 40 }, // 右上
    { x: centerX - cardWidth - gap / 2, y: centerY + cardHeight / 2 + gap }, // 左下
    { x: centerX + gap / 2, y: centerY + cardHeight / 2 + gap }, // 右下
  ];

  // 创建四个场景
  const demos = [
    createEducationDemo(positions[0].x, positions[0].y, cardWidth, cardHeight),
    createDataVizDemo(positions[1].x, positions[1].y, cardWidth, cardHeight),
    createCreativeDemo(positions[2].x, positions[2].y, cardWidth, cardHeight),
    createProductDemo(positions[3].x, positions[3].y, cardWidth, cardHeight),
  ];

  const demoLabels = ['教育视频', '数据可视化', '创意动画', '产品演示'];

  // 字幕
  const subtitle = Text({
    x: centerX,
    y: centerY + 280,
    content: '只需几行代码，你也能创造精彩',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  // 动画：卡片依次出现
  demos.forEach((demo, demoIndex) => {
    // 获取容器内所有元素
    const children = demo.getChildren();

    children.forEach((child, i) => {
      scene.timeline.add({
        target: child,
        startTime: 0.5 + demoIndex * 0.8 + i * 0.05,
        duration: 0.3,
        property: 'opacity',
        from: 0,
        to: 1,
        easing: Easing.easeOut,
      });
    });

    // 高亮效果
    scene.timeline.add({
      target: children[0], // 背景
      startTime: 2 + demoIndex * 2,
      duration: 0.3,
      property: 'scale',
      from: 1,
      to: 1.02,
      easing: Easing.easeOut,
    });

    scene.timeline.add({
      target: children[0],
      startTime: 2.3 + demoIndex * 2,
      duration: 0.3,
      property: 'scale',
      from: 1.02,
      to: 1,
      easing: Easing.easeIn,
    });
  });

  // 字幕出现
  scene.timeline.add({
    target: subtitle,
    startTime: 10,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 清理动画
  scene.timeline.add({
    target: mainTitle,
    startTime: 25,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  scene.timeline.add({
    target: subtitle,
    startTime: 26,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  demos.forEach((demo) => {
    demo.getChildren().forEach((child) => {
      scene.timeline.add({
        target: child,
        startTime: 26,
        duration: 1,
        property: 'opacity',
        from: 1,
        to: 0,
        easing: Easing.easeIn,
      });
    });
  });

  // 添加元素
  scene.add(mainTitle, subtitle);
  demos.forEach((demo) => {
    demo.getChildren().forEach((child) => scene.add(child));
  });

  return scene;
}
