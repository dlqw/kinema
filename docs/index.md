# AniMaker 动画渲染框架

> 一个现代化、高性能的 TypeScript 动画渲染框架

## 简介

AniMaker 是一个功能强大、易于使用的动画渲染框架，专为构建复杂的 2D/3D 动画应用而设计。它提供了：

- 🎨 **灵活的渲染引擎** - 支持 Canvas、WebGL 和 SVG 渲染后端
- ⚡ **高性能动画系统** - 基于时间轴的动画编排与插值
- 🔌 **插件化架构** - 可扩展的插件系统
- 📦 **TypeScript 原生支持** - 完整的类型定义和智能提示
- 🎯 **渐进式学习曲线** - 从简单到复杂的渐进式 API

## 快速开始

```bash
# 安装
npm install @animaker/core

# 创建你的第一个动画
import { Animator, CanvasRenderer } from '@animaker/core';

const animator = new Animator({
  renderer: new CanvasRenderer(canvas),
});

animator.play();
```

## 文档导航

- 📚 [入门教程](./guide/getting-started.md) - 快速了解 AniMaker
- 🎯 [核心概念](./guide/concepts.md) - 理解框架的核心概念
- 📖 [API 参考](./api/) - 完整的 API 文档
- 💡 [示例集合](./examples/) - 实战示例代码
- 🔌 [插件开发](./guide/plugins.md) - 开发自定义插件
- 🚀 [迁移指南](./guide/migration.md) - 从其他框架迁移

## 贡献

欢迎贡献！请阅读 [贡献指南](./contributing.md)

## 许可证

MIT License
