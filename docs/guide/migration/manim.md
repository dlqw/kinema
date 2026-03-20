# 从 Manim 迁移到 AniMaker

本指南帮助你从 Python 的 Manim 迁移到 TypeScript 的 AniMaker。

## 目录

- [概述](#概述)
- [概念对比](#概念对比)
- [API 映射](#api-映射)
- [代码转换示例](#代码转换示例)
- [常见问题](#常见问题)

---

## 概述

### 主要差异

| 方面 | Manim | AniMaker |
|------|-------|----------|
| **语言** | Python | TypeScript |
| **运行环境** | 本地渲染 | 浏览器/本地 |
| **渲染后端** | Cairo/OpenGL | WebGPU/Canvas2D |
| **类型系统** | 动态类型 | 静态类型 |
| **数据模型** | 可变 | 不可变 |
| **动画定义** | 继承 Mobject | 实现 RenderObject |
| **组合方式** | 函数式 | 面向对象 |

### AniMaker 的优势

1. **类型安全** - 编译时捕获错误
2. **更好性能** - WebGPU 加速
3. **实时预览** - 浏览器中即时查看
4. **现代工具** - TypeScript 生态系统

---

## 概念对比

### Scene 对应

```python
# Manim
class MyScene(Scene):
    def construct(self):
        circle = Circle()
        self.play(Create(circle))
```

```typescript
// AniMaker
import { createScene, VectorObject } from '@animaker/core';
import { FadeInAnimation } from '@animaker/core/animation';

const scene = createScene({
  width: 1920,
  height: 1080,
  fps: 60
});

const circle = VectorObject.circle(1);
const fadeIn = new FadeInAnimation(circle, { duration: 1 });

scene.schedule(fadeIn, 0);
```

### Mobject 对应

```python
# Manim
circle = Circle(radius=2, color=BLUE)
square = Square(side_length=3, color=RED)
```

```typescript
// AniMaker
import { VectorObject } from '@animaker/core';

const circle = VectorObject.circle(2, { x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#3498db']]));

const square = VectorObject.rectangle(3, 3, { x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#e74c3c']]));
```

### Animation 对应

```python
# Manim
self.play(Create(circle))
self.play(FadeOut(circle))
self.play(Transform(circle, square))
```

```typescript
// AniMaker
import {
  FadeInAnimation,
  FadeOutAnimation,
  TransformAnimation
} from '@animaker/core/animation';

const create = new FadeInAnimation(circle, { duration: 1 });
const fadeOut = new FadeOutAnimation(circle, { duration: 1 });
const transform = new TransformAnimation(circle, square.getState(), {
  duration: 1
});

scene.schedule(create, 0);
scene.schedule(fadeOut, 1);
scene.schedule(transform, 2);
```

---

## API 映射

### 创建对象

| Manim | AniMaker | 说明 |
|-------|----------|------|
| `Circle()` | `VectorObject.circle()` | 圆形 |
| `Square()` | `VectorObject.rectangle()` | 正方形 |
| `Rectangle()` | `VectorObject.rectangle()` | 矩形 |
| `Line()` | `VectorObject.line()` | 线段 |
| `Triangle()` | `PolygonObject.triangle()` | 三角形 |
| `Polygon()` | `PolygonObject` | 多边形 |
| `Text()` | `TextObject` | 文本 |
| `Dot()` | `VectorObject.circle()` | 点（小圆） |

### 颜色

| Manim | AniMaker |
|-------|----------|
| `WHITE` | `#FFFFFF` |
| `BLACK` | `#000000` |
| `BLUE` | `#3498db` |
| `RED` | `#e74c3c` |
| `GREEN` | `#2ecc71` |
| `YELLOW` | `#f1c40f` |
| `ORANGE` | `#e67e22` |
| `PURPLE` | `#9b59b6` |
| `MAROON` | `#8e44ad` |

### 动画

| Manim | AniMaker | 说明 |
|-------|----------|------|
| `Create()` | `FadeInAnimation` | 创建对象 |
| `FadeIn()` | `FadeInAnimation` | 淡入 |
| `FadeOut()` | `FadeOutAnimation` | 淡出 |
| `Transform()` | `TransformAnimation` | 变换 |
| `ReplacementTransform()` | `TransformAnimation` | 替换变换 |
| `Rotate()` | `RotateAnimation` | 旋转 |
| `Shift()` | `MoveAnimation` | 移动 |
| `Scale()` | `ScaleAnimation` | 缩放 |

### 组合

| Manim | AniMaker | 说明 |
|-------|----------|------|
| `AnimationGroup()` | `AnimationGroup(Parallel)` | 并行 |
| `Succession()` | `AnimationGroup(Sequence)` | 顺序 |
| `LaggedStart()` | `AnimationGroup(Lagged)` | 延迟 |

### 缓动函数

| Manim | AniMaker | 说明 |
|-------|----------|------|
| `linear()` | `linear` | 线性 |
| `smooth()` | `smooth` | 平滑 |
| `smoother()` | `smoother` | 更平滑 |
| `ease_in_sine()` | `easeInSine` | 正弦加速 |
| `ease_out_sine()` | `easeOutSine` | 正弦减速 |
| `ease_in_out_sine()` | `easeInOutSine` | 正弦加减速 |
| `ease_in_quad()` | `easeIn` | 二次加速 |
| `ease_out_quad()` | `easeOut` | 二次减速 |
| `ease_in_out_quad()` | `easeInOut` | 二次加减速 |
| `there_and_back()` | `thereAndBack` | 往返 |

---

## 代码转换示例

### 示例 1: 基础动画

**Manim 代码：**
```python
from manim import *

class BasicAnimation(Scene):
    def construct(self):
        # 创建圆形
        circle = Circle(radius=2, color=BLUE)
        self.play(Create(circle))

        # 移动圆形
        self.play(circle.animate.shift(RIGHT * 2))

        # 旋转圆形
        self.play(circle.animate.rotate(PI / 2))

        # 缩放圆形
        self.play(circle.animate.scale(2))

        # 淡出
        self.play(FadeOut(circle))
```

**AniMaker 代码：**
```typescript
import { createScene, VectorObject } from '@animaker/core';
import {
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  RotateAnimation,
  ScaleAnimation
} from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

const scene = createScene({
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  fps: 60
});

// 创建圆形
const circle = VectorObject.circle(2, { x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#3498db']]));

// 添加到场景
let currentScene = scene.addObject(circle);

// 创建动画
const fadeIn = new FadeInAnimation(circle, { duration: 1, easing: smooth });
const move = new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, {
  duration: 1,
  easing: smooth
});
const rotate = new RotateAnimation(circle, 'z', 90, {
  duration: 1,
  easing: smooth
});
const scale = new ScaleAnimation(circle, { x: 2, y: 2, z: 1 }, {
  duration: 1,
  easing: smooth
});
const fadeOut = new FadeOutAnimation(circle, { duration: 1, easing: smooth });

// 调度动画
currentScene = currentScene.schedule(fadeIn, 0);    // 0-1秒
currentScene = currentScene.schedule(move, 1);     // 1-2秒
currentScene = currentScene.schedule(rotate, 2);   // 2-3秒
currentScene = currentScene.schedule(scale, 3);    // 3-4秒
currentScene = currentScene.schedule(fadeOut, 4);  // 4-5秒
```

### 示例 2: 组合动画

**Manim 代码：**
```python
class ComposedAnimation(Scene):
    def construct(self):
        circle = Circle(radius=1, color=BLUE)
        square = Square(side_length=2, color=RED)

        # 并行动画
        self.play(
            Create(circle),
            Create(square)
        )

        # 顺序动画
        self.play(
            circle.animate.shift(RIGHT),
            square.animate.shift(LEFT)
        )

        # 嵌套组合
        self.play(
            AnimationGroup(
                circle.animate.rotate(PI),
                square.animate.rotate(PI),
                lag_ratio=0.5
            )
        )
```

**AniMaker 代码：**
```typescript
import { createScene, VectorObject } from '@animaker/core';
import {
  FadeInAnimation,
  MoveAnimation,
  RotateAnimation,
  AnimationGroup,
  CompositionType
} from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

const scene = createScene();

const circle = VectorObject.circle(1)
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#3498db']]));

const square = VectorObject.rectangle(2, 2)
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#e74c3c']]));

let currentScene = scene.addObjects(circle, square);

// 并行动画
const parallelCreate = new AnimationGroup(
  circle,
  [
    new FadeInAnimation(circle, { duration: 1, easing: smooth }),
    new FadeInAnimation(square, { duration: 1, easing: smooth })
  ],
  CompositionType.Parallel
);

// 顺序动画
const sequenceMove = new AnimationGroup(
  circle,
  [
    new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, { duration: 1 }),
    new MoveAnimation(square, { x: -2, y: 0, z: 0 }, { duration: 1 })
  ],
  CompositionType.Sequence
);

// 延迟动画（lag_ratio）
const laggedRotate = new AnimationGroup(
  circle,
  [
    new RotateAnimation(circle, 'z', 180, { duration: 1 }),
    new RotateAnimation(square, 'z', 180, { duration: 1 })
  ],
  CompositionType.Lagged
);

currentScene = currentScene.schedule(parallelCreate, 0);
currentScene = currentScene.schedule(sequenceMove, 1);
currentScene = currentScene.schedule(laggedRotate, 3);
```

### 示例 3: 文本动画

**Manim 代码：**
```python
class TextAnimation(Scene):
    def construct(self):
        title = Text("Hello Manim", font_size=72)
        subtitle = Text("Welcome to the show", font_size=36)

        # 逐字显示
        self.play(AddTextLetterByLetter(title))

        # 淡入副标题
        self.play(FadeIn(subtitle))

        # 改变颜色
        self.play(title.animate.set_color(YELLOW))
```

**AniMaker 代码：**
```typescript
import { createScene } from '@animaker/core';
import { TextObject } from '@animaker/core/objects';
import { FadeInAnimation } from '@animaker/core/animation';
import { smooth, easeInOut } from '@animaker/core/easing';

const scene = createScene();

const title = TextObject.title('Hello AniMaker')
  .withPosition({ x: 0, y: 1, z: 0 })
  .withStyles(new Map([
    ['fillColor', '#FFFFFF'],
    ['fontSize', 72 * 0.01]  // 转换为场景单位
  ]));

const subtitle = TextObject.subtitle('Welcome to the show')
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([
    ['fillColor', '#CCCCCC'],
    ['fontSize', 36 * 0.01]
  ]));

let currentScene = scene.addObjects(title, subtitle);

// 淡入标题
const titleFadeIn = new FadeInAnimation(title, {
  duration: 1.5,
  easing: easeInOut
});

// 淡入副标题
const subtitleFadeIn = new FadeInAnimation(subtitle, {
  duration: 1,
  easing: smooth
});

// 改变颜色（使用样式更新）
const changeColor = title.withStyles(
  new Map([['fillColor', '#f1c40f']])
);

currentScene = currentScene.schedule(titleFadeIn, 0);
currentScene = currentScene.schedule(subtitleFadeIn, 1.5);
currentScene = currentScene.addObject(changeColor);
```

### 示例 4: 数学图形

**Manim 代码：**
```python
class MathShapes(Scene):
    def construct(self):
        # 创建函数图形
        func = lambda x: np.sin(x)
        graph = FunctionGraph(func, x_range=[-PI, PI])

        # 添加坐标轴
        axes = Axes()

        self.play(Create(axes))
        self.play(Create(graph))
```

**AniMaker 代码：**
```typescript
import { createScene } from '@animaker/core';
import { PathObject } from '@animaker/core/objects';
import { FadeInAnimation } from '@animaker/core/animation';

const scene = createScene();

// 生成正弦函数路径点
function generateSinePath(): Point3D[] {
  const points: Point3D[] = [];
  const startX = -Math.PI;
  const endX = Math.PI;
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const x = startX + (endX - startX) * (i / steps);
    const y = Math.sin(x);
    points.push({ x, y, z: 0 });
  }

  return points;
}

// 创建路径对象
const graph = PathObject.fromPoints(generateSinePath())
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([
    ['strokeColor', '#3498db'],
    ['strokeWidth', 0.02]
  ]));

// 添加坐标轴（使用线段）
const xAxis = VectorObject.line(
  { x: -4, y: 0, z: 0 },
  { x: 4, y: 0, z: 0 }
).withStyles(new Map([['strokeColor', '#666666'], ['strokeWidth', 0.01]]));

const yAxis = VectorObject.line(
  { x: 0, y: -2, z: 0 },
  { x: 0, y: 2, z: 0 }
).withStyles(new Map([['strokeColor', '#666666'], ['strokeWidth', 0.01]]));

let currentScene = scene.addObjects(xAxis, yAxis, graph);

// 动画
const createAxes = new AnimationGroup(
  xAxis,
  [
    new FadeInAnimation(xAxis, { duration: 0.5 }),
    new FadeInAnimation(yAxis, { duration: 0.5 })
  ],
  CompositionType.Parallel
);

const createGraph = new FadeInAnimation(graph, {
  duration: 1.5,
  easing: smooth
});

currentScene = currentScene.schedule(createAxes, 0);
currentScene = currentScene.schedule(createGraph, 0.5);
```

---

## 常见问题

### Q: 如何处理 Manim 的 `add()` 和 `remove()`？

**A:** AniMaker 使用 `addObject()` 和 `removeObject()` 方法：

```python
# Manim
circle = Circle()
self.add(circle)
self.remove(circle)
```

```typescript
// AniMaker
const circle = VectorObject.circle(1);
let scene = scene.addObject(circle);
scene = scene.removeObject(circle.getState().id);
```

### Q: 如何实现 Manim 的 `wait()`？

**A:** 使用 `schedule()` 的延迟参数或创建空动画：

```python
# Manim
self.play(Create(circle))
self.wait(1)
self.play(FadeOut(circle))
```

```typescript
// AniMaker
const create = new FadeInAnimation(circle, { duration: 1 });
const fadeOut = new FadeOutAnimation(circle, { duration: 1 });

scene.schedule(create, 0);
scene.schedule(fadeOut, 2);  // 1秒延迟
```

### Q: 如何处理 Manim 的 `next_to()` 和 `align_to()`？

**A:** 手动计算位置或创建辅助函数：

```typescript
// 辅助函数
function nextTo(obj: RenderObject, direction: 'left' | 'right' | 'up' | 'down', distance: number = 0.5): Point3D {
  const pos = obj.getState().transform.position;
  switch (direction) {
    case 'left': return { x: pos.x - distance, y: pos.y, z: pos.z };
    case 'right': return { x: pos.x + distance, y: pos.y, z: pos.z };
    case 'up': return { x: pos.x, y: pos.y + distance, z: pos.z };
    case 'down': return { x: pos.x, y: pos.y - distance, z: pos.z };
  }
}

// 使用
const square = VectorObject.rectangle(1, 1)
  .withPosition(nextTo(circle, 'right', 1));
```

### Q: 如何实现 Manim 的 `UpdateFromFunc`？

**A:** 使用自定义动画或每帧更新：

```typescript
class UpdateAnimation extends Animation {
  private updateFunc: (obj: RenderObject, progress: number) => RenderObject;

  constructor(
    target: RenderObject,
    updateFunc: (obj: RenderObject, progress: number) => RenderObject,
    config: AnimationConfig
  ) {
    super(target, config);
    this.updateFunc = updateFunc;
  }

  interpolate(elapsedTime: number): InterpolationResult {
    const alpha = Math.min(1, elapsedTime / this.config.duration);
    const easedAlpha = this.config.easing(alpha as Alpha);

    const updatedObj = this.updateFunc(this.target, easedAlpha);

    return {
      object: updatedObj,
      complete: easedAlpha >= 1
    };
  }
}

// 使用
const updateAnim = new UpdateAnimation(
  circle,
  (obj, progress) => {
    const newRadius = 1 + progress;
    return obj.withScale({ x: newRadius, y: newRadius, z: 1 });
  },
  { duration: 2, easing: smooth }
);
```

### Q: 如何处理 Manim 的 ValueTracker？

**A:** 使用外部变量或创建状态管理器：

```typescript
class ValueTracker {
  private value: number = 0;
  private listeners: Array<(value: number) => void> = [];

  setValue(value: number): void {
    this.value = value;
    this.listeners.forEach(listener => listener(value));
  }

  getValue(): number {
    return this.value;
  }

  onChange(callback: (value: number) => void): void {
    this.listeners.push(callback);
  }
}

// 使用
const tracker = new ValueTracker();
tracker.onChange((value) => {
  console.log('Value changed:', value);
  // 更新对象
});
```

---

## 最佳实践

### 1. 使用类型安全

```typescript
// 定义明确的类型
interface MySceneState {
  circle: CircleObject;
  square: SquareObject;
  animationProgress: number;
}

// 使用类型注解
const createMyScene = (): Scene => {
  // ...
};
```

### 2. 利用不可变性

```typescript
// 好的做法：使用不可变更新
let scene = scene.addObject(circle);
scene = scene.schedule(animation, 0);

// 避免：直接修改
// scene.objects.push(circle);  // 不要这样做
```

### 3. 复用动画配置

```typescript
// 创建通用配置
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 1,
  easing: smooth,
  delay: 0
};

// 使用配置
const anim = new MoveAnimation(circle, { x: 1, y: 0, z: 0 }, {
  ...DEFAULT_ANIMATION_CONFIG,
  duration: 2  // 覆盖特定属性
});
```

### 4. 组织代码结构

```typescript
// 按功能组织
import { createScene } from '@animaker/core';
import { CircleObject } from './objects/CircleObject';
import { createIntroAnimation } from './animations/intro';
import { createMainAnimation } from './animations/main';

export function createMyScene(): Scene {
  const scene = createScene();
  const circle = new CircleObject(1);

  let currentScene = scene.addObject(circle);
  currentScene = currentScene.schedule(createIntroAnimation(circle), 0);
  currentScene = currentScene.schedule(createMainAnimation(circle), 2);

  return currentScene;
}
```

---

## 相关文档

- [动画创建入门](../animation-basics.md) - AniMaker 动画基础
- [核心概念](../concepts.md) - AniMaker 核心概念
- [自定义动画](../custom-animations.md) - 创建自定义动画
- [API 参考](../../api/) - 完整 API 文档
