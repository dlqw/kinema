/**
 * 场景2: 引入 Kinema (0:30 - 1:30)
 *
 * 镜头4: 第一印象 (30-45s) - Logo 分解重组，展示模块化
 * 镜头5: "哇"时刻 (45-55s) - 4行代码创建动画
 * 镜头6: 效果升级 (55s-1:30) - 代码不变，效果升级
 */

import { Scene, Circle, Rectangle, Text, Group, Line } from '../../src';
import type { RenderObject } from '../../src';
import { colors, videoConfig } from '../main';
import { Easing } from '../../src/easing';

// Type aliases to avoid DOM type conflicts
type AnimText = ReturnType<typeof Text>;
type AnimRectangle = ReturnType<typeof Rectangle>;

// 代码编辑器组件
function createCodeEditor(x: number, y: number, width: number, height: number) {
  const editor = Group();

  // 编辑器背景
  const background = Rectangle({
    x,
    y,
    width,
    height,
    color: colors.code.background,
    cornerRadius: 8,
    opacity: 0,
  });

  // 标题栏
  const titleBar = Rectangle({
    x,
    y: y - 40,
    width,
    height: 40,
    color: '#21262D',
    cornerRadius: [8, 8, 0, 0],
    opacity: 0,
  });

  // 窗口按钮
  const redDot = Circle({ x: x + 20, y: y - 20, radius: 6, color: '#FF5F56', opacity: 0 });
  const yellowDot = Circle({ x: x + 40, y: y - 20, radius: 6, color: '#FFBD2E', opacity: 0 });
  const greenDot = Circle({ x: x + 60, y: y - 20, radius: 6, color: '#27C93F', opacity: 0 });

  // 文件名标签
  const fileName = Text({
    x: x + width / 2,
    y: y - 28,
    content: 'animation.ts',
    fontSize: 14,
    color: colors.text.secondary,
    opacity: 0,
  });

  return {
    background,
    titleBar,
    redDot,
    yellowDot,
    greenDot,
    fileName,
  };
}

// 代码行组件
function createCodeLine(
  x: number,
  y: number,
  code: string,
  highlights: { start: number; end: number; color: string }[],
) {
  const elements: (AnimText | AnimRectangle)[] = [];
  let currentX = x;

  // 行号
  elements.push(
    Text({
      x: currentX,
      y,
      content: '  1  ',
      fontSize: 16,
      fontFamily: 'JetBrains Mono, monospace',
      color: colors.code.comment,
      opacity: 0,
    }),
  );
  currentX += 40;

  // 解析代码并应用高亮
  let lastEnd = 0;
  highlights.sort((a, b) => a.start - b.start);

  highlights.forEach(({ start, end, color }) => {
    if (start > lastEnd) {
      elements.push(
        Text({
          x: currentX,
          y,
          content: code.slice(lastEnd, start),
          fontSize: 16,
          fontFamily: 'JetBrains Mono, monospace',
          color: colors.code.text,
          opacity: 0,
        }),
      );
      currentX += code.slice(lastEnd, start).length * 10;
    }
    elements.push(
      Text({
        x: currentX,
        y,
        content: code.slice(start, end),
        fontSize: 16,
        fontFamily: 'JetBrains Mono, monospace',
        color,
        opacity: 0,
      }),
    );
    currentX += code.slice(start, end).length * 10;
    lastEnd = end;
  });

  if (lastEnd < code.length) {
    elements.push(
      Text({
        x: currentX,
        y,
        content: code.slice(lastEnd),
        fontSize: 16,
        fontFamily: 'JetBrains Mono, monospace',
        color: colors.code.text,
        opacity: 0,
      }),
    );
  }

  return elements;
}

// 创建渲染画布
function createRenderCanvas(x: number, y: number, width: number, height: number) {
  const background = Rectangle({
    x,
    y,
    width,
    height,
    color: '#0D1117',
    cornerRadius: 8,
    border: { color: colors.brand, width: 2 },
    opacity: 0,
  });

  const label = Text({
    x: x + width / 2,
    y: y - 25,
    content: '输出',
    fontSize: 14,
    color: colors.text.secondary,
    opacity: 0,
  });

  return { background, label };
}

// 创建演示用的动画圆形
function createDemoCircle(x: number, y: number) {
  return Circle({
    x,
    y,
    radius: 0,
    color: '#FF6B6B',
    opacity: 0,
  });
}

