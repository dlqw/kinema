# AniMaker Workstation

AniMaker视频工作站 - Electron桌面应用程序

## 技术栈

- **UI框架**: React 18
- **构建工具**: electron-vite
- **类型系统**: TypeScript
- **动画核心**: @animaker/core

## 功能特性

- [x] 基础Electron应用架构
- [x] 主进程/渲染进程通信
- [x] 主题切换 (暗色/亮色)
- [ ] 项目管理功能
- [ ] 国际化支持
- [ ] 视频渲染集成
- [ ] 逐帧编辑功能

## 开发指南

### 安装依赖

```bash
# 在项目根目录
cd packages/workstation
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建Electron应用
npm run build

# 构建安装包
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 项目结构

```
packages/workstation/
├── src/
│   ├── main/        # Electron主进程
│   ├── preload/     # 预加载脚本
│   └── renderer/    # React渲染进程
├── resources/       # 应用资源
└── electron.vite.config.ts
```

## 开发计划

### v0.1.0 (当前版本)
- [x] 基础架构搭建
- [ ] 项目文件管理
- [ ] 基础UI组件
- [ ] 与核心动画库集成

### v0.2.0 (计划中)
- [ ] 完整的项目管理功能
- [ ] 国际化支持
- [ ] 视频预览功能
- [ ] 时间轴编辑器
