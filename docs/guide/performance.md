# 性能优化指南

本指南详细介绍 AniMaker 框架的性能优化策略，帮助你创建流畅、高效的动画。

## 目录

- [性能分析工具](#性能分析工具)
- [渲染优化](#渲染优化)
- [动画优化](#动画优化)
- [内存管理](#内存管理)
- [WebGPU 优化](#webgpu-优化)
- [最佳实践](#最佳实践)

---

## 性能分析工具

### 内置性能监控

AniMaker 提供内置的性能分析工具：

```typescript
import { PerformanceMonitor, createScene } from '@animaker/core';

// 创建性能监控器
const monitor = new PerformanceMonitor({
  // 监控选项
  enableFPS: true,           // 监控帧率
  enableMemory: true,        // 监控内存使用
  enableRenderTime: true,    // 监控渲染时间
  enableObjectCount: true,   // 监控对象数量
  reportInterval: 1000       // 报告间隔（毫秒）
});

// 绑定到场景
const scene = createScene({
  width: 1920,
  height: 1080,
  fps: 60
});

monitor.attach(scene);

// 获取性能报告
const report = monitor.getReport();
console.log('FPS:', report.fps);
console.log('Frame Time:', report.frameTime, 'ms');
console.log('Memory:', report.memory, 'MB');
console.log('Objects:', report.objectCount);
console.log('GPU Memory:', report.gpuMemory, 'MB');

// 启用详细日志
monitor.setLogLevel('debug');

// 添加自定义指标
monitor.addMetric('custom-metric', () => {
  return calculateCustomMetric();
});
```

### 性能分析器

使用性能分析器进行深入分析：

```typescript
import { Profiler } from '@animaker/core';

const profiler = new Profiler();

// 开始性能分析
profiler.start('animation-update');

// 执行动画更新
scene.updateTo(elapsedTime);

// 结束分析
profiler.end('animation-update');

// 获取分析结果
const results = profiler.getResults();
console.log('animation-update:', results['animation-update']);
// 输出: { duration: 2.5ms, calls: 60, avgDuration: 0.042ms }

// 对比分析
profiler.compare('render', 'animation-update');
// 输出: "render 比 animation-update 慢 3.2 倍"

// 生成性能报告
const report = profiler.generateReport();
console.log(report);
```

### 浏览器开发者工具

利用浏览器内置工具：

**Chrome DevTools Performance:**
```typescript
// 标记性能时间点
performance.mark('animation-start');

// 动画逻辑
scene.updateTo(elapsedTime);

performance.mark('animation-end');
performance.measure('animation', 'animation-start', 'animation-end');

// 获取测量结果
const measures = performance.getEntriesByName('animation');
measures.forEach(measure => {
  console.log(`Duration: ${measure.duration}ms`);
});
```

**Memory Profiling:**
```typescript
// 检查内存使用
function checkMemory() {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1024 / 1024;
    const total = performance.memory.totalJSHeapSize / 1024 / 1024;
    const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;

    console.log(`Memory: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB`);
    console.log(`Usage: ${(used / limit * 100).toFixed(1)}%`);
  }
}

// 定期检查
setInterval(checkMemory, 5000);
```

---

## 渲染优化

### 批量渲染

将相同的渲染操作批量处理：

```typescript
// 不好的做法：每个对象单独渲染
objects.forEach(obj => {
  renderer.setFillColor(obj.getColor());
  renderer.render(obj);
});

// 好的做法：按颜色分组批量渲染
const groupedByColor = new Map<string, RenderObject[]>();
objects.forEach(obj => {
  const color = obj.getColor();
  if (!groupedByColor.has(color)) {
    groupedByColor.set(color, []);
  }
  groupedByColor.get(color)!.push(obj);
});

// 批量渲染
groupedByColor.forEach((objs, color) => {
  renderer.setFillColor(color);
  objs.forEach(obj => renderer.render(obj));
});
```

### 视锥剔除

不渲染视野外的对象：

```typescript
class FrustumCuller {
  private bounds: BoundingBox;

  constructor(sceneWidth: number, sceneHeight: number) {
    this.bounds = {
      min: { x: -sceneWidth / 2, y: -sceneHeight / 2, z: 0 },
      max: { x: sceneWidth / 2, y: sceneHeight / 2, z: 0 },
      center: { x: 0, y: 0, z: 0 }
    };
  }

  isVisible(object: RenderObject): boolean {
    const objBounds = object.getBoundingBox();
    return this.intersects(this.bounds, objBounds);
  }

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.max.x < b.min.x || a.min.x > b.max.x ||
      a.max.y < b.min.y || a.min.y > b.max.y ||
      a.max.z < b.min.z || a.min.z > b.max.z
    );
  }
}

// 使用视锥剔除
const culler = new FrustumCuller(1920, 1080);

const visibleObjects = allObjects.filter(obj => culler.isVisible(obj));
renderer.render(visibleObjects);
```

### LOD (Level of Detail)

根据距离使用不同细节级别：

```typescript
interface LODConfig {
  distances: number[];      // 距离阈值
  qualities: number[];      // 对应的质量级别
}

class LODObject implements RenderObject {
  private variants: Map<number, RenderObject>;
  private config: LODConfig;
  private baseState: RenderObjectState;

  constructor(
    variants: RenderObject[],
    config: LODConfig,
    position: Point3D
  ) {
    this.variants = new Map();
    config.qualities.forEach((quality, index) => {
      this.variants.set(quality, variants[index]);
    });
    this.config = config;
    this.baseState = variants[0].getState();
  }

  getVariantForDistance(distance: number): RenderObject {
    for (let i = 0; i < this.config.distances.length; i++) {
      if (distance < this.config.distances[i]) {
        return this.variants.get(this.config.qualities[i])!;
      }
    }
    return this.variants.get(this.config.qualities[this.config.qualities.length - 1])!;
  }

  render(renderer: Renderer, cameraPosition: Point3D): void {
    const distance = this.calculateDistance(cameraPosition);
    const variant = this.getVariantForDistance(distance);
    variant.render(renderer);
  }

  private calculateDistance(point: Point3D): number {
    const dx = point.x - this.baseState.transform.position.x;
    const dy = point.y - this.baseState.transform.position.y;
    const dz = point.z - this.baseState.transform.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// 使用 LOD
const lodObject = new LODObject(
  [
    createHighDetailModel(),    // 高质量模型
    createMediumDetailModel(),  // 中等质量模型
    createLowDetailModel()      // 低质量模型
  ],
  {
    distances: [5, 15],
    qualities: [1.0, 0.5, 0.25]
  },
  { x: 0, y: 0, z: 0 }
);
```

### 减少绘制调用

合并绘制操作：

```typescript
// 使用实例化渲染
class InstancedRenderer {
  renderInstances(objects: RenderObject[], prototype: RenderObject) {
    const instances = objects.map(obj => ({
      position: obj.getState().transform.position,
      rotation: obj.getState().transform.rotation,
      scale: obj.getState().transform.scale
    }));

    // 一次性渲染所有实例
    renderer.renderInstanced(prototype, instances);
  }
}

// 使用纹理图集
class TextureAtlas {
  private regions: Map<string, TextureRegion> = new Map();

  addRegion(name: string, region: TextureRegion) {
    this.regions.set(name, region);
  }

  renderRegion(name: string, position: Point3D) {
    const region = this.regions.get(name);
    if (region) {
      renderer.setTextureSubRect(region);
      renderer.renderAt(position);
    }
  }
}
```

---

## 动画优化

### 避免不必要的计算

缓存计算结果：

```typescript
// 不好的做法：每次都重新计算
class BadAnimation extends Animation {
  interpolate(elapsedTime: number): InterpolationResult {
    const path = this.calculateComplexPath();  // 每次都计算
    // ...
  }
}

// 好的做法：缓存计算结果
class GoodAnimation extends Animation {
  private cachedPath?: Point3D[];

  private getPath(): Point3D[] {
    if (!this.cachedPath) {
      this.cachedPath = this.calculateComplexPath();
    }
    return this.cachedPath;
  }

  interpolate(elapsedTime: number): InterpolationResult {
    const path = this.getPath();  // 使用缓存
    // ...
  }
}
```

### 使用增量更新

只更新变化的部分：

```typescript
class IncrementalAnimator {
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1 / 60;  // 60 FPS

  shouldUpdate(currentTime: number): boolean {
    return currentTime - this.lastUpdateTime >= this.updateInterval;
  }

  update(currentTime: number, scene: Scene): Scene {
    if (!this.shouldUpdate(currentTime)) {
      return scene;  // 跳过更新
    }

    this.lastUpdateTime = currentTime;
    return scene.updateTo(currentTime);
  }
}
```

### 动画合并

合并相似动画：

```typescript
// 不好的做法：多个独立动画
const anim1 = new MoveAnimation(obj, { x: 1, y: 0, z: 0 }, { duration: 1 });
const anim2 = new RotateAnimation(obj, 'z', 90, { duration: 1 });
const anim3 = new ScaleAnimation(obj, { x: 1.5, y: 1.5, z: 1 }, { duration: 1 });

scene.schedule(anim1, 0);
scene.schedule(anim2, 0);
scene.schedule(anim3, 0);

// 好的做法：合并为单个动画
const combined = new AnimationGroup(
  obj,
  [anim1, anim2, anim3],
  CompositionType.Parallel
);

scene.schedule(combined, 0);
```

### 懒加载动画

延迟加载动画资源：

```typescript
class LazyAnimationLoader {
  private cache: Map<string, Animation> = new Map();
  private loaders: Map<string, () => Animation> = new Map();

  register(key: string, loader: () => Animation): void {
    this.loaders.set(key, loader);
  }

  load(key: string): Animation {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const loader = this.loaders.get(key);
    if (!loader) {
      throw new Error(`No loader registered for: ${key}`);
    }

    const animation = loader();
    this.cache.set(key, animation);
    return animation;
  }

  preload(keys: string[]): void {
    keys.forEach(key => this.load(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

// 使用懒加载
const loader = new LazyAnimationLoader();
loader.register('explosion', () => createExplosionAnimation());
loader.register('firework', () => createFireworkAnimation());

// 预加载常用动画
loader.preload(['explosion', 'firework']);
```

---

## 内存管理

### 对象池

复用对象减少 GC 压力：

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  get size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}

// 使用对象池
const particlePool = new ObjectPool(
  () => new Particle(),
  (p) => p.reset(),
  100,  // 初始大小
  500   // 最大大小
);

// 获取粒子
const particle = particlePool.acquire();

// 使用粒子
particle.initialize(position, velocity);

// 释放粒子
particlePool.release(particle);
```

### 内存泄漏检测

检测和修复内存泄漏：

```typescript
class MemoryLeakDetector {
  private snapshots: Map<string, number> = new Map();

  takeSnapshot(name: string): void {
    if (performance.memory) {
      const memory = performance.memory.usedJSHeapSize;
      this.snapshots.set(name, memory);
    }
  }

  compare(name1: string, name2: string): number {
    const mem1 = this.snapshots.get(name1) || 0;
    const mem2 = this.snapshots.get(name2) || 0;
    return mem2 - mem1;
  }

  detectLeaks(): string[] {
    const leaks: string[] = [];
    const keys = Array.from(this.snapshots.keys());

    for (let i = 1; i < keys.length; i++) {
      const diff = this.compare(keys[i - 1], keys[i]);
      if (diff > 1024 * 1024) {  // 超过 1MB
        leaks.push(`${keys[i - 1]} -> ${keys[i]}: +${(diff / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    return leaks;
  }
}

// 使用内存泄漏检测器
const detector = new MemoryLeakDetector();

detector.takeSnapshot('initial');

// 执行操作
runAnimation();

detector.takeSnapshot('after-animation');

// 检查泄漏
const leaks = detector.detectLeaks();
if (leaks.length > 0) {
  console.warn('Memory leaks detected:', leaks);
}
```

### 资源释放

正确释放资源：

```typescript
class ResourceManager {
  private resources: Map<string, { resource: unknown; refCount: number }> = new Map();

  acquire<T>(key: string, factory: () => T): T {
    if (!this.resources.has(key)) {
      this.resources.set(key, {
        resource: factory(),
        refCount: 0
      });
    }

    const entry = this.resources.get(key)!;
    entry.refCount++;
    return entry.resource as T;
  }

  release(key: string): void {
    const entry = this.resources.get(key);
    if (entry) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        // 释放资源
        if (entry.resource instanceof WebGLTexture) {
          // 删除纹理
        } else if (entry.resource instanceof WebGLBuffer) {
          // 删除缓冲区
        }
        this.resources.delete(key);
      }
    }
  }

  getRefCount(key: string): number {
    return this.resources.get(key)?.refCount ?? 0;
  }
}
```

---

## WebGPU 优化

### GPU 内存管理

有效管理 GPU 内存：

```typescript
class WebGPUMemoryManager {
  private buffers: Map<GPUBuffer, number> = new Map();
  private textures: Map<GPUTexture, number> = new Map();

  createBuffer(device: GPUDevice, size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    const buffer = device.createBuffer({
      size,
      usage,
      mappedAtCreation: false
    });

    this.buffers.set(buffer, size);
    return buffer;
  }

  createTexture(device: GPUDevice, descriptor: GPUTextureDescriptor): GPUTexture {
    const texture = device.createTexture(descriptor);

    const size = this.calculateTextureSize(descriptor);
    this.textures.set(texture, size);

    return texture;
  }

  destroyBuffer(buffer: GPUBuffer): void {
    this.buffers.delete(buffer);
    buffer.destroy();
  }

  destroyTexture(texture: GPUTexture): void {
    this.textures.delete(texture);
    texture.destroy();
  }

  getMemoryUsage(): number {
    let total = 0;
    this.buffers.forEach(size => total += size);
    this.textures.forEach(size => total += size);
    return total;
  }

  private calculateTextureSize(descriptor: GPUTextureDescriptor): number {
    const formatSize = this.getFormatSize(descriptor.format);
    const mipLevels = descriptor.mipLevelCount || 1;
    let totalSize = 0;

    for (let level = 0; level < mipLevels; level++) {
      const width = descriptor.size.width >> level;
      const height = descriptor.size.height >> level;
      const depth = descriptor.size.depthOrArrayLayers;
      totalSize += width * height * depth * formatSize;
    }

    return totalSize;
  }

  private getFormatSize(format: GPUTextureFormat): number {
    // 简化的格式大小计算
    switch (format) {
      case 'rgba8unorm':
      case 'rgba8unorm-srgb':
        return 4;
      case 'rgb8unorm':
        return 3;
      case 'r8unorm':
        return 1;
      default:
        return 4;
    }
  }
}
```

### 命令缓冲区优化

优化命令编码：

```typescript
class WebGPUCommandOptimizer {
  private commandBuffers: GPUCommandBuffer[] = [];
  private currentEncoder: GPUCommandEncoder | null = null;

  beginEncoding(device: GPUDevice): GPUCommandEncoder {
    if (!this.currentEncoder) {
      this.currentEncoder = device.createCommandEncoder();
    }
    return this.currentEncoder;
  }

  endEncoding(device: GPUDevice): void {
    if (this.currentEncoder) {
      const commandBuffer = this.currentEncoder.finish();
      this.commandBuffers.push(commandBuffer);
      this.currentEncoder = null;
    }
  }

  submit(device: GPUDevice): void {
    if (this.commandBuffers.length > 0) {
      device.queue.submit(this.commandBuffers);
      this.commandBuffers = [];
    }
  }

  // 批量编码
  encodePass(encoder: GPUCommandEncoder, callback: (pass: GPURenderPassEncoder) => void): void {
    const passEncoder = encoder.beginRenderPass({
      colorAttachments: [{
        view: getCurrentTextureView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    callback(passEncoder);
    passEncoder.end();
  }
}
```

---

## 最佳实践

### 1. 性能检查清单

在部署前检查：

- [ ] 目标帧率稳定（60 FPS 或更高）
- [ ] 内存使用稳定（无持续增长）
- [ ] GPU 内存使用合理
- [ ] 对象数量在可控范围内
- [ ] 绘制调用次数最小化
- [ ] 纹理和着色器已优化
- [ ] 无内存泄漏
- [ ] 移动设备性能可接受

### 2. 性能目标

不同平台的性能目标：

| 平台 | 目标帧率 | 最大对象数 | 最大内存 |
|------|----------|------------|----------|
| 桌面浏览器 | 60 FPS | 1000+ | 500MB |
| 移动浏览器 | 30-60 FPS | 500+ | 200MB |
| 低端设备 | 30 FPS | 200+ | 100MB |

### 3. 优化优先级

按照优先级进行优化：

1. **高优先级（立即处理）**
   - 帧率低于目标
   - 内存泄漏
   - 崩溃或卡顿

2. **中优先级（计划处理）**
   - 内存使用过高
   - 加载时间过长
   - 移动设备性能差

3. **低优先级（可选）**
   - 优化加载几毫秒
   - 减少少量内存使用
   - 代码清理

### 4. 监控策略

持续监控性能：

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples: number = 60;

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    if (values.length > this.maxSamples) {
      values.shift();
    }
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;

    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  getTrend(name: string): 'improving' | 'stable' | 'degrading' {
    const values = this.metrics.get(name);
    if (!values || values.length < 10) return 'stable';

    const firstHalf = values.slice(0, values.length / 2);
    const secondHalf = values.slice(values.length / 2);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = (secondAvg - firstAvg) / firstAvg;

    if (diff < -0.1) return 'improving';
    if (diff > 0.1) return 'degrading';
    return 'stable';
  }

  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      fps: this.getAverage('fps'),
      frameTime: this.getAverage('frameTime'),
      memory: this.getAverage('memory'),
      objectCount: this.getAverage('objectCount'),
      trends: {}
    };

    this.metrics.forEach((_, name) => {
      report.trends[name] = this.getTrend(name);
    });

    return report;
  }
}
```

---

## 相关文档

- [核心类型 API](../api/core.md) - 性能相关类型
- [动画 API](../api/animation.md) - 动画优化 API
- [场景 API](../api/scene.md) - 场景管理 API
- [WebGPU 文档](https://gpuweb.github.io/gpuweb/) - WebGPU 规范
