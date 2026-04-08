# 迁移指南

本指南帮助你从其他动画库和框架迁移到 Kinema。

## 目录

- [从 Manim 迁移](./manim.md) - 从 Python Manim 迁移
- [从 GSAP 迁移](./gsap.md) - 从 GSAP 迁移
- [从 Framer Motion 迁移](./framer-motion.md) - 从 Framer Motion 迁移

---

## 为什么选择 Kinema？

### 与其他框架对比

| 特性       | Kinema          | Manim        | GSAP       | Framer Motion |
| ---------- | --------------- | ------------ | ---------- | ------------- |
| 语言       | TypeScript      | Python       | JavaScript | React         |
| 性能       | 高（WebGPU）    | 中           | 高         | 高            |
| 类型安全   | ✅ 完整         | ❌           | ⚠️ 部分    | ✅ 完整       |
| 学习曲线   | 中等            | 中等         | 简单       | 简单          |
| 渲染后端   | WebGPU/Canvas2D | Cairo/OpenGL | DOM/SVG    | DOM/SVG       |
| 视频导出   | ✅ 原生支持     | ✅ 原生支持  | ⚠️ 需插件  | ⚠️ 需插件     |
| 3D 支持    | ✅ 原生         | ⚠️ 有限      | ❌         | ❌            |
| 粒子系统   | ✅ 原生         | ⚠️ 手动实现  | ❌         | ❌            |
| 物理模拟   | ✅ 可扩展       | ⚠️ 手动实现  | ⚠️ 需插件  | ⚠️ 需插件     |
| 浏览器运行 | ✅ 是           | ❌ 仅本地    | ✅ 是      | ✅ 是         |

### Kinema 的优势

**1. 类型安全**

```typescript
// 完整的 TypeScript 类型推断
const scene: Scene = createScene();
const circle: CircleObject = VectorObject.circle(1);
const move: MoveAnimation = new MoveAnimation(circle, { x: 2, y: 0, z: 0 });
```

**2. 现代化架构**

- 基于 WebGPU 的高性能渲染
- 不可变数据模式
- 函数式编程风格
- 完整的插件系统

**3. 跨平台**

- 在浏览器中直接运行
- 支持导出为视频
- 适用于桌面和移动设备

**4. 易于调试**

- 内置性能监控
- 详细的错误信息
- 可视化调试工具

---

## 迁移路径

根据你的背景选择合适的迁移路径：

### 从 Manim 迁移

如果你：

- 熟悉 Python 和 Manim
- 需要创建数学动画
- 想要更好的性能

**推荐步骤：**

1. 阅读 [从 Manim 迁移](./manim.md)
2. 学习 TypeScript 基础
3. 理解 Kinema 的对象模型
4. 从简单动画开始迁移

### 从 GSAP 迁移

如果你：

- 熟悉 GSAP 的时间轴概念
- 需要更强大的功能
- 想要类型安全

**推荐步骤：**

1. 阅读 [从 GSAP 迁移](./gsap.md)
2. 了解动画组合差异
3. 学习缓动函数映射
4. 逐步替换现有动画

### 从 Framer Motion 迁移

如果你：

- 使用 React 开发
- 需要更灵活的动画
- 想要支持 3D

**推荐步骤：**

1. 阅读 [从 Framer Motion 迁移](./framer-motion.md)
2. 理解组件到对象的映射
3. 学习变体转换
4. 集成到 React 项目

---

## 快速参考

### 术语对照

| 概念 | Manim      | GSAP     | Framer Motion | Kinema         |
| ---- | ---------- | -------- | ------------- | -------------- |
| 场景 | Scene      | Timeline | motion        | Scene          |
| 对象 | Mobject    | Target   | Component     | RenderObject   |
| 动画 | Animation  | Tween    | Transition    | Animation      |
| 缓动 | rate_func  | ease     | ease          | easing         |
| 组合 | Succession | Timeline | Variants      | AnimationGroup |
| 渲染 | Render     | Render   | Render        | render         |

### 代码模式对照

**创建对象：**

```typescript
// Manim
circle = Circle()

// GSAP
// 直接操作 DOM 元素

// Framer Motion
<motion.circle />

// Kinema
const circle = VectorObject.circle(1)
```

**创建动画：**

```typescript
// Manim
play(Create(circle))

// GSAP
gsap.to(circle, { x: 100, duration: 1 })

// Framer Motion
<motion.div animate={{ x: 100 }} />

// Kinema
const move = new MoveAnimation(circle, { x: 2, y: 0, z: 0 }, { duration: 1 })
```

**组合动画：**

```typescript
// Manim
play(Create(circle), FadeIn(square));

// GSAP
const tl = gsap.timeline();
tl.to(circle, { x: 100 }).to(square, { opacity: 1 });

// Framer Motion
// 使用 variants 或多个 motion 组件

// Kinema
const group = new AnimationGroup(
  circle,
  [new FadeInAnimation(circle), new FadeInAnimation(square)],
  CompositionType.Parallel,
);
```

---

## 迁移检查清单

### 迁移前

- [ ] 备份现有项目
- [ ] 了解 TypeScript 基础
- [ ] 安装 Kinema
- [ ] 阅读相关迁移指南

### 迁移中

- [ ] 创建项目结构
- [ ] 迁移基础对象
- [ ] 迁移动画逻辑
- [ ] 测试动画效果

### 迁移后

- [ ] 性能优化
- [ ] 代码重构
- [ ] 文档更新
- [ ] 团队培训

---

## 获取帮助

迁移过程中遇到问题？

1. **查看文档** - 本指南和 API 参考
2. **查看示例** - [示例集合](../../examples/)
3. **提交问题** - [GitHub Issues](https://github.com/your-username/kinema/issues)
4. **社区讨论** - [Discussions](https://github.com/your-username/kinema/discussions)

---

## 下一步

选择适合你的迁移指南：

- [从 Manim 迁移 →](./manim.md)
- [从 GSAP 迁移 →](./gsap.md)
- [从 Framer Motion 迁移 →](./framer-motion.md)

或直接开始使用 Kinema：

- [快速开始](../getting-started.md)
- [动画创建入门](../animation-basics.md)
- [核心概念](../concepts.md)
