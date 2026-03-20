# AniMaker 底层渲染引擎架构设计

## 1. 概述

本文档定义 AniMaker 动画渲染框架的底层渲染引擎架构。该架构基于 WebGPU 标准，提供高性能的 2D/3D 混合渲染能力，专为动画制作场景优化。

### 1.1 设计目标

- **高性能渲染**：充分利用 GPU 并行计算能力
- **跨平台兼容**：WebGPU 优先，WebGL 2.0 降级支持
- **动画优化**：针对骨骼动画、变形动画等特性优化
- **可扩展性**：模块化设计，支持自定义渲染管线
- **开发者友好**：简洁的 API 设计，易于集成

### 1.2 技术栈

```
核心 API: WebGPU (优先), WebGL 2.0 (降级)
着色器语言: WGSL (WebGPU), GLSL (WebGL)
构建工具: Vite
开发语言: TypeScript 5.0+
```

## 2. 核心架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    AniMaker Render Engine                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              High-Level Animation Layer              │    │
│  │  (Scene Graph, Timeline, Animation Controllers)       │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────┐    │
│  │             Rendering Abstraction Layer              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Renderer │ │ Material │ │ Geometry │            │    │
│  │  │ Manager  │ │  System  │ │  System  │            │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────┐    │
│  │              Core Rendering Engine                   │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │          Rendering Pipeline Manager           │   │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │    │
│  │  │  │ Culling │ │ Sorting │ │ Batching│        │   │    │
│  │  │  └─────────┘ └─────────┘ └─────────┘        │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │           Resource Management                │   │    │
│  │  │  BufferManager | TextureManager |            │   │    │
│  │  │  ShaderManager | PipelineManager             │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────┐    │
│  │              Graphics API Abstraction               │    │
│  │  ┌─────────────────┐      ┌─────────────────┐      │    │
│  │  │   WebGPUImpl    │      │  WebGL2Fallback │      │    │
│  │  │  (Primary)      │      │  (Secondary)    │      │    │
│  │  └─────────────────┘      └─────────────────┘      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

```
src/render/
├── core/                    # 核心渲染引擎
│   ├── RenderEngine.ts      # 渲染引擎主入口
│   ├── RenderContext.ts     # 渲染上下文管理
│   ├── Capability.ts        # GPU能力检测与配置
│   └── RenderStats.ts       # 性能统计
│
├── graphics/                # 图形API抽象层
│   ├── GraphicsDevice.ts    # 图形设备抽象
│   ├── webgpu/             # WebGPU 实现
│   │   ├── WebGPUDevice.ts
│   │   ├── WebGPUContext.ts
│   │   ├── WebGPUBuffer.ts
│   │   ├── WebGPUTexture.ts
│   │   └── WebGPUPipeline.ts
│   └── webgl2/             # WebGL2 降级实现
│       ├── WebGL2Device.ts
│       └── ...
│
├── resources/               # 资源管理系统
│   ├── BufferManager.ts    # 缓冲区管理
│   ├── TextureManager.ts   # 纹理管理
│   ├── ShaderManager.ts    # 着色器管理
│   ├── PipelineManager.ts  # 渲染管线管理
│   └── ResourceCache.ts    # 资源缓存
│
├── pipeline/                # 渲染管线
│   ├── PipelineManager.ts   # 管线管理器
│   ├── RenderPass.ts       # 渲染通道
│   ├── ComputePass.ts      # 计算通道
│   └── RenderQueue.ts      # 渲染队列
│
├── materials/               # 材质系统
│   ├── Material.ts         # 材质基类
│   ├── ShaderMaterial.ts   # 着色器材质
│   ├── StandardMaterial.ts # 标准材质
│   └── MaterialLibrary.ts  # 材质库
│
├── geometry/                # 几何系统
│   ├── Geometry.ts         # 几何体基类
│   ├── BufferGeometry.ts   # 缓冲几何体
│   ├── Attribute.ts        # 顶点属性
│   └── Index.ts            # 索引缓冲
│
├── animation/               # 动画渲染支持
│   ├── SkinningRenderer.ts # 骨骼蒙皮渲染
│   ├── MorphRenderer.ts    # 变形目标渲染
│   └── ParticleRenderer.ts # 粒子渲染
│
├── post-processing/         # 后处理
│   ├── PostProcessing.ts   # 后处理管理器
│   ├── Bloom.ts            # 泛光
│   ├── ToneMapping.ts      # 色调映射
│   └── FXAA.ts             # 抗锯齿
│
└── utils/                   # 工具函数
    ├── ShaderLib.ts        # 着色器库
    └── FormatUtils.ts      # 格式转换工具
```

