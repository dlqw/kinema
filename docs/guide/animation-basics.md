# 动画创建入门教程

欢迎来到 AniMaker 动画创建入门教程！本教程将带你从零开始学习如何使用 AniMaker 创建精美的动画。

## 目录

1. [基础概念介绍](#第一章基础概念介绍)
2. [创建第一个动画](#第二章创建第一个动画)
3. [动画组合](#第三章动画组合)
4. [缓动函数](#第四章缓动函数)

---

## 第一章：基础概念介绍

在开始创建动画之前，我们需要理解 AniMaker 的三个核心概念：**Scene（场景）**、**RenderObject（渲染对象）** 和 **Animation（动画）**。

### 1.1 Scene（场景）

Scene 是动画的容器，类似于电影中的一个场景。它管理着所有可渲染的对象，控制动画的播放时间线。

```typescript
import { createScene } from '@animaker/core';

// 创建一个默认场景（1920x1080，黑色背景，60fps）
const scene = createScene();

// 或者自定义场景配置
const customScene = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  fps: 30
});
```

**Scene 的核心特性：**
- **不可变性**：所有操作都返回新的 Scene 实例
- **时间管理**：跟踪当前时间，管理动画播放
- **对象管理**：添加、移除、查找渲染对象
- **动画调度**：安排动画的播放时间和顺序

### 1.2 RenderObject（渲染对象）

RenderObject 是场景中任何可见元素的基础。它可以是简单的几何形状（圆形、矩形）、文本、图像，或复杂的组合对象。

```typescript
import { Circle } from '@animaker/core';

// 创建一个圆形
const circle = new Circle({
  radius: 1,
  fillColor: '#3498db',
  strokeColor: '#2980b9',
  strokeWidth: 0.05
});
```

**RenderObject 的核心属性：**
- **Transform（变换）**：位置、旋转、缩放、透明度
- **Style（样式）**：填充颜色、描边颜色、线宽等
- **Z-Index**：渲染顺序（值越大越靠前）

### 1.3 Animation（动画）

Animation 描述了 RenderObject 的属性如何随时间变化。每个动画都有一个目标对象和持续时间。

```typescript
import { FadeIn, MoveAnimation } from '@animaker/core';

// 淡入动画
const fadeIn = new FadeIn(circle, {
  duration: 1,
  easing: smooth
});

// 移动动画
const moveRight = new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, {
  duration: 2,
  easing: easeInOut
});
```

**Animation 的核心特性：**
- **目标对象**：要动画化的 RenderObject
- **持续时间**：动画时长（秒）
- **缓动函数**：控制动画的速度曲线
- **延迟**：动画开始前的等待时间

### 1.4 与 Manim 的对比

如果你熟悉 Manim（Python 数学动画引擎），你会发现 AniMaker 有相似的设计理念：

| 概念 | Manim | AniMaker | 说明 |
|------|-------|----------|------|
| 场景 | `Scene` | `Scene` | 动画容器 |
| 对象 | `Mobject` | `RenderObject` | 可渲染元素 |
| 动画 | `Animation` | `Animation` | 属性变化描述 |
| 播放 | `play()` | `schedule()` | 添加到时间线 |
| 变换 | `animate()` | `withTransform()` | 不可变更新 |

**主要区别：**

1. **类型安全**：AniMaker 使用 TypeScript，提供完整的类型检查
2. **不可变性**：所有对象操作返回新实例，避免副作用
3. **Web 原生**：直接在浏览器中渲染，无需视频导出
4. **实时预览**：动画可以实时播放和交互

```typescript
// Manim 风格（Python）
class MyScene(Scene):
    def construct(self):
        circle = Circle()
        self.play(Create(circle))
        self.play(circle.animate.shift(RIGHT()))

// AniMaker 风格（TypeScript）
const scene = createScene();
const circle = new Circle({ radius: 1 });
let currentScene = scene.addObject(circle);
currentScene = currentScene.schedule(new FadeIn(circle, { duration: 1 }));
currentScene = currentScene.schedule(
  new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, { duration: 1 })
);
```

---

## 第二章：创建第一个动画

现在让我们创建一个完整的动画！我们将从环境配置开始，逐步构建一个包含移动、旋转和淡入淡出效果的动画。

### 2.1 环境配置

**前置条件：**
- Node.js 18+
- npm 或 pnpm

**安装 AniMaker：**

```bash
# 使用 npm
npm install @animaker/core

# 使用 pnpm
pnpm add @animaker/core
```

**创建项目结构：**

```bash
my-animation/
├── index.html          # HTML 文件
├── src/
│   └── main.ts         # TypeScript 入口
├── package.json
└── tsconfig.json
```

**HTML 模板（index.html）：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的第一个 AniMaker 动画</title>
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #0f0f1e;
        }
        canvas {
            box-shadow: 0 0 50px rgba(52, 152, 219, 0.3);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <canvas id="animaker"></canvas>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 2.2 创建简单图形

让我们创建一些基本的几何形状：

```typescript
// src/main.ts
import { createScene, Circle, Rectangle, Square } from '@animaker/core';
import { smooth, easeInOut } from '@animaker/core/easing';

// 创建场景
const scene = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#0f0f1e',
  fps: 60
});

// 创建一个圆形
const circle = new Circle({
  radius: 0.5,
  fillColor: '#e74c3c',
  strokeColor: '#c0392b',
  strokeWidth: 0.05
}).withPosition(-3, 1, 0); // 初始位置在左侧

// 创建一个矩形
const rectangle = new Rectangle({
  width: 1.5,
  height: 1,
  fillColor: '#3498db',
  cornerRadius: 0.1
}).withPosition(-3, -1, 0);

// 创建一个正方形
const square = new Square({
  sideLength: 1,
  fillColor: '#2ecc71',
  strokeColor: '#27ae60',
  strokeWidth: 0.05
}).withPosition(3, 0, 0); // 初始位置在右侧

// 将对象添加到场景
let currentScene = scene.addObjects(circle, rectangle, square);
```

### 2.3 添加基础动画

现在让我们为这些形状添加动画效果：

#### 移动动画（MoveAnimation）

```typescript
import { MoveAnimation } from '@animaker/core';

// 圆形从左向右移动
const moveCircle = new MoveAnimation(
  circle,
  { x: 3, y: 1, z: 0 },  // 目标位置
  {
    duration: 2,
    easing: smooth,
    name: 'move-circle'
  }
);

// 矩形对角线移动
const moveRectangle = new MoveAnimation(
  rectangle,
  { x: 2, y: 2, z: 0 },
  { duration: 1.5, easing: easeInOut }
);

// 正方形从右向左移动
const moveSquare = new MoveAnimation(
  square,
  { x: -3, y: 0, z: 0 },
  { duration: 2.5, easing: smooth }
);

// 调度动画（串行执行）
currentScene = currentScene.schedule(moveCircle);
currentScene = currentScene.schedule(moveRectangle, 0.5); // 延迟 0.5 秒
currentScene = currentScene.schedule(moveSquare, 1); // 延迟 1 秒
```

#### 旋转动画（RotateAnimation）

```typescript
import { RotateAnimation } from '@animaker/core';

// 圆形旋转 360 度
const rotateCircle = new RotateAnimation(
  circle,
  'z',              // 旋转轴
  360,              // 旋转度数
  { duration: 2, easing: smooth }
);

// 矩形绕 X 轴旋转（3D 效果）
const rotateRectangle = new RotateAnimation(
  rectangle,
  'x',
  180,
  { duration: 1.5, easing: easeInOut }
);

currentScene = currentScene.schedule(rotateCircle, 2);
currentScene = currentScene.schedule(rotateRectangle, 2.5);
```

#### 淡入淡出动画（FadeIn/FadeOut）

```typescript
import { FadeInAnimation, FadeOutAnimation } from '@animaker/core';

// 圆形淡入
const fadeInCircle = new FadeInAnimation(circle, {
  duration: 1,
  easing: smooth
});

// 正方形淡出
const fadeOutSquare = new FadeOutAnimation(square, {
  duration: 1,
  easing: smooth
});

// 先淡入，再淡出
currentScene = currentScene.schedule(fadeInCircle);
currentScene = currentScene.schedule(fadeOutSquare, 4);
```

### 2.4 完整示例代码

将以上代码组合起来，我们得到第一个完整动画：

```typescript
// src/main.ts
import {
  createScene,
  Circle,
  Rectangle,
  Square
} from '@animaker/core';
import {
  MoveAnimation,
  RotateAnimation,
  FadeInAnimation,
  FadeOutAnimation
} from '@animaker/core/animation';
import { smooth, easeInOut } from '@animaker/core/easing';
import { renderToCanvas } from '@animaker/renderer';

// 创建场景
const scene = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#0f0f1e',
  fps: 60
});

// 创建图形对象
const circle = new Circle({
  radius: 0.5,
  fillColor: '#e74c3c',
  strokeColor: '#c0392b',
  strokeWidth: 0.05
}).withPosition(-3, 1, 0);

const rectangle = new Rectangle({
  width: 1.5,
  height: 1,
  fillColor: '#3498db',
  cornerRadius: 0.1
}).withPosition(-3, -1, 0);

const square = new Square({
  sideLength: 1,
  fillColor: '#2ecc71',
  strokeColor: '#27ae60',
  strokeWidth: 0.05
}).withPosition(3, 0, 0);

// 添加对象到场景
let currentScene = scene.addObjects(circle, rectangle, square);

// 创建动画
const fadeInCircle = new FadeInAnimation(circle, { duration: 1, easing: smooth });
const moveCircle = new MoveAnimation(circle, { x: 3, y: 1, z: 0 }, {
  duration: 2,
  easing: smooth
});
const rotateCircle = new RotateAnimation(circle, 'z', 360, {
  duration: 2,
  easing: smooth
});

const moveRectangle = new MoveAnimation(rectangle, { x: 2, y: 2, z: 0 }, {
  duration: 1.5,
  easing: easeInOut
});
const rotateRectangle = new RotateAnimation(rectangle, 'x', 180, {
  duration: 1.5,
  easing: easeInOut
});

const moveSquare = new MoveAnimation(square, { x: -3, y: 0, z: 0 }, {
  duration: 2.5,
  easing: smooth
});
const fadeOutSquare = new FadeOutAnimation(square, { duration: 1, easing: smooth });

// 调度动画
currentScene = currentScene.schedule(fadeInCircle);
currentScene = currentScene.schedule(moveCircle, 1);
currentScene = currentScene.schedule(rotateCircle, 1);
currentScene = currentScene.schedule(moveRectangle, 0.5);
currentScene = currentScene.schedule(rotateRectangle, 0.5);
currentScene = currentScene.schedule(moveSquare, 1);
currentScene = currentScene.schedule(fadeOutSquare, 4);

// 渲染到 Canvas
const canvas = document.getElementById('animaker') as HTMLCanvasElement;
renderToCanvas(canvas, currentScene, {
  autoplay: true,
  loop: false
});
```

---

## 第三章：动画组合

在实际应用中，我们经常需要组合多个动画来创建复杂的效果。AniMaker 提供了三种主要的组合方式：**并行**、**顺序** 和 **延迟**。

### 3.1 并行动画

并行动画是指多个动画同时执行。例如，一个对象同时移动和旋转。

```typescript
import { AnimationGroup, CompositionType } from '@animaker/core';

// 创建一个圆形
const wheel = new Circle({
  radius: 0.5,
  fillColor: '#f39c12',
  strokeColor: '#e67e22',
  strokeWidth: 0.1
}).withPosition(-4, 0, 0);

// 创建并行动画组
const parallelGroup = new AnimationGroup(
  wheel,
  [
    // 向右移动
    new MoveAnimation(wheel, { x: 4, y: 0, z: 0 }, { duration: 3, easing: smooth }),
    // 同时旋转（像车轮滚动）
    new RotateAnimation(wheel, 'z', 720, { duration: 3, easing: smooth })
  ],
  CompositionType.Parallel, // 并行执行
  { duration: 3, easing: smooth }
);

// 调度并行动画
let scene = createScene().addObject(wheel);
scene = scene.schedule(parallelGroup);
```

**并行组合的特点：**
- 所有动画同时开始
- 总持续时间等于最长的动画
- 适用于需要同时变化多个属性的场景

### 3.2 顺序动画

顺序动画是指动画按顺序一个接一个执行。

```typescript
// 创建顺序动画组
const sequenceGroup = new AnimationGroup(
  box,
  [
    // 第一步：淡入
    new FadeInAnimation(box, { duration: 0.5, easing: smooth }),
    // 第二步：向右移动
    new MoveAnimation(box, { x: 2, y: 0, z: 0 }, { duration: 1, easing: easeInOut }),
    // 第三步：旋转 90 度
    new RotateAnimation(box, 'z', 90, { duration: 0.5, easing: smooth }),
    // 第四步：放大
    new ScaleAnimation(box, { x: 1.5, y: 1.5, z: 1 }, { duration: 0.5, easing: smooth }),
    // 第五步：淡出
    new FadeOutAnimation(box, { duration: 0.5, easing: smooth })
  ],
  CompositionType.Sequence // 顺序执行
);

// 调度顺序动画
let scene = createScene().addObject(box);
scene = scene.schedule(sequenceGroup);
```

**顺序组合的特点：**
- 动画按顺序执行
- 总持续时间等于所有动画之和
- 适用于有明确步骤的复杂动画

### 3.3 延迟动画

延迟动画是指动画之间有固定的间隔时间，类似于波浪效果。

```typescript
// 创建多个圆形
const circles = Array.from({ length: 5 }, (_, i) =>
  new Circle({
    radius: 0.3,
    fillColor: `hsl(${200 + i * 30}, 70%, 60%)`
  }).withPosition(-4 + i * 2, 2, 0)
);

// 为每个圆形创建相同的动画
const animations = circles.map(circle =>
  new MoveAnimation(circle, { x: 0, y: -3, z: 0 }, {
    duration: 2,
    easing: smooth
  })
);

// 创建延迟动画组（每个动画延迟 0.2 秒开始）
const laggedGroup = new AnimationGroup(
  circles[0], // 目标对象（这里不会被实际使用）
  animations,
  CompositionType.Lagged, // 延迟执行
  { duration: 2 + 0.2 * (animations.length - 1), easing: smooth }
);

// 添加所有圆形并调度动画
let scene = createScene();
scene = scene.addObjects(...circles);
scene = scene.schedule(laggedGroup);
```

**延迟组合的特点：**
- 动画依次开始，但可能重叠
- 可以创建波浪、级联效果
- 总持续时间 = 最长动画 + 延迟时间

### 3.4 嵌套组合

你可以嵌套组合来创建更复杂的动画序列：

```typescript
// 创建一个复杂的嵌套动画
const complexAnimation = new AnimationGroup(
  hero,
  [
    // 第一阶段：入场（并行：淡入 + 放大）
    new AnimationGroup(
      hero,
      [
        new FadeInAnimation(hero, { duration: 0.5, easing: smooth }),
        new ScaleAnimation(hero, { x: 1.2, y: 1.2, z: 1 }, {
          duration: 0.5,
          easing: smooth
        })
      ],
      CompositionType.Parallel
    ),

    // 第二阶段：移动到中心
    new MoveAnimation(hero, { x: 0, y: 0, z: 0 }, {
      duration: 1,
      easing: easeInOut
    }),

    // 第三阶段：旋转效果（并行：旋转 + 弹跳缩放）
    new AnimationGroup(
      hero,
      [
        new RotateAnimation(hero, 'z', 360, { duration: 1, easing: smooth }),
        new AnimationGroup(
          hero,
          [
            new ScaleAnimation(hero, { x: 1.1, y: 1.1, z: 1 }, { duration: 0.3 }),
            new ScaleAnimation(hero, { x: 1, y: 1, z: 1 }, { duration: 0.3 })
          ],
          CompositionType.Sequence
        )
      ],
      CompositionType.Parallel
    )
  ],
  CompositionType.Sequence
);
```

### 3.5 实战示例：弹跳球动画

让我们用一个弹跳球的例子来综合运用动画组合：

```typescript
import {
  createScene,
  Circle
} from '@animaker/core';
import {
  MoveAnimation,
  ScaleAnimation,
  FadeInAnimation
} from '@animaker/core/animation';
import { AnimationGroup, CompositionType } from '@animaker/core/animation';
import { smooth, easeOut, bounce } from '@animaker/core/easing';

// 创建场景
const scene = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  fps: 60
});

// 创建球
const ball = new Circle({
  radius: 0.4,
  fillColor: '#e74c3c',
  strokeColor: '#c0392b',
  strokeWidth: 0.05
}).withPosition(0, 3, 0);

// 创建地面
const ground = new Rectangle({
  width: 10,
  height: 0.2,
  fillColor: '#34495e'
}).withPosition(0, -3, 0);

let currentScene = scene.addObjects(ball, ground);

// 弹跳动画序列
const bounceSequence = [
  // 第一次下落
  new MoveAnimation(ball, { x: 0, y: -2.6, z: 0 }, {
    duration: 0.5,
    easing: easeOut
  }),
  // 第一次弹起（高度降低）
  new MoveAnimation(ball, { x: 0, y: 0, z: 0 }, {
    duration: 0.4,
    easing: easeOut
  }),
  // 第二次下落
  new MoveAnimation(ball, { x: 0, y: -2.6, z: 0 }, {
    duration: 0.4,
    easing: easeOut
  }),
  // 第二次弹起（更低）
  new MoveAnimation(ball, { x: 0, y: -1, z: 0 }, {
    duration: 0.3,
    easing: easeOut
  }),
  // 第三次下落
  new MoveAnimation(ball, { x: 0, y: -2.6, z: 0 }, {
    duration: 0.3,
    easing: easeOut
  }),
  // 停止
  new MoveAnimation(ball, { x: 0, y: -2.6, z: 0 }, {
    duration: 0.1,
    easing: smooth
  })
];

// 添加挤压效果（落地时变扁）
const squashEffect = new AnimationGroup(
  ball,
  [
    // 下落时拉长
    new ScaleAnimation(ball, { x: 0.9, y: 1.1, z: 1 }, { duration: 0.5 }),
    // 落地时压扁
    new ScaleAnimation(ball, { x: 1.2, y: 0.8, z: 1 }, { duration: 0.1 }),
    // 恢复
    new ScaleAnimation(ball, { x: 1, y: 1, z: 1 }, { duration: 0.2 })
  ],
  CompositionType.Sequence
);

// 组合弹跳和挤压效果
const fullBounceAnimation = new AnimationGroup(
  ball,
  [
    // 淡入
    new FadeInAnimation(ball, { duration: 0.3, easing: smooth }),
    // 弹跳序列
    ...bounceSequence,
    // 挤压效果
    squashEffect
  ],
  CompositionType.Sequence
);

currentScene = currentScene.schedule(fullBounceAnimation);
```

---

## 第四章：缓动函数

缓动函数（Easing Function）决定了动画随时间的速度变化，是创建自然、流畅动画的关键。

### 4.1 什么是缓动函数？

缓动函数接收一个线性进度值（0 到 1），返回一个"缓动后"的进度值。

```typescript
// 线性缓动（无效果）
const linear: EasingFunction = (alpha) => alpha;

// 平滑缓动（S 曲线）
const smooth: EasingFunction = (alpha) => alpha * alpha * (3 - 2 * alpha);
```

**可视化对比：**
- `linear`: 等速运动，看起来机械
- `smooth`: 平滑加速和减速，看起来自然
- `easeIn`: 开始慢，越来越快
- `easeOut`: 开始快，越来越慢
- `easeInOut`: 两端慢，中间快

### 4.2 内置缓动函数

AniMaker 提供了丰富的内置缓动函数：

#### 基础缓动

```typescript
import {
  linear,
  smooth,
  smoother
} from '@animaker/core/easing';

// linear - 等速
const anim1 = new MoveAnimation(obj, target, {
  duration: 2,
  easing: linear
});

// smooth - S 曲线（推荐默认值）
const anim2 = new MoveAnimation(obj, target, {
  duration: 2,
  easing: smooth
});

// smoother - 更平滑的 S 曲线
const anim3 = new MoveAnimation(obj, target, {
  duration: 2,
  easing: smoother
});
```

#### 加速缓动（Ease In）

```typescript
import {
  easeIn,
  easeInCubic,
  easeInQuart,
  easeInQuint,
  easeInSine,
  easeInExpo,
  easeInCirc
} from '@animaker/core/easing';

// easeIn - 二次加速
const carStart = new MoveAnimation(car, target, {
  duration: 2,
  easing: easeIn // 像汽车起步
});

// easeInExpo - 指数加速（很慢开始，很快结束）
const rocket = new MoveAnimation(rocketObj, target, {
  duration: 2,
  easing: easeInExpo // 像火箭发射
});
```

#### 减速缓动（Ease Out）

```typescript
import {
  easeOut,
  easeOutCubic,
  easeOutQuart,
  easeOutQuint,
  easeOutSine,
  easeOutExpo,
  easeOutCirc
} from '@animaker/core/easing';

// easeOut - 二次减速
const carStop = new MoveAnimation(car, target, {
  duration: 2,
  easing: easeOut // 像汽车刹车
});

// easeOutExpo - 指数减速（很快开始，很慢结束）
const ballRoll = new MoveAnimation(ball, target, {
  duration: 2,
  easing: easeOutExpo // 像球滚动停止
});
```

#### 加速减速缓动（Ease In Out）

```typescript
import {
  easeInOut,
  easeInOutCubic,
  easeInOutQuart,
  easeInOutQuint,
  easeInOutSine,
  easeInOutExpo,
  easeInOutCirc
} from '@animaker/core/easing';

// easeInOut - 先加速后减速
const doorOpen = new RotateAnimation(door, 'y', 90, {
  duration: 1.5,
  easing: easeInOut // 像门打开
});
```

#### 特殊效果缓动

```typescript
import {
  elastic,
  back,
  bounce,
  thereAndBack,
  thereAndBackWithPause
} from '@animaker/core/easing';

// elastic - 弹簧效果
const spring = new MoveAnimation(obj, target, {
  duration: 2,
  easing: elastic // 像弹簧一样振荡
});

// back - 回拉效果
const pullBack = new MoveAnimation(obj, target, {
  duration: 1,
  easing: back // 先往后拉，再向前冲
});

// bounce - 弹跳效果
const bouncingBall = new MoveAnimation(ball, target, {
  duration: 2,
  easing: bounce // 像球落地弹跳
});
```

### 4.3 缓动函数选择指南

| 场景 | 推荐缓动 | 说明 |
|------|----------|------|
| 通用动画 | `smooth` | 最自然的选择 |
| 淡入 | `easeOutSine` | 柔和出现 |
| 淡出 | `easeInSine` | 柔和消失 |
| 移入屏幕 | `easeOutQuart` | 快速进入，平滑停止 |
| 移出屏幕 | `easeInQuart` | 快速离开 |
| UI 元素出现 | `easeOutBack` | 略微过冲后回到位置 |
| 强调效果 | `elastic` | 弹簧般吸引注意 |
| 加载动画 | `linear` | 匀速旋转 |
| 物理模拟 | `bounce` | 弹跳效果 |

### 4.4 自定义缓动函数

当内置缓动函数不能满足需求时，你可以创建自定义缓动函数。

```typescript
import { custom } from '@animaker/core/easing';

// 创建一个"急停"缓动
const sharpStop = custom((alpha) => {
  // 前 80% 快速，后 20% 缓慢停止
  if (alpha < 0.8) {
    return alpha * 1.25; // 加速
  }
  return 1 + (alpha - 1) * 0.25; // 减速
});

// 使用自定义缓动
const sharpMove = new MoveAnimation(obj, target, {
  duration: 2,
  easing: sharpStop
});
```

**高级示例：贝塞尔曲线缓动**

```typescript
// 创建三次贝塞尔曲线缓动
function cubicBezierEasing(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): EasingFunction {
  return custom((t) => {
    // 简化的贝塞尔计算
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    function sampleCurveX(t: number): number {
      return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t: number): number {
      return ((ay * t + by) * t + cy) * t;
    }

    // 使用牛顿法求解 t
    let t2 = t;
    for (let i = 0; i < 5; i++) {
      const x2 = sampleCurveX(t2) - t;
      if (Math.abs(x2) < 0.001) break;
      const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
      t2 -= x2 / d2;
    }

    return sampleCurveY(t2);
  });
}

// CSS ease-in-out 等效缓动
const cssEaseInOut = cubicBezierEasing(0.42, 0, 0.58, 1);
```

### 4.5 缓动函数组合技巧

#### 技巧 1：不对称缓动

```typescript
// 对不同属性使用不同缓动
const asymmetricMove = new AnimationGroup(
  hero,
  [
    // 位置用 easeOut（快速到达）
    new MoveAnimation(hero, { x: 2, y: 0, z: 0 }, {
      duration: 1,
      easing: easeOut
    }),
    // 旋转用 smooth（平滑过渡）
    new RotateAnimation(hero, 'z', 180, {
      duration: 1,
      easing: smooth
    }),
    // 透明度用 easeIn（慢慢显现）
    new FadeInAnimation(hero, { duration: 1, easing: easeIn })
  ],
  CompositionType.Parallel
);
```

#### 技巧 2：分段缓动

```typescript
// 将动画分成多段，每段使用不同缓动
const segmentedMove = new AnimationGroup(
  box,
  [
    // 第一阶段：快速启动
    new MoveAnimation(box, { x: 1, y: 0, z: 0 }, {
      duration: 0.3,
      easing: easeIn
    }),
    // 第二阶段：匀速移动
    new MoveAnimation(box, { x: 2, y: 0, z: 0 }, {
      duration: 0.4,
      easing: linear
    }),
    // 第三阶段：平滑停止
    new MoveAnimation(box, { x: 3, y: 0, z: 0 }, {
      duration: 0.3,
      easing: easeOut
    })
  ],
  CompositionType.Sequence
);
```

#### 技巧 3：物理仿真缓动

```typescript
// 模拟重力效果
function gravityEasing(height: number): EasingFunction {
  return custom((t) => {
    // h(t) = H - 0.5 * g * t²
    const g = 9.8;
    const fallTime = Math.sqrt(2 * height / g);
    const progress = t * fallTime;
    return 1 - 0.5 * g * progress * progress / height;
  });
}

const realisticFall = new MoveAnimation(
  apple,
  { x: 0, y: -5, z: 0 },
  { duration: 1, easing: gravityEasing(5) }
);
```

### 4.6 实战示例：UI 动画缓动选择

```typescript
// 按钮：点击时轻微缩小
const buttonPress = new ScaleAnimation(button, { x: 0.95, y: 0.95, z: 1 }, {
  duration: 0.1,
  easing: easeOutCubic
});

// 模态框：弹出效果
const modalPopup = new AnimationGroup(
  modal,
  [
    new FadeInAnimation(modal, { duration: 0.3, easing: easeOutQuad }),
    new ScaleAnimation(modal, { x: 1, y: 1, z: 1 }, {
      duration: 0.3,
      easing: easeOutBack // 轻微过冲效果
    })
  ],
  CompositionType.Parallel
);

// 侧边栏：滑入效果
const sidebarSlide = new MoveAnimation(sidebar, { x: 0, y: 0, z: 0 }, {
  duration: 0.4,
  easing: easeOutCubic
});

// 通知：出现后自动消失
const notificationShow = new AnimationGroup(
  notification,
  [
    new FadeInAnimation(notification, { duration: 0.3, easing: easeOutQuad }),
    new MoveAnimation(notification, { x: 0, y: 20, z: 0 }, {
      duration: 0.3,
      easing: easeOutBack
    }),
    // 等待 2 秒
    new MoveAnimation(notification, { x: 0, y: 20, z: 0 }, {
      duration: 2,
      easing: linear
    }),
    // 消失
    new FadeOutAnimation(notification, { duration: 0.3, easing: easeInQuad })
  ],
  CompositionType.Sequence
);
```

---

## 总结

恭喜你完成了 AniMaker 动画创建入门教程！你现在应该能够：

1. **理解核心概念**：Scene、RenderObject、Animation 的作用和关系
2. **创建基本动画**：移动、旋转、缩放、淡入淡出
3. **组合复杂动画**：并行、顺序、延迟以及嵌套组合
4. **选择合适缓动**：根据场景选择正确的缓动函数

### 下一步学习

- 📖 [核心概念详解](./concepts.md) - 深入了解框架架构
- 🎨 [图形对象参考](../api/) - 所有可用的图形类型
- 🔌 [插件开发](./plugins.md) - 扩展框架功能
- 💡 [示例集合](../examples/) - 更多实战示例

### 实践建议

1. **从简单开始**：先用简单的形状练习基本动画
2. **实验缓动**：尝试不同缓动函数的效果
3. **组合练习**：用组合方式创建复杂序列
4. **参考示例**：查看官方示例获取灵感

### 获取帮助

- 🐛 [报告问题](https://github.com/your-username/animaker/issues)
- 💬 [参与讨论](https://github.com/your-username/animaker/discussions)
- 📚 [API 文档](../api/)

祝你创作愉快！🎬
