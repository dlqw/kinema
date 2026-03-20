/**
 * 场景3: 核心演示 (1:30 - 3:30)
 *
 * 3.1 易用性展示 (1:30-2:15) - 45秒
 *   - 工厂函数魔法
 *   - 链式调用
 *
 * 3.2 功能丰富展示 (2:15-3:00) - 45秒
 *   - 动画效果博物馆
 *   - 后处理与导出
 *
 * 3.3 性能优势展示 (3:00-3:30) - 30秒
 *   - 性能可视化
 *   - 性能对比
 */

import { Scene, Circle, Rectangle, Text, Group, Line } from '../../src'
import type { RenderObject } from '../../src'
import { colors, videoConfig } from '../main'
import { Easing } from '../../src/easing'

// Type aliases to avoid DOM type conflicts
type AnimText = ReturnType<typeof Text>
type AnimRectangle = ReturnType<typeof Rectangle>

// === 工具函数 ===

function createPanel(x: number, y: number, width: number, height: number, title: string) {
  const background = Rectangle({
    x, y,
    width, height,
    color: '#161B22',
    cornerRadius: 12,
    border: { color: '#30363D', width: 1 },
    opacity: 0,
  })

  const titleText = Text({
    x: x + 20,
    y: y + 15,
    content: title,
    fontSize: 18,
    color: colors.text.primary,
    opacity: 0,
  })

  return { background, titleText }
}

function createCodeBlock(x: number, y: number, lines: { code: string; color?: string }[]) {
  const elements: any[] = []

  lines.forEach((line, index) => {
    elements.push(Text({
      x: x + 15,
      y: y + 15 + index * 24,
      content: line.code,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      color: line.color || colors.code.text,
      opacity: 0,
    }))
  })

  return elements
}

function createAnimatedShape(type: string, x: number, y: number, size: number, color: string) {
  switch (type) {
    case 'circle':
      return Circle({ x, y, radius: size, color, opacity: 0 })
    case 'square':
      return Rectangle({ x: x - size, y: y - size, width: size * 2, height: size * 2, color, opacity: 0 })
    case 'triangle':
      // 用文本近似三角形
      return Text({ x: x - size, y: y - size, content: '▲', fontSize: size * 2, color, opacity: 0 })
    default:
      return Circle({ x, y, radius: size, color, opacity: 0 })
  }
}

// === 3.1 易用性展示 ===

