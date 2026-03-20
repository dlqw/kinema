# 架构设计文档

AniMaker 是一个模块化的动画渲染框架和视频工作站，采用 Monorepo 架构。

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    AniMaker 项目                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  Core Framework  │      │  Video Workstation│         │
│  │  (packages/core) │      │  (packages/ws)   │         │
│  │                  │      │                  │         │
│  │  ┌────────────┐  │      │  ┌────────────┐  │         │
│  │  │ Rendering  │  │      │  │   Electron  │  │         │
│  │  │   Engine   │  │      │  │   + React   │  │         │
│  │  └────────────┘  │      │  └────────────┘  │         │
│  │  ┌────────────┐  │      │                  │         │
│  │  │ Animation  │  │      │  ┌────────────┐  │         │
│  │  │  System    │  │      │  │    UI      │  │         │
│  │  └────────────┘  │      │  │ Components │  │         │
│  │  ┌────────────┐  │      │  └────────────┘  │         │
│  │  │   Scene    │  │      │                  │         │
│  │  │ Management │  │      │  ┌────────────┐  │         │
│  │  └────────────┘  │      │  │     IPC    │  │         │
│  │                  │      │  │  Handlers  │  │         │
│  └──────────────────┘      │  └────────────┘  │         │
│                            └──────────────────┘         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Shared Types & Utilities            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 核心框架架构

### 分层设计

```
┌─────────────────────────────────────┐
│         Application Layer           │  用户应用代码
├─────────────────────────────────────┤
│         Framework Layer             │  框架 API
│  ┌───────────────────────────────┐  │
│  │   Factory Functions & API     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Scene & Animation System    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Event System                │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│         Rendering Layer            │  渲染抽象
│  ┌───────────────────────────────┐  │
│  │   Render Objects              │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Render Engine               │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│         Graphics Layer             │  图形后端
│  ┌─────────┐  ┌─────────┐          │
│  │ Canvas  │  │  WebGL  │          │
│  │   2D    │  │  WebGPU │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
```

### 核心模块

#### 1. 类型系统 (Type System)

```typescript
// 品牌类型提供编译时安全
type ObjectId = string & { readonly __brand: unique symbol };
type Time = number & { readonly __brand: unique symbol };
type Alpha = number & { readonly __brand: unique symbol };
```

#### 2. 渲染对象 (Render Objects)

```
RenderObject (抽象基类)
    ├── VectorObject (矢量图形)
    │   ├── Circle
    │   ├── Rectangle
    │   ├── Polygon
    │   └── Path
    ├── TextObject (文本)
    └── GroupObject (编组)
```

#### 3. 场景管理 (Scene Management)

```typescript
class Scene {
  // 对象管理
  add(object: RenderObject): void
  remove(object: RenderObject): void

  // 时间控制
  play(): void
  pause(): void
  seek(time: Time): void

  // 渲染
  render(renderer: Renderer): void
}
```

#### 4. 动画系统 (Animation System)

```
Animation (抽象基类)
    ├── TransformAnimation
    ├── FadeAnimation
    ├── RotateAnimation
    ├── MoveAnimation
    └── AnimationGroup
        ├── Parallel
        ├── Sequence
        └── Lagged
```

#### 5. 事件系统 (Event System)

```typescript
// 类型安全的事件
type SceneEvents = {
  init: void
  objectAdded: RenderObject
  objectRemoved: RenderObject
  frameRender: RenderContext
  update: number
  pause: void
}

class EventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void
  emit<K extends keyof T>(event: K, data: T[K]): void
}
```

## 渲染引擎架构

### 渲染管线

```
Input (Scene)
    ↓
Culling (视锥剔除)
    ↓
Batching (批处理)
    ↓
Rendering (渲染)
    ↓
Post-Processing (后处理)
    ↓
Output (Frame)
```

### 图形设备抽象

```typescript
interface GraphicsDevice {
  // 资源创建
  createBuffer(data: ArrayBuffer): GPUBuffer
  createTexture(desc: TextureDesc): GPUTexture
  createPipeline(desc: PipelineDesc): GPUPipeline

  // 渲染命令
  beginPass(): void
  draw(vertexCount: number): void
  endPass(): void
}
```

### 后处理效果

```
Render Output
    ↓
Bloom Effect
    ↓
Blur Effect
    ↓
Chromatic Aberration
    ↓
Color Correction
    ↓
Vignette
    ↓
Final Output
```

## 视频工作站架构

### Electron 应用结构

```
AniMaker Workstation
├── Main Process (主进程)
│   ├── Window Management
│   ├── IPC Handlers
│   ├── File System Access
│   └── Export Service
│
└── Renderer Process (渲染进程)
    ├── React Application
    │   ├── Project Panel
    │   ├── Preview Window
    │   ├── Properties Panel
    │   └── Timeline
    └── Core Framework Integration
```

### IPC 通信

```typescript
// 主进程
ipcMain.handle('project:save', async (event, project) => {
  await saveProject(project)
  return { success: true }
})

// 渲染进程
const result = await ipcRenderer.invoke('project:save', project)
```

### 状态管理

```
Application State
├── Project State
│   ├── Scenes
│   ├── Objects
│   └── Animations
├── UI State
│   ├── Selection
│   ├── Viewport
│   └── Panels
└── Playback State
    ├── Playing
    ├── Current Frame
    └── Loop Mode
```

## Monorepo 结构

```
animaker/
├── packages/
│   ├── core/              # 核心框架库
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── render/
│   │   │   ├── scene/
│   │   │   ├── animation/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── workstation/       # 视频工作站
│       ├── src/
│       │   ├── main/      # Electron 主进程
│       │   ├── renderer/  # React 前端
│       │   └── shared/    # 共享代码
│       └── package.json
│
├── docs/                  # 文档
├── tests/                 # 测试
└── package.json           # 根 package.json
```

## 设计原则

1. **类型安全**: 使用 TypeScript 严格模式和品牌类型
2. **不可变性**: 数据结构默认不可变
3. **组合优于继承**: 使用组合构建复杂功能
4. **依赖注入**: 渲染引擎等组件通过注入使用
5. **事件驱动**: 使用事件系统解耦组件
6. **平台抽象**: 图形设备等支持多后端

## 性能考虑

- **批处理**: 减少绘制调用
- **剔除**: 跳过不可见对象
- **缓存**: 缓存渲染结果和计算
- **惰性求值**: 按需计算
- **Web Worker**: 耗时操作放到 Worker

## 扩展性

### 插件系统（计划中）

```typescript
interface Plugin {
  name: string
  version: string
  install(app: Application): void
  uninstall(app: Application): void
}
```

### 自定义渲染对象

```typescript
class CustomObject extends RenderObject {
  render(renderer: Renderer): void {
    // 自定义渲染逻辑
  }
}
```

## 未来规划

- [ ] WebGPU 后端完善
- [ ] 插件系统
- [ ] 实时协作
- [ ] AI 辅助编辑
- [ ] 云端渲染
