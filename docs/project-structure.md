# Kinema 项目目录结构

本文档描述当前仓库的实际结构，而不是历史上的单根 `src/` 布局。

## 设计原则

- 根目录只做编排，不再承载业务源码。
- 可运行产品放在 `packages/` 下，按包边界管理职责。
- 测试、文档和样例与产品代码解耦，避免生成物混入源码目录。
- 构建输出只能写入 `dist`、`out`、`release` 等专用目录，并通过 `.gitignore` 排除。

## 当前结构

```text
VideoMaker/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── animation/       # 动画定义与组合
│   │   │   ├── api/             # 对外 API 聚合
│   │   │   ├── core/            # RenderObject、GroupObject 等核心对象
│   │   │   ├── easing/          # 缓动函数
│   │   │   ├── effects/         # 渲染效果
│   │   │   ├── events/          # 事件总线与事件类型
│   │   │   ├── export/          # 导出流程与编码器
│   │   │   ├── factory/         # 场景和动画工厂
│   │   │   ├── render/          # 渲染相关实现
│   │   │   ├── scene/           # Scene 与调度
│   │   │   ├── timeline/        # 时间线对象
│   │   │   ├── types/           # 核心类型定义
│   │   │   ├── utils/           # 运行时工具
│   │   │   └── index.ts         # 包入口
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── workstation/
│       ├── src/
│       │   ├── components/      # 复用 UI 组件
│       │   ├── i18n/            # 国际化初始化
│       │   ├── locales/         # 文案资源
│       │   ├── main/            # Electron 主进程
│       │   ├── preload/         # preload 暴露层
│       │   ├── renderer/        # React 渲染进程
│       │   ├── stores/          # Zustand 状态管理
│       │   └── types/           # 工作站专用类型
│       ├── resources/           # 图标等打包资源
│       ├── electron.vite.config.ts
│       ├── electron-builder.json
│       ├── package.json
│       └── tsconfig.json
├── tests/
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   ├── e2e/                     # Playwright 端到端测试
│   ├── fixtures/                # 夹具
│   ├── mocks/                   # 测试替身
│   └── setup.ts
├── video/
│   ├── assets/                  # 示例素材
│   ├── scenes/                  # 示例场景
│   ├── render.ts                # 渲染入口
│   └── render-video.ts          # 视频导出入口
├── docs/                        # 文档站与架构说明
├── changelogs/                  # 版本记录
├── scripts/                     # CI / 自动化脚本
├── package.json                 # workspace 编排
├── tsconfig.json                # 根级测试与工具链类型检查
├── vitest.config.ts             # Vitest 配置
└── playwright.config.ts         # Playwright 配置
```

## 目录职责

### `packages/core`

- 承载可复用的动画、场景、渲染和导出能力。
- 允许发布为独立包。
- 不放置 Electron、UI 和桌面端状态管理逻辑。

### `packages/workstation`

- 承载桌面应用入口和 UI。
- 通过 `@kinema/core` 复用引擎能力。
- 所有 Electron 构建配置都应留在该包内部，不再放在根目录。

### `tests`

- 统一覆盖跨包行为。
- `unit/` 面向小粒度逻辑。
- `integration/` 面向导出、渲染和场景流转。
- `e2e/` 面向用户可见流程。

### `video`

- 保留手工渲染实验、样例和素材。
- 不作为发布包的一部分。

## 维护规则

- 不在源码目录提交编译产物、`.d.ts`、`.js.map`、临时帧或导出视频。
- 新功能先判断归属：
  - 引擎能力放 `packages/core`
  - 桌面交互放 `packages/workstation`
  - 跨包验证放 `tests`
- 根目录禁止再新增与 `packages/workstation` 重复的 Electron 入口。
- 文档引用路径时，优先指向包入口或公开 API，避免依赖历史目录。
