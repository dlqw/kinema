# Kinema

高性能 2D 动画渲染框架，附带 Electron 桌面工作站。

## 项目概览

Kinema 是一个 TypeScript npm workspaces 单仓（monorepo），包含两个核心包：

| 包                        | 说明                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`@kinema/core`**        | 跨平台动画引擎：对象层级、场景管理、动画系统、渲染管线（WebGPU / WebGL2 / Canvas 2D）、特效、导出（图片序列 / GIF / WebM / MP4） |
| **`@kinema/workstation`** | Electron + React 19 桌面应用，基于 `electron-vite` 构建                                                                          |

## 仓库结构

```
Kinema/
├── packages/
│   ├── core/                 # 动画与渲染引擎（可发布至 npm）
│   └── workstation/          # Electron 桌面应用
├── tests/                    # 单元测试、集成测试、E2E 测试
├── docs/                     # 产品文档与开发文档
├── changelogs/               # 版本更新日志
├── scripts/                  # CI/CD 与构建脚本
└── package.json              # 工作区编排
```

## 快速开始

```bash
# 安装依赖
npm install

# 构建全部
npm run build

# 类型检查
npm run typecheck

# 运行测试
npm run test

# 运行测试（带覆盖率）
npm run test:coverage

# 启动 Electron 开发服务器
npm run dev
```

针对单个包操作：

```bash
npm run build --workspace @kinema/core
npm run dev --workspace @kinema/workstation
```

## 技术栈

- **语言**：TypeScript（ESM、严格模式）
- **构建**：`tsc`（core）、`electron-vite`（workstation）
- **测试**：Vitest + Playwright
- **代码规范**：ESLint + Prettier + Commitlint + Husky
- **版本管理**：Changesets
- **文档**：VitePress + TypeDoc

## 渲染架构

```
高层动画层   Animation / AnimationGroup / easing / Timeline
    ↓
场景管理层   Scene / SceneBuilder / 工厂函数
    ↓
渲染抽象层   RenderEngine / RenderContext / RenderPipeline
    ↓
图形 API 层  WebGPU（主）/ WebGL2（备选）/ Canvas 2D
    ↓
资源管理层   BufferManager / TextureManager / ShaderManager
```

## 开发说明

- 根目录脚本负责跨包编排，不包含业务代码
- `packages/core` 是运行时 API 和导出逻辑的单一事实来源
- `packages/workstation` 采用三进程模型：Main / Preload / Renderer
- `tests/` 覆盖共享运行时和导出流程
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

## 许可证

MIT
