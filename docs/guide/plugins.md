# 插件开发指南

AniMaker 采用插件化架构，允许开发者扩展框架功能。本指南将详细介绍如何创建、测试和发布插件。

## 目录

- [插件基础](#插件基础)
- [创建插件](#创建插件)
- [插件类型](#插件类型)
- [插件钩子](#插件钩子)
- [插件配置](#插件配置)
- [插件调试](#插件调试)
- [发布插件](#发布插件)

---

## 插件基础

### Plugin 接口

每个插件都需要实现 `Plugin` 接口：

```typescript
interface Plugin {
  // 插件名称（唯一标识）
  name: string;

  // 插件版本
  version?: string;

  // 安装插件时调用
  install(scene: Scene, config?: PluginConfig): void;

  // 卸载插件时调用
  uninstall(scene: Scene): void;

  // 可选：插件配置
  config?: PluginConfig;

  // 可选：插件依赖
  dependencies?: string[];
}

interface PluginConfig {
  [key: string]: unknown;
}
```

## 创建一个简单插件

```typescript
import { Plugin, Animator } from '@animaker/core';

// 定义插件配置
interface LoggerPluginConfig {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logTiming?: boolean;
}

// 实现插件
class LoggerPlugin implements Plugin {
  name = 'logger';
  version = '1.0.0';

  private config: Required<LoggerPluginConfig>;

  constructor(config: LoggerPluginConfig = {}) {
    this.config = {
      logLevel: config.logLevel || 'info',
      logTiming: config.logTiming ?? true,
    };
  }

  install(animator: Animator): void {
    // 监听动画事件
    animator.on('play', () => this.log('Animation started'));
    animator.on('pause', () => this.log('Animation paused'));
    animator.on('stop', () => this.log('Animation stopped'));
    animator.on('complete', () => this.log('Animation completed'));

    // 监听帧事件
    if (this.config.logTiming) {
      animator.on('frame', (deltaTime) => {
        this.log(`Frame time: ${deltaTime.toFixed(2)}ms`, 'debug');
      });
    }
  }

  uninstall(animator: Animator): void {
    // 清理事件监听
    animator.off('play');
    animator.off('pause');
    animator.off('stop');
    animator.off('complete');
    animator.off('frame');
  }

  private log(message: string, level?: string): void {
    const logLevel = level || this.config.logLevel;
    console[logLevel](`[LoggerPlugin] ${message}`);
  }
}

// 使用插件
const animator = new Animator({ renderer });
animator.use(new LoggerPlugin({ logLevel: 'debug' }));
```

## 插件类型

### 1. 渲染插件

扩展渲染能力：

```typescript
class BlurRendererPlugin implements Plugin {
  name = 'blur-renderer';

  install(animator: Animator): void {
    const renderer = animator.renderer;

    // 添加模糊渲染方法
    renderer.renderWithBlur = (scene: Scene, radius: number) => {
      // 模糊渲染逻辑
    };
  }

  uninstall(animator: Animator): void {
    delete animator.renderer.renderWithBlur;
  }
}
```

### 2. 补间插件

添加新的补间类型：

```typescript
class PhysicsTweenPlugin implements Plugin {
  name = 'physics-tween';

  install(animator: Animator): void {
    // 注册自定义补间类型
    Tween.registerType('physics', PhysicsTween);
  }

  uninstall(animator: Animator): void {
    Tween.unregisterType('physics');
  }
}

// 使用自定义补间
const physicsTween = new Tween({
  type: 'physics',
  velocity: { x: 10, y: 20 },
  acceleration: { x: 0, y: 9.8 },
});
```

### 3. 效果插件

添加视觉效果：

```typescript
class ParticleEffectPlugin implements Plugin {
  name = 'particle-effect';

  private particles: Particle[] = [];

  install(animator: Animator): void {
    // 注册粒子系统
    animator.effects.particle = this.createParticle.bind(this);

    // 每帧更新粒子
    animator.on('beforeRender', () => {
      this.updateParticles();
    });
  }

  private createParticle(config: ParticleConfig): Particle {
    const particle = new Particle(config);
    this.particles.push(particle);
    return particle;
  }

  private updateParticles(): void {
    // 更新粒子逻辑
  }

  uninstall(animator: Animator): void {
    delete animator.effects.particle;
    animator.off('beforeRender');
    this.particles = [];
  }
}
```

### 4. 导出插件

支持导出动画：

```typescript
class GIFExportPlugin implements Plugin {
  name = 'gif-export';

  install(animator: Animator): void {
    animator.export.gif = async (options: ExportOptions) => {
      // GIF 导出逻辑
    };
  }

  uninstall(animator: Animator): void {
    delete animator.export.gif;
  }
}
```

## 插件钩子

AniMaker 提供了丰富的钩子函数：

| 钩子 | 触发时机 | 用途 |
|------|----------|------|
| `install` | 插件安装时 | 初始化插件 |
| `uninstall` | 插件卸载时 | 清理资源 |
| `beforeInit` | 动画器初始化前 | 配置动画器 |
| `afterInit` | 动画器初始化后 | 访问动画器实例 |
| `beforeRender` | 每帧渲染前 | 预处理场景 |
| `afterRender` | 每帧渲染后 | 后处理效果 |
| `beforeUpdate` | 每帧更新前 | 修改动画状态 |
| `afterUpdate` | 每帧更新后 | 响应状态变化 |

## 插件配置

支持全局配置和实例配置：

```typescript
// 全局配置
Animator.configure({
  plugins: {
    'my-plugin': {
      option1: 'value1',
      option2: 'value2',
    },
  },
});

// 实例配置
const animator = new Animator({
  renderer,
  plugins: [
    new MyPlugin({ customOption: true }),
  ],
});
```

## 插件依赖管理

插件可以声明依赖：

```typescript
class AdvancedPlugin implements Plugin {
  name = 'advanced-plugin';
  dependencies = ['base-plugin', 'utils-plugin'];

  install(animator: Animator): void {
    // 检查依赖是否满足
    for (const dep of this.dependencies) {
      if (!animator.hasPlugin(dep)) {
        throw new Error(`Missing required plugin: ${dep}`);
      }
    }

    // 插件逻辑
  }
}
```

## 插件调试

使用内置的调试工具：

```typescript
// 启用插件调试
animator.use(new DebugPlugin({
  showPluginStats: true,
  logPluginLifecycle: true,
}));

// 查看已安装插件
console.log(animator.plugins.list());
// 输出: ['logger', 'particle-effect', 'gif-export']
```

## 发布插件

1. 遵循命名规范：`@animaker/plugin-*` 或 `animaker-plugin-*`
2. 提供完整的 TypeScript 类型定义
3. 编写使用文档和示例
4. 添加单元测试
5. 发布到 npm

```json
// package.json
{
  "name": "@animaker/plugin-my-plugin",
  "version": "1.0.0",
  "keywords": ["animaker", "plugin", "animation"],
  "peerDependencies": {
    "@animaker/core": "^1.0.0"
  }
}
```

---

## 完整示例：创建自定义导出插件

让我们创建一个完整的插件示例，实现视频导出功能：

```typescript
import { Plugin, Scene, Renderer, PluginConfig } from '@animaker/core';

interface VideoExportConfig extends PluginConfig {
  format?: 'mp4' | 'webm' | 'gif';
  quality?: 'low' | 'medium' | 'high';
  framerate?: number;
  bitrate?: number;
}

class VideoExportPlugin implements Plugin {
  name = 'video-export';
  version = '1.0.0';

  private config: Required<VideoExportConfig>;
  private renderer: Renderer | null = null;
  private frames: ArrayBuffer[] = [];
  private isRecording = false;

  constructor(config: VideoExportConfig = {}) {
    this.config = {
      format: config.format ?? 'mp4',
      quality: config.quality ?? 'medium',
      framerate: config.framerate ?? 60,
      bitrate: config.bitrate ?? 5000
    };
  }

  install(scene: Scene, config?: PluginConfig): void {
    console.log(`Installing ${this.name} plugin v${this.version}`);

    // 初始化导出器
    scene.export = {
      video: this.exportVideo.bind(this),
      startRecording: this.startRecording.bind(this),
      stopRecording: this.stopRecording.bind(this),
      isRecording: () => this.isRecording
    };

    // 监听渲染完成事件
    scene.on('afterRender', (renderer: Renderer) => {
      if (this.isRecording) {
        this.captureFrame(renderer);
      }
    });
  }

  uninstall(scene: Scene): void {
    console.log(`Uninstalling ${this.name} plugin`);

    // 停止录制
    if (this.isRecording) {
      this.stopRecording();
    }

    // 清理资源
    this.frames = [];

    // 移除导出功能
    delete scene.export;
  }

  private startRecording(): void {
    this.isRecording = true;
    this.frames = [];
    console.log('Started recording video');
  }

  private stopRecording(): void {
    this.isRecording = false;
    console.log(`Stopped recording. Captured ${this.frames.length} frames`);
  }

  private captureFrame(renderer: Renderer): void {
    const frame = renderer.captureFrame();
    this.frames.push(frame);
  }

  private async exportVideo(filename: string): Promise<void> {
    if (this.frames.length === 0) {
      throw new Error('No frames to export. Start recording first.');
    }

    console.log(`Exporting ${this.frames.length} frames to ${filename}`);

    // 根据格式选择编码器
    switch (this.config.format) {
      case 'mp4':
        await this.exportAsMP4(filename);
        break;
      case 'webm':
        await this.exportAsWebM(filename);
        break;
      case 'gif':
        await this.exportAsGIF(filename);
        break;
    }

    // 清理帧数据
    this.frames = [];
  }

  private async exportAsMP4(filename: string): Promise<void> {
    // 使用 FFmpeg.wasm 进行 MP4 编码
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    // 将帧转换为视频
    // 这里简化实现，实际需要更复杂的编码逻辑
    console.log(`Encoding MP4: ${filename}`);
  }

  private async exportAsWebM(filename: string): Promise<void> {
    // 使用 WebM 编码器
    console.log(`Encoding WebM: ${filename}`);
  }

  private async exportAsGIF(filename: string): Promise<void> {
    // 使用 GIF 编码器
    console.log(`Encoding GIF: ${filename}`);
  }
}

// 使用插件
import { createScene } from '@animaker/core';

const scene = createScene({
  width: 1920,
  height: 1080,
  fps: 60
});

const videoPlugin = new VideoExportPlugin({
  format: 'mp4',
  quality: 'high',
  framerate: 60
});

videoPlugin.install(scene);

// 开始录制
scene.export.startRecording();

// 运行动画
for (let t = 0; t < 10; t += 1/60) {
  scene.updateTo(t);
  renderer.render(scene);
}

// 停止并导出
scene.export.stopRecording();
await scene.export.video('animation.mp4');
```

---

## 插件测试

为插件编写单元测试：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VideoExportPlugin } from './video-export-plugin';

describe('VideoExportPlugin', () => {
  let plugin: VideoExportPlugin;
  let scene: Scene;

  beforeEach(() => {
    plugin = new VideoExportPlugin({
      format: 'mp4',
      quality: 'medium'
    });
    scene = createScene();
  });

  afterEach(() => {
    if (plugin) {
      plugin.uninstall(scene);
    }
  });

  it('should have correct name and version', () => {
    expect(plugin.name).toBe('video-export');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install export functions on scene', () => {
    plugin.install(scene);

    expect(scene.export).toBeDefined();
    expect(scene.export.video).toBeDefined();
    expect(scene.export.startRecording).toBeDefined();
    expect(scene.export.stopRecording).toBeDefined();
    expect(scene.export.isRecording).toBeDefined();
  });

  it('should start and stop recording', () => {
    plugin.install(scene);

    expect(scene.export.isRecording()).toBe(false);

    scene.export.startRecording();
    expect(scene.export.isRecording()).toBe(true);

    scene.export.stopRecording();
    expect(scene.export.isRecording()).toBe(false);
  });

  it('should remove export functions on uninstall', () => {
    plugin.install(scene);
    plugin.uninstall(scene);

    expect(scene.export).toBeUndefined();
  });

  it('should throw error when exporting with no frames', async () => {
    plugin.install(scene);

    await expect(scene.export.video('test.mp4')).rejects.toThrow(
      'No frames to export'
    );
  });
});
```

---

## 插件开发最佳实践

### 1. 类型安全

始终提供完整的 TypeScript 类型定义：

```typescript
// 定义清晰的配置接口
interface MyPluginConfig {
  enabled: boolean;
  options: {
    timeout: number;
    retries: number;
  };
}

// 使用泛型保持类型安全
class MyPlugin<T extends MyPluginConfig = MyPluginConfig> implements Plugin {
  constructor(private config: T) {}

  install(scene: Scene): void {
    // 类型安全的配置访问
    const timeout = this.config.options.timeout;
  }
}
```

### 2. 错误处理

提供清晰的错误信息和恢复机制：

```typescript
class RobustPlugin implements Plugin {
  install(scene: Scene): void {
    try {
      this.initialize(scene);
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      // 提供降级方案
      this.initializeFallback(scene);
    }
  }

  private initialize(scene: Scene): void {
    // 完整初始化
  }

  private initializeFallback(scene: Scene): void {
    // 降级初始化
  }
}
```

### 3. 资源清理

确保正确清理所有资源：

```typescript
class CleanPlugin implements Plugin {
  private resources: Resource[] = [];
  private eventListeners: Array<() => void> = [];

  install(scene: Scene): void {
    // 分配资源
    this.resources.push(this.allocateResource());

    // 注册事件监听
    const handler = () => this.handleEvent();
    scene.on('event', handler);
    this.eventListeners.push(() => scene.off('event', handler));
  }

  uninstall(scene: Scene): void {
    // 清理事件监听
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.eventListeners = [];

    // 释放资源
    this.resources.forEach(resource => resource.release());
    this.resources = [];
  }
}
```

### 4. 性能考虑

避免性能瓶颈：

```typescript
class OptimizedPlugin implements Plugin {
  private cache: Map<string, unknown> = new Map();
  private debounceTimer: number | null = null;

  install(scene: Scene): void {
    // 使用缓存避免重复计算
    scene.on('event', (data) => {
      if (this.cache.has(data.id)) {
        return this.cache.get(data.id);
      }

      const result = this.processData(data);
      this.cache.set(data.id, result);
      return result;
    });

    // 使用防抖减少频繁操作
    scene.on('frequent-event', (data) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.handleEvent(data);
        this.debounceTimer = null;
      }, 100);
    });
  }
}
```

---

## 插件生态系统

### 官方插件

- `@animaker/plugin-export` - 导出动画为视频/GIF
- `@animaker/plugin-particles` - 高级粒子系统
- `@animaker/plugin-physics` - 物理模拟
- `@animaker/plugin-audio` - 音频可视化
- `@animaker/plugin-ui` - UI 组件

### 社区插件

- `animaker-plugin-shapes` - 额外的形状对象
- `animaker-plugin-easing` - 扩展缓动函数
- `animaker-plugin-text` - 高级文本效果

---

## 相关文档

- [核心类型 API](../api/core.md) - 插件相关类型
- [场景 API](../api/scene.md) - Scene 接口文档
- [自定义动画](./custom-animations.md) - 创建自定义动画
- [自定义渲染对象](./custom-objects.md) - 创建自定义对象
