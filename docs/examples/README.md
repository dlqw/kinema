# 示例代码集合

本目录包含 Kinema 框架的可运行示例代码，每个示例都经过精心设计，展示了框架的各种功能。

## 目录结构

```
examples/
├── basic/                   # 基础示例
│   ├── circle.ts           # 旋转的圆形
│   └── fade.ts             # 淡入淡出效果
├── intermediate/            # 中级示例
│   ├── transform.ts        # 变换动画
│   └── composition.ts      # 动画组合
└── types.ts               # 示例类型定义
```

## 快速开始

### 运行单个示例

```typescript
// 导入示例
import { createRotatingCircleExample } from './basic/circle';

// 创建场景
const scene = createRotatingCircleExample();

// 使用渲染器渲染
import { renderToCanvas } from '@kinema/renderer';
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
renderToCanvas(canvas, scene, { autoplay: true });
```

### 批量运行示例

```typescript
import * as examples from './index';

// 运行所有基础示例
examples.runBasicExamples();

// 运行所有中级示例
examples.runIntermediateExamples();
```

## 示例说明

### 基础示例（basic/）

#### circle.ts - 旋转的圆形

展示内容：

- 创建带有填充和描边的圆形
- 应用旋转动画
- 使用不同缓动函数控制旋转速度
- 调度多个动画到时间线

可导出函数：

- `createRotatingCircleExample()` - 单个旋转圆形
- `createMultipleCirclesExample()` - 多个旋转圆形

#### fade.ts - 淡入淡出效果

展示内容：

- 创建淡入动画（透明度 0 → 1）
- 创建淡出动画（透明度 1 → 0）
- 组合淡入淡出效果
- 闪烁和脉冲效果
- 交叉淡入淡出

可导出函数：

- `createFadeExample()` - 基础淡入淡出
- `createBlinkExample()` - 闪烁效果
- `createPulseExample()` - 脉冲效果
- `createCrossFadeExample()` - 交叉淡入淡出
- `createCompleteFadeDemo()` - 完整演示

### 中级示例（intermediate/）

#### transform.ts - 变换动画

展示内容：

- 移动动画（MoveAnimation）
- 旋转动画（RotateAnimation）
- 缩放动画（ScaleAnimation）
- 组合多个变换
- 路径移动

可导出函数：

- `createMoveAnimationExample()` - 移动动画展示
- `createRotateAnimationExample()` - 旋转动画展示
- `createScaleAnimationExample()` - 缩放动画展示
- `createCombinedTransformExample()` - 组合变换（火箭发射）
- `createPathAnimationExample()` - 路径移动

#### composition.ts - 动画组合

展示内容：

- 并行动画（Parallel）
- 顺序动画（Sequence）
- 延迟动画（Lagged）
- 嵌套组合
- 复杂编排

可导出函数：

- `createParallelExample()` - 并行动画（车轮滚动）
- `createSequenceExample()` - 顺序动画（英雄入场）
- `createLaggedExample()` - 延迟动画（波浪效果）
- `createNestedCompositionExample()` - 嵌套组合（天体运行）
- `createComplexChoreographyExample()` - 复杂编排（舞蹈队形）

## 代码规范

所有示例代码遵循以下规范：

1. **TypeScript 严格模式** - 所有类型明确定义
2. **详细中文注释** - 每个关键步骤都有注释说明
3. **可编译性** - 代码可以独立编译通过
4. **模块化导出** - 每个示例函数都可以单独导入使用
5. **命名规范** - 使用清晰的函数和变量命名

## 示例模板

创建新示例时，请遵循以下模板：

```typescript
/**
 * 示例标题
 *
 * 简短描述示例的用途和展示内容
 *
 * @module examples/category/example-name
 */

import { createScene, Scene } from '../../../packages/core/src/types/scene';
import { VectorObject } from '../../../packages/core/src/types/objects';
// ... 其他导入

/**
 * 创建示例场景
 *
 * @returns 配置好动画的场景
 */
export function createExampleName(): Scene {
  // 第一步：创建场景
  const scene: Scene = createScene({
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    fps: 60,
  });

  // 第二步：创建对象
  const obj: VectorObject = VectorObject.circle(1, { x: 0, y: 0, z: 0 });

  // 第三步：创建动画
  // ...

  // 第四步：调度动画
  let currentScene: Scene = scene.addObject(obj);
  // currentScene = currentScene.schedule(animation);

  return currentScene;
}

/**
 * 主函数（用于直接运行）
 */
export function main(): void {
  console.log('示例名称');
  console.log('运行方式：');
  console.log('  const scene = createExampleName();');
}

if (require.main === module) {
  main();
}
```

## 贡献指南

欢迎贡献新的示例代码！请确保：

1. 代码遵循现有示例的风格和结构
2. 添加详细的中文注释
3. 更新本 README 文件
4. 确保代码可以编译通过
5. 在适当的位置添加类型定义

## 相关文档

- [动画创建入门教程](../guide/animation-basics.md)
- [核心概念](../guide/concepts.md)
- [API 参考](../api/)
