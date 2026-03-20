# 场景 API

本节介绍 AniMaker 框架的场景管理 API。Scene 是动画的容器和编排器，负责管理对象和动画的播放。

## 目录

- [Scene 类](#scene-类)
- [SceneConfig](#sceneconfig)
- [SceneBuilder](#scenebuilder)
- [辅助函数](#辅助函数)

---

## Scene 类

Scene 是动画系统的核心容器，管理所有渲染对象和动画播放。

### 类签名

```typescript
class Scene {
  constructor(
    public readonly config: SceneConfig,
    public readonly id: string
  )
}
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `config` | `SceneConfig` | 场景配置（只读） |
| `id` | `string` | 场景唯一标识符 |

### 方法

#### getObject()

通过 ID 获取对象。

```typescript
getObject(id: ObjectId): RenderObject | undefined
```

**参数：**
- `id` - 对象 ID

**返回：**
- 对象实例，如果不存在返回 `undefined`

**示例：**
```typescript
const obj = scene.getObject('circle-123');
if (obj) {
  console.log('Found:', obj.getState().transform);
}
```

#### getObjects()

获取场景中的所有对象（按 z-index 排序）。

```typescript
getObjects(): ReadonlyArray<RenderObject>
```

**返回：**
- 排序后的对象数组

**示例：**
```typescript
const objects = scene.getObjects();
objects.forEach(obj => {
  console.log(`${obj.getState().id}: z-index=${obj.getState().z_index}`);
});
```

#### addObject()

添加对象到场景。

```typescript
addObject(object: RenderObject): Scene
```

**参数：**
- `object` - 要添加的对象

**返回：**
- 新的 Scene 实例（不可变更新）

**示例：**
```typescript
let scene = createScene();
const circle = VectorObject.circle(1, { x: 0, y: 0, z: 0 });

scene = scene.addObject(circle);
```

#### addObjects()

添加多个对象到场景。

```typescript
addObjects(...objects: RenderObject[]): Scene
```

**参数：**
- `objects` - 要添加的对象列表

**返回：**
- 新的 Scene 实例

**示例：**
```typescript
const circle = VectorObject.circle(1, { x: 0, y: 0, z: 0 });
const rect = VectorObject.rectangle(2, 1, { x: 2, y: 0, z: 0 });

scene = scene.addObjects(circle, rect);
```

#### removeObject()

从场景移除对象。

```typescript
removeObject(objectId: ObjectId): Scene
```

**参数：**
- `objectId` - 要移除的对象 ID

**返回：**
- 新的 Scene 实例

**示例：**
```typescript
const obj = scene.getObjects()[0];
scene = scene.removeObject(obj.getState().id);
```

#### removeObjects()

批量移除对象。

```typescript
removeObjects(...objectIds: ObjectId[]): Scene
```

**示例：**
```typescript
const objects = scene.getObjects();
const ids = objects.map(o => o.getState().id);
scene = scene.removeObjects(...ids);
```

#### clear()

清空场景中的所有对象。

```typescript
clear(): Scene
```

**返回：**
- 新的空 Scene 实例

**示例：**
```typescript
scene = scene.clear();
console.log(scene.getObjects().length); // 0
```

#### schedule()

调度动画到时间线。

```typescript
schedule(animation: Animation, delay?: number): Scene
```

**参数：**
- `animation` - 要调度的动画
- `delay` - 开始延迟（秒），默认 0

**返回：**
- 新的 Scene 实例

**示例：**
```typescript
const fadeIn = new FadeInAnimation(circle, { duration: 1 });
const move = new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, { duration: 2 });

// 立即播放淡入
scene = scene.schedule(fadeIn, 0);

// 淡入完成后移动
scene = scene.schedule(move, 1);
```

#### scheduleAll()

调度多个动画同时开始。

```typescript
scheduleAll(animations: ReadonlyArray<Animation>, delay?: number): Scene
```

**参数：**
- `animations` - 动画数组
- `delay` - 开始延迟

**返回：**
- 新的 Scene 实例

**示例：**
```typescript
scene = scene.scheduleAll([
  new FadeInAnimation(circle, { duration: 1 }),
  new FadeInAnimation(rect, { duration: 1 }),
  new FadeInAnimation(triangle, { duration: 1 })
], 0);
```

#### getTime()

获取场景当前时间。

```typescript
getTime(): number
```

**返回：**
- 当前时间（秒）

#### updateTo()

将场景更新到指定时间点。

```typescript
updateTo(targetTime: number): Scene
```

**参数：**
- `targetTime` - 目标时间（秒）

**返回：**
- 更新后的 Scene 实例

**示例：**
```typescript
// 获取第 1 秒的场景状态
const frame1 = scene.updateTo(1.0);

// 获取第 2 秒的场景状态
const frame2 = scene.updateTo(2.0);

// 渲染每一帧
for (let t = 0; t <= totalDuration; t += 1/fps) {
  const frame = scene.updateTo(t);
  renderer.render(frame);
}
```

#### createSnapshot()

创建场景快照。

```typescript
createSnapshot(): SceneSnapshot
```

**返回：**
- 场景快照对象

#### restoreFromSnapshot()

从快照恢复场景。

```typescript
restoreFromSnapshot(snapshot: SceneSnapshot): Scene
```

**参数：**
- `snapshot` - 要恢复的快照

**返回：**
- 恢复后的 Scene 实例

**示例：**
```typescript
// 保存状态
const snapshot = scene.createSnapshot();

// ...做一些修改 ...

// 恢复状态
scene = scene.restoreFromSnapshot(snapshot);
```

#### findObjectsAtPoint()

查找包含指定点的所有对象。

```typescript
findObjectsAtPoint(point: Point3D): ReadonlyArray<RenderObject>
```

**参数：**
- `point` - 要检查的点

**返回：**
- 包含该点的对象数组（按 z-index 排序，最前面的最后）

#### getObjectAtPoint()

获取包含指定点的最顶层对象。

```typescript
getObjectAtPoint(point: Point3D): RenderObject | undefined
```

---

## SceneConfig

场景配置接口。

```typescript
interface SceneConfig {
  readonly width: number;               // 场景宽度（像素）
  readonly height: number;              // 场景高度（像素）
  readonly backgroundColor?: string;    // 背景色
  readonly fps: number;                 // 帧率
}
```

### 默认配置

```typescript
const DEFAULT_SCENE_CONFIG: SceneConfig = {
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  fps: 60
};
```

### 示例

```typescript
import { createScene } from '@animaker/core';

// 使用默认配置
const scene1 = createScene();

// 自定义配置
const scene2 = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  fps: 30
});

// 全高清配置
const scene3 = createScene({
  width: 3840,
  height: 2160,
  backgroundColor: '#000000',
  fps: 60
});
```

---

## SceneBuilder

场景构建器，提供流式 API 创建场景。

### 类签名

```typescript
class SceneBuilder {
  constructor()
}
```

### 方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `withDimensions(width, height)` | 宽度、高度 | `SceneBuilder` | 设置场景尺寸 |
| `withBackgroundColor(color)` | 背景色 | `SceneBuilder` | 设置背景颜色 |
| `withFps(fps)` | 帧率 | `SceneBuilder` | 设置帧率 |
| `build(id?)` | 可选 ID | `Scene` | 构建场景实例 |

### 示例

```typescript
import { sceneBuilder } from '@animaker/core';

const scene = sceneBuilder()
  .withDimensions(1920, 1080)
  .withBackgroundColor('#1a1a2e')
  .withFps(60)
  .build();

// 等价于
const scene = createScene({
  width: 1920,
  height: 1080,
  backgroundColor: '#1a1a2e',
  fps: 60
});
```

---

## 辅助函数

### createScene()

创建新场景的便捷函数。

```typescript
function createScene(config?: Partial<SceneConfig>): Scene
```

**参数：**
- `config` - 部分配置（与默认配置合并）

**返回：**
- 新的 Scene 实例

**示例：**
```typescript
import { createScene } from '@animaker/core';

// 使用默认配置
const scene1 = createScene();

// 部分自定义
const scene2 = createScene({
  width: 1280,
  height: 720
});

// 完全自定义
const scene3 = createScene({
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  fps: 60
});
```

### sceneBuilder()

创建场景构建器。

```typescript
function sceneBuilder(): SceneBuilder
```

---

## SceneSnapshot

场景快照接口。

```typescript
interface SceneSnapshot {
  readonly time: number;                           // 快照时间
  readonly objects: ReadonlyArray<RenderObject>; // 对象列表
  readonly metadata?: ReadonlyMap<string, unknown>; // 元数据
}
```

**用途：**
- 保存场景状态
- 实现撤销/重做功能
- 缓存场景状态

---

## 使用示例

### 创建完整动画场景

```typescript
import {
  createScene,
  VectorObject
} from '@animaker/core';
import {
  FadeInAnimation,
  MoveAnimation,
  RotateAnimation
} from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

// 1. 创建场景
const scene = createScene({
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  fps: 60
});

// 2. 创建对象
const circle = VectorObject.circle(
  0.5,
  { x: -2, y: 0, z: 0 },
  { color: '#3498db', width: 0.05 },
  { color: '#2980b9', opacity: 1 }
);

// 3. 添加到场景
let currentScene = scene.addObject(circle);

// 4. 创建动画
const fadeIn = new FadeInAnimation(circle, {
  duration: 1,
  easing: smooth
});

const moveRight = new MoveAnimation(circle, {
  x: 2,
  y: 0,
  z: 0
}, {
  duration: 2,
  easing: smooth
});

const rotate = new RotateAnimation(circle, 'z', 360, {
  duration: 2,
  easing: smooth
});

// 5. 调度动画
currentScene = currentScene.schedule(fadeIn, 0);
currentScene = currentScene.schedule(moveRight, 1);
currentScene = currentScene.schedule(rotate, 1);

// 6. 渲染帧
const fps = currentScene.config.fps;
const duration = 3; // 总时长
for (let t = 0; t <= duration; t += 1/fps) {
  const frame = currentScene.updateTo(t);
  renderer.render(frame.getObjects());
}
```

### 交互式场景更新

```typescript
// 每次更新都返回新实例
let scene = createScene().addObject(circle);

// 添加动画
scene = scene.schedule(fadeIn, 0);
scene = scene.schedule(move, 1);
scene = scene.schedule(rotate, 1);

// 更新到不同时间点
const frame1 = scene.updateTo(0.5);
const frame2 = frame1.updateTo(1.0);
const frame3 = frame2.updateTo(2.0);

// 注意：每个 updateTo 都返回新实例
// 原始 scene 保持不变
```

---

## 相关文档

- [核心类型 API](./core.md) - 基础类型定义
- [动画 API](./animation.md) - 动画类型和接口
- [示例集合](../examples/) - 实战示例代码
