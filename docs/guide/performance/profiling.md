# 性能分析指南

> 本指南介绍如何使用各种工具分析 Kinema 渲染引擎的性能，识别瓶颈并进行优化。

## 目录

- [使用 Chrome DevTools](#使用-chrome-devtools)
- [帧率监控](#帧率监控)
- [性能瓶颈识别](#性能瓶颈识别)
- [内置分析工具](#内置分析工具)

---

## 使用 Chrome DevTools

### 1. Performance 面板

Chrome DevTools 的 Performance 面板是最强大的性能分析工具。

#### 开始录制

1. 打开 Chrome DevTools (F12)
2. 切换到 Performance 面板
3. 点击 "Record" 按钮
4. 执行要分析的操作
5. 点击 "Stop" 停止录制

#### 分析结果

录制完成后，你会看到时间线视图：

```
Main Thread (主线程)
├── Animation Frame (动画帧)
│   ├── Script (脚本执行)
│   ├── Rendering (渲染)
│   └── Painting (绘制)
├── Composite (合成)
└── Idle (空闲)
```

**关注指标**:

- **FPS** - 帧率，目标 60 FPS (16.67ms/帧)
- **Script** - 脚本执行时间
- **Rendering** - 渲染时间
- **Painting** - 绘制时间

### 2. Memory 面板

内存面板用于分析内存使用和泄漏。

#### 内存快照

```typescript
// 在代码中标记内存快照点
console.log('=== Taking snapshot ===');
console.log('Memory:', performance.memory);

// 执行操作
// ...

console.log('=== After operation ===');
console.log('Memory:', performance.memory);
```

#### 分析内存泄漏

1. 在操作前拍摄堆快照
2. 执行操作
3. 在操作后拍摄堆快照
4. 对比两个快照，查找未释放的对象

### 3. Rendering 面板

Rendering 面板专门用于分析渲染性能。

#### 启用渲染指标

```typescript
// 在开发模式下显示 FPS 计数器
if (import.meta.env.DEV) {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb
  document.body.appendChild(stats.dom);

  // 在渲染循环中更新
  function animate() {
    stats.begin();
    // ... 渲染代码 ...
    stats.end();
    requestAnimationFrame(animate);
  }
  animate();
}
```

#### 关键指标

- **FPS** - 当前帧率
- **Frame Time** - 帧时间
- **GPU Memory** - GPU 内存使用

---

## 帧率监控

### 1. 内置帧率监控

Kinema 提供内置的帧率监控工具。

```typescript
import { RenderEngine, RenderStats } from '@kinema/render/core';

// 创建渲染引擎
const engine = await RenderEngine.init({
  // ... 配置
});

// 获取统计信息
const stats = engine.getStats();

// 每秒打印一次统计信息
setInterval(() => {
  console.log('=== Render Stats ===');
  console.log('FPS:', stats.fps);
  console.log('Frame Time:', stats.frameTime.toFixed(2), 'ms');
  console.log('Draw Calls:', stats.drawCalls);
  console.log('Triangles:', stats.triangles);
  console.log('Vertices:', stats.vertices);
  console.log('Textures:', stats.textureCount);
  console.log('Buffers:', stats.bufferCount);
}, 1000);
```

### 2. 自定义帧率监控器

创建自定义的帧率监控器。

```typescript
class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;

  update(): void {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;

      this.onFPSUpdate(this.fps);
    }
  }

  onFPSUpdate(fps: number): void {
    console.log(`FPS: ${fps}`);
    if (fps < 55) {
      console.warn('Low FPS detected!');
    }
  }
}

// 使用监控器
const monitor = new FPSMonitor();

function animate() {
  monitor.update();
  // ... 渲染代码 ...
  requestAnimationFrame(animate);
}
```

### 3. 帧时间分析

分析帧时间分布，识别性能波动。

```typescript
class FrameTimeAnalyzer {
  private frameTimes: number[] = [];
  private maxSamples = 300; // 保存 5 秒数据 (60 FPS)

  recordFrame(duration: number): void {
    this.frameTimes.push(duration);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getAnalysis(): FrameTimeAnalysis {
    if (this.frameTimes.length === 0) {
      return { avg: 0, min: 0, max: 0, std: 0 };
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    const avg = sum / this.frameTimes.length;
    const min = Math.min(...this.frameTimes);
    const max = Math.max(...this.frameTimes);

    // 计算标准差
    const variance =
      this.frameTimes.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
      this.frameTimes.length;
    const std = Math.sqrt(variance);

    return { avg, min, max, std };
  }

  getPercentile(percentile: number): number {
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[index];
  }
}

// 使用分析器
const analyzer = new FrameTimeAnalyzer();

function animate() {
  const start = performance.now();

  // ... 渲染代码 ...

  const duration = performance.now() - start;
  analyzer.recordFrame(duration);

  // 每秒打印分析
  if (Math.random() < 0.016) {
    // 约 1/60 概率
    const analysis = analyzer.getAnalysis();
    console.log('Frame Time:', analysis);
    console.log('99th percentile:', analyzer.getPercentile(0.99));
  }

  requestAnimationFrame(animate);
}
```

---

## 性能瓶颈识别

### 1. CPU 瓶颈

**症状**:

- 低 FPS，帧时间高
- 脚本执行时间长
- 主线程繁忙

**诊断**:

```typescript
import { Profiler } from '@kinema/utils';

const profiler = new Profiler();

// 分析函数执行时间
profiler.profile('sceneUpdate', () => {
  scene.update(deltaTime);
});

profiler.profile('culling', () => {
  culler.cull(objects, camera);
});

profiler.profile('batching', () => {
  batches = batchingManager.createBatches(culledObjects);
});

// 打印分析结果
console.log(profiler.getReport());
```

**输出示例**:

```
Profile Report:
┌─────────────┬──────────┬──────────┬─────────┐
│ Function    │ Calls    │ Total ms │ Avg ms  │
├─────────────┼──────────┼──────────┼─────────┤
│ sceneUpdate │ 1000     │ 250      │ 0.25    │
│ culling     │ 1000     │ 150      │ 0.15    │
│ batching    │ 1000     │ 400      │ 0.40    │ ← 瓶颈
└─────────────┴──────────┴──────────┴─────────┘
```

### 2. GPU 瓶颈

**症状**:

- 低 FPS，但脚本执行时间短
- GPU 时间高
- 绘制调用多

**诊断**:

```typescript
// 使用 GPU 计时器 (WebGPU)
import { GPUProfiler } from '@kinema/render/debug';

const gpuProfiler = new GPUProfiler(device);

// 创建查询集
const queries = gpuProfiler.createQuerySet(10);

// 记录 GPU 时间
gpuProfiler.beginQuery(queries, 0);
renderScene();
gpuProfiler.endQuery(queries, 0);

// 读取结果
const gpuTime = await gpuProfiler.getTime(queries, 0);
console.log('GPU Time:', gpuTime, 'ns');
```

**常见 GPU 瓶颈**:

- 过多的绘制调用
- 过大的纹理
- 复杂的着色器
- 过度绘制 (Overdraw)

### 3. 内存瓶颈

**症状**:

- 频繁 GC 暂停
- 内存持续增长
- 页面卡顿

**诊断**:

```typescript
class MemoryMonitor {
  private lastMemory = performance.memory;

  check(): void {
    const currentMemory = performance.memory;
    const delta = currentMemory.usedJSHeapSize - this.lastMemory.usedJSHeapSize;

    console.log('Memory Delta:', (delta / 1024 / 1024).toFixed(2), 'MB');

    if (delta > 10 * 1024 * 1024) {
      // 增长超过 10MB
      console.warn('Large memory increase detected!');
      console.trace('Call stack:');
    }

    this.lastMemory = currentMemory;
  }
}

// 定期检查
const memoryMonitor = new MemoryMonitor();
setInterval(() => memoryMonitor.check(), 5000);
```

---

## 内置分析工具

### 1. 性能分析器

Kinema 提供内置的性能分析器。

```typescript
import { PerformanceAnalyzer } from '@kinema/render/debug';

const analyzer = new PerformanceAnalyzer();

// 启用分析
analyzer.enable();

// ... 运行场景 ...

// 生成报告
const report = analyzer.generateReport();

console.log('=== Performance Report ===');
console.log('Average FPS:', report.averageFPS);
console.log('Frame Time:', {
  avg: report.frameTime.average,
  min: report.frameTime.min,
  max: report.frameTime.max,
  p95: report.frameTime.percentile95,
});
console.log('GPU Time:', {
  avg: report.gpuTime.average,
  max: report.gpuTime.max,
});
console.log('Draw Calls:', {
  avg: report.drawCalls.average,
  max: report.drawCalls.max,
});

// 找出瓶颈
const bottlenecks = analyzer.identifyBottlenecks();
console.log('Bottlenecks:', bottlenecks);
```

### 2. 渲染诊断

启用渲染诊断信息。

```typescript
import { RenderEngine } from '@kinema/render/core';

const engine = await RenderEngine.init({
  // ... 配置
  enableDebugMarkers: true,
  enableValidation: true,
});

// 启用诊断覆盖层
engine.setDiagnosticsEnabled(true);

// 配置显示内容
engine.setDiagnosticsOptions({
  showFPS: true,
  showFrameTime: true,
  showDrawCalls: true,
  showMemory: true,
  showGPUStats: true,
});
```

### 3. 性能阈值警告

设置性能阈值，自动警告性能问题。

```typescript
import { PerformanceMonitor } from '@kinema/render/debug';

const monitor = new PerformanceMonitor({
  minFPS: 55,
  maxFrameTime: 20, // ms
  maxDrawCalls: 100,
  maxGPUTime: 10, // ms
});

monitor.on('warning', (warning) => {
  console.warn('Performance Warning:', warning);
  switch (warning.type) {
    case 'low-fps':
      console.warn('FPS dropped below threshold');
      break;
    case 'high-frame-time':
      console.warn('Frame time too high');
      break;
    case 'too-many-draw-calls':
      console.warn('Too many draw calls, consider batching');
      break;
    case 'high-gpu-time':
      console.warn('GPU time too high');
      break;
  }
});

// 每帧检查
function animate() {
  monitor.update(stats);
  // ... 渲染代码 ...
  requestAnimationFrame(animate);
}
```

### 4. 性能对比工具

对比不同配置的性能。

```typescript
import { PerformanceComparator } from '@kinema/render/debug';

const comparator = new PerformanceComparator();

// 测试配置 A
await comparator.test(
  'Config A',
  async () => {
    // 使用配置 A 渲染
  },
  {
    duration: 5000, // 测试 5 秒
    warmup: 1000, // 预热 1 秒
  },
);

// 测试配置 B
await comparator.test(
  'Config B',
  async () => {
    // 使用配置 B 渲染
  },
  {
    duration: 5000,
    warmup: 1000,
  },
);

// 生成对比报告
const comparison = comparator.compare('Config A', 'Config B');

console.log('=== Performance Comparison ===');
console.log('FPS:', comparison.fps.diff, comparison.fps.improvement);
console.log('Frame Time:', comparison.frameTime.diff, comparison.frameTime.improvement);
console.log('Draw Calls:', comparison.drawCalls.diff, comparison.drawCalls.improvement);
console.log('GPU Time:', comparison.gpuTime.diff, comparison.gpuTime.improvement);
```

---

## 性能优化流程

### 1. 测量 → 分析 → 优化 → 验证

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ 测量   │ ──→ │ 分析   │ ──→ │ 优化   │ ──→ │ 验证   │
│ Baseline│     │ 瓶颈   │     │ 实现   │     │ 对比   │
└────────┘     └────────┘     └────────┘     └────────┘
     ↑                                              │
     └──────────────── 必要时重复 ───────────────────┘
```

### 2. 优化检查清单

- [ ] 测量基线性能
- [ ] 识别主要瓶颈 (CPU/GPU/内存)
- [ ] 应用针对性优化
- [ ] 验证优化效果
- [ ] 确保没有引入新问题
- [ ] 更新文档和注释

### 3. 性能目标

根据目标平台设定合理的性能目标。

| 平台     | 目标 FPS | 最大帧时间 | 最大绘制调用 |
| -------- | -------- | ---------- | ------------ |
| 桌面     | 60       | 16.67ms    | 100          |
| 移动高端 | 60       | 16.67ms    | 50           |
| 移动低端 | 30       | 33.33ms    | 30           |

---

## 最佳实践总结

1. **先测量后优化** - 始终基于数据做优化决策
2. **关注瓶颈** - 优化最大的瓶颈而非所有地方
3. **验证效果** - 每次优化后验证实际效果
4. **持续监控** - 在开发过程中持续监控性能
5. **设置目标** - 根据目标平台设定合理的性能目标

```typescript
// 性能监控最佳实践
export class PerformanceGuard {
  private readonly targetFPS = 60;
  private readonly maxFrameTime = 16.67;

  check(stats: RenderStats): void {
    const fps = stats.fps;
    const frameTime = stats.frameTime;

    if (fps < this.targetFPS * 0.9) {
      console.warn(`FPS ${fps} below 90% target`);
    }

    if (frameTime > this.maxFrameTime * 1.2) {
      console.warn(`Frame time ${frameTime.toFixed(2)}ms exceeds 120% target`);
    }

    // 记录用于后续分析
    this.record(stats);
  }

  private record(stats: RenderStats): void {
    // 存储用于趋势分析
  }
}
```
