/**
 * 场景4: 类型安全 (3:30 - 4:30)
 *
 * - 类型推导展示 (0-20s)
 * - 编译时错误捕获 (20-40s)
 * - 类型安全矩阵 (40-60s)
 */

import { Scene, Circle, Rectangle, Text, Group, Line } from '../../src';
import type { RenderObject } from '../../src';
import { colors, videoConfig } from '../main';
import { Easing } from '../../src/easing';

// Type aliases to avoid DOM type conflicts
type AnimText = ReturnType<typeof Text>;
type AnimRectangle = ReturnType<typeof Rectangle>;

// === 类型推导展示 ===

function createTypeInferenceDemo(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 标题
  const sectionTitle = Text({
    x: centerX,
    y: 80,
    content: '🔍 类型安全',
    fontSize: 42,
    color: colors.brand,
    opacity: 0,
  });

  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 代码编辑器面板
  const codePanel = createPanel(100, 150, 700, 500, '类型推导');

  // 智能提示框
  const intellisenseBox = Rectangle({
    x: 350,
    y: 280,
    width: 400,
    height: 250,
    color: '#1C2128',
    cornerRadius: 8,
    border: { color: colors.brand, width: 2 },
    opacity: 0,
  });

  // 智能提示内容
  const suggestions = [
    { method: 'at(x: number, y: number): Circle', icon: '📍' },
    { method: 'moveTo(x: number, y: number): Circle', icon: '➡️' },
    { method: 'rotate(degrees: number): Circle', icon: '🔄' },
    { method: 'scale(factor: number): Circle', icon: '📐' },
    { method: 'fadeIn(): Circle', icon: '✨' },
    { method: 'fadeOut(): Circle', icon: '🌙' },
  ];

  const suggestionTexts: AnimText[] = [];
  suggestions.forEach((s, i) => {
    const text = Text({
      x: 370,
      y: 300 + i * 35,
      content: `${s.icon} ${s.method}`,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      color: i === 0 ? colors.brand : colors.text.secondary,
      opacity: 0,
    });
    suggestionTexts.push(text);
  });

  // 代码
  const codeLines = [
    { content: 'const circle = Circle({ radius: 50 })', y: 200 },
    { content: '', y: 230 },
    { content: 'circle.|', y: 260 }, // 光标位置
  ];

  const codeTexts: AnimText[] = [];
  codeLines.forEach((line) => {
    const text = Text({
      x: 130,
      y: line.y,
      content: line.content,
      fontSize: 16,
      fontFamily: 'JetBrains Mono, monospace',
      color: colors.code.text,
      opacity: 0,
    });
    codeTexts.push(text);
  });

  // 光标闪烁
  const cursor = Text({
    x: 220,
    y: 260,
    content: '|',
    fontSize: 16,
    fontFamily: 'JetBrains Mono, monospace',
    color: colors.brand,
    opacity: 0,
  });

  // 字幕
  const subtitle1 = Text({
    x: centerX,
    y: 700,
    content: '完整的类型推导',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  const subtitle2 = Text({
    x: centerX,
    y: 700,
    content: 'IDE 智能提示，想错都难',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  // 动画时间线
  scene.timeline.add({
    target: codePanel.background,
    startTime: startTime + 0.3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: codePanel.titleText,
    startTime: startTime + 0.5,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 代码逐行出现
  codeTexts.forEach((text, i) => {
    scene.timeline.add({
      target: text,
      startTime: startTime + 1 + i * 0.3,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 光标出现和闪烁
  scene.timeline.add({
    target: cursor,
    startTime: startTime + 2,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 光标闪烁效果
  for (let i = 0; i < 10; i++) {
    scene.timeline.add({
      target: cursor,
      startTime: startTime + 2.3 + i * 0.5,
      duration: 0.25,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.linear,
    });
    scene.timeline.add({
      target: cursor,
      startTime: startTime + 2.55 + i * 0.5,
      duration: 0.25,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.linear,
    });
  }

  // 智能提示框出现
  scene.timeline.add({
    target: intellisenseBox,
    startTime: startTime + 3,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: intellisenseBox,
    startTime: startTime + 3,
    duration: 0.4,
    property: 'y',
    from: 270,
    to: 280,
    easing: Easing.easeOut,
  });

  // 提示项出现
  suggestionTexts.forEach((text, i) => {
    scene.timeline.add({
      target: text,
      startTime: startTime + 3.2 + i * 0.1,
      duration: 0.2,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 高亮滚动效果 - 通过 opacity 变化模拟
  suggestionTexts.forEach((text, i) => {
    if (i > 0) {
      scene.timeline.add({
        target: text,
        startTime: startTime + 5 + (i - 1) * 0.5,
        duration: 0.2,
        property: 'opacity',
        from: 1,
        to: 0.5,
        easing: Easing.linear,
      });
    }
    if (i < suggestionTexts.length - 1) {
      scene.timeline.add({
        target: suggestionTexts[i + 1],
        startTime: startTime + 5 + i * 0.5,
        duration: 0.2,
        property: 'opacity',
        from: 0.5,
        to: 1,
        easing: Easing.linear,
      });
    }
  });

  // 字幕
  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 4,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 8,
    duration: 0.5,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  scene.timeline.add({
    target: subtitle2,
    startTime: startTime + 8.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 清理
  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime + 18,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });
  [
    codePanel.background,
    codePanel.titleText,
    intellisenseBox,
    ...suggestionTexts,
    ...codeTexts,
    cursor,
    subtitle1,
    subtitle2,
  ].forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 18,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  // 添加元素
  scene.add(sectionTitle);
  scene.add(codePanel.background, codePanel.titleText);
  scene.add(intellisenseBox);
  suggestionTexts.forEach((t) => scene.add(t));
  codeTexts.forEach((t) => scene.add(t));
  scene.add(cursor, subtitle1, subtitle2);
}

// === 编译时错误捕获 ===

function createErrorCatchingDemo(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 分屏显示
  // 左边：错误代码
  // 右边：修正代码

  const errorPanel = createPanel(80, 150, 850, 500, '❌ 错误示例');
  const correctPanel = createPanel(990, 150, 850, 500, '✅ 修正后');

  // 错误代码
  const errorLines = [
    { content: 'const circle = Circle({', y: 200 },
    { content: '  radius: "50",  // ❌ 类型错误', y: 230, color: colors.error },
    { content: '})', y: 260 },
    { content: '', y: 290 },
    { content: 'circle.moveto(100, 100)  // ❌ 方法名错误', y: 320, color: colors.error },
  ];

  // 修正代码
  const correctLines = [
    { content: 'const circle = Circle({', y: 200 },
    { content: '  radius: 50,  // ✅ 正确类型', y: 230, color: colors.success },
    { content: '})', y: 260 },
    { content: '', y: 290 },
    { content: 'circle.moveTo(100, 100)  // ✅ 正确方法', y: 320, color: colors.success },
  ];

  const errorTexts: AnimText[] = [];
  errorLines.forEach((line) => {
    const text = Text({
      x: 110,
      y: line.y,
      content: line.content,
      fontSize: 15,
      fontFamily: 'JetBrains Mono, monospace',
      color: line.color || colors.code.text,
      opacity: 0,
    });
    errorTexts.push(text);
  });

  const correctTexts: AnimText[] = [];
  correctLines.forEach((line) => {
    const text = Text({
      x: 1020,
      y: line.y,
      content: line.content,
      fontSize: 15,
      fontFamily: 'JetBrains Mono, monospace',
      color: line.color || colors.code.text,
      opacity: 0,
    });
    correctTexts.push(text);
  });

  // 错误提示框
  const errorTooltip = Rectangle({
    x: 200,
    y: 250,
    width: 350,
    height: 40,
    color: 'rgba(248, 81, 73, 0.1)',
    cornerRadius: 4,
    border: { color: colors.error, width: 1 },
    opacity: 0,
  });

  const errorTooltipText = Text({
    x: 210,
    y: 260,
    content: "Type 'string' is not assignable to type 'number'",
    fontSize: 12,
    color: colors.error,
    opacity: 0,
  });

  // 成功提示
  const successCheck = Text({
    x: 1350,
    y: 260,
    content: '✓',
    fontSize: 24,
    color: colors.success,
    opacity: 0,
  });

  // 字幕
  const subtitle1 = Text({
    x: centerX,
    y: 700,
    content: '写代码时就发现问题',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  const subtitle2 = Text({
    x: centerX,
    y: 700,
    content: '不用等到运行时才报错',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  // 动画
  scene.timeline.add({
    target: errorPanel.background,
    startTime: startTime,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: correctPanel.background,
    startTime: startTime + 0.3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 错误代码出现
  errorTexts.forEach((text, i) => {
    scene.timeline.add({
      target: text,
      startTime: startTime + 0.8 + i * 0.2,
      duration: 0.2,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 错误提示出现
  scene.timeline.add({
    target: errorTooltip,
    startTime: startTime + 2.5,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: errorTooltipText,
    startTime: startTime + 2.7,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 修正代码出现
  correctTexts.forEach((text, i) => {
    scene.timeline.add({
      target: text,
      startTime: startTime + 4 + i * 0.2,
      duration: 0.2,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 成功提示
  scene.timeline.add({
    target: successCheck,
    startTime: startTime + 6,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: successCheck,
    startTime: startTime + 6,
    duration: 0.4,
    property: 'scale',
    from: 0,
    to: 1,
    easing: Easing.easeOutBack,
  });

  // 字幕
  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 3,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 8,
    duration: 0.5,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  scene.timeline.add({
    target: subtitle2,
    startTime: startTime + 8.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 清理
  const allElements = [
    errorPanel.background,
    errorPanel.titleText,
    correctPanel.background,
    correctPanel.titleText,
    errorTooltip,
    errorTooltipText,
    successCheck,
    subtitle1,
    subtitle2,
    ...errorTexts,
    ...correctTexts,
  ];

  allElements.forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 18,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  // 添加元素
  scene.add(errorPanel.background, errorPanel.titleText);
  scene.add(correctPanel.background, correctPanel.titleText);
  scene.add(errorTooltip, errorTooltipText);
  scene.add(successCheck);
  scene.add(subtitle1, subtitle2);
  errorTexts.forEach((t) => scene.add(t));
  correctTexts.forEach((t) => scene.add(t));
}

// === 类型安全矩阵 ===

function createTypeSafetyMatrix(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  // 矩阵背景
  const matrixBg = Rectangle({
    x: centerX - 500,
    y: centerY - 200,
    width: 1000,
    height: 400,
    color: '#161B22',
    cornerRadius: 16,
    border: { color: '#30363D', width: 2 },
    opacity: 0,
  });

  // 四象限标题
  const quadrants = [
    {
      title: '🔍 参数校验',
      x: centerX - 250,
      y: centerY - 100,
      items: ['必填/可选', '类型匹配', '范围检查'],
    },
    {
      title: '🎯 返回值类型',
      x: centerX + 250,
      y: centerY - 100,
      items: ['自动推导', '链式调用保证', '空值安全'],
    },
    {
      title: '🏗️ 泛型约束',
      x: centerX - 250,
      y: centerY + 100,
      items: ['动画目标类型', '状态类型关联', '插值结果类型'],
    },
    {
      title: '📦 品牌类型',
      x: centerX + 250,
      y: centerY + 100,
      items: ['ObjectId', 'Time / Alpha', '编译时区分'],
    },
  ];

  const quadrantElements: any[] = [];

  quadrants.forEach((q) => {
    const title = Text({
      x: q.x,
      y: q.y - 30,
      content: q.title,
      fontSize: 20,
      color: colors.brand,
      opacity: 0,
    });
    quadrantElements.push(title);

    q.items.forEach((item, i) => {
      const itemText = Text({
        x: q.x,
        y: q.y + 10 + i * 25,
        content: `• ${item}`,
        fontSize: 14,
        color: colors.text.secondary,
        opacity: 0,
      });
      quadrantElements.push(itemText);
    });
  });

  // 分隔线
  const hLine = Line({
    x1: centerX - 480,
    y1: centerY,
    x2: centerX + 480,
    y2: centerY,
    color: '#30363D',
    width: 1,
    opacity: 0,
  });

  const vLine = Line({
    x1: centerX,
    y1: centerY - 180,
    x2: centerX,
    y2: centerY + 180,
    color: '#30363D',
    width: 1,
    opacity: 0,
  });

  // 字幕
  const subtitle = Text({
    x: centerX,
    y: 700,
    content: '四层类型防护 · 让 TypeScript 成为你的超能力',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  });

  // 动画
  scene.timeline.add({
    target: matrixBg,
    startTime: startTime,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 从中心展开效果
  scene.timeline.add({
    target: matrixBg,
    startTime: startTime,
    duration: 0.6,
    property: 'scale',
    from: 0.8,
    to: 1,
    easing: Easing.easeOut,
  });

  // 分隔线出现
  scene.timeline.add({
    target: hLine,
    startTime: startTime + 0.4,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: vLine,
    startTime: startTime + 0.4,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 象限内容出现（从左上开始顺时针）
  quadrantElements.forEach((el, i) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 0.8 + i * 0.1,
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
    target: matrixBg,
    startTime: startTime + 18,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });
  [hLine, vLine, subtitle, ...quadrantElements].forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 18,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  // 添加元素
  scene.add(matrixBg, hLine, vLine, subtitle);
  quadrantElements.forEach((el) => scene.add(el));
}

// === 辅助函数 ===

function createPanel(x: number, y: number, width: number, height: number, title: string) {
  const background = Rectangle({
    x,
    y,
    width,
    height,
    color: '#161B22',
    cornerRadius: 12,
    border: { color: '#30363D', width: 1 },
    opacity: 0,
  });

  const titleText = Text({
    x: x + 20,
    y: y + 15,
    content: title,
    fontSize: 18,
    color: colors.text.primary,
    opacity: 0,
  });

  return { background, titleText };
}

// === 创建完整场景 ===

export function createTypeSafetyScene(): Scene {
  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 60, // 1分钟
  });

  // 类型推导 (0-20s)
  createTypeInferenceDemo(scene, 0);

  // 错误捕获 (20-40s)
  createErrorCatchingDemo(scene, 20);

  // 类型矩阵 (40-60s)
  createTypeSafetyMatrix(scene, 40);

  return scene;
}
