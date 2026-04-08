# 开发者文档

欢迎来到 Kinema 开发者文档！这里包含项目的架构设计、开发指南和技术规范。

## 快速链接

- [贡献指南](./contributing.md) - 如何参与项目贡献
- [架构设计](./architecture.md) - 系统架构和技术设计

## 开发资源

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/kinema.git
cd kinema

# 安装依赖
npm install

# 启动 Electron 工作站
npm run electron:dev

# 运行测试
npm run test

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

### 项目结构

```
kinema/
├── packages/
│   ├── core/           # 动画引擎与导出能力
│   └── workstation/    # Electron 工作站
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
- Canvas 2D / 导出流水线

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

Kinema 采用分层架构设计：

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
- **导出系统**: 图像序列、GIF、视频导出

### 视频工作站 (packages/workstation)

- **Electron 主进程**: 窗口管理、IPC 处理
- **React 前端**: UI 组件和状态管理
- **Preload 层**: 进程隔离下的 API 暴露
- **国际化与项目状态**: 本地化与工作区状态管理

## 获取帮助

- 查看 [API 文档](../api/)
- 阅读 [用户指南](../guide/getting-started.md)
- 参与 [GitHub Discussions](https://github.com/your-username/kinema/discussions)
- 提交 [Issue](https://github.com/your-username/kinema/issues)

## 相关链接

- [GitHub 仓库](https://github.com/your-username/kinema)
- [问题追踪](https://github.com/your-username/kinema/issues)
- [更新日志](../../changelogs/CHANGELOG.md)
- [许可证](../../LICENSE)
