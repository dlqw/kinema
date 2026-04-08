# 从 GSAP 迁移到 Kinema

本指南帮助你从 GSAP (GreenSock Animation Platform) 迁移到 Kinema。

## 目录

- [概述](#概述)
- [概念对比](#概念对比)
- [API 映射](#api-映射)
- [代码转换示例](#代码转换示例)
- [高级功能迁移](#高级功能迁移)

---

## 概述

### 主要差异

| 方面       | GSAP           | Kinema          |
| ---------- | -------------- | --------------- |
| **目标**   | DOM/SVG/Canvas | Canvas/WebGPU   |
| **语法**   | 链式调用       | 对象创建        |
| **时间轴** | Timeline       | Scene + 调度    |
| **状态**   | 可变           | 不可变          |
| **类型**   | JSDoc          | 原生 TypeScript |
| **插件**   | 付费插件       | 内置功能        |

### Kinema 的优势

1. **完整类型系统** - 原生 TypeScript 支持
2. **不可变数据** - 更可预测的状态管理
3. **WebGPU 加速** - 更好的性能
4. **免费功能** - 无需付费插件

---

## 概念对比

### Timeline 对应

```javascript
// GSAP
const tl = gsap.timeline({
  defaults: {
    duration: 1,
    ease: 'power2.out',
  },
});

tl.to('.box', { x: 100 }).to('.box', { y: 50 }).to('.box', { rotation: 360 });
```

```typescript
// Kinema
import { createScene } from '@kinema/core';
import {
  MoveAnimation,
  RotateAnimation,
  AnimationGroup,
  CompositionType,
} from '@kinema/core/animation';
import { easeOut } from '@kinema/core/easing';

const scene = createScene();
const box = VectorObject.rectangle(1, 1);

const moveX = new MoveAnimation(
  box,
  { x: 2, y: 0, z: 0 },
  {
    duration: 1,
    easing: easeOut,
  },
);

const moveY = new MoveAnimation(
  box,
  { x: 2, y: 1, z: 0 },
  {
    duration: 1,
    easing: easeOut,
  },
);

const rotate = new RotateAnimation(box, 'z', 360, {
  duration: 1,
  easing: easeOut,
});

const timeline = new AnimationGroup(box, [moveX, moveY, rotate], CompositionType.Sequence);

scene.schedule(timeline, 0);
```

### Tween 对应

```javascript
// GSAP
gsap.to('.box', {
  x: 100,
  y: 50,
  rotation: 90,
  duration: 1,
  ease: 'power2.inOut',
  delay: 0.5,
});
```

```typescript
// Kinema
const transform = new TransformAnimation(
  box,
  {
    id: box.getState().id,
    transform: {
      position: { x: 2, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 90 },
      scale: { x: 1, y: 1, z: 1 },
      opacity: 1,
    },
    visible: true,
    z_index: 0,
    styles: new Map(),
  },
  {
    duration: 1,
    easing: easeInOut,
    delay: 0.5,
  },
);

scene.schedule(transform, 0);
```

---

## API 映射

### 核心方法

| GSAP              | Kinema                             | 说明           |
| ----------------- | ---------------------------------- | -------------- |
| `gsap.to()`       | `TransformAnimation`               | 动画到目标状态 |
| `gsap.from()`     | 反向 `TransformAnimation`          | 从初始状态动画 |
| `gsap.fromTo()`   | 自定义插值                         | 两端状态插值   |
| `gsap.set()`      | `withPosition()`, `withScale()` 等 | 立即设置       |
| `gsap.timeline()` | `AnimationGroup(Sequence)`         | 时间轴         |

### 属性映射

| GSAP              | Kinema                                     | 说明       |
| ----------------- | ------------------------------------------ | ---------- |
| `x`, `y`, `z`     | `position.{x,y,z}`                         | 位置       |
| `rotation`        | `rotation.{x,y,z}`                         | 旋转（度） |
| `scale`           | `scale.{x,y,z}`                            | 缩放       |
| `opacity`         | `opacity`                                  | 透明度     |
| `width`, `height` | 尺寸参数                                   | 尺寸       |
| `backgroundColor` | `styles.fillColor`                         | 背景色     |
| `color`           | `styles.fillColor` 或 `styles.strokeColor` | 颜色       |

### 缓动函数

| GSAP           | Kinema           | 说明       |
| -------------- | ---------------- | ---------- |
| `none`         | `linear`         | 无缓动     |
| `power1.in`    | `easeIn`         | 二次加速   |
| `power1.out`   | `easeOut`        | 二次减速   |
| `power1.inOut` | `easeInOut`      | 二次加减速 |
| `power2.in`    | `easeInCubic`    | 三次加速   |
| `power2.out`   | `easeOutCubic`   | 三次减速   |
| `power2.inOut` | `easeInOutCubic` | 三次加减速 |
| `power3.in`    | `easeInQuart`    | 四次加速   |
| `power3.out`   | `easeOutQuart`   | 四次减速   |
| `power4.in`    | `easeInQuint`    | 五次加速   |
| `power4.out`   | `easeOutQuint`   | 五次减速   |
| `sine.in`      | `easeInSine`     | 正弦加速   |
| `sine.out`     | `easeOutSine`    | 正弦减速   |
| `sine.inOut`   | `easeInOutSine`  | 正弦加减速 |
| `expo.in`      | `easeInExpo`     | 指数加速   |
| `expo.out`     | `easeOutExpo`    | 指数减速   |
| `back.out`     | `back`           | 回弹       |
| `elastic.out`  | `elastic`        | 弹性       |

---

## 代码转换示例

### 示例 1: 基础动画

**GSAP 代码：**

```javascript
// GSAP
gsap.to('.box', {
  x: 100,
  duration: 1,
  ease: 'power2.out',
});

gsap.to('.box', {
  y: 50,
  duration: 0.5,
  delay: 1,
  ease: 'power1.inOut',
});

gsap.to('.box', {
  rotation: 360,
  duration: 1,
  delay: 1.5,
  ease: 'elastic.out(1, 0.3)',
});
```

**Kinema 代码：**

```typescript
import { createScene, VectorObject } from '@kinema/core';
import {
  MoveAnimation,
  RotateAnimation,
  AnimationGroup,
  CompositionType,
} from '@kinema/core/animation';
import { easeOut, easeInOut, elastic } from '@kinema/core/easing';

const scene = createScene();
const box = VectorObject.rectangle(1, 1).withPosition({ x: 0, y: 0, z: 0 });

// 创建动画
const moveX = new MoveAnimation(
  box,
  { x: 2, y: 0, z: 0 },
  {
    duration: 1,
    easing: easeOut,
  },
);

const moveY = new MoveAnimation(
  box,
  { x: 2, y: 0.5, z: 0 },
  {
    duration: 0.5,
    easing: easeInOut,
  },
);

const rotate = new RotateAnimation(box, 'z', 360, {
  duration: 1,
  easing: elastic,
});

// 使用动画组组合
const timeline = new AnimationGroup(box, [moveX, moveY, rotate], CompositionType.Sequence);

scene.schedule(timeline, 0);
```

### 示例 2: 时间轴控制

**GSAP 代码：**

```javascript
// GSAP
const tl = gsap.timeline({
  paused: true,
  repeat: 2,
  yoyo: true,
  onComplete: () => console.log('Complete'),
  onReverseComplete: () => console.log('Reverse Complete'),
});

tl.to('.box1', { x: 100, duration: 1 })
  .to('.box2', { y: 50, duration: 1 }, '-=0.5') // 重叠 0.5 秒
  .to('.box3', { rotation: 180, duration: 1 });

// 控制
tl.play();
tl.pause();
tl.reverse();
tl.seek(1.5);
tl.timeScale(0.5); // 慢动作
tl.progress(0.5); // 跳到 50%
```

**Kinema 代码：**

```typescript
import { createScene, VectorObject } from '@kinema/core';
import {
  MoveAnimation,
  RotateAnimation,
  AnimationGroup,
  CompositionType,
} from '@kinema/core/animation';
import { smooth } from '@kinema/core/easing';

const scene = createScene();

const box1 = VectorObject.rectangle(1, 1).withPosition({ x: -2, y: 0, z: 0 });
const box2 = VectorObject.rectangle(1, 1).withPosition({ x: 0, y: 0, z: 0 });
const box3 = VectorObject.rectangle(1, 1).withPosition({ x: 2, y: 0, z: 0 });

let currentScene = scene.addObjects(box1, box2, box3);

// 创建动画
const anim1 = new MoveAnimation(box1, { x: -1, y: 0, z: 0 }, { duration: 1, easing: smooth });
const anim2 = new MoveAnimation(box2, { x: 0, y: 0.5, z: 0 }, { duration: 1, easing: smooth });
const anim3 = new RotateAnimation(box3, 'z', 180, { duration: 1, easing: smooth });

// 时间轴（顺序 + 重叠）
const timeline = new AnimationGroup(
  box1,
  [
    anim1,
    new AnimationGroup(box2, [anim2], CompositionType.Sequence), // 内嵌组
    anim3,
  ],
  CompositionType.Sequence,
);

// 调度（重叠效果通过时间实现）
currentScene = currentScene.schedule(anim1, 0);
currentScene = currentScene.schedule(anim2, 0.5); // 重叠 0.5 秒
currentScene = currentScene.schedule(anim3, 1.5);

// 场景控制
const totalTime = 2.5;

// 播放控制
let currentTime = 0;
let isPlaying = false;
let playbackSpeed = 1;
let direction: 'forward' | 'backward' = 'forward';

function play() {
  isPlaying = true;
  direction = 'forward';
}

function pause() {
  isPlaying = false;
}

function reverse() {
  isPlaying = true;
  direction = 'backward';
}

function seek(time: number) {
  currentTime = Math.max(0, Math.min(totalTime, time));
  currentScene = currentScene.updateTo(currentTime);
}

function timeScale(scale: number) {
  playbackSpeed = scale;
}

function progress(value: number) {
  seek(value * totalTime);
}

// 动画循环
function animate(deltaTime: number) {
  if (isPlaying) {
    const delta = deltaTime * playbackSpeed;
    if (direction === 'forward') {
      currentTime += delta;
      if (currentTime >= totalTime) {
        currentTime = 0; // 循环
      }
    } else {
      currentTime -= delta;
      if (currentTime <= 0) {
        currentTime = totalTime;
      }
    }
    currentScene = currentScene.updateTo(currentTime);
  }
}

// 使用
play();
// pause();
// reverse();
// seek(1.5);
// timeScale(0.5);
// progress(0.5);
```

### 示例 3: 交错动画

**GSAP 代码：**

```javascript
// GSAP
gsap.to('.box', {
  x: 100,
  duration: 1,
  stagger: 0.1, // 每个元素延迟 0.1 秒
  ease: 'power2.out',
});

// 或使用高级交错
gsap.to('.box', {
  x: 100,
  duration: 1,
  stagger: {
    each: 0.1,
    from: 'center', // 从中间开始
    grid: [5, 5], // 5x5 网格
    ease: 'power1.in',
  },
});
```

**Kinema 代码：**

```typescript
import { createScene, VectorObject } from '@kinema/core';
import { MoveAnimation, AnimationGroup, CompositionType } from '@kinema/core/animation';
import { easeOut } from '@kinema/core/easing';

const scene = createScene();

// 创建多个盒子
const boxes = Array.from({ length: 25 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return VectorObject.rectangle(0.2, 0.2).withPosition({
    x: (col - 2) * 0.3,
    y: (2 - row) * 0.3,
    z: 0,
  });
});

let currentScene = scene.addObjects(...boxes);

// 创建交错动画（使用 Lagged 组合）
const animations = boxes.map(
  (box) =>
    new MoveAnimation(
      box,
      { x: box.getState().transform.position.x + 1, y: 0, z: 0 },
      {
        duration: 1,
        easing: easeOut,
      },
    ),
);

const staggered = new AnimationGroup(boxes[0], animations, CompositionType.Lagged);

currentScene = currentScene.schedule(staggered, 0);

// 高级交错：从中心开始
function createGridStagger(
  objects: RenderObject[],
  animationFactory: (obj: RenderObject) => Animation,
): Animation[] {
  // 计算中心索引
  const centerIndex = Math.floor(objects.length / 2);

  // 按距离中心排序
  const sorted = objects
    .map((obj, index) => ({
      obj,
      index,
      distance: Math.abs(index - centerIndex),
    }))
    .sort((a, b) => a.distance - b.distance);

  // 创建动画
  return sorted.map(({ obj }) => animationFactory(obj));
}

// 使用
const gridAnimations = createGridStagger(
  boxes,
  (box) =>
    new MoveAnimation(
      box,
      { x: box.getState().transform.position.x + 1, y: 0, z: 0 },
      {
        duration: 1,
        easing: easeOut,
      },
    ),
);

const gridStaggered = new AnimationGroup(boxes[0], gridAnimations, CompositionType.Lagged);

currentScene = currentScene.schedule(gridStaggered, 0);
```

### 示例 4: ScrollTrigger

**GSAP 代码：**

```javascript
// GSAP + ScrollTrigger
gsap.to('.box', {
  x: 500,
  scrollTrigger: {
    trigger: '.box',
    start: 'top center',
    end: 'bottom center',
    scrub: true,
    pin: true,
  },
});
```

**Kinema 代码：**

```typescript
// Kinema 需要自定义滚动触发器
class ScrollTrigger {
  private animations: Array<{ animation: Animation; start: number; end: number }> = [];

  add(animation: Animation, start: number, end: number): void {
    this.animations.push({ animation, start, end });
  }

  update(scrollProgress: number): void {
    this.animations.forEach(({ animation, start, end }) => {
      if (scrollProgress >= start && scrollProgress <= end) {
        const progress = (scrollProgress - start) / (end - start);
        animation.interpolate(progress);
      }
    });
  }
}

// 使用
const scrollTrigger = new ScrollTrigger();
const box = VectorObject.rectangle(1, 1).withPosition({ x: 0, y: 0, z: 0 });

const moveX = new MoveAnimation(
  box,
  { x: 5, y: 0, z: 0 },
  {
    duration: 1,
    easing: linear, // scrub 需要 linear
  },
);

scrollTrigger.add(moveX, 0, 0.5); // 0-50% 滚动范围

// 监听滚动事件
window.addEventListener('scroll', () => {
  const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  scrollTrigger.update(scrollProgress);
});
```

---

## 高级功能迁移

### Draggable

**GSAP 代码：**

```javascript
// GSAP Draggable
Draggable.create('.box', {
  type: 'x,y',
  bounds: '#container',
  inertia: true,
  onDragStart: function () {
    console.log('Drag started');
  },
  onDrag: function () {
    console.log(this.x, this.y);
  },
  onDragEnd: function () {
    console.log('Drag ended');
  },
});
```

**Kinema 代码：**

```typescript
// Kinema 需要自定义拖拽实现
class DraggableObject {
  private isDragging = false;
  private startPosition: Point3D = { x: 0, y: 0, z: 0 };
  private mouseOffset: Point3D = { x: 0, y: 0, z: 0 };

  constructor(
    private obj: RenderObject,
    private bounds?: { min: Point3D; max: Point3D },
    private inertia: boolean = false,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = document.getElementById('canvas');

    canvas?.addEventListener('mousedown', (e) => this.onDragStart(e));
    canvas?.addEventListener('mousemove', (e) => this.onDrag(e));
    canvas?.addEventListener('mouseup', () => this.onDragEnd());
  }

  private onDragStart(event: MouseEvent): void {
    const mousePos = this.getMousePosition(event);
    const objPos = this.obj.getState().transform.position;

    // 检查是否点击在对象上
    if (this.isPointInObject(mousePos, this.obj)) {
      this.isDragging = true;
      this.startPosition = objPos;
      this.mouseOffset = {
        x: mousePos.x - objPos.x,
        y: mousePos.y - objPos.y,
        z: 0,
      };
    }
  }

  private onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;

    const mousePos = this.getMousePosition(event);
    let newPos = {
      x: mousePos.x - this.mouseOffset.x,
      y: mousePos.y - this.mouseOffset.y,
      z: 0,
    };

    // 应用边界
    if (this.bounds) {
      newPos = {
        x: Math.max(this.bounds.min.x, Math.min(this.bounds.max.x, newPos.x)),
        y: Math.max(this.bounds.min.y, Math.min(this.bounds.max.y, newPos.y)),
        z: 0,
      };
    }

    this.obj = this.obj.withPosition(newPos);
  }

  private onDragEnd(): void {
    this.isDragging = false;

    // 惯性效果
    if (this.inertia) {
      // 实现惯性逻辑
    }
  }

  private getMousePosition(event: MouseEvent): Point3D {
    const canvas = document.getElementById('canvas');
    if (!canvas) return { x: 0, y: 0, z: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      z: 0,
    };
  }

  private isPointInObject(point: Point3D, obj: RenderObject): boolean {
    const bbox = obj.getBoundingBox();
    return (
      point.x >= bbox.min.x &&
      point.x <= bbox.max.x &&
      point.y >= bbox.min.y &&
      point.y <= bbox.max.y
    );
  }

  getObject(): RenderObject {
    return this.obj;
  }
}

// 使用
const box = VectorObject.rectangle(1, 1).withPosition({ x: 0, y: 0, z: 0 });
const draggable = new DraggableObject(
  box,
  {
    min: { x: -2, y: -2, z: 0 },
    max: { x: 2, y: 2, z: 0 },
  },
  true,
);

scene.addObject(draggable.getObject());
```

### MorphSVG

**GSAP 代码：**

```javascript
// GSAP MorphSVG
gsap.to('#path1', {
  morphSVG: '#path2',
  duration: 2,
  ease: 'power1.inOut',
});
```

**Kinema 代码：**

```typescript
// Kinema 路径变形
class MorphAnimation extends Animation {
  private startPath: Point3D[];
  private endPath: Point3D[];

  constructor(
    target: RenderObject,
    endPath: Point3D[],
    config: AnimationConfig
  ) {
    super(target, config);
    this.startPath = (target as PathObject).getPoints();
    this.endPath = endPath;
  }

  interpolate(elapsedTime: number): InterpolationResult {
    const alpha = Math.min(1, elapsedTime / this.config.duration);
    const easedAlpha = this.config.easing(alpha as Alpha);

    // 插值路径点
    const morphedPath = this.startPath.map((startPoint, index) => {
      const endPoint = this.endPath[index] || startPoint;
      return {
        x: lerp(startPoint.x, endPoint.x, easedAlpha),
        y: lerp(startPoint.y, endPoint.y, easedAlpha),
        z: lerp(startPoint.z, endPoint.z, easedAlpha)
      };
    });

    const morphedObj = (this.target as PathObject).withPoints(morphedPath);

    return {
      object: morphedObj,
      complete: easedAlpha >= 1
    };
  }
}

// 使用
const path1 = PathObject.fromPoints([...]);
const path2 = [...]; // 目标路径点

const morph = new MorphAnimation(path1, path2, {
  duration: 2,
  easing: easeInOut
});

scene.schedule(morph, 0);
```

---

## 迁移检查清单

### 准备阶段

- [ ] 备份现有 GSAP 项目
- [ ] 安装 Kinema
- [ ] 设置 TypeScript 环境
- [ ] 了解 Kinema 基础概念

### 迁移阶段

- [ ] 转换基础动画（to, from, fromTo）
- [ ] 转换时间轴
- [ ] 转换缓动函数
- [ ] 转换交错动画
- [ ] 转换高级功能（Draggable, ScrollTrigger 等）

### 测试阶段

- [ ] 功能测试
- [ ] 性能测试
- [ ] 浏览器兼容性测试

---

## 相关文档

- [动画创建入门](../animation-basics.md) - Kinema 动画基础
- [缓动函数 API](../../api/easing.md) - 完整缓动函数参考
- [自定义动画](../custom-animations.md) - 创建自定义动画
- [性能优化指南](../performance.md) - 性能优化建议