function createEaseOfUseSection(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2
  const centerY = videoConfig.height / 2

  // 标题
  const sectionTitle = Text({
    x: centerX,
    y: 80,
    content: '🎯 易用性',
    fontSize: 42,
    color: colors.brand,
    opacity: 0,
  })

  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 左侧：代码编辑器
  const codePanel = createPanel(80, 140, 600, 400, 'animation.ts')

  const codeLines = createCodeBlock(80, 140, [
    { code: '// 创建各种图形，一行搞定', color: colors.code.comment },
    { code: 'const circle = Circle({ radius: 50 })', color: colors.code.text },
    { code: 'const rect = Rectangle({ width: 100 })', color: colors.code.text },
    { code: 'const text = Text({ content: "Hi!" })', color: colors.code.text },
    { code: '', color: colors.code.text },
    { code: '// 组合在一起', color: colors.code.comment },
    { code: 'const group = Group([circle, rect, text])', color: colors.code.text },
    { code: '', color: colors.code.text },
    { code: '// 链式调用', color: colors.code.comment },
    { code: 'circle.at(0, 0)', color: colors.code.text },
    { code: '  .moveTo(100, 100)', color: colors.code.text },
    { code: '  .rotate(360)', color: colors.code.text },
    { code: '  .fadeIn()', color: colors.code.text },
  ])

  // 右侧：效果预览
  const previewPanel = createPanel(720, 140, 700, 400, '预览')

  // 创建演示图形
  const demoCircle = Circle({
    x: centerX + 350,
    y: centerY,
    radius: 30,
    color: '#FF6B6B',
    opacity: 0,
  })

  const demoRect = Rectangle({
    x: centerX + 250,
    y: centerY - 30,
    width: 60,
    height: 60,
    color: '#4ECDC4',
    opacity: 0,
  })

  const demoText = Text({
    x: centerX + 450,
    y: centerY,
    content: 'Hi!',
    fontSize: 28,
    color: '#FFE66D',
    opacity: 0,
  })

  // 字幕
  const subtitle1 = Text({
    x: centerX,
    y: 580,
    content: '工厂函数，一看就会',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  })

  const subtitle2 = Text({
    x: centerX,
    y: 580,
    content: '像写句子一样写动画',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  })

  // 动画时间线
  // 面板出现
  scene.timeline.add({
    target: codePanel.background,
    startTime: startTime + 0.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: codePanel.titleText,
    startTime: startTime + 0.7,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: previewPanel.background,
    startTime: startTime + 0.8,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: previewPanel.titleText,
    startTime: startTime + 1,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 代码逐行出现
  codeLines.forEach((line, i) => {
    scene.timeline.add({
      target: line,
      startTime: startTime + 1.5 + i * 0.15,
      duration: 0.2,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  // 图形同步出现
  scene.timeline.add({
    target: demoCircle,
    startTime: startTime + 2,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: demoCircle,
    startTime: startTime + 2,
    duration: 0.8,
    property: 'scale',
    from: 0,
    to: 1,
    easing: Easing.easeOutBack,
  })

  scene.timeline.add({
    target: demoRect,
    startTime: startTime + 2.5,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: demoText,
    startTime: startTime + 3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 字幕
  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 4,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: subtitle1,
    startTime: startTime + 8,
    duration: 0.5,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  scene.timeline.add({
    target: subtitle2,
    startTime: startTime + 8.5,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 动画演示
  scene.timeline.add({
    target: demoCircle,
    startTime: startTime + 10,
    duration: 3,
    property: 'x',
    from: centerX + 350,
    to: centerX + 250,
    easing: Easing.easeInOut,
  })

  scene.timeline.add({
    target: demoCircle,
    startTime: startTime + 10,
    duration: 3,
    property: 'rotation',
    from: 0,
    to: 360,
    easing: Easing.easeInOut,
  })

  scene.timeline.add({
    target: demoCircle,
    startTime: startTime + 10,
    duration: 1.5,
    property: 'opacity',
    from: 0.5,
    to: 1,
    easing: Easing.easeOut,
  })

  // 清理
  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime + 20,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  ;[codePanel.background, codePanel.titleText, previewPanel.background, previewPanel.titleText,
    ...codeLines, demoCircle, demoRect, demoText, subtitle1, subtitle2].forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 20,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    })
  })

  // 添加元素
  scene.add(sectionTitle)
  scene.add(codePanel.background, codePanel.titleText)
  scene.add(previewPanel.background, previewPanel.titleText)
  codeLines.forEach((line) => scene.add(line))
  scene.add(demoCircle, demoRect, demoText)
  scene.add(subtitle1, subtitle2)
}

// === 3.2 功能丰富展示 ===

function createFeaturesSection(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2
  const centerY = videoConfig.height / 2

  // 标题
  const sectionTitle = Text({
    x: centerX,
    y: 80,
    content: '🎨 功能丰富',
    fontSize: 42,
    color: colors.brand,
    opacity: 0,
  })

  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 动画效果网格 (3x3)
  const effectNames = [
    ['移动', '旋转', '缩放'],
    ['路径', '变形', '弹跳'],
    ['粒子', '波浪', '爆炸'],
  ]

  const gridSize = 160
  const startX = centerX - gridSize * 1.5
  const startY = centerY - gridSize * 1

  const gridCells: any[] = []
  const gridLabels: any[] = []
  const gridDemos: any[] = []

  effectNames.forEach((row, rowIndex) => {
    row.forEach((name, colIndex) => {
      const x = startX + colIndex * gridSize + gridSize / 2
      const y = startY + rowIndex * gridSize + gridSize / 2

      // 单元格背景
      const cell = Rectangle({
        x: startX + colIndex * gridSize + 5,
        y: startY + rowIndex * gridSize + 5,
        width: gridSize - 10,
        height: gridSize - 10,
        color: '#1C2128',
        cornerRadius: 12,
        border: { color: '#30363D', width: 1 },
        opacity: 0,
      })
      gridCells.push(cell)

      // 标签
      const label = Text({
        x: x,
        y: y + 50,
        content: name,
        fontSize: 16,
        color: colors.text.secondary,
        opacity: 0,
      })
      gridLabels.push(label)

      // 演示图形
      const demo = createAnimatedShape(
        rowIndex === 0 && colIndex === 0 ? 'circle' : 'circle',
        x,
        y - 10,
        20,
        colors.brand
      )
      gridDemos.push(demo)
    })
  })

  // 网格出现动画
  gridCells.forEach((cell, i) => {
    scene.timeline.add({
      target: cell,
      startTime: startTime + 0.5 + i * 0.05,
      duration: 0.4,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  gridLabels.forEach((label, i) => {
    scene.timeline.add({
      target: label,
      startTime: startTime + 0.8 + i * 0.05,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  gridDemos.forEach((demo, i) => {
    scene.timeline.add({
      target: demo,
      startTime: startTime + 1 + i * 0.05,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  // 高亮效果：依次突出每个格子
  gridCells.forEach((cell, i) => {
    // 边框发光
    scene.timeline.add({
      target: cell,
      startTime: startTime + 3 + i * 0.8,
      duration: 0.3,
      property: 'scale',
      from: 1,
      to: 1.1,
      easing: Easing.easeOut,
    })
    scene.timeline.add({
      target: cell,
      startTime: startTime + 3.3 + i * 0.8,
      duration: 0.3,
      property: 'scale',
      from: 1.1,
      to: 1,
      easing: Easing.easeIn,
    })

    // 对应演示动画
    const demo = gridDemos[i]
    const row = Math.floor(i / 3)
    const col = i % 3

    // 根据位置执行不同动画
    if (row === 0 && col === 0) {
      // 移动
      scene.timeline.add({
        target: demo,
        startTime: startTime + 3 + i * 0.8,
        duration: 0.6,
        property: 'x',
        from: demo.x,
        to: demo.x + 30,
        easing: Easing.easeInOut,
      })
    } else if (row === 0 && col === 1) {
      // 旋转
      scene.timeline.add({
        target: demo,
        startTime: startTime + 3 + i * 0.8,
        duration: 0.6,
        property: 'rotation',
        from: 0,
        to: 360,
        easing: Easing.easeInOut,
      })
    } else if (row === 0 && col === 2) {
      // 缩放
      scene.timeline.add({
        target: demo,
        startTime: startTime + 3 + i * 0.8,
        duration: 0.3,
        property: 'scale',
        from: 1,
        to: 1.5,
        easing: Easing.easeOut,
      })
      scene.timeline.add({
        target: demo,
        startTime: startTime + 3.3 + i * 0.8,
        duration: 0.3,
        property: 'scale',
        from: 1.5,
        to: 1,
        easing: Easing.easeIn,
      })
    }
  })

  // 字幕
  const subtitle = Text({
    x: centerX,
    y: 580,
    content: '丰富的后处理效果 · 支持 10+ 导出格式',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  })

  scene.timeline.add({
    target: subtitle,
    startTime: startTime + 8,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 清理
  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime + 22,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  ;[...gridCells, ...gridLabels, ...gridDemos, subtitle].forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 22,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    })
  })

  // 添加元素
  scene.add(sectionTitle)
  gridCells.forEach((cell) => scene.add(cell))
  gridLabels.forEach((label) => scene.add(label))
  gridDemos.forEach((demo) => scene.add(demo))
  scene.add(subtitle)
}

// === 3.3 性能展示 ===

function createPerformanceSection(scene: Scene, startTime: number) {
  const centerX = videoConfig.width / 2
  const centerY = videoConfig.height / 2

  // 标题
  const sectionTitle = Text({
    x: centerX,
    y: 80,
    content: '⚡ 性能优势',
    fontSize: 42,
    color: colors.brand,
    opacity: 0,
  })

  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 性能监控面板
  const monitorPanel = createPanel(100, 150, 800, 450, '性能监控')

  // GPU 使用率
  const gpuLabel = Text({
    x: 140,
    y: 220,
    content: '🎮 GPU: WebGPU',
    fontSize: 20,
    color: colors.text.primary,
    opacity: 0,
  })

  const gpuBar = Rectangle({
    x: 140,
    y: 250,
    width: 0,
    height: 24,
    color: colors.success,
    cornerRadius: 4,
    opacity: 0,
  })

  const gpuBarBg = Rectangle({
    x: 140,
    y: 250,
    width: 500,
    height: 24,
    color: '#21262D',
    cornerRadius: 4,
    opacity: 0,
  })

  const gpuValue = Text({
    x: 650,
    y: 252,
    content: '98%',
    fontSize: 16,
    color: colors.success,
    opacity: 0,
  })

  // FPS
  const fpsLabel = Text({
    x: 140,
    y: 310,
    content: '📊 FPS: 稳定 60',
    fontSize: 20,
    color: colors.text.primary,
    opacity: 0,
  })

  // FPS 波形图 (简化)
  const fpsBars: AnimRectangle[] = []
  for (let i = 0; i < 20; i++) {
    const bar = Rectangle({
      x: 140 + i * 25,
      y: 380 - Math.sin(i * 0.5) * 20,
      width: 20,
      height: 40 + Math.sin(i * 0.5) * 20,
      color: colors.brand,
      cornerRadius: 2,
      opacity: 0,
    })
    fpsBars.push(bar)
  }

  // 内存
  const memLabel = Text({
    x: 140,
    y: 420,
    content: '💾 内存: 45MB',
    fontSize: 20,
    color: colors.text.primary,
    opacity: 0,
  })

  const memBar = Rectangle({
    x: 140,
    y: 450,
    width: 0,
    height: 24,
    color: colors.brand,
    cornerRadius: 4,
    opacity: 0,
  })

  const memBarBg = Rectangle({
    x: 140,
    y: 450,
    width: 500,
    height: 24,
    color: '#21262D',
    cornerRadius: 4,
    opacity: 0,
  })

  const memValue = Text({
    x: 650,
    y: 452,
    content: '稳定',
    fontSize: 16,
    color: colors.brand,
    opacity: 0,
  })

  // 性能对比面板
  const comparePanel = createPanel(950, 150, 800, 450, '性能对比')

  // 对比数据
  const frameworks = ['AniMaker', 'Canvas', 'SVG', 'DOM']
  const scores = [98, 72, 55, 35]
  const barColors = [colors.success, colors.warning, '#8B949E', colors.error]

  const compareBars: AnimRectangle[] = []
  const compareLabels: AnimText[] = []
  const compareScores: AnimText[] = []

  frameworks.forEach((name, i) => {
    const label = Text({
      x: 1000,
      y: 220 + i * 80,
      content: name,
      fontSize: 18,
      color: colors.text.primary,
      opacity: 0,
    })
    compareLabels.push(label)

    const bar = Rectangle({
      x: 1150,
      y: 218 + i * 80,
      width: 0,
      height: 28,
      color: barColors[i],
      cornerRadius: 4,
      opacity: 0,
    })
    compareBars.push(bar)

    const score = Text({
      x: 1160,
      y: 220 + i * 80,
      content: `${scores[i]}%`,
      fontSize: 16,
      color: barColors[i],
      opacity: 0,
    })
    compareScores.push(score)
  })

  // 动画时间线

  // 面板出现
  scene.timeline.add({
    target: monitorPanel.background,
    startTime: startTime + 0.3,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: monitorPanel.titleText,
    startTime: startTime + 0.5,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: comparePanel.background,
    startTime: startTime + 0.5,
    duration: 0.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: comparePanel.titleText,
    startTime: startTime + 0.7,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // GPU 指标
  scene.timeline.add({
    target: gpuLabel,
    startTime: startTime + 1,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: gpuBarBg,
    startTime: startTime + 1.2,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: gpuBar,
    startTime: startTime + 1.5,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: gpuBar,
    startTime: startTime + 1.5,
    duration: 1.5,
    property: 'width',
    from: 0,
    to: 490,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: gpuValue,
    startTime: startTime + 2,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // FPS 指标
  scene.timeline.add({
    target: fpsLabel,
    startTime: startTime + 2.5,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  fpsBars.forEach((bar, i) => {
    scene.timeline.add({
      target: bar,
      startTime: startTime + 2.8 + i * 0.05,
      duration: 0.2,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
    // 波动动画
    scene.timeline.add({
      target: bar,
      startTime: startTime + 3,
      duration: 2,
      property: 'height',
      from: 40,
      to: 60,
      easing: Easing.easeInOut,
      repeat: -1,
      yoyo: true,
    })
  })

  // 内存指标
  scene.timeline.add({
    target: memLabel,
    startTime: startTime + 3.5,
    duration: 0.4,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: memBarBg,
    startTime: startTime + 3.7,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: memBar,
    startTime: startTime + 4,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: memBar,
    startTime: startTime + 4,
    duration: 1,
    property: 'width',
    from: 0,
    to: 200,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: memValue,
    startTime: startTime + 4.5,
    duration: 0.3,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 对比数据
  compareLabels.forEach((label, i) => {
    scene.timeline.add({
      target: label,
      startTime: startTime + 1.5 + i * 0.2,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  compareBars.forEach((bar, i) => {
    scene.timeline.add({
      target: bar,
      startTime: startTime + 2 + i * 0.3,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
    scene.timeline.add({
      target: bar,
      startTime: startTime + 2 + i * 0.3,
      duration: 1.5,
      property: 'width',
      from: 0,
      to: scores[i] * 5,
      easing: Easing.easeOut,
    })
  })

  compareScores.forEach((score, i) => {
    scene.timeline.add({
      target: score,
      startTime: startTime + 3.5 + i * 0.3,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
    // 分数跟随条形图移动
    scene.timeline.add({
      target: score,
      startTime: startTime + 2 + i * 0.3,
      duration: 1.5,
      property: 'x',
      from: 1160,
      to: 1160 + scores[i] * 5 + 10,
      easing: Easing.easeOut,
    })
  })

  // 字幕
  const subtitle = Text({
    x: centerX,
    y: 650,
    content: 'WebGPU 加速 · 性能领先 3-5 倍',
    fontSize: 28,
    color: colors.text.accent,
    opacity: 0,
  })

  scene.timeline.add({
    target: subtitle,
    startTime: startTime + 6,
    duration: 0.6,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 清理
  scene.timeline.add({
    target: sectionTitle,
    startTime: startTime + 23,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  const allElements = [
    monitorPanel.background, monitorPanel.titleText,
    comparePanel.background, comparePanel.titleText,
    gpuLabel, gpuBar, gpuBarBg, gpuValue,
    fpsLabel, memLabel, memBar, memBarBg, memValue,
    ...fpsBars, ...compareLabels, ...compareBars, ...compareScores,
    subtitle,
  ]

  allElements.forEach((el) => {
    scene.timeline.add({
      target: el,
      startTime: startTime + 23,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    })
  })

  // 添加元素
  scene.add(sectionTitle)
  scene.add(monitorPanel.background, monitorPanel.titleText)
  scene.add(comparePanel.background, comparePanel.titleText)
  scene.add(gpuLabel, gpuBar, gpuBarBg, gpuValue)
  scene.add(fpsLabel)
  fpsBars.forEach((bar) => scene.add(bar))
  scene.add(memLabel, memBar, memBarBg, memValue)
  compareLabels.forEach((label) => scene.add(label))
  compareBars.forEach((bar) => scene.add(bar))
  compareScores.forEach((score) => scene.add(score))
  scene.add(subtitle)
}

// === 创建完整场景 ===

export function createCoreDemoScene(): Scene {
  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 120, // 2分钟
  })

  // 3.1 易用性 (0-25秒)
  createEaseOfUseSection(scene, 0)

  // 3.2 功能丰富 (25-50秒)
  createFeaturesSection(scene, 25)

  // 3.3 性能 (50-80秒)
  createPerformanceSection(scene, 50)

  return scene
}
