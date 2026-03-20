# 快速开始

本指南将帮助你快速上手 AniMaker 动画渲染框架。

## 安装

```bash
# 使用 npm
npm install @animaker/core

# 使用 yarn
yarn add @animaker/core

# 使用 pnpm
pnpm add @animaker/core
```

## 第一个动画

让我们创建一个简单的淡入动画：

```typescript
import { Animator, CanvasRenderer, Tween } from '@animaker/core';

// 1. 创建渲染器
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas);

// 2. 创建动画器
const animator = new Animator({ renderer });

// 3. 创建补间动画
const tween = new Tween({
  target: { opacity: 0 },
  to: { opacity: 1 },
  duration: 1000,
  easing: 'easeInOutQuad',
});

// 4. 播放动画
animator.add(tween);
animator.play();
```

## 理解核心概念

AniMaker 由以下几个核心部分组成：

### 1. 渲染器 (Renderer)
负责将动画内容渲染到不同的后端（Canvas、WebGL、SVG）。

### 2. 动画器 (Animator)
动画的主控制器，管理时间轴和动画队列。

### 3. 补间 (Tween)
定义从起始状态到结束状态的过渡。

### 4. 时间轴 (Timeline)
组织多个动画，支持序列、并行等复杂编排。

## 下一步

- 阅读核心概念了解更多细节
- 查看示例集合获取实战代码
- 浏览 API 参考了解完整接口
