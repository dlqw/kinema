/**
 * 场景6: 对比收尾 (5:00 - 5:30)
 *
 * - Kinema vs Manim 对比 (0-15s)
 * - 核心优势总结 (15-25s)
 * - 行动号召 (25-30s)
 */

import { Scene, Circle, Rectangle, Text, Group, Line } from '../../src';
import type { RenderObject } from '../../src';
import { colors, videoConfig } from '../main';
import { Easing } from '../../src/easing';

// Type aliases to avoid DOM type conflicts
type AnimText = ReturnType<typeof Text>;
type AnimCircle = ReturnType<typeof Circle>;

// === 对比表格 ===

function createComparisonTable(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 标题
  const title = Text({
    x: centerX,
    y: 100,
    content: 'Kinema vs Manim',
    fontSize: 42,
    color: colors.text.primary,
    opacity: 0,
  });

  scene.timeline.add({
    target: title,
    startTime: startTime,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 对比项目
  const comparisons = [
    { feature: '类型系统', manim: '动态类型', kinema: '静态类型 ✅' },
    { feature: '错误检测', manim: '运行时', kinema: '编译时 ✅' },
    { feature: '导出格式', manim: '视频', kinema: '10+ 格式 ✅' },
    { feature: '渲染方式', manim: 'CPU', kinema: 'GPU 加速 ✅' },
    { feature: '学习曲线', manim: '陡峭', kinema: '平缓 ✅' },
  ];

  const tableY = 180;
  const rowHeight = 60;
  const colWidth = 400;

  // 表头
  const headerBg = Rectangle({
    x: centerX - 600,
    y: tableY,
    width: 1200,
    height: 50,
    color: '#21262D',
    opacity: 0,
  });

  const headers = [
    { text: '特性', x: centerX - 450 },
    { text: '🐍 Manim', x: centerX - 150 },
    { text: '📦 Kinema', x: centerX + 250 },
  ];

  const headerTexts: AnimText[] = [];
  headers.forEach((h) => {
    const text = Text({
      x: h.x,
      y: tableY + 15,
      content: h.text,
      fontSize: 20,
      color: colors.text.primary,
      opacity: 0,
    });
    headerTexts.push(text);
  });

  // 数据行
  const rowElements: any[] = [];

  comparisons.forEach((row, i) => {
    const y = tableY + 60 + i * rowHeight;

    // 行背景（交替颜色）
    const rowBg = Rectangle({
      x: centerX - 600,
      y: y,
      width: 1200,
      height: rowHeight - 2,
      color: i % 2 === 0 ? '#161B22' : '#0D1117',
      opacity: 0,
    });
    rowElements.push(rowBg);

    // 特性名称
    const featureText = Text({
      x: centerX - 450,
      y: y + 18,
      content: row.feature,
      fontSize: 18,
      color: colors.text.primary,
      opacity: 0,
    });
    rowElements.push(featureText);

    // Manim 值
    const manimText = Text({
      x: centerX - 150,
      y: y + 18,
      content: row.manim,
      fontSize: 18,
      color: colors.text.secondary,
      opacity: 0,
    });
    rowElements.push(manimText);

    // Kinema 值
    const kinemaText = Text({
      x: centerX + 250,
      y: y + 18,
      content: row.kinema,
      fontSize: 18,
      color: colors.success,
      opacity: 0,
    });
    rowElements.push(kinemaText);

    // 分隔线
    const separator = Line({
      x1: centerX - 600,
      y1: y + rowHeight - 2,
      x2: centerX + 600,
      y2: y + rowHeight - 2,
      color: '#30363D',
      width: 1,
      opacity: 0,
    });
    rowElements.push(separator);
  });

  // 字幕
  const subtitle = Text({
    x: centerX,
    y: centerY + 230,
    content: '同样的强大 · 更安全，更快速，更简单',
    fontSize: 24,
    color: colors.text.accent,
    opacity: 0,
  });

  // 动画：表格出现
  scene.timeline.add({
    target: headerBg,
    startTime: startTime + 0.3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  headerTexts.forEach((text, i) => {
    scene.timeline.add({
      target: text,
      startTime: startTime + 0.5 + i * 0.1,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 行数据出现
  rowElements.forEach((el, i) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 1 + i * 0.05,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 字幕
  scene.timeline.add({
    target: subtitle,
    startTime: startTime + 5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 清理
  scene.timeline.add({
    target: title,
    startTime: startTime + 13,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });
  [headerBg, ...headerTexts, subtitle, ...rowElements].forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 13,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  // 添加元素
  scene.add(title, headerBg, ...headerTexts, subtitle, ...rowElements);
}

// === 核心优势总结 ===

function createAdvantagesSummary(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  const advantages = [
    { icon: '🎯', title: '类型安全', desc: '编译时保护' },
    { icon: '⚡', title: '高性能', desc: 'WebGPU 加速' },
    { icon: '🎨', title: '易用性', desc: '简洁 API' },
  ];

  const advantageElements: any[] = [];

  // 容器背景
  const containerBg = Rectangle({
    x: centerX - 400,
    y: centerY - 150,
    width: 800,
    height: 300,
    color: '#161B22',
    cornerRadius: 20,
    border: { color: colors.brand, width: 2 },
    opacity: 0,
  });

  // 三个优势
  advantages.forEach((adv, i) => {
    const x = centerX - 250 + i * 250;
    const y = centerY;

    // 图标
    const icon = Text({
      x: x,
      y: y - 60,
      content: adv.icon,
      fontSize: 48,
      opacity: 0,
    });
    advantageElements.push(icon);

    // 标题
    const title = Text({
      x: x,
      y: y + 10,
      content: adv.title,
      fontSize: 28,
      color: colors.brand,
      opacity: 0,
    });
    advantageElements.push(title);

    // 描述
    const desc = Text({
      x: x,
      y: y + 50,
      content: adv.desc,
      fontSize: 18,
      color: colors.text.secondary,
      opacity: 0,
    });
    advantageElements.push(desc);
  });

  // 动画
  scene.timeline.add({
    target: containerBg,
    startTime: startTime,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 从中心扩展
  scene.timeline.add({
    target: containerBg,
    startTime: startTime,
    duration: 0.6,
    property: 'scale',
    from: 0.8,
    to: 1,
    easing: Easing.easeOut,
  });

  // 优势依次出现（从下往上）
  advantageElements.forEach((el, i) => {
    const delay = Math.floor(i / 3) * 0.3; // 同一行同时出现
    const rowOffset = (i % 3) * 0.1; // 同一列错开

    scene.timeline.add({
      target: el,
      startTime: startTime + 0.5 + delay + rowOffset,
      duration: 0.4,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });

    // 轻微上浮效果
    scene.timeline.add({
      target: el,
      startTime: startTime + 0.5 + delay + rowOffset,
      duration: 0.4,
      property: 'y',
      from: (el as any).y + 20,
      to: (el as any).y,
      easing: Easing.easeOut,
    });
  });

  // 清理
  scene.timeline.add({
    target: containerBg,
    startTime: startTime + 8,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  advantageElements.forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 8,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  // 添加元素
  scene.add(containerBg, ...advantageElements);
}

// === 行动号召 ===

function createCallToAction(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 粒子背景效果（简化为小圆点）
  const particles: AnimCircle[] = [];
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const radius = 300 + Math.random() * 100;
    const particle = Circle({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: 2 + Math.random() * 3,
      color: colors.brand,
      opacity: 0,
    });
    particles.push(particle);
  }

  // Logo
  const logoOuter = Circle({
    x: centerX,
    y: centerY - 30,
    radius: 80,
    color: 'transparent',
    strokeColor: colors.brand,
    strokeWidth: 4,
    opacity: 0,
  });

  const logoInner = Circle({
    x: centerX,
    y: centerY - 30,
    radius: 50,
    color: colors.brand,
    opacity: 0,
  });

  const logoPlay = Text({
    x: centerX - 15,
    y: centerY - 50,
    content: '▶',
    fontSize: 36,
    color: colors.background,
    opacity: 0,
  });

  const logoText = Text({
    x: centerX,
    y: centerY + 70,
    content: 'Kinema',
    fontSize: 36,
    fontFamily: 'Inter, sans-serif',
    color: colors.text.primary,
    opacity: 0,
  });

  // 号召文字
  const ctaText = Text({
    x: centerX,
    y: centerY + 130,
    content: '✨ 开始创作你的动画 ✨',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  // 链接
  const githubLink = Text({
    x: centerX,
    y: centerY + 180,
    content: '🔗 github.com/kinema/kinema',
    fontSize: 20,
    color: colors.brand,
    opacity: 0,
  });

  const docsLink = Text({
    x: centerX,
    y: centerY + 215,
    content: '📚 docs.kinema.dev',
    fontSize: 20,
    color: colors.brand,
    opacity: 0,
  });

  // 底部信息
  const footerText = Text({
    x: centerX,
    y: centerY + 280,
    content: 'Made with ❤️ + TypeScript',
    fontSize: 16,
    color: colors.text.secondary,
    opacity: 0,
  });

  // 动画
  // 粒子出现并旋转
  particles.forEach((particle, i) => {
    scene.timeline.add({
      target: particle,
      startTime: startTime + i * 0.02,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 0.6,
      easing: Easing.easeOut,
    });

    // 轨道旋转
    scene.timeline.add({
      target: particle,
      startTime: startTime + 0.5,
      duration: 10,
      property: 'rotation',
      from: 0,
      to: 360,
      easing: Easing.linear,
      repeat: -1,
    });
  });

  // Logo 聚合出现
  scene.timeline.add({
    target: logoOuter,
    startTime: startTime + 0.5,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: logoOuter,
    startTime: startTime + 0.5,
    duration: 1,
    property: 'scale',
    from: 0,
    to: 1,
    easing: Easing.easeOutBack,
  });

  scene.timeline.add({
    target: logoInner,
    startTime: startTime + 1,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: logoPlay,
    startTime: startTime + 1.3,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: logoText,
    startTime: startTime + 1.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 文字出现
  scene.timeline.add({
    target: ctaText,
    startTime: startTime + 2.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: githubLink,
    startTime: startTime + 3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: docsLink,
    startTime: startTime + 3.3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: footerText,
    startTime: startTime + 3.8,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // Logo 脉动效果
  scene.timeline.add({
    target: logoInner,
    startTime: startTime + 2.5,
    duration: 0.5,
    property: 'scale',
    from: 1,
    to: 1.1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: logoInner,
    startTime: startTime + 3,
    duration: 0.5,
    property: 'scale',
    from: 1.1,
    to: 1,
    easing: Easing.easeIn,
  });

  // 添加元素
  particles.forEach((p) => scene.add(p));
  scene.add(logoOuter, logoInner, logoPlay, logoText);
  scene.add(ctaText, githubLink, docsLink, footerText);
}

// === 创建完整场景 ===

export function createComparisonScene(): Scene {
  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 30,
  });

  // 对比表格 (0-15s)
  createComparisonTable(scene, 0);

  // 核心优势 (15-25s)
  createAdvantagesSummary(scene, 15);

  // 行动号召 (25-30s)
  createCallToAction(scene, 25);

  return scene;
}
