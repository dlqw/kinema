# 开发者文档

欢迎来到 AniMaker 开发者文档！这里包含项目的架构设计、开发指南和技术规范。

## 快速链接

- [贡献指南](./contributing.md) - 如何参与项目贡献
- [架构设计](./architecture.md) - 系统架构和技术设计

## 开发资源

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/animaker.git
cd animaker

# 安装依赖
pnpm install

# 启动开发
pnpm run dev

# 运行测试
pnpm run test

# 类型检查
pnpm run typecheck

# 代码检查
pnpm run lint
```

### 项目结构

```
animaker/
├── packages/
│   ├── core/           # 核心框架
│   └── workstation/    # 视频工作站
├── docs/               # 文档
│   ├── guide/          # 用户指南
│   ├── api/            # API 参考
│   ├── workstation/    # 工作站文档
│   └── development/    # 开发者文档（本目录）
├── tests/              # 测试
└── scripts/            # 构建脚本
```

### 技术栈

**核心框架**:
- TypeScript 5.5+
- Canvas 2D / WebGL2

**视频工作站**:
- Electron
- React 18
- Vite

**开发工具**:
- Vitest (测试)
- Playwright (E2E)
- ESLint + Prettier
- TypeDoc

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 Conventional Commits 提交规范
- 公共 API 必须包含 JSDoc 注释
- 测试覆盖率目标 80%+

### 提交流程

1. Fork 项目仓库
2. 创建功能分支 (`feature/xxx` 或 `fix/xxx`)
3. 开发并测试
4. 提交 Pull Request
5. 代码审查通过后合并

详细步骤请参考 [贡献指南](./contributing.md)。

### 测试要求

```bash
# 单元测试
pnpm run test

# E2E 测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:coverage
```

## 架构概览

AniMaker 采用分层架构设计：

```
应用层 (Application)
    ↓
框架层 (Framework)
    ↓
渲染层 (Rendering)
    ↓
图形层 (Graphics)
```

详细架构说明请参考 [架构设计](./architecture.md)。

## 模块说明

### 核心框架 (packages/core)

- **类型系统**: 品牌类型和类型定义
- **渲染对象**: 矢量图形、文本、编组
- **场景管理**: 场景组织和时间控制
- **动画系统**: 关键帧、缓动、时间轴
- **事件系统**: 类型安全的事件处理
- **渲染引擎**: Canvas 2D 和 WebGL 后端

### 视频工作站 (packages/workstation)

- **Electron 主进程**: 窗口管理、IPC 处理
- **React 前端**: UI 组件和状态管理
- **文档**: 用户手册和 API 文档

## 获取帮助

- 查看 [API 文档](../api/)
- 阅读 [用户指南](../guide/getting-started.md)
- 参与 [GitHub Discussions](https://github.com/your-username/animaker/discussions)
- 提交 [Issue](https://github.com/your-username/animaker/issues)

## 相关链接

- [GitHub 仓库](https://github.com/your-username/animaker)
- [问题追踪](https://github.com/your-username/animaker/issues)
- [更新日志](../CHANGELOG.md)
- [许可证](../../LICENSE)