## 3. 核心 API 设计

### 3.1 渲染引擎初始化

```typescript
interface RenderEngineConfig {
  canvas?: HTMLCanvasElement;
  devicePixelRatio?: number;
  powerPreference?: 'high-performance' | 'low-power';
  apiPreference?: 'webgpu' | 'webgl2' | 'auto';
  debugMode?: boolean;
}

class RenderEngine {
  // 初始化渲染引擎
  static async init(config: RenderEngineConfig): Promise<RenderEngine>;

  // 获取图形设备
  get device(): GraphicsDevice;

  // 获取渲染上下文
  get context(): RenderContext;

  // 帧循环
  start(): void;
  pause(): void;
  resume(): void;

  // 渲染一帧
  render(deltaTime: number): void;

  // 资源管理器
  get resources(): {
    buffers: BufferManager;
    textures: TextureManager;
    shaders: ShaderManager;
    pipelines: PipelineManager;
  };

  // 性能统计
  get stats(): RenderStats;
}
```

### 3.2 图形设备抽象

```typescript
// 图形设备接口 - 统一 WebGPU 和 WebGL2
interface GraphicsDevice {
  // 设备信息
  readonly adapterInfo: GPUAdapterInfo;
  readonly features: Set<string>;
  readonly limits: DeviceLimits;

  // 上下文
  readonly context: GPUCanvasContext | WebGLRenderingContext;

  // 资源创建
  createBuffer(descriptor: BufferDescriptor): GraphicsBuffer;
  createTexture(descriptor: TextureDescriptor): GraphicsTexture;
  createShader(descriptor: ShaderDescriptor): GraphicsShader;
  createRenderPipeline(descriptor: PipelineDescriptor): GraphicsPipeline;
  createComputePipeline(descriptor: ComputePipelineDescriptor): ComputePipeline;

  // 命令编码
  createCommandEncoder(): CommandEncoder;

  // 队列操作
  get queue(): Queue;

  // 生命周期
  flush(): void;
  loseDevice(): void;
}
```

### 3.3 缓冲管理器

```typescript
class BufferManager {
  // 创建顶点缓冲
  createVertexBuffer(data: Float32Array, usage: BufferUsage): GraphicsBuffer;

  // 创建索引缓冲
  createIndexBuffer(data: Uint16Array | Uint32Array): GraphicsBuffer;

  // 创建统一缓冲 (Uniform Buffer)
  createUniformBuffer(size: number): GraphicsBuffer;

  // 创建存储缓冲 (Storage Buffer)
  createStorageBuffer(size: number): GraphicsBuffer;

  // 缓冲池管理（减少创建开销）
  getBufferFromPool(size: number, usage: BufferUsage): GraphicsBuffer;
  returnBufferToPool(buffer: GraphicsBuffer): void;

  // 批量更新优化
  updateBuffers(updates: BufferUpdate[]): void;
}
```

### 3.4 着色器管理

```typescript
interface ShaderDescriptor {
  vertex: {
    code: string;
    entryPoint?: string;
  };
  fragment?: {
    code: string;
    entryPoint?: string;
  };
  compute?: {
    code: string;
    entryPoint?: string;
  };
  defines?: Record<string, string | number | boolean>;
}

class ShaderManager {
  // 从源码创建着色器
  createShader(descriptor: ShaderDescriptor): GraphicsShader;

  // 着色器变体管理（支持宏定义）
  getShaderVariant(baseShader: GraphicsShader, defines: Record<string, any>): GraphicsShader;

  // 着色器热重载
  reloadShader(shader: GraphicsShader): Promise<void>;

  // 预编译着色器库
  preloadShaderLib(): Promise<void>;
}
```

