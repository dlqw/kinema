# 性能问题 FAQ

关于 Kinema 性能优化和调试的常见问题解答。

---

## 如何优化动画性能？

### 问题

我的动画运行不流畅，有哪些优化方法？

### 回答

**性能优化策略：**

### 1. 减少对象数量

```typescript
// ❌ 不好的做法：创建过多对象
for (let i = 0; i < 1000; i++) {
  const circle = VectorObject.circle(0.01);
  scene.addObject(circle);
}

// ✅ 好的做法：使用对象池
class ObjectPool<T> {
  private pool: T[] = [];

  acquire(): T {
    return this.pool.pop() || this.create();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }
}

const pool = new ObjectPool();
for (let i = 0; i < 1000; i++) {
  const circle = pool.acquire();
  // 使用 circle
  // 完成后释放
  pool.release(circle);
}
```

### 2. 批量渲染

```typescript
// ✅ 按类型分组批量渲染
function optimizeRendering(objects: RenderObject[]) {
  // 按颜色分组
  const grouped = new Map<string, RenderObject[]>();
  objects.forEach((obj) => {
    const color = obj.getState().styles.get('fillColor') as string;
    if (!grouped.has(color)) {
      grouped.set(color, []);
    }
    grouped.get(color)!.push(obj);
  });

  // 批量渲染相同颜色的对象
  grouped.forEach((objs, color) => {
    renderer.setFillColor(color);
    objs.forEach((obj) => renderer.render(obj));
  });
}
```

### 3. 使用 LOD (Level of Detail)

```typescript
// 根据距离使用不同细节级别
interface LODObject {
  getVariantForDistance(distance: number): RenderObject;
}

function renderWithLOD(objects: LODObject[], cameraPosition: Point3D) {
  objects.forEach((obj) => {
    const distance = calculateDistance(cameraPosition, obj.getPosition());
    const variant = obj.getVariantForDistance(distance);
    renderer.render(variant);
  });
}
```

### 4. 启用性能监控

```typescript
import { PerformanceMonitor } from '@kinema/core';

const monitor = new PerformanceMonitor({
  enableFPS: true,
  enableMemory: true,
  enableRenderTime: true,
  reportInterval: 1000,
});

monitor.attach(scene);

// 定期检查性能
setInterval(() => {
  const report = monitor.getReport();
  console.log('FPS:', report.fps);
  console.log('Frame Time:', report.frameTime, 'ms');
  console.log('Memory:', report.memory, 'MB');
}, 5000);
```

---

## 为什么我的动画卡顿？

### 问题

动画在播放时出现卡顿或不流畅，是什么原因？

### 回答

**常见原因和解决方案：**

### 1. 帧率过低

**症状：** 动画看起来不连贯，有跳跃感

**解决方案：**

```typescript
// 检查帧率配置
const scene = createScene({
  fps: 60, // 确保使用足够高的帧率
});

// 监控实际帧率
const actualFPS = monitor.getReport().fps;
if (actualFPS < 30) {
  console.warn('帧率过低:', actualFPS);
}
```

### 2. 过多的绘制调用

**症状：** 每帧渲染耗时过长

**解决方案：**

```typescript
// 检查绘制调用次数
console.log('Draw calls:', renderer.getDrawCalls());

// 减少绘制调用
function batchRender(objects: RenderObject[]) {
  renderer.saveState();

  // 批量设置属性
  objects.forEach((obj) => {
    renderer.setTransform(obj.getTransform());
    renderer.render(obj);
  });

  renderer.restoreState();
}
```

### 3. 内存泄漏

**症状：** 随着时间推移性能下降

**解决方案：**

```typescript
// 检测内存泄漏
class MemoryLeakDetector {
  private snapshots: Map<string, number> = new Map();

  takeSnapshot(name: string): void {
    if (performance.memory) {
      this.snapshots.set(name, performance.memory.usedJSHeapSize);
    }
  }

  detectLeaks(): string[] {
    const leaks: string[] = [];
    const keys = Array.from(this.snapshots.keys());

    for (let i = 1; i < keys.length; i++) {
      const diff = this.snapshots.get(keys[i])! - this.snapshots.get(keys[i - 1])!;
      if (diff > 1024 * 1024) {
        // 超过 1MB
        leaks.push(`${keys[i - 1]} -> ${keys[i]}: +${diff / 1024 / 1024}MB`);
      }
    }

    return leaks;
  }
}

// 使用
const detector = new MemoryLeakDetector();
detector.takeSnapshot('initial');

// 运行动画
runAnimation();

detector.takeSnapshot('after-animation');
console.log(detector.detectLeaks());
```

### 4. 主线程阻塞

