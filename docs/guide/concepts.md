# 核心概念

深入理解 AniMaker 的核心概念是掌握框架的关键。

## 架构概览

```
┌─────────────────────────────────────┐
│           Application               │
├─────────────────────────────────────┤
│            Animator                 │
│  ┌──────────────────────────────┐  │
│  │         Timeline             │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ │  │
│  │  │Tween │ │Tween │ │Tween │ │  │
│  │  └──────┘ └──────┘ └──────┘ │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│            Renderer                 │
│  ┌──────────┐ ┌──────────┐         │
│  │  Canvas  │ │  WebGL   │ ...     │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│              Scene                  │
└─────────────────────────────────────┘
```

## 渲染器 (Renderer)

渲染器是框架与图形后端的接口层。

### 可用渲染器

| 渲染器 | 用途 | 性能 | 兼容性 |
|--------|------|------|--------|
| CanvasRenderer | 2D 图形 | 中 | 优秀 |
| WebGLRenderer | 2D/3D 图形 | 高 | 良好 |
| SVGRenderer | 矢量图形 | 低 | 优秀 |

### 渲染器接口

```typescript
interface Renderer {
  // 初始化渲染上下文
  initialize(canvas: HTMLCanvasElement): void;

  // 渲染一帧
  render(scene: Scene, deltaTime: number): void;

  // 调整大小
  resize(width: number, height: number): void;

  // 清理资源
  dispose(): void;
}
```

## 动画器 (Animator)

动画器是整个动画系统的核心控制器。

```typescript
const animator = new Animator({
  renderer: new CanvasRenderer(canvas),
  fps: 60,                    // 帧率
  autoPlay: true,             // 自动播放
  loop: false,                // 循环播放
});
```

### 动画器生命周期

```
[Created] → [Playing] ↔ [Paused]
    ↓           ↓
  [Stopped] ← [Ended]
```

## 补间 (Tween)

补间定义了属性值随时间的变化。

### 创建补间

```typescript
const tween = new Tween({
  target: { x: 0, y: 0, rotation: 0 },
  to: { x: 100, y: 100, rotation: 360 },
  duration: 1000,
  easing: 'easeInOutCubic',
  delay: 500,
  onUpdate: (progress) => {
    console.log('Progress:', progress);
  },
});
```

### 缓动函数

AniMaker 提供了丰富的内置缓动函数：

- Linear: `linear`
- Quad: `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- Cubic: `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- Quart: `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- Elastic: `easeOutElastic`, `easeInOutElastic`
- Bounce: `easeOutBounce`, `easeInOutBounce`

## 时间轴 (Timeline)

时间轴用于编排复杂的动画序列。

```typescript
const timeline = new Timeline();

// 序列执行
timeline.sequence([
  tween1,
  tween2,
  tween3,
]);

// 并行执行
timeline.parallel([
  tweenA,
  tweenB,
]);

// 混合编排
timeline.sequence([
  tween1,
  timeline.parallel([tween2, tween3]),
  tween4,
]);
```

## 场景图 (Scene Graph)

场景图管理所有可渲染的对象。

```typescript
const scene = new Scene();

// 添加子节点
const rect = new Rectangle({ width: 100, height: 100 });
scene.add(rect);

// 变换
rect.position.set(200, 200);
rect.rotation = Math.PI / 4;
rect.scale.set(1.5, 1.5);
```

## 插件系统 (Plugin)

插件扩展框架的功能。

```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin';

  install(animator: Animator): void {
    // 插件初始化逻辑
  }

  uninstall(animator: Animator): void {
    // 插件清理逻辑
  }
}

animator.use(new MyPlugin());
```

## 性能优化

### 使用对象池

```typescript
const pool = new ObjectPool(() => new Vector2());

const vec = pool.acquire();
// ... 使用 vec
pool.release(vec);
```

### 批量渲染

```typescript
animator.configure({
  batchRender: true,
  batchSize: 1000,
});
```

### 离屏渲染

```typescript
const offscreenCanvas = document.createElement('canvas');
const offscreenRenderer = new CanvasRenderer(offscreenCanvas);
```
