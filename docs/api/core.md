# 核心类型 API

本节介绍 Kinema 框架的核心类型定义。这些类型构成了整个框架的基础，理解它们对于掌握框架至关重要。

## 目录

- [品牌类型](#品牌类型)
- [几何类型](#几何类型)
- [变换类型](#变换类型)
- [渲染对象状态](#渲染对象状态)
- [工具函数](#工具函数)

---

## 品牌类型

Kinema 使用品牌类型（Branded Types）来防止类型混淆，提供编译时的类型安全保证。

### ObjectId

对象的唯一标识符。

```typescript
type ObjectId = string & { readonly __brand: unique symbol };
```

**说明：**

- 用于唯一标识场景中的每个渲染对象
- 字符串类型，但带有类型品牌，不能与其他字符串混淆
- 由 `generateObjectId()` 函数生成

**示例：**

```typescript
import { generateObjectId } from '@kinema/core';

const id: ObjectId = generateObjectId('circle');
console.log(id); // 输出: "circle-1234567890-abc123"
```

### Time

时间值（单位：秒）。

```typescript
type Time = number & { readonly __brand: 'time' };
```

**说明：**

- 表示动画中的时间点或持续时间
- 单位始终为秒
- 用于类型签名中，明确表示时间相关参数

### Alpha

动画进度值 [0, 1]。

```typescript
type Alpha = number & { readonly __brand: 'alpha' };
```

**说明：**

- 表示动画的线性进度，0 表示开始，1 表示结束
- 传递给缓动函数的输入类型
- 缓动函数返回经过缓动处理的 Alpha 值

**示例：**

```typescript
import { smooth } from '@kinema/core/easing';

const progress: Alpha = 0.5 as Alpha;
const eased: Alpha = smooth(progress);
console.log(eased); // 输出缓动后的值
```

---

## 几何类型

### Point3D

三维空间中的点。

```typescript
interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
```

**属性：**

- `x` - X 坐标
- `y` - Y 坐标
- `z` - Z 坐标

**说明：**

- 所有属性都是只读的
- 用于表示位置、方向等
- 在 2D 场景中，z 坐标通常为 0

**示例：**

```typescript
const origin: Point3D = { x: 0, y: 0, z: 0 };
const point: Point3D = { x: 3.5, y: 2.1, z: -1 };

// 创建偏移点
const offset: Point3D = {
  x: origin.x + 1,
  y: origin.y + 2,
  z: origin.z,
};
```

### Point2D

二维空间中的点（便捷类型）。

```typescript
interface Point2D {
  readonly x: number;
  readonly y: number;
}
```

**说明：**

- Point3D 的简化版本，用于 2D 操作
- 提供更好的类型提示
- 可以自动转换为 Point3D

### BoundingBox

对象的轴对齐边界框。

```typescript
interface BoundingBox {
  readonly min: Point3D; // 最小角点
  readonly max: Point3D; // 最大角点
  readonly center: Point3D; // 中心点
}
```

**属性：**

- `min` - 边界框的最小坐标（左下后）
- `max` - 边界框的最大坐标（右上前）
- `center` - 边界框的中心点

**方法：**

- `contains(point: Point3D): boolean` - 检查点是否在边界框内
- `width(): number` - 获取边界框宽度
- `height(): number` - 获取边界框高度
- `depth(): number` - 获取边界框深度

**示例：**

```typescript
import { BoundingBox } from '@kinema/core';

const bbox: BoundingBox = {
  min: { x: -1, y: -1, z: 0 },
  max: { x: 1, y: 1, z: 0 },
  center: { x: 0, y: 0, z: 0 },
};

console.log(bbox.center); // { x: 0, y: 0, z: 0 }
```

---

## 变换类型

### Transform

对象的变换状态。

```typescript
interface Transform {
  readonly position: Point3D; // 位置
  readonly rotation: Point3D; // 旋转（欧拉角，度）
  readonly scale: Point3D; // 缩放
  readonly opacity: number; // 透明度 [0, 1]
}
```

**属性：**

- `position` - 对象在场景中的位置
- `rotation` - 对象绕各轴的旋转角度（度）
  - `x` - 绕 X 轴旋转
  - `y` - 绕 Y 轴旋转
  - `z` - 绕 Z 轴旋转（垂直于屏幕）
- `scale` - 对象的缩放比例
  - `x` - X 方向缩放
  - `y` - Y 方向缩放
  - `z` - Z 方向缩放
- `opacity` - 对象的透明度（0 = 完全透明，1 = 完全不透明）

**默认值：**

```typescript
const DEFAULT_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  opacity: 1,
};
```

**示例：**

```typescript
import { RenderObject } from '@kinema/core';

// 创建一个旋转 45 度、透明度为 0.5 的变换
const transform: Transform = {
  position: { x: 2, y: 3, z: 0 },
  rotation: { x: 0, y: 0, z: 45 },
  scale: { x: 1, y: 1, z: 1 },
  opacity: 0.5,
};

// 应用到对象
const transformed: RenderObject = object.withTransform(transform);
```

---

## 渲染对象状态

### RenderObjectState

渲染对象的完整状态。

```typescript
interface RenderObjectState {
  readonly id: ObjectId; // 唯一标识
  readonly transform: Transform; // 变换状态
  readonly visible: boolean; // 是否可见
  readonly z_index: number; // 渲染顺序
  readonly styles: ReadonlyMap<string, unknown>; // 自定义样式
  readonly parentId?: ObjectId; // 父对象 ID
}
```

**属性说明：**

| 属性        | 类型          | 说明                                 |
| ----------- | ------------- | ------------------------------------ |
| `id`        | `ObjectId`    | 对象的唯一标识符                     |
| `transform` | `Transform`   | 对象的当前变换状态                   |
| `visible`   | `boolean`     | 对象是否可见（不可见对象不参与渲染） |
| `z_index`   | `number`      | 渲染顺序（值越大越靠前）             |
| `styles`    | `ReadonlyMap` | 自定义样式属性（填充色、描边等）     |
| `parentId`  | `ObjectId?`   | 父对象的 ID（用于层次结构）          |

**示例：**

```typescript
import { generateObjectId } from '@kinema/core';

const state: RenderObjectState = {
  id: generateObjectId('my-object'),
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    opacity: 1,
  },
  visible: true,
  z_index: 0,
  styles: new Map([
    ['fillColor', '#3498db'],
    ['strokeWidth', 0.05],
  ]),
};
```

---

## 工具函数

### generateObjectId()

生成唯一对象 ID。

**签名：**

```typescript
function generateObjectId(prefix: string = 'obj'): ObjectId;
```

**参数：**

- `prefix` - ID 前缀，用于标识对象类型

**返回：**

- 唯一的对象 ID

**示例：**

```typescript
import { generateObjectId } from '@kinema/core';

const circleId = generateObjectId('circle');
const rectId = generateObjectId('rectangle');

console.log(circleId); // "circle-1710932400000-abc123"
```

### isValidAlpha()

检查值是否为有效的 Alpha 值。

**签名：**

```typescript
function isValidAlpha(value: number): value is Alpha;
```

**参数：**

- `value` - 要检查的值

**返回：**

- 如果值在 [0, 1] 范围内，返回 `true`

**示例：**

```typescript
import { isValidAlpha } from '@kinema/core';

console.log(isValidAlpha(0.5)); // true
console.log(isValidAlpha(1.5)); // false
console.log(isValidAlpha(-0.1)); // false
```

### clamp()

将值限制在指定范围内。

**签名：**

```typescript
function clamp(value: number, min: number, max: number): number;
```

**参数：**

- `value` - 要限制的值
- `min` - 最小值
- `max` - 最大值

**返回：**

- 限制在 [min, max] 范围内的值

**示例：**

```typescript
import { clamp } from '@kinema/core';

console.log(clamp(0.5, 0, 1)); // 0.5
console.log(clamp(-0.5, 0, 1)); // 0
console.log(clamp(1.5, 0, 1)); // 1

// 限制透明度
const safeOpacity = clamp(opacity, 0, 1);
```

### lerp()

线性插值。

**签名：**

```typescript
function lerp(start: number, end: number, alpha: number): number;
```

**参数：**

- `start` - 起始值
- `end` - 结束值
- `alpha` - 插值进度 [0, 1]

**返回：**

- 插值结果

**示例：**

```typescript
import { lerp } from '@kinema/core';

const result = lerp(0, 100, 0.5); // 50
const position = lerp(start.x, end.x, progress);
```

### lerpPoint()

两点之间的线性插值。

**签名：**

```typescript
function lerpPoint(start: Point3D, end: Point3D, alpha: number): Point3D;
```

**参数：**

- `start` - 起始点
- `end` - 结束点
- `alpha` - 插值进度 [0, 1]

**返回：**

- 插值后的点

**示例：**

```typescript
import { lerpPoint } from '@kinema/core';

const start: Point3D = { x: 0, y: 0, z: 0 };
const end: Point3D = { x: 10, y: 10, z: 0 };
const middle = lerpPoint(start, end, 0.5);

console.log(middle); // { x: 5, y: 5, z: 0 }
```

---

## 类型守卫

### isPoint3D()

检查值是否为 Point3D 类型。

**签名：**

```typescript
function isPoint3D(value: unknown): value is Point3D;
```

**示例：**

```typescript
import { isPoint3D } from '@kinema/core';

const value = { x: 1, y: 2, z: 3 };

if (isPoint3D(value)) {
  console.log('X coordinate:', value.x);
}
```

### isRenderObject()

检查值是否为 RenderObject。

**签名：**

```typescript
function isRenderObject(value: unknown): value is RenderObject;
```

**示例：**

```typescript
import { isRenderObject } from '@kinema/core';

if (isRenderObject(obj)) {
  console.log('Object ID:', obj.getState().id);
}
```

### isAnimation()

检查值是否为 Animation。

**签名：**

```typescript
function isAnimation(value: unknown): value is Animation;
```

---

## 相关文档

- [动画 API](./animation.md) - 动画相关类型和接口
- [场景 API](./scene.md) - 场景管理相关 API
- [缓动函数 API](./easing.md) - 缓动函数完整参考
- [示例集合](../examples/) - 实战示例代码