**症状：** 界面响应缓慢

**解决方案：**

```typescript
// 使用 Web Workers 进行计算
class WorkerManager {
  private worker: Worker;

  constructor(scriptPath: string) {
    this.worker = new Worker(scriptPath);
  }

  async calculate(data: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.postMessage(data);
    });
  }
}

// 使用
const worker = new WorkerManager('/calculation-worker.js');
const result = await worker.calculate(largeDataSet);
```

---

## 如何减少内存使用？

### 问题

我的动画占用内存过多，如何优化？

### 回答

**内存优化技巧：**

### 1. 及时释放资源

```typescript
// ✅ 及时清理不再使用的对象
function cleanupScene(scene: Scene): Scene {
  const objects = scene.getObjects();

  // 移除已完成动画的对象
  const toRemove = objects.filter((obj) => {
    const state = obj.getState();
    return !state.visible || state.transform.opacity <= 0;
  });

  let cleanedScene = scene;
  toRemove.forEach((obj) => {
    cleanedScene = cleanedScene.removeObject(state.id);
  });

  return cleanedScene;
}
```

### 2. 使用对象池

```typescript
// 对象池实现
class ParticlePool {
  private particles: Particle[] = [];
  private maxParticles: number = 100;

  acquire(): Particle {
    return this.particles.pop() || new Particle();
  }

  release(particle: Particle): void {
    if (this.particles.length < this.maxParticles) {
      particle.reset();
      this.particles.push(particle);
    }
  }

  get size(): number {
    return this.particles.length;
  }
}

// 使用
const pool = new ParticlePool();
const particle = pool.acquire();
// 使用 particle
pool.release(particle);
```

### 3. 避免不必要的克隆

```typescript
// ❌ 不好的做法：频繁克隆大对象
function process(obj: LargeObject): LargeObject {
  return obj.clone(); // 每次都创建新副本
}

// ✅ 好的做法：使用不可变更新
function process(obj: LargeObject): LargeObject {
  return obj.withProperty(newValue); // 只更新需要修改的部分
}
```

### 4. 使用纹理图集

```typescript
// 将多个纹理合并为一个
class TextureAtlas {
  private textures: Map<string, TextureRegion> = new Map();

  addRegion(name: string, x: number, y: number, width: number, height: number): void {
    this.textures.set(name, { x, y, width, height });
  }

  getRegion(name: string): TextureRegion | undefined {
    return this.textures.get(name);
  }

  // 使用单个大纹理
  getTexture(): Texture {
    return this.atlasTexture;
  }
}
```

---

## 对象数量有限制吗？

### 问题

Kinema 可以处理多少个对象？有硬性限制吗？

### 回答

**没有硬性限制，但存在性能限制：**

### 推荐对象数量

| 设备级别 | 最大对象数 | 最大动画数 |
| -------- | ---------- | ---------- |
| 高端桌面 | 1000+      | 500+       |
| 中端桌面 | 500+       | 200+       |
| 移动设备 | 200+       | 100+       |
| 低端设备 | 100+       | 50+        |

**性能测试代码：**

```typescript
function benchmarkObjectCount(): void {
  const counts = [100, 500, 1000, 2000, 5000];

  counts.forEach((count) => {
    const scene = createScene();

    // 创建指定数量的对象
    const objects = Array.from({ length: count }, () => VectorObject.circle(0.1));

    scene.addObjects(...objects);

    // 测试性能
    const startTime = performance.now();

    for (let t = 0; t < 5; t += 1 / 60) {
      scene.updateTo(t);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`${count} objects: ${duration.toFixed(2)}ms`);
  });
}
```

**优化建议：**

```typescript
// 1. 使用视锥剔除
function isVisible(object: RenderObject, viewport: BoundingBox): boolean {
  const bbox = object.getBoundingBox();
  return intersects(bbox, viewport);
}

// 2. 使用距离剔除
function isCloseEnough(object: RenderObject, camera: Point3D, maxDistance: number): boolean {
  const distance = calculateDistance(object.getPosition(), camera);
  return distance <= maxDistance;
}

// 3. 使用动态加载
function loadObjectsOnDemand(scene: Scene): void {
  const visibleObjects = objects.filter(
    (obj) => isVisible(obj, currentViewport) && isCloseEnough(obj, cameraPosition, 100),
  );

  scene.clear();
  scene.addObjects(...visibleObjects);
}
```

---

## WebGPU 性能更好吗？

### 问题

WebGPU 渲染器比 Canvas2D 快多少？应该选择哪个？

### 回答

**性能对比：**