### 3.5 渲染管线

```typescript
interface RenderPipelineDescriptor {
  shader: GraphicsShader;
  vertexState: VertexState;
  primitive: PrimitiveState;
  depthStencil?: DepthStencilState;
  colorTargetStates: ColorTargetState[];
  layout?: PipelineLayout;
}

class PipelineManager {
  // 创建渲染管线
  createPipeline(descriptor: RenderPipelineDescriptor): GraphicsPipeline;

  // 管线缓存（避免重复创建）
  getOrCreatePipeline(key: string, descriptor: RenderPipelineDescriptor): GraphicsPipeline;

  // 动态状态管理
  setBlendState(state: BlendState): void;
  setDepthState(state: DepthState): void;
  setRasterState(state: RasterState): void;
}
```

## 4. 渲染流程设计

### 4.1 帧渲染流程

```
┌─────────────────────────────────────────────────────────┐
│                   Frame Start                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  1. Update Phase                                        │
│     - Update scene hierarchy                            │
│     - Update animations                                 │
│     - Update transform matrices                         │
│     - Update camera parameters                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Culling Phase                                       │
│     - Frustum culling                                   │
│     - Occlusion culling (optional)                      │
│     - Distance-based LOD selection                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. Sorting & Batching Phase                            │
│     - Sort by material (reduce state changes)           │
│     - Sort by depth (front-to-back for opaque)          │
│     - Batch dynamic geometry                            │
│     - Instance compatible objects                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Shadow Pass (if enabled)                            │
│     - Render shadow maps for lights                     │
│     - Cascade shadow maps for directional lights        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. Depth Pre-pass (optional)                           │
│     - Render depth only for early-Z                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. Main Color Pass                                     │
│     - Render opaque geometry                            │
│     - Execute material shaders                          │
│     - Apply lighting                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. Transparent Pass                                    │
│     - Sort back-to-front                                │
│     - Render transparent geometry                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  8. Post-Processing                                     │
│     - Bloom                                             │
│     - Tone Mapping                                      │
│     - Anti-aliasing                                     │
│     - Color grading                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Frame End                             │
│                   Present to Screen                     │
└─────────────────────────────────────────────────────────┘
```

### 4.2 渲染队列设计

```typescript
enum RenderQueueType {
  Background = 1000,     // 背景（天空盒等）
  Opaque = 2000,         // 不透明物体
  AlphaTest = 2500,      // Alpha 测试
  Transparent = 3000,    // 透明物体
  Overlay = 4000,        // 叠加层（UI等）
}

class RenderQueue {
  // 添加渲染项
  addRenderable(item: Renderable): void;

  // 排序（支持自定义排序函数）
  sort(compareFn?: (a: Renderable, b: Renderable) => number): void;

  // 清空队列
  clear(): void;

  // 执行渲染
  render(context: RenderContext): void;
}
```

## 5. 动画渲染优化

### 5.1 骨骼动画优化

```typescript
// GPU 蒙皮计算
class SkinningSystem {
  // 骨骼矩阵缓冲（存储缓冲，支持大量骨骼）
  boneMatricesBuffer: StorageBuffer;

  // 蒙皮计算着色器
  computeShader: ComputeShader;

  // 执行 GPU 蒙皮
  computeSkinMeshes(meshes: SkinnedMesh[]): void;
}

// WGSL 蒙皮计算着色器示例
const skinningShader = `
@group(0) @binding(0) var<storage> boneMatrices: array<mat4x4<f32>>;
@group(0) @binding(1) var<storage> inputPositions: array<vec3<f32>>;
@group(0) @binding(2) var<storage> outputPositions: array<vec3<f32>>;
@group(0) @binding(3) var<storage> vertexWeights: array<VertexBoneData>;

struct VertexBoneData {
  indices: vec4<u32>,
  weights: vec4<f32>,
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let vertexIndex = id.x;
  let boneData = vertexWeights[vertexIndex];

  var skinnedPosition = vec4<f32>(0.0);
  let position = inputPositions[vertexIndex];

