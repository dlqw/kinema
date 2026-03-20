/**
 * 场景1: 开场 (0:00 - 0:30)
 *
 * 镜头1: 问题引入 (0-10s) - 灯泡亮起，"我想做一个动画"
 * 镜头2: 遭遇困难 (10-25s) - 痛点闪现，混乱效果
 * 镜头3: 转折 (25-30s) - AniMaker Logo 出现
 */

import { Scene, Circle, Text, Group, Line } from '../../src'
import type { RenderObject } from '../../src'
import { colors, videoConfig } from '../main'
import { Easing } from '../../src/easing'

// Type aliases to avoid DOM type conflicts
type AnimText = ReturnType<typeof Text>
type AnimLine = ReturnType<typeof Line>

// 创建灯泡图标
function createLightbulb(x: number, y: number, size: number) {
  const bulb = Circle({
    x, y,
    radius: size * 0.4,
    color: colors.warning,
    opacity: 0,
  })

  const glow = Circle({
    x, y,
    radius: size * 0.6,
    color: '#FFD700',
    opacity: 0,
  })

  return { bulb, glow }
}

// 创建混乱线条
function createChaosLines(centerX: number, centerY: number) {
  const lines: AnimLine[] = []
  const questionMarks: AnimText[] = []

  // 创建多条混乱的线条
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const length = 100 + Math.random() * 100
    const endX = centerX + Math.cos(angle) * length
    const endY = centerY + Math.sin(angle) * length

    lines.push(Line({
      x1: centerX, y1: centerY,
      x2: endX, y2: endY,
      color: colors.error,
      width: 2,
      opacity: 0,
    }))
  }

  // 创建问号
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const distance = 150
    questionMarks.push(Text({
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      content: '?',
      fontSize: 40,
      color: colors.warning,
      opacity: 0,
    }))
  }

  return { lines, questionMarks }
}

// 创建痛点文字
function createPainPoints(centerX: number, centerY: number) {
  const points = [
    { text: '代码太复杂', color: colors.error },
    { text: '性能太差', color: colors.warning },
    { text: '类型不安全', color: '#FFD700' },
    { text: '文档看不懂', color: colors.text.secondary },
  ]

  return points.map((point, i) => Text({
    x: centerX + (i - 1.5) * 300,
    y: centerY + 150,
    content: point.text,
    fontSize: 36,
    color: point.color,
    opacity: 0,
  }))
}

// 创建 AniMaker Logo
function createLogo(centerX: number, centerY: number) {
  // Logo 由多个元素组成
  const container = Group()

  // 外圈
  const outerRing = Circle({
    x: centerX, y: centerY,
    radius: 80,
    color: 'transparent',
    strokeColor: colors.brand,
    strokeWidth: 4,
    opacity: 0,
  })

  // 内圈
  const innerCircle = Circle({
    x: centerX, y: centerY,
    radius: 50,
    color: colors.brand,
    opacity: 0,
  })

  // 播放按钮三角形
  const playButton = Text({
    x: centerX - 15, y: centerY - 20,
    content: '▶',
    fontSize: 40,
    color: colors.background,
    opacity: 0,
  })

  // Logo 文字
  const logoText = Text({
    x: centerX, y: centerY + 130,
    content: 'AniMaker',
    fontSize: 48,
    fontFamily: 'Inter, sans-serif',
    color: colors.text.primary,
    opacity: 0,
  })

  return { outerRing, innerCircle, playButton, logoText }
}