| 操作                 | Canvas2D | WebGPU | 提升 |
| -------------------- | -------- | ------ | ---- |
| 简单绘制 (100 对象)  | 5ms      | 2ms    | 2.5x |
| 复杂绘制 (1000 对象) | 50ms     | 10ms   | 5x   |
| 粒子系统 (1000 粒子) | 100ms    | 15ms   | 6.7x |
| 3D 渲染              | 不支持   | 20ms   | N/A  |

**选择建议：**

```typescript
// 1. 自动选择（推荐）
const scene = createScene({
  renderer: 'auto', // 自动选择最佳渲染器
});

// 2. 手动选择 WebGPU
const scene = createScene({
  renderer: 'webgpu',
});

// 3. 手动选择 Canvas2D
const scene = createScene({
  renderer: 'canvas2d',
});
```

**性能测试：**

```typescript
async function benchmarkRenderers(): Promise<void> {
  const scene = createScene();
  const objects = Array.from({ length: 1000 }, () => VectorObject.circle(0.1));

  scene.addObjects(...objects);

  // 测试 WebGPU
  if (await checkWebGPUSupport()) {
    const webgpuRenderer = new WebGPURenderer();
    const webgpuTime = benchmarkRenderer(webgpuRenderer, scene);
    console.log('WebGPU:', webgpuTime, 'ms');
  }

  // 测试 Canvas2D
  const canvas2dRenderer = new Canvas2DRenderer();
  const canvas2dTime = benchmarkRenderer(canvas2dRenderer, scene);
  console.log('Canvas2D:', canvas2dTime, 'ms');
}
```

**优化 WebGPU 性能：**

```typescript
// 1. 使用实例化渲染
renderer.renderInstanced(prototype, instances);

// 2. 使用计算着色器
const computePipeline = device.createComputePipeline({
  compute: {
    module: device.createShaderModule({ code: computeShader }),
    entryPoint: 'main',
  },
});

// 3. 批量更新缓冲区
const stagingBuffer = device.createBuffer({
  size: totalSize,
  mappedAtCreation: true,
});

// 写入数据
new Float32Array(stagingBuffer.getMappedRange()).set(data);
stagingBuffer.unmap();
```

---

## 如何减少初始化时间？

### 问题

Kinema 初始化需要很长时间，如何加快启动速度？

### 回答

**减少初始化时间的方法：**

### 1. 延迟加载资源

```typescript
class LazyResourceManager {
  private resources: Map<string, () => Resource> = new Map();
  private cache: Map<string, Resource> = new Map();

  register(name: string, loader: () => Resource): void {
    this.resources.set(name, loader);
  }

  async get(name: string): Promise<Resource> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const loader = this.resources.get(name);
    if (!loader) {
      throw new Error(`Resource not found: ${name}`);
    }

    const resource = await loader();
    this.cache.set(name, resource);
    return resource;
  }
}

// 使用
const resources = new LazyResourceManager();
resources.register('explosion', () => createExplosionTexture());
resources.register('firework', () => createFireworkTexture());

// 需要时才加载
const explosion = await resources.get('explosion');
```

### 2. 预编译着色器

```typescript
// 预编译着色器模块
const shaderCache = new Map<string, GPUShaderModule>();

async function getShaderModule(device: GPUDevice, code: string): Promise<GPUShaderModule> {
  if (shaderCache.has(code)) {
    return shaderCache.get(code)!;
  }

  const module = device.createShaderModule({ code });
  shaderCache.set(code, module);
  return module;
}
```

### 3. 使用 Web Workers

```typescript
// 在 Worker 中预处理数据
const worker = new Worker('/preprocessing-worker.js');

worker.postMessage({ type: 'initialize', data: largeDataSet });

worker.onmessage = (e) => {
  if (e.data.type === 'ready') {
    // 数据已准备好，可以快速初始化
    initializeScene(e.data.processedData);
  }
};
```

### 4. 分步初始化

```typescript
async function initializeSceneGradually(): Promise<void> {
  // 第 1 步：创建场景
  const scene = createScene();

  // 第 2 步：添加基础对象
  const baseObjects = await loadBaseObjects();
  scene.addObjects(...baseObjects);

  // 第 3 步：加载纹理
  const textures = await loadTexturesAsync();

  // 第 4 步：创建动画
  const animations = await createAnimationsAsync();

  // 第 5 步：开始渲染
  startRendering(scene);
}
```

---

## 相关文档

- [性能优化指南](../guide/performance.md) - 详细性能优化指南
- [一般问题 FAQ](./general.md) - 基础问题解答
- [渲染问题 FAQ](./rendering.md) - 渲染相关问题
- [故障排除 FAQ](./troubleshooting.md) - 故障排除指南