  for (var i = 0u; i < 4u; i++) {
    let boneIndex = boneData.indices[i];
    let weight = boneData.weights[i];
    let boneMatrix = boneMatrices[boneIndex];
    skinnedPosition += boneMatrix * vec4<f32>(position, 1.0) * weight;
  }

  outputPositions[vertexIndex] = skinnedPosition.xyz;
}
`;
```

### 5.2 变形目标优化

```typescript
class MorphTargetRenderer {
  // 变形目标权重缓冲
  weightBuffer: UniformBuffer;

  // 基础顶点 + 目标差值存储
  vertexBuffer: StorageBuffer;

  // 动态更新变形权重
  updateWeights(weights: Float32Array): void;

  // 混合变形目标
  blendMorphTargets(baseGeometry: Geometry, targets: MorphTarget[]): Buffer;
}
```

### 5.3 粒子渲染优化

```typescript
// GPU 粒子系统
class GPUParticleSystem {
  // 粒子数据缓冲（环形缓冲）
  particleBuffer: StorageBuffer;

  // 粒子发射着色器
  emitShader: ComputeShader;

  // 粒子更新着色器
  updateShader: ComputeShader;

  // 粒子渲染管线
  renderPipeline: RenderPipeline;

  // 模拟更新
  simulate(deltaTime: number): void;

  // 渲染
  render(context: RenderContext): void;
}
```

## 6. 性能优化策略

### 6.1 批量渲染

```typescript
// 静态批处理：合并静态几何体
class StaticBatcher {
  batch(renderables: Renderable[]): BatchedGeometry;
}

// 动态批处理：运行时合并
class DynamicBatcher {
  batch(renderables: Renderable[], maxBatchSize: number): void;
}

// GPU 实例化渲染
class InstancedRenderer {
  drawInstanced(geometry: Geometry, instances: InstanceData[]): void;
}
```

### 6.2 资源管理优化

```typescript
// 纹理图集
class TextureAtlas {
  addTexture(texture: GraphicsTexture): AtlasEntry;
  removeTexture(entry: AtlasEntry): void;
  getAtlasTexture(): GraphicsTexture;
}

// 缓冲池
class BufferPool {
  acquire(size: number, usage: BufferUsage): GraphicsBuffer;
  release(buffer: GraphicsBuffer): void;
}

// 资源 LRU 缓存
class ResourceCache {
  get<T>(key: string, factory: () => T): T;
  evict(size: number): void;
  clear(): void;
}
```

### 6.3 状态变更优化

```typescript
// 渲染状态排序器
class StateSorter {
  // 按材质分组（减少状态切换）
  sortByMaterial(renderables: Renderable[]): Renderable[];

  // 按深度排序（不透明：前到后，透明：后到前）
  sortByDepth(renderables: Renderable[], camera: Camera): Renderable[];
}

// 状态缓存
class StateCache {
  setPipeline(pipeline: GraphicsPipeline): boolean; // 返回是否实际切换
  setBindGroup(index: number, group: BindGroup): boolean;
  setVertexBuffer(slot: number, buffer: GraphicsBuffer): boolean;
}
```

## 7. 着色器库设计

### 7.1 内置着色器

```typescript
// 标准着色器库
const ShaderLib = {
  // 基础着色器
  Basic: {
    vertex: basicVertexShader,
    fragment: basicFragmentShader,
  },

  // 标准PBR着色器
  Standard: {
    vertex: standardVertexShader,
    fragment: standardFragmentShader,
  },

  // 骨骼蒙皮着色器
  Skinning: {
    vertex: skinningVertexShader,
    compute: skinningComputeShader,
  },

  // 变形目标着色器
  Morph: {
    vertex: morphVertexShader,
    compute: morphComputeShader,
  },

  // 粒子着色器
  Particle: {
    vertex: particleVertexShader,
    fragment: particleFragmentShader,
    compute: particleComputeShader,
  },

  // 后处理着色器
  PostProcessing: {
    Bloom: bloomFragmentShader,
    ToneMapping: toneMappingFragmentShader,
    FXAA: fxaaFragmentShader,
  },
};
```

### 7.2 着色器变体系统