// 创建模块标签
function createModuleLabels(centerX: number, centerY: number) {
  const modules = [
    { name: '渲染引擎', angle: -90 },
    { name: '动画系统', angle: -30 },
    { name: '时间轴', angle: 30 },
    { name: '事件系统', angle: 90 },
    { name: '导出模块', angle: 150 },
    { name: '类型定义', angle: 210 },
  ];

  const radius = 200;

  return modules.map(({ name, angle }) => {
    const rad = (angle * Math.PI) / 180;
    return {
      label: Text({
        x: centerX + Math.cos(rad) * radius,
        y: centerY + Math.sin(rad) * radius,
        content: name,
        fontSize: 20,
        color: colors.brand,
        opacity: 0,
      }),
      angle,
    };
  });
}

// 创建完整场景
export function createIntroductionScene(): Scene {
  const centerX = videoConfig.width / 2;
  const centerY = videoConfig.height / 2;

  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 60, // 60秒
  });

  // === 镜头4: 模块化展示 (0-15s) ===

  // Logo 中心
  const logoCircle = Circle({
    x: centerX,
    y: centerY,
    radius: 60,
    color: colors.brand,
    opacity: 0,
  });

  const logoText = Text({
    x: centerX,
    y: centerY - 15,
    content: 'Kinema',
    fontSize: 24,
    color: colors.background,
    opacity: 0,
  });

  // 模块标签
  const moduleLabels = createModuleLabels(centerX, centerY);

  // 连接线
  const connectionLines = moduleLabels.map(({ label, angle }) => {
    const rad = (angle * Math.PI) / 180;
    const innerRadius = 80;
    const outerRadius = 170;
    return Line({
      x1: centerX + Math.cos(rad) * innerRadius,
      y1: centerY + Math.sin(rad) * innerRadius,
      x2: centerX + Math.cos(rad) * outerRadius,
      y2: centerY + Math.sin(rad) * outerRadius,
      color: colors.brand,
      width: 2,
      opacity: 0,
    });
  });

  // 主标题
  const mainTitle = Text({
    x: centerX,
    y: centerY + 300,
    content: '一个完整的动画创作框架',
    fontSize: 36,
    color: colors.text.primary,
    opacity: 0,
  });

  // === 镜头5: 代码演示 (15-25s) ===

  const editorX = 100;
  const editorY = 200;
  const editorWidth = 700;
  const editorHeight = 600;

  const codeEditor = createCodeEditor(editorX, editorY, editorWidth, editorHeight);

  // 代码内容
  const codeLines = [
    {
      code: "import { Circle, rotate, renderToCanvas } from 'kinema'",
      highlights: [
        { start: 0, end: 6, color: colors.code.keyword },
        { start: 8, end: 9, color: colors.code.type },
        { start: 11, end: 16, color: colors.code.function },
        { start: 18, end: 24, color: colors.code.function },
        { start: 26, end: 40, color: colors.code.function },
        { start: 47, end: 57, color: colors.code.string },
      ],
    },
    { code: '', highlights: [] },
    {
      code: "const circle = Circle({ radius: 50, color: '#FF6B6B' })",
      highlights: [
        { start: 0, end: 5, color: colors.code.keyword },
        { start: 6, end: 12, color: colors.code.variable },
        { start: 15, end: 21, color: colors.code.function },
        { start: 31, end: 33, color: colors.code.variable },
        { start: 41, end: 51, color: colors.code.string },
      ],
    },
    {
      code: 'const animation = rotate(circle, { degrees: 360 })',
      highlights: [
        { start: 0, end: 5, color: colors.code.keyword },
        { start: 6, end: 15, color: colors.code.variable },
        { start: 18, end: 24, color: colors.code.function },
        { start: 39, end: 46, color: colors.code.variable },
      ],
    },
    { code: '', highlights: [] },
    {
      code: "renderToCanvas(animation, '#canvas')",
      highlights: [
        { start: 0, end: 14, color: colors.code.function },
        { start: 26, end: 35, color: colors.code.string },
      ],
    },
  ];

  const codeElements: any[] = [];
  codeLines.forEach((line, index) => {
    if (line.code) {
      const elements = createCodeLine(
        editorX + 20,
        editorY + 50 + index * 30,
        line.code,
        line.highlights,
      );
      codeElements.push(...elements);
    }
  });

  // 渲染画布
  const canvasX = 900;
  const canvasY = 200;
  const canvasWidth = 800;
  const canvasHeight = 600;

  const renderCanvas = createRenderCanvas(canvasX, canvasY, canvasWidth, canvasHeight);

  // 演示圆形
  const demoCircle = createDemoCircle(canvasX + canvasWidth / 2, canvasY + canvasHeight / 2);

  // 字幕
  const subtitle1 = Text({
    x: centerX,
    y: centerY + 450,
    content: '只需 4 行代码',
    fontSize: 32,
    color: colors.text.accent,
    opacity: 0,
  });

  const subtitle2 = Text({
    x: centerX,
    y: centerY + 450,
    content: '就能创建一个动画',
    fontSize: 32,
    color: colors.text.accent,
    opacity: 0,
  });

  // === 动画时间线 ===

  // 镜头4: 模块展示 (0-15s)
  scene.timeline.add({
    target: logoCircle,
    startTime: 0,
    duration: 1,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: logoText,
    startTime: 0.5,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // Logo 分解动画
  scene.timeline.add({
    target: logoCircle,
    startTime: 2,
    duration: 2,
    property: 'scale',
    from: 1,
    to: 0.8,
    easing: Easing.easeOut,
  });

  // 模块标签和连接线出现
  connectionLines.forEach((line, i) => {
    scene.timeline.add({
      target: line,
      startTime: 3 + i * 0.15,
      duration: 0.5,
      property: 'opacity',
      from: 0,
      to: 0.6,
      easing: Easing.easeOut,
    });
  });

  moduleLabels.forEach(({ label }, i) => {
    scene.timeline.add({
      target: label,
      startTime: 3.5 + i * 0.2,
      duration: 0.6,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 主标题
  scene.timeline.add({
    target: mainTitle,
    startTime: 6,
    duration: 1.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 模块重新组合
  scene.timeline.add({
    target: logoCircle,
    startTime: 10,
    duration: 2,
    property: 'scale',
    from: 0.8,
    to: 1,
    easing: Easing.easeOutBack,
  });

  connectionLines.forEach((line) => {
    scene.timeline.add({
      target: line,
      startTime: 10,
      duration: 2,
      property: 'opacity',
      from: 0.6,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  moduleLabels.forEach(({ label }) => {
    scene.timeline.add({
      target: label,
      startTime: 10,
      duration: 2,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    });
  });

  scene.timeline.add({
    target: mainTitle,
    startTime: 12,
    duration: 2,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  // 镜头5: 代码演示 (15-25s)
  // 过渡到代码编辑器
  scene.timeline.add({
    target: logoCircle,
    startTime: 15,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  scene.timeline.add({
    target: logoText,
    startTime: 15,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  // 编辑器出现
  scene.timeline.add({
    target: codeEditor.background,
    startTime: 16,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: codeEditor.titleBar,
    startTime: 16,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });
  [codeEditor.redDot, codeEditor.yellowDot, codeEditor.greenDot].forEach((dot) => {
    scene.timeline.add({
      target: dot,
      startTime: 16.2,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  scene.timeline.add({
    target: codeEditor.fileName,
    startTime: 16.5,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 渲染画布出现
  scene.timeline.add({
    target: renderCanvas.background,
    startTime: 17,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: renderCanvas.label,
    startTime: 17.2,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 代码逐行出现
  codeElements.forEach((element, i) => {
    scene.timeline.add({
      target: element,
      startTime: 18 + i * 0.1,
      duration: 0.15,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    });
  });

  // 字幕出现
  scene.timeline.add({
    target: subtitle1,
    startTime: 20,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: subtitle1,
    startTime: 22,
    duration: 0.5,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  });

  scene.timeline.add({
    target: subtitle2,
    startTime: 22.5,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  // 圆形出现在画布中
  scene.timeline.add({
    target: demoCircle,
    startTime: 19.5,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  });

  scene.timeline.add({
    target: demoCircle,
    startTime: 19.5,
    duration: 1,
    property: 'radius',
    from: 0,
    to: 50,
    easing: Easing.easeOutBack,
  });

  // 圆形开始旋转
  scene.timeline.add({
    target: demoCircle,
    startTime: 21,
    duration: 3,
    property: 'rotation',
    from: 0,
    to: 360,
    easing: Easing.easeInOut,
  });

  // 镜头6: 效果升级 (25-60s)
  // ... 更多动画效果

  // 添加所有元素
  scene.add(logoCircle, logoText, mainTitle);
  connectionLines.forEach((line) => scene.add(line));
  moduleLabels.forEach(({ label }) => scene.add(label));

  scene.add(
    codeEditor.background,
    codeEditor.titleBar,
    codeEditor.redDot,
    codeEditor.yellowDot,
    codeEditor.greenDot,
    codeEditor.fileName,
  );
  codeElements.forEach((element) => scene.add(element));

  scene.add(renderCanvas.background, renderCanvas.label);
  scene.add(demoCircle);
  scene.add(subtitle1, subtitle2);

  return scene;
}