// 创建完整场景
export function createIntroScene(): Scene {
  const centerX = videoConfig.width / 2
  const centerY = videoConfig.height / 2

  const scene = new Scene({
    width: videoConfig.width,
    height: videoConfig.height,
    backgroundColor: videoConfig.backgroundColor,
    fps: videoConfig.fps,
    duration: 30, // 30秒
  })

  // 创建所有元素
  const { bulb, glow } = createLightbulb(centerX, centerY, 100)
  const { lines, questionMarks } = createChaosLines(centerX, centerY)
  const painPoints = createPainPoints(centerX, centerY)
  const logo = createLogo(centerX, centerY)

  // 添加初始文字
  const introText = Text({
    x: centerX,
    y: centerY + 200,
    content: '我想做一个动画...',
    fontSize: 42,
    color: colors.text.primary,
    opacity: 0,
  })

  const butText = Text({
    x: centerX,
    y: centerY + 200,
    content: '但是...',
    fontSize: 48,
    color: colors.warning,
    opacity: 0,
  })

  const untilText = Text({
    x: centerX,
    y: centerY + 200,
    content: '直到... AniMaker',
    fontSize: 48,
    color: colors.brand,
    opacity: 0,
  })

  // === 动画时间线 ===

  // 0-3s: 灯泡渐亮
  scene.timeline.add({
    target: glow,
    startTime: 0,
    duration: 3,
    property: 'opacity',
    from: 0,
    to: 0.3,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: bulb,
    startTime: 0.5,
    duration: 2.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 3-6s: 灯泡脉动 + 文字出现
  scene.timeline.add({
    target: introText,
    startTime: 3,
    duration: 2,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 灯泡呼吸效果
  for (let i = 0; i < 3; i++) {
    scene.timeline.add({
      target: glow,
      startTime: 5 + i * 1.5,
      duration: 0.75,
      property: 'scale',
      from: 1,
      to: 1.2,
      easing: Easing.easeInOut,
    })
    scene.timeline.add({
      target: glow,
      startTime: 5.75 + i * 1.5,
      duration: 0.75,
      property: 'scale',
      from: 1.2,
      to: 1,
      easing: Easing.easeInOut,
    })
  }

  // 8-10s: 混乱开始
  scene.timeline.add({
    target: introText,
    startTime: 8,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  scene.timeline.add({
    target: butText,
    startTime: 8.5,
    duration: 1.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // 10-18s: 混乱线条和问号出现
  lines.forEach((line, i) => {
    scene.timeline.add({
      target: line,
      startTime: 10 + i * 0.2,
      duration: 1,
      property: 'opacity',
      from: 0,
      to: 0.8,
      easing: Easing.easeOut,
    })
    // 线条抖动
    scene.timeline.add({
      target: line,
      startTime: 12,
      duration: 6,
      property: 'rotation',
      from: 0,
      to: Math.random() * 0.5 - 0.25,
      easing: Easing.linear,
      repeat: -1,
      yoyo: true,
    })
  })

  questionMarks.forEach((mark, i) => {
    scene.timeline.add({
      target: mark,
      startTime: 12 + i * 0.3,
      duration: 0.5,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
    // 问号旋转
    scene.timeline.add({
      target: mark,
      startTime: 12 + i * 0.3,
      duration: 4,
      property: 'rotation',
      from: -10,
      to: 10,
      easing: Easing.easeInOut,
      repeat: -1,
      yoyo: true,
    })
  })

  // 14-18s: 痛点文字闪现 (故障风格)
  painPoints.forEach((point, i) => {
    const baseTime = 14 + i * 1

    // 故障效果：多次快速闪现
    for (let j = 0; j < 3; j++) {
      scene.timeline.add({
        target: point,
        startTime: baseTime + j * 0.1,
        duration: 0.05,
        property: 'opacity',
        from: 0,
        to: 1,
        easing: Easing.linear,
      })
      scene.timeline.add({
        target: point,
        startTime: baseTime + j * 0.1 + 0.05,
        duration: 0.05,
        property: 'opacity',
        from: 1,
        to: 0,
        easing: Easing.linear,
      })
    }
    // 最终显示
    scene.timeline.add({
      target: point,
      startTime: baseTime + 0.35,
      duration: 0.3,
      property: 'opacity',
      from: 0,
      to: 1,
      easing: Easing.easeOut,
    })
  })

  // 18-22s: 混乱达到顶峰
  scene.timeline.add({
    target: glow,
    startTime: 18,
    duration: 4,
    property: 'opacity',
    from: 0.3,
    to: 0,
    easing: Easing.easeIn,
  })

  scene.timeline.add({
    target: bulb,
    startTime: 18,
    duration: 4,
    property: 'opacity',
    from: 1,
    to: 0.3,
    easing: Easing.easeIn,
  })

  // 22-25s: 光束穿透，混乱消散
  scene.timeline.add({
    target: butText,
    startTime: 22,
    duration: 1,
    property: 'opacity',
    from: 1,
    to: 0,
    easing: Easing.easeIn,
  })

  // 所有混乱元素消散
  ;[...lines, ...questionMarks, ...painPoints].forEach((element, i) => {
    scene.timeline.add({
      target: element,
      startTime: 22 + i * 0.05,
      duration: 1,
      property: 'opacity',
      from: 1,
      to: 0,
      easing: Easing.easeIn,
    })
  })

  // 25-30s: Logo 出现
  scene.timeline.add({
    target: logo.outerRing,
    startTime: 25,
    duration: 1.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: logo.outerRing,
    startTime: 25,
    duration: 1.5,
    property: 'scale',
    from: 0.5,
    to: 1,
    easing: Easing.easeOutBack,
  })

  scene.timeline.add({
    target: logo.innerCircle,
    startTime: 26,
    duration: 1,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: logo.playButton,
    startTime: 26.5,
    duration: 0.8,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  scene.timeline.add({
    target: logo.logoText,
    startTime: 27,
    duration: 1.5,
    property: 'opacity',
    from: 0,
    to: 1,
    easing: Easing.easeOut,
  })

  // Logo 脉动效果
  scene.timeline.add({
    target: logo.innerCircle,
    startTime: 28,
    duration: 0.5,
    property: 'scale',
    from: 1,
    to: 1.1,
    easing: Easing.easeOut,
  })
  scene.timeline.add({
    target: logo.innerCircle,
    startTime: 28.5,
    duration: 0.5,
    property: 'scale',
    from: 1.1,
    to: 1,
    easing: Easing.easeIn,
  })

  // 添加所有元素到场景
  scene.add(glow as RenderObject, bulb as RenderObject)
  scene.add(...lines as RenderObject[], ...questionMarks as RenderObject[], ...painPoints as RenderObject[])
  scene.add(introText as RenderObject, butText as RenderObject, untilText as RenderObject)
  scene.add(logo.outerRing as RenderObject, logo.innerCircle as RenderObject, logo.playButton as RenderObject, logo.logoText as RenderObject)

  return scene
}
