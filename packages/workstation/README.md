# Kinema Workstation

Kinema 视频工作站，仓库中的 Electron 桌面应用。

## 技术栈

- **UI框架**: React 18
- **构建工具**: electron-vite
- **类型系统**: TypeScript
- **动画核心**: @kinema/core

## 功能特性

- [x] 基础Electron应用架构
- [x] 主进程/渲染进程通信
- [x] 主题切换 (暗色/亮色)
- [x] 中英双语切换
- [x] 项目管理工作流
- [x] 最近项目管理
- [x] 项目设置编辑
- [x] 场景草稿管理
- [x] 导出交付包控制台
- [ ] 逐帧编辑功能
- [ ] 实时场景预览
- [ ] 真正的视频渲染导出

## 开发指南

### 安装依赖

```bash
npm install
```

默认在仓库根目录安装。该包由根 `package.json` 通过 workspace 编排。

### 开发模式

```bash
npm run electron:dev
```

### 构建应用

```bash
# 从仓库根目录构建 Electron 应用
npm run electron:build

# 构建安装包
npm run electron:package:win
npm run electron:package:mac
npm run electron:package:linux
```

如果只想在包目录内单独工作，也可以使用：

```bash
npm run dev --workspace @kinema/workstation
npm run build --workspace @kinema/workstation
```

## 项目结构

```
packages/workstation/
├── src/
│   ├── main/        # Electron主进程
│   ├── preload/     # 预加载脚本
│   └── renderer/    # React渲染进程
├── resources/       # 应用资源
├── electron.vite.config.ts
└── electron-builder.json
```

## 当前状态

当前工作站已经可以承担“项目壳层”职责：

- 新建、打开、保存、另存为、关闭 `.kinema` 项目
- 持久化最近项目列表
- 编辑项目设置与场景草稿
- 同步主题与语言设置
- 导出渲染计划或项目快照 JSON 交付包

目前仍未完成的部分主要是：

- 时间线/场景编辑器
- 实时预览画布
- 基于编辑器状态的真实视频渲染输出

## 说明

- `src/main` 负责 Electron 主进程、文件系统操作和导出协议。
- `src/preload` 负责向渲染进程暴露安全 API。
- `src/renderer` 是 React 前端入口和工作站界面。
- `src/stores` 保存桌面端状态逻辑。
