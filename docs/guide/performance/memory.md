# 内存管理指南

> 本指南介绍 Kinema 渲染引擎的内存管理最佳实践，帮助您避免内存泄漏并优化内存使用。

## 目录

- [资源释放策略](#资源释放策略)
- [避免内存泄漏](#避免内存泄漏)
- [GC 优化](#gc-优化)
- [内存分析工具](#内存分析工具)

---

## 资源释放策略

### 1. 显式资源释放

所有图形资源都实现了 `Disposable` 接口，使用后必须显式释放。

```typescript
import {
  GraphicsBuffer,
  GraphicsTexture,
  GraphicsShader,
  RenderPipeline,
} from '@kinema/render/graphics';

class ResourceManager {
  private buffers: GraphicsBuffer[] = [];
  private textures: GraphicsTexture[] = [];

  createBuffer(size: number): GraphicsBuffer {
    const buffer = device.createBuffer({ size });
    this.buffers.push(buffer);
    return buffer;
  }

  createTexture(descriptor: TextureDescriptor): GraphicsTexture {
    const texture = device.createTexture(descriptor);
    this.textures.push(texture);
    return texture;
  }

  // 显式释放所有资源
  dispose(): void {
    for (const buffer of this.buffers) {
      buffer.destroy();
    }
    for (const texture of this.textures) {
      texture.destroy();
    }
    this.buffers = [];
    this.textures = [];
  }
}
```

### 2. 使用 WeakRef 管理缓存

对于缓存资源，使用 `WeakRef` 避免阻止垃圾回收。

```typescript
class ResourceCache<T extends { destroy(): void }> {
  private cache = new Map<string, WeakRef<T>>();
  private registry = new FinalizationRegistry((key: string) => {
    this.cache.delete(key);
  });

  get(key: string): T | undefined {
    const ref = this.cache.get(key);
    return ref?.deref();
  }

  set(key: string, value: T): void {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.registry.register(value, key);
  }
}
```

### 3. 分层资源释放

实现分层释放策略，优先释放不重要的资源。

```typescript
import { ResourcePriority } from '@kinema/render/resources';

enum ResourcePriority {
  CRITICAL, // 场景必需资源
  HIGH, // 当前可见资源
  MEDIUM, // 可能可见资源
  LOW, // 不可见资源
}

class PriorityResourceManager {
  private resources = new Map<ResourcePriority, Set<Disposable>>();

  add(resource: Disposable, priority: ResourcePriority): void {
    if (!this.resources.has(priority)) {
      this.resources.set(priority, new Set());
    }
    this.resources.get(priority)!.add(resource);
  }

  // 从低优先级开始释放资源
  freeByPriority(minPriority: ResourcePriority): void {
    for (const priority of [ResourcePriority.LOW, ResourcePriority.MEDIUM, ResourcePriority.HIGH]) {
      if (priority < minPriority) continue;

      const resources = this.resources.get(priority);
      if (resources) {
        for (const resource of resources) {
          resource.destroy();
        }
        resources.clear();
      }
    }
  }
}
```

### 4. 自动资源追踪

使用 `DisposableGroup` 自动管理一组资源。

```typescript
import { DisposableGroup } from '@kinema/utils';

class Scene {
  private resources = new DisposableGroup();

  async load(): Promise<void> {
    // 添加到资源组，自动追踪
    const texture = await this.resources.add(device.createTexture({ size: [512, 512] }));

    const buffer = this.resources.add(device.createBuffer({ size: 1024 }));

    // 当场景销毁时，所有资源自动释放
  }

  dispose(): void {
    this.resources.dispose(); // 一次性释放所有资源
  }
}
```

---

## 避免内存泄漏

### 1. 事件监听器清理

事件监听器是常见的内存泄漏源，必须及时清理。

```typescript
// 不推荐：忘记移除监听器
class AnimationController {
  start() {
    engine.on('update', this.onUpdate);
  }
  // 忘须移除监听器！
}

// 推荐：使用 Disposable 管理监听器
import { EventDisposable } from '@kinema/utils';

class AnimationController {
  private disposables = new DisposableGroup();

  start() {
    this.disposables.add(engine.on('update', this.onUpdate));
  }

  stop() {
    this.disposables.dispose(); // 自动移除所有监听器
  }
}
```

### 2. 闭包捕获

避免闭包捕获大型对象。

```typescript
// 不推荐：闭包捕获大型对象
function createAnimation(scene: LargeScene) {
  return {
    update: () => {
      // 闭包保持对 scene 的引用
      scene.render();
    },
  };
}

// 推荐：只捕获需要的部分
function createAnimation(renderer: Renderer) {
  return {
    update: () => {
      renderer.render(); // 只引用需要的部分
    },
  };
}
```

### 3. 循环引用

循环引用会阻止垃圾回收，使用 WeakMap 打破。

```typescript
// 不推荐：循环引用
class Node {
  children: Node[] = [];
  parent?: Node; // 可能造成循环引用
}

// 推荐：使用 WeakMap 存储父引用
const parentMap = new WeakMap<Node, Node>();

class Node {
  children: Node[] = [];

  setParent(parent: Node): void {
    parentMap.set(this, parent);
  }

  getParent(): Node | undefined {
    return parentMap.get(this);
  }
}
```

### 4. 纹理和缓冲区泄漏

确保纹理和缓冲区被正确释放。

```typescript
class TextureLoader {
  private loadingPromises = new Map<string, Promise<GraphicsTexture>>();

  async load(url: string): Promise<GraphicsTexture> {
    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // 加载纹理
    const promise = device.createTexture_fromImage(url).finally(() => {
      // 加载完成后移除 Promise 引用
      this.loadingPromises.delete(url);
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  cancel(url: string): void {
    this.loadingPromises.delete(url);
  }
}
```

---

## GC 优化

### 1. 减少对象分配

重用对象而不是频繁创建新对象。

```typescript
// 不推荐：每帧创建新对象
class ParticleSystem {
  update() {
    for (const particle of this.particles) {
      const velocity = new Vector3(); // 每帧分配
      particle.position.add(velocity);
    }
  }
}

// 推荐：使用对象池
class ParticleSystem {
  private vectorPool = new ObjectPool<Vector3>({
    factory: () => new Vector3(),
    initialSize: 100,
  });

  update() {
    for (const particle of this.particles) {
      const velocity = this.vectorPool.acquire();
      particle.position.add(velocity);
      this.vectorPool.release(velocity);
    }
  }
}
```

### 2. 避免装箱/拆箱

避免在热路径中使用 `any` 类型。

```typescript
// 不推荐：造成装箱
function process(value: any): void {
  const num = value as number; // 可能装箱
}

// 推荐：使用泛型
function process<T extends number>(value: T): void {
  const num = value; // 无装箱
}
```

### 3. 使用 TypedArray

对于数值数据，使用 TypedArray 而不是普通数组。

```typescript
// 不推荐：普通数组
const vertices: number[] = [];
for (let i = 0; i < 10000; i++) {
  vertices.push(i, i + 1, i + 2);
}

// 推荐：Float32Array
const vertices = new Float32Array(30000);
for (let i = 0; i < 10000; i++) {
  vertices[i * 3] = i;
  vertices[i * 3 + 1] = i + 1;
  vertices[i * 3 + 2] = i + 2;
}
```

**性能对比**:

| 操作 | 普通数组 | Float32Array | 提升 |
| ---- | -------- | ------------ | ---- |
| 创建 | 5ms      | 0.5ms        | 10x  |
| 遍历 | 12ms     | 2ms          | 6x   |
| 内存 | 80KB     | 30KB         | 2.7x |

### 4. 延迟初始化

延迟初始化大型对象，减少启动时的内存压力。

```typescript
class SceneManager {
  private _heavyResource?: HeavyResource;

  get heavyResource(): HeavyResource {
    // 首次访问时才创建
    if (!this._heavyResource) {
      this._heavyResource = new HeavyResource();
    }
    return this._heavyResource;
  }
}
```

---

## 内存分析工具

### 1. Chrome DevTools 内存分析

使用 Chrome DevTools 分析内存使用。

```typescript
// 在开发模式下启用内存分析
if (import.meta.env.DEV) {
  // 定期生成内存快照
  setInterval(() => {
    console.log('Memory:', {
      used: performance.memory.usedJSHeapSize / 1024 / 1024,
      total: performance.memory.totalJSHeapSize / 1024 / 1024,
      limit: performance.memory.jsHeapSizeLimit / 1024 / 1024,
    });
  }, 5000);
}
```

### 2. 使用内置内存追踪

Kinema 提供内置内存追踪工具。

```typescript
import { MemoryTracker } from '@kinema/utils';

const tracker = new MemoryTracker();

// 开始追踪
tracker.start();

// ... 执行操作 ...

// 生成报告
const report = tracker.getReport();
console.log('Memory Report:', {
  allocated: report.allocatedBytes,
  deallocated: report.deallocatedBytes,
  current: report.currentBytes,
  peak: report.peakBytes,
});

// 停止追踪
tracker.stop();
```

### 3. 资源泄漏检测

使用资源泄漏检测工具。

```typescript
import { ResourceLeakDetector } from '@kinema/render/debug';

const detector = new ResourceLeakDetector({
  checkInterval: 10000, // 每 10 秒检查一次
  threshold: 100, // 超过 100 个未释放资源时警告
});

detector.on('leak', (report) => {
  console.warn('Resource leak detected:', report);
});

// 启动检测
detector.start();
```

### 4. 内存分析最佳实践

1. **定期检查** - 每个里程碑都进行内存分析
2. **对比基线** - 与之前的版本对比内存使用
3. **关注趋势** - 关注内存增长趋势，而不仅仅是峰值
4. **真实场景** - 在真实使用场景下测试，而不仅仅是合成测试

```typescript
// 内存分析辅助工具
export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];

  takeSnapshot(label: string): void {
    const snapshot: MemorySnapshot = {
      label,
      timestamp: Date.now(),
      memory: {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
      },
      resources: {
        textures: TextureManager.getActiveCount(),
        buffers: BufferManager.getActiveCount(),
        shaders: ShaderManager.getActiveCount(),
      },
    };
    this.snapshots.push(snapshot);
  }

  compare(from: string, to: string): MemoryDiff {
    const start = this.snapshots.find((s) => s.label === from);
    const end = this.snapshots.find((s) => s.label === to);

    if (!start || !end) {
      throw new Error('Snapshot not found');
    }

    return {
      memoryDelta: end.memory.used - start.memory.used,
      textureDelta: end.resources.textures - start.resources.textures,
      bufferDelta: end.resources.buffers - start.resources.buffers,
      shaderDelta: end.resources.shaders - start.resources.shaders,
    };
  }
}
```

---

## 最佳实践总结

1. **显式释放** - 始终显式释放图形资源
2. **追踪资源** - 使用 DisposableGroup 管理资源生命周期
3. **避免闭包** - 避免闭包捕获大型对象
4. **使用对象池** - 减少频繁的对象分配
5. **定期分析** - 使用工具定期分析内存使用
6. **设置限制** - 设置合理的资源限制

```typescript
// 资源限制配置
const resourceLimits = {
  maxTextures: 1000,
  maxBuffers: 500,
  maxMemoryMB: 512,
};

if (TextureManager.getActiveCount() > resourceLimits.maxTextures) {
  console.warn('Texture limit exceeded, freeing oldest textures');
  TextureManager.freeOldest(TextureManager.getActiveCount() - resourceLimits.maxTextures);
}
```
