# Changelog

All notable changes to AniMaker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 视频工作站 Electron 应用架构初始化
- electron-vite 构建系统配置
- React + TypeScript 前端框架设置
- 视频工作站完整文档体系
- **国际化系统**: 基于 i18next 的多语言支持
  - 支持英文和中文界面
  - 语言偏好持久化（Zustand store）
  - UI 语言选择器
  - 完整的菜单和界面文本翻译

### Changed
- 统一项目版本号为 v0.1.0（开发阶段）
- 更新文档结构，分离框架文档和工作站文档
- 扩展翻译文件，覆盖所有主要 UI 文本

### Technical
- 初始化 Git 仓库，配置 .gitignore
- 创建 Git 分支策略文档
- 建立视频工作站文档目录结构
- 创建 languageStore 管理语言偏好

## [0.1.0] - 2026-03-20

### 框架核心
- 项目初始化和基础架构
- TypeScript 类型系统和品牌类型定义
- 渲染对象抽象层（VectorObject, TextObject, GroupObject）
- 场景管理和调度系统
- 基础动画系统和缓动函数
- 事件系统（EventEmitter、事件冒泡）
- 工厂函数和链式 API

### 渲染引擎
- Canvas 2D 渲染器
- WebGL2 图形设备支持
- 批处理和剔除管线
- 后处理效果框架（Bloom, Blur, 色差等）

### 导出系统
- 图片序列导出（PNG/JPEG/WebP）
- GIF 动画导出
- 视频导出（WebM/MP4 via MediaRecorder）

### 文档
- 核心文档结构
- 框架使用指南
- API 参考文档
- 开发者贡献指南

### 测试
- 单元测试框架（Vitest）
- E2E 测试框架（Playwright）
- 测试覆盖率报告

### 视频工作站
- Electron + React 架构设计
- electron-vite 构建系统
- 完整的用户文档体系
- 项目管理、编辑器、设置等文档

### 开发工具
- ESLint + Prettier 代码规范
- TypeScript 严格模式
- VitePress 文档站点
- TypeDoc API 文档生成