```typescript
// 着色器变体生成器
class ShaderVariantGenerator {
  // 从基础着色器生成变体
  generateVariants(
    baseShader: string,
    variantDefinitions: VariantDefinition[]
  ): Map<string, string>;

  // 运行时着色器组合
  buildShader(
    template: ShaderTemplate,
    defines: Record<string, any>
  ): string;
}

// 变体定义示例
const skinVariants = {
  MAX_BONES: [64, 128, 256],
  SKINNING_MODE: ['LINEAR', 'DUAL_QUATERNION'],
  USE_NORMALS: [true, false],
  USE_TANGENTS: [true, false],
};
```

## 8. 调试与性能分析

### 8.1 渲染统计

```typescript
interface RenderStats {
  // 帧率
  fps: number;
  frameTime: number;

  // 绘制调用
  drawCalls: number;
  instancedDrawCalls: number;
  computePasses: number;

  // 资源使用
  triangles: number;
  vertices: number;

  // GPU 内存
  bufferMemory: number;
  textureMemory: number;

  // 渲染时间（GPU 计时器）
  gpuTime: number;
  shadowMapTime: number;
  postProcessingTime: number;

  // 调试信息
  pipelineChanges: number;
  textureBindings: number;
  bufferUpdates: number;
}

class RenderStatsCollector {
  beginFrame(): void;
  endFrame(): RenderStats;
  reset(): void;
}
```

### 8.2 调试工具

```typescript
// 渲染调试器
class RenderDebugger {
  // 线框模式
  setWireframe(enabled: boolean): void;

  // 法线可视化
  visualizeNormals(enabled: boolean): void;

  // 深度可视化
  visualizeDepth(enabled: boolean): void;

  // 渲染通道可视化
  visualizeRenderPass(passIndex: number): void;

  // 着色器热重载
  enableHotReload(enabled: boolean): void;
}

// 性能分析器
class Profiler {
  // GPU 时间戳查询
  beginTimestamp(label: string): void;
  endTimestamp(label: string): number;

  // CPU 性能分析
  beginMeasure(label: string): void;
  endMeasure(label: string): number;

  // 生成报告
  generateReport(): ProfileReport;
}
```

## 9. 降级策略

### 9.1 WebGPU 到 WebGL2 降级

```typescript
// 能力检测
class CapabilityDetector {
  static detect(): RenderCapability {
    if (navigator.gpu) {
      return RenderCapability.WebGPU;
    }
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) {
      return RenderCapability.WebGL2;
    }
    return RenderCapability.None;
  }
}

// 降级适配器
class FallbackAdapter {
  static createDevice(capability: RenderCapability): GraphicsDevice {
    switch (capability) {
      case RenderCapability.WebGPU:
        return new WebGPUDevice();
      case RenderCapability.WebGL2:
        return new WebGL2Device();
      default:
        throw new Error('No supported graphics API');
    }
  }
}

// 功能特性映射
const FeatureCompatibility = {
  // WebGPU 特性 -> WebGL2 替代方案
  'compute-shaders': 'transform-feedback',
  'storage-buffers': 'uniform-buffers',
  'bind-groups': 'uniform-blocks',
  // ... 更多映射
};
```

## 10. 后续开发计划

### 10.1 第一阶段：核心基础
- [ ] WebGPU 上下文初始化
- [ ] 基础图形设备抽象
- [ ] 缓冲和纹理管理
- [ ] 基础着色器系统
- [ ] 简单几何体渲染

### 10.2 第二阶段：渲染管线
- [ ] 渲染通道设计
- [ ] 渲染队列系统
- [ ] 材质系统
- [ ] 深度和模板测试
- [ ] 混合和透明度

### 10.3 第三阶段：动画支持
- [ ] 骨骼蒙皮渲染
- [ ] 变形目标渲染
- [ ] 粒子系统
- [ ] GPU 计算着色器集成

### 10.4 第四阶段：优化和工具
- [ ] 批量渲染优化
- [ ] 资源管理优化
- [ ] 性能分析工具
- [ ] 调试可视化

---

**文档版本**: 0.1.0
**最后更新**: 2025-03-19
**维护者**: graphics-specialist
