# 动画 API

本节介绍 Kinema 框架的动画系统 API。动画系统是框架的核心，负责定义和执行对象属性随时间的变化。

## 目录

- [Animation 基类](#animation-基类)
- [内置动画类型](#内置动画类型)
- [动画组合](#动画组合)
- [动画构建器](#动画构建器)

---

## Animation 基类

所有动画类型都继承自 `Animation` 抽象基类。

### 类签名

```typescript
abstract class Animation<T extends RenderObject = RenderObject> {
  constructor(
    public readonly target: T,
    protected readonly config: AnimationConfig
  )
}
```

### 属性

| 属性     | 类型                        | 说明             |
| -------- | --------------------------- | ---------------- |
| `target` | `T`                         | 动画的目标对象   |
| `config` | `Readonly<AnimationConfig>` | 动画配置（只读） |

### 方法

#### getTotalDuration()

获取动画的总持续时间（包括延迟）。

```typescript
getTotalDuration(): number
```

**返回：** 动画总时长（秒）

**示例：**

```typescript
const animation = new FadeInAnimation(circle, {
  duration: 1,
  delay: 0.5,
});

console.log(animation.getTotalDuration()); // 1.5 (1 + 0.5)
```

#### interpolate()

在给定时间点插值动画。

```typescript
interpolate(elapsedTime: number): InterpolationResult<T>
```

**参数：**

- `elapsedTime` - 从动画开始经过的时间（秒）

**返回：**

- `object` - 插值后的对象状态
- `complete` - 动画是否完成

**示例：**

```typescript
const result = animation.interpolate(0.5);
if (result.complete) {
  console.log('动画已完成');
} else {
  scene.addObject(result.object);
}
```

#### getName()

获取动画名称。

```typescript
getName(): string
```

**返回：** 动画名称（用于调试）

---

## 内置动画类型

### FadeInAnimation - 淡入动画

将对象的透明度从 0 插值到当前值。

#### 类签名

```typescript
class FadeInAnimation extends Animation {
  constructor(target: RenderObject, config: AnimationConfig);
}
```

#### 示例

```typescript
import { FadeInAnimation } from '@kinema/core/animation';
import { smooth } from '@kinema/core/easing';

const fadeIn = new FadeInAnimation(circle, {
  duration: 1,
  easing: smooth,
  name: 'fade-in',
});

scene.schedule(fadeIn, 0);
```

### FadeOutAnimation - 淡出动画

将对象的透明度从当前值插值到 0。

#### 类签名

```typescript
class FadeOutAnimation extends Animation {
  constructor(target: RenderObject, config: AnimationConfig);
}
```

#### 示例

```typescript
import { FadeOutAnimation } from '@kinema/core/animation';
import { easeInSine } from '@kinema/core/easing';

const fadeOut = new FadeOutAnimation(circle, {
  duration: 1,
  easing: easeInSine,
  name: 'fade-out',
});
```

### RotateAnimation - 旋转动画

绕指定轴旋转对象。

#### 类签名

```typescript
class RotateAnimation extends Animation {
  constructor(
    target: RenderObject,
    axis: 'x' | 'y' | 'z',
    degrees: number,
    config: AnimationConfig,
  );
}
```

#### 参数

- `target` - 目标对象
- `axis` - 旋转轴（'x', 'y', 或 'z'）
- `degrees` - 旋转角度（度）
- `config` - 动画配置

#### 示例

```typescript
import { RotateAnimation } from '@kinema/core/animation';
import { smooth } from '@kinema/core/easing';

// 绕 Z 轴旋转 360 度
const rotate = new RotateAnimation(circle, 'z', 360, {
  duration: 2,
  easing: smooth,
  name: 'rotate-full',
});

// 绕 X 轴旋转 90 度
const flip = new RotateAnimation(rectangle, 'x', 90, {
  duration: 1,
  easing: smooth,
});
```

### MoveAnimation - 移动动画

相对于当前位置移动对象。

#### 类签名

```typescript
class MoveAnimation extends Animation {
  constructor(target: RenderObject, delta: Point3D, config: AnimationConfig);
}
```

#### 参数

- `target` - 目标对象
- `delta` - 移动增量
  - `x` - X 方向增量
  - `y` - Y 方向增量
  - `z` - Z 方向增量
- `config` - 动画配置

#### 示例

```typescript
import { MoveAnimation } from '@kinema/core/animation';
import { easeInOut } from '@kinema/core/easing';

// 向右移动 2 个单位
const moveRight = new MoveAnimation(
  circle,
  {
    x: 2,
    y: 0,
    z: 0,
  },
  {
    duration: 1.5,
    easing: easeInOut,
    name: 'move-right',
  },
);

// 对角线移动
const moveDiagonal = new MoveAnimation(
  circle,
  {
    x: 2,
    y: 2,
    z: 0,
  },
  {
    duration: 2,
    easing: smooth,
  },
);
```

### ScaleAnimation - 缩放动画

缩放对象。

#### 类签名

```typescript
class ScaleAnimation extends Animation {
  constructor(target: RenderObject, scaleFactor: Point3D, config: AnimationConfig);
}
```

#### 参数

- `target` - 目标对象
- `scaleFactor` - 目标缩放比例
  - `x` - X 方向缩放
  - `y` - Y 方向缩放
  - `z` - Z 方向缩放

#### 示例

```typescript
import { ScaleAnimation } from '@kinema/core/animation';
import { easeOutBack } from '@kinema/core/easing';

// 放大到 1.5 倍
const scaleUp = new ScaleAnimation(
  circle,
  {
    x: 1.5,
    y: 1.5,
    z: 1,
  },
  {
    duration: 0.5,
    easing: easeOutBack,
    name: 'scale-up',
  },
);

// 仅水平拉伸
const stretchHorizontal = new ScaleAnimation(
  rect,
  {
    x: 2,
    y: 1,
    z: 1,
  },
  {
    duration: 1,
    easing: smooth,
  },
);
```

### TransformAnimation - 变换动画

在两个对象状态之间进行完整的变换插值。

#### 类签名

```typescript
class TransformAnimation extends Animation {
  constructor(target: RenderObject, endState: RenderObjectState, config: AnimationConfig);
}
```

#### 参数

- `target` - 目标对象
- `endState` - 目标状态（包含完整的变换）
- `config` - 动画配置

#### 示例

```typescript
import { TransformAnimation } from '@kinema/core/animation';

const endState: RenderObjectState = {
  id: target.getState().id,
  transform: {
    position: { x: 2, y: 3, z: 0 },
    rotation: { x: 0, y: 0, z: 45 },
    scale: { x: 1.5, y: 1.5, z: 1 },
    opacity: 0.8,
  },
  visible: true,
  z_index: 0,
  styles: new Map(),
};

const transform = new TransformAnimation(circle, endState, {
  duration: 2,
  easing: smooth,
});
```

---

## 动画组合

### AnimationGroup - 动画组

组合多个动画，支持并行、顺序或延迟执行。

#### 类签名

```typescript
class AnimationGroup extends Animation {
  constructor(
    target: RenderObject,
    animations: ReadonlyArray<Animation>,
    compositionType: CompositionType = CompositionType.Parallel,
    config?: AnimationConfig,
  );
}
```

#### 参数

- `target` - 主目标对象
- `animations` - 要组合的动画数组
- `compositionType` - 组合类型（见下文）
- `config` - 可选的动画配置

#### 组合类型

```typescript
enum CompositionType {
  Parallel = 'parallel', // 同时执行
  Sequence = 'sequence', // 依次执行
  Lagged = 'lagged', // 延迟执行
}
```

#### 并行动画示例

```typescript
import { AnimationGroup, CompositionType } from '@kinema/core/animation';
import { MoveAnimation, RotateAnimation } from '@kinema/core/animation';

// 同时移动和旋转（像车轮滚动）
const parallelGroup = new AnimationGroup(
  wheel,
  [
    new MoveAnimation(
      wheel,
      { x: 3, y: 0, z: 0 },
      {
        duration: 2,
        easing: smooth,
      },
    ),
    new RotateAnimation(wheel, 'z', 360, {
      duration: 2,
      easing: smooth,
    }),
  ],
  CompositionType.Parallel,
);

scene.schedule(parallelGroup, 0);
```

#### 顺序动画示例

```typescript
// 依次执行多个动画
const sequenceGroup = new AnimationGroup(
  hero,
  [
    new FadeInAnimation(hero, { duration: 0.5 }),
    new MoveAnimation(hero, { x: 2, y: 0, z: 0 }, { duration: 1 }),
    new RotateAnimation(hero, 'z', 180, { duration: 0.5 }),
    new FadeOutAnimation(hero, { duration: 0.5 }),
  ],
  CompositionType.Sequence,
);
```

#### 延迟动画示例

```typescript
// 延迟执行动画（波浪效果）
const laggedGroup = new AnimationGroup(
  circles[0],
  circles.map(
    (circle) =>
      new MoveAnimation(
        circle,
        { x: 0, y: 2, z: 0 },
        {
          duration: 1,
          easing: smooth,
        },
      ),
  ),
  CompositionType.Lagged,
);
```

---

## 动画配置

### AnimationConfig

所有动画的通用配置接口。

```typescript
interface AnimationConfig {
  readonly duration: number; // 持续时间（秒）
  readonly easing: EasingFunction; // 缓动函数
  readonly delay?: number; // 开始延迟（秒）
  readonly removeOnComplete?: boolean; // 完成后移除对象
  readonly name?: string; // 动画名称（调试用）
}
```

**属性说明：**

| 属性               | 类型             | 必需 | 默认值   | 说明                       |
| ------------------ | ---------------- | ---- | -------- | -------------------------- |
| `duration`         | `number`         | ✅   | -        | 动画持续时间（秒）         |
| `easing`           | `EasingFunction` | ✅   | `smooth` | 缓动函数                   |
| `delay`            | `number`         | ❌   | `0`      | 动画开始前的延迟时间       |
| `removeOnComplete` | `boolean`        | ❌   | `false`  | 完成后从场景中移除对象     |
| `name`             | `string`         | ❌   | -        | 动画名称（用于日志和调试） |

### InterpolationResult

动画插值结果。

```typescript
interface InterpolationResult<T extends RenderObject = RenderObject> {
  readonly object: T; // 插值后的对象
  readonly complete: boolean; // 动画是否完成
}
```

---

## 动画构建器

### AnimationBuilder

提供流式 API 来构建动画配置。

#### 使用方法

```typescript
const animation = FadeInAnimation.animate(circle)
  .withDuration(2)
  .withEasing(smooth)
  .withDelay(0.5)
  .removeOnComplete(true)
  .withName('my-fade-in')
  .build();
```

#### 方法

| 方法                       | 参数                  | 返回               | 说明           |
| -------------------------- | --------------------- | ------------------ | -------------- |
| `withDuration(seconds)`    | 持续时间（秒）        | `AnimationBuilder` | 设置动画时长   |
| `withEasing(easing)`       | 缓动函数              | `AnimationBuilder` | 设置缓动效果   |
| `withDelay(seconds)`       | 延迟时间（秒）        | `AnimationBuilder` | 设置开始延迟   |
| `removeOnComplete(value?)` | 是否移除（默认 true） | `AnimationBuilder` | 设置完成后移除 |
| `withName(name)`           | 动画名称              | `AnimationBuilder` | 设置调试名称   |
| `build()`                  | -                     | `T`                | 构建动画实例   |

#### 完整示例

```typescript
import { FadeInAnimation, RotateAnimation } from '@kinema/core/animation';
import { smooth, easeOutBack } from '@kinema/core/easing';

// 创建淡入动画
const fadeIn = FadeInAnimation.animate(circle)
  .withDuration(1)
  .withEasing(smooth)
  .withDelay(0.5)
  .withName('circle-fade-in')
  .build();

// 创建带弹跳效果的旋转动画
const rotate = RotateAnimation.animate(box)
  .withDuration(1.5)
  .withEasing(easeOutBack)
  .withDelay(1)
  .withName('box-rotate')
  .build();
```

---

## 相关文档

- [核心类型 API](./core.md) - 基础类型定义
- [场景 API](./scene.md) - 场景管理和动画调度
- [缓动函数 API](./easing.md) - 缓动函数完整参考
- [动画创建入门教程](../guide/animation-basics.md) - 动画教程
