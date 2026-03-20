# 缓动函数 API

本节介绍 AniMaker 框架的缓动函数（Easing Functions）API。缓动函数控制动画的速度曲线，是创建自然、流畅动画的关键。

## 目录

- [缓动函数类型](#缓动函数类型)
- [基础缓动](#基础缓动)
- [加速缓动（Ease In）](#加速缓动ease-in)
- [减速缓动（Ease Out）](#减速缓动ease-out)
- [加速减速缓动（Ease In Out）](#加速减速缓动ease-in-out)
- [特殊效果缓动](#特殊效果缓动)
- [工具函数](#工具函数)

---

## 缓动函数类型

### EasingFunction

缓动函数类型定义。

```typescript
type EasingFunction = (alpha: Alpha) => Alpha;
```

**说明：**
- 接收一个线性进度值 `[0, 1]`
- 返回经过缓动的进度值 `[0, 1]`
- 用于控制动画的速度曲线

**参数：**
- `alpha` - 线性进度，0 表示开始，1 表示结束

**返回：**
- 缓动后的进度值

---

## 基础缓动

### linear

线性缓动，无缓动效果。

```typescript
function linear(alpha: Alpha): Alpha
```

**特点：**
- 匀速运动
- 适用于需要恒定速度的场景

**曲线：**
```
1 │╱
  │╱
  │╱
  │╱
  └──────────────────
  0                  1
```

**示例：**
```typescript
import { linear } from '@animaker/core/easing';

const anim = new MoveAnimation(obj, target, {
  duration: 2,
  easing: linear  // 匀速移动
});
```

### smooth

平滑缓动，S 型曲线（默认推荐）。

```typescript
function smooth(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha * alpha * (3 - 2 * alpha)
```

**特点：**
- 开始和结束时平滑
- 适用于大多数动画
- 框架默认缓动函数

**曲线：**
```
1 │        ╱
  │      ╱
  │    ╱
  │ ╱
  └──────────────────
  0                  1
```

### smoother

更平滑的 S 型曲线。

```typescript
function smoother(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10)
```

**特点：**
- 比 smooth 更平滑
- 适用于需要非常柔和的过渡

---

## 加速缓动（Ease In）

加速缓动函数开始慢，越来越快。

### easeIn

二次加速。

```typescript
function easeIn(alpha: Alpha): Alpha
```

**公式：** `alpha * alpha`

**曲线：**
```
1 │           ╱
  │         ╱
  │       ╱
  │     ╱
  │   ╱
  │ ╱
  └──────────────────
  0                  1
```

**示例：**
```typescript
// 像汽车起步
const carStart = new MoveAnimation(car, target, {
  duration: 2,
  easing: easeIn
});
```

### easeInCubic

三次加速。

```typescript
function easeInCubic(alpha: Alpha): Alpha
```

**公式：** `alpha * alpha * alpha`

### easeInQuart

四次加速。

```typescript
function easeInQuart(alpha: Alpha): Alpha
```

**公式：** `alpha * alpha * alpha * alpha`

### easeInQuint

五次加速。

```typescript
function easeInQuint(alpha: Alpha): Alpha
```

**公式：** `alpha * alpha * alpha * alpha * alpha`

### easeInSine

正弦加速。

```typescript
function easeInSine(alpha: Alpha): Alpha
```

**公式：** `1 - Math.cos((alpha * Math.PI) / 2)`

### easeInExpo

指数加速。

```typescript
function easeInExpo(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha === 0 ? 0 : Math.pow(2, 10 * alpha - 10)
```

**特点：**
- 非常慢的开始，然后极快地加速
- 适用于火箭发射等场景

### easeInCirc

圆形加速。

```typescript
function easeInCirc(alpha: Alpha): Alpha
```

**公式：** `1 - Math.sqrt(1 - alpha * alpha)`

---

## 减速缓动（Ease Out）

减速缓动函数开始快，越来越慢。

### easeOut

二次减速。

```typescript
function easeOut(alpha: Alpha): Alpha
```

**公式：** `alpha * (2 - alpha)`

**曲线：**
```
1 │╱
  │╱
  │╱
  │╱
  │╱
  └──────────────────
  0                  1
```

**示例：**
```typescript
// 像汽车刹车
const carStop = new MoveAnimation(car, target, {
  duration: 2,
  easing: easeOut
});
```

### easeOutCubic

三次减速。

```typescript
function easeOutCubic(alpha: Alpha): Alpha
```

**公式：** `1 - Math.pow(1 - alpha, 3)`

### easeOutQuart

四次减速。

```typescript
function easeOutQuart(alpha: Alpha): Alpha
```

**公式：** `1 - Math.pow(1 - alpha, 4)`

### easeOutQuint

五次减速。

```typescript
function easeOutQuint(alpha: Alpha): Alpha
```

**公式：** `1 - Math.pow(1 - alpha, 5)`

### easeOutSine

正弦减速。

```typescript
function easeOutSine(alpha: Alpha): Alpha
```

**公式：** `Math.sin((alpha * Math.PI) / 2)`

### easeOutExpo

指数减速。

```typescript
function easeOutExpo(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha === 1 ? 1 : 1 - Math.pow(2, -10 * alpha)
```

**特点：**
- 非常快的开始，然后极慢地减速
- 适用于球滚动停止等场景

### easeOutCirc

圆形减速。

```typescript
function easeOutCirc(alpha: Alpha): Alpha
```

**公式：** `Math.sqrt(1 - Math.pow(alpha - 1, 2))`

---

## 加速减速缓动（Ease In Out）

加速减速缓动函数两端慢，中间快。

### easeInOut

二次加速减速。

```typescript
function easeInOut(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha < 0.5
  ? 2 * alpha * alpha
  : 1 - Math.pow(-2 * alpha + 2, 2) / 2
```

**曲线：**
```
1 │      ╱╱
  │    ╱╱
  │  ╱╱
  │ ╱╱
  │╱╱
  └──────────────────
  0                  1
```

**示例：**
```typescript
// 像门打开
const doorOpen = new RotateAnimation(door, 'y', 90, {
  duration: 1.5,
  easing: easeInOut
});
```

### easeInOutCubic

三次加速减速。

```typescript
function easeInOutCubic(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha < 0.5
  ? 4 * alpha * alpha * alpha
  : 1 - Math.pow(-2 * alpha + 2, 3) / 2
```

### easeInOutQuart

四次加速减速。

```typescript
function easeInOutQuart(alpha: Alpha): Alpha
```

### easeInOutQuint

五次加速减速。

```typescript
function easeInOutQuint(alpha: Alpha): Alpha
```

### easeInOutSine

正弦加速减速。

```typescript
function easeInOutSine(alpha: Alpha): Alpha
```

**公式：** `-(Math.cos(Math.PI * alpha) - 1) / 2`

### easeInOutExpo

指数加速减速。

```typescript
function easeInOutExpo(alpha: Alpha): Alpha
```

### easeInOutCirc

圆形加速减速。

```typescript
function easeInOutCirc(alpha: Alpha): Alpha
```

---

## 特殊效果缓动

### elastic

弹性效果，像弹簧一样。

```typescript
function elastic(alpha: Alpha): Alpha
```

**公式：**
```typescript
const c4 = (2 * Math.PI) / 3;
return alpha === 0
  ? 0
  : alpha === 1
  ? 1
  : -Math.pow(2, 10 * alpha - 10) * Math.sin((alpha * 10 - 10.75) * c4)
```

**特点：**
- 带回弹效果
- 适用于强调效果

**示例：**
```typescript
const popIn = new ScaleAnimation(obj, { x: 1.5, y: 1.5, z: 1 }, {
  duration: 1,
  easing: elastic
});
```

### back

回拉效果，先向后拉再向前冲。

```typescript
function back(alpha: Alpha): Alpha
```

**公式：**
```typescript
const c1 = 1.70158;
const c3 = c1 + 1;
return 1 + c3 * Math.pow(alpha - 1, 3) + c1 * Math.pow(alpha - 1, 2);
```

**特点：**
- 开始时轻微反向运动
- 适用于强调出现效果

**示例：**
```typescript
const appear = new FadeInAnimation(obj, {
  duration: 1,
  easing: back
});
```

### bounce

弹跳效果，像球落地。

```typescript
function bounce(alpha: Alpha): Alpha
```

**特点：**
- 像球落地弹跳
- 适用于强调效果

**示例：**
```typescript
const drop = new MoveAnimation(obj, { x: 0, y: -3, z: 0 }, {
  duration: 2,
  easing: bounce
});
```

### thereAndBack

往返效果（跳跳）。

```typescript
function thereAndBack(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha < 0.5 ? 2 * alpha : 2 - 2 * alpha
```

**特点：**
- 前半段前进，后半段返回
- 适用于强调显示

### thereAndBackWithPause

往返并暂停。

```typescript
function thereAndBackWithPause(alpha: Alpha): Alpha
```

**公式：**
```typescript
alpha < 0.5 ? 2 * alpha : alpha < 0.75 ? 1 : 4 - 4 * alpha
```

---

## 工具函数

### custom()

创建自定义缓动函数。

```typescript
function custom(fn: (alpha: number) => number): EasingFunction
```

**参数：**
- `fn` - 自定义函数，接收 [0, 1] 返回 [0, 1]

**返回：**
- 类型安全的缓动函数

**示例：**
```typescript
import { custom } from '@animaker/core/easing';

// 创建急停缓动
const sharpStop = custom((t) => {
  if (t < 0.8) {
    return t * 1.25;
  }
  return 1 + (t - 1) * 0.25;
});

// 使用自定义缓动
const anim = new MoveAnimation(obj, target, {
  duration: 2,
  easing: sharpStop
});
```

### cubicBezier()

创建三次贝塞尔曲线缓动。

```typescript
function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): EasingFunction
```

**参数：**
- `p1x`, `p1y` - 第一个控制点
- `p2x`, `p2y` - 第二个控制点

**返回：**
- 贝塞尔曲线缓动函数

**示例：**
```typescript
// CSS ease-in-out 等效
const cssEaseInOut = cubicBezier(0.42, 0, 0.58, 1);

// 自定义贝塞尔
const customBezier = cubicBezier(0.25, 0.1, 0.25, 1);
```

---

## 缓动函数集合

### easeInFunctions

所有加速缓动的集合对象。

```typescript
const easeInFunctions = {
  quadratic: easeIn,
  cubic: easeInCubic,
  quart: easeInQuart,
  quint: easeInQuint,
  sine: easeInSine,
  expo: easeInExpo,
  circ: easeInCirc
} as const;
```

### easeOutFunctions

所有减速缓动的集合对象。

```typescript
const easeOutFunctions = {
  quadratic: easeOut,
  cubic: easeOutCubic,
  quart: easeOutQuart,
  quint: easeOutQuint,
  sine: easeOutSine,
  expo: easeOutExpo,
  circ: easeOutCirc
} as const;
```

### easeInOutFunctions

所有加速减速缓动的集合对象。

```typescript
const easeInOutFunctions = {
  quadratic: easeInOut,
  cubic: easeInOutCubic,
  quart: easeInOutQuart,
  quint: easeInOutQuint,
  sine: easeInOutSine,
  expo: easeInOutExpo,
  circ: easeInOutCirc
} as const;
```

### specialFunctions

所有特殊效果缓动的集合对象。

```typescript
const specialFunctions = {
  elastic,
  back,
  bounce,
  thereAndBack,
  thereAndBackWithPause
} as const;
```

---

## 缓动选择指南

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

---

## 完整示例

### 在动画中使用缓动

```typescript
import {
  FadeInAnimation,
  MoveAnimation,
  RotateAnimation,
  ScaleAnimation
} from '@animaker/core/animation';
import {
  smooth,
  easeInOut,
  easeOutBack,
  elastic,
  bounce
} from '@animaker/core/easing';

// 1. 平滑淡入
const fadeIn = new FadeInAnimation(obj, {
  duration: 1,
  easing: smooth
});

// 2. 带回弹的放大
const popIn = new ScaleAnimation(obj, { x: 1.2, y: 1.2, z: 1 }, {
  duration: 0.5,
  easing: easeOutBack
});

// 3. 弹性移动
const elasticMove = new MoveAnimation(obj, { x: 2, y: 0, z: 0 }, {
  duration: 1.5,
  easing: elastic
});

// 4. 平滑移动和旋转
const smoothRotate = new RotateAnimation(obj, 'z', 360, {
  duration: 2,
  easing: easeInOut
});

// 5. 弹跳落地
const drop = new MoveAnimation(obj, { x: 0, y: -3, z: 0 }, {
  duration: 1,
  easing: bounce
});
```

### 创建自定义缓动曲线

```typescript
import { custom } from '@animaker/core/easing';

// 自定义缓动：快速启动，平滑停止
const fastStartSmoothStop = custom((t) => {
  // 前 70% 快速
  if (t < 0.7) {
    return (t / 0.7) * 0.8;
  }
  // 后 30% 平滑停止
  return 0.8 + ((t - 0.7) / 0.3 * 0.2;
});

// 使用自定义缓动
const anim = new MoveAnimation(obj, target, {
  duration: 2,
  easing: fastStartSmoothStop
});
```

---

## 相关文档

- [核心类型 API](./core.md) - 类型定义
- [动画 API](./animation.md) - 动画接口
- [动画创建入门教程](../guide/animation-basics.md) - 缓动函数教程
