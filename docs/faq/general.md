# 一般问题 FAQ

关于 Kinema 框架的基础问题解答。

---

## Kinema 是什么？

### 问题

Kinema 是什么？它解决了什么问题？

### 回答

**Kinema** 是一个现代化的 TypeScript 动画渲染框架，专为创建高性能、可交互的 2D/3D 动画而设计。

**核心特点：**

1. **类型安全** - 完整的 TypeScript 支持，编译时捕获错误
2. **高性能** - 基于 WebGPU 和 Canvas2D 的渲染后端
3. **跨平台** - 在浏览器中运行，支持导出为视频
4. **可扩展** - 插件系统支持自定义功能
5. **现代化架构** - 不可变数据、函数式编程风格

**适用场景：**

- 📺 教育视频和教程
- 🎮 游戏动画和特效
- 📊 数据可视化动画
- 🎨 创意编程和艺术作品
- 📱 交互动画和用户体验

**代码示例：**

```typescript
import { createScene, VectorObject } from '@kinema/core';
import { FadeInAnimation, MoveAnimation } from '@kinema/core/animation';
import { smooth } from '@kinema/core/easing';

// 创建场景
const scene = createScene({
  width: 1920,
  height: 1080,
  fps: 60,
});

// 创建对象
const circle = VectorObject.circle(1)
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#3498db']]));

// 添加到场景
scene.addObject(circle);

// 创建动画
const fadeIn = new FadeInAnimation(circle, { duration: 1, easing: smooth });
const move = new MoveAnimation(
  circle,
  { x: 2, y: 0, z: 0 },
  {
    duration: 1,
    easing: smooth,
  },
);

// 调度动画
scene.schedule(fadeIn, 0); // 立即开始淡入
scene.schedule(move, 1); // 1秒后移动
```

---

## Kinema 与 Manim 有什么区别？

### 问题

我已经熟悉 Manim，为什么要切换到 Kinema？它们有什么主要区别？

### 回答

| 特性         | Manim           | Kinema          |
| ------------ | --------------- | --------------- |
| **语言**     | Python          | TypeScript      |
| **运行环境** | 本地渲染        | 浏览器/本地     |
| **类型安全** | ❌ 动态类型     | ✅ 静态类型     |
| **实时预览** | ❌ 需要重新渲染 | ✅ 即时查看     |
| **Web 集成** | ❌ 不支持       | ✅ 原生支持     |
| **性能**     | 中等            | 高（WebGPU）    |
| **学习曲线** | 中等            | 需要 TypeScript |
| **生态系统** | 成熟            | 发展中          |

**Kinema 的优势：**

1. **类型安全**

```typescript
// TypeScript 在编译时捕获错误
const move = new MoveAnimation(
  circle,
  { x: 2, y: 0, z: 0 },
  {
    duration: 1,
    easing: smooth,
  },
);

// 错误：类型不匹配会在编译时报错
// const move = new MoveAnimation(circle, "invalid", { duration: 1 });
```

2. **浏览器运行**

```typescript
// 直接在浏览器中运行和预览
// 无需等待渲染完成
```

3. **现代开发工具**

```typescript
// 完整的 IDE 支持
// 代码补全、类型检查、重构工具
```

4. **Web 集成**

```typescript
// 可以与 React、Vue 等框架集成
// 创建交互式动画
```

---

## Kinema 是免费的吗？

### 问题

Kinema 是开源免费的吗？可以用于商业项目吗？

### 回答

**是的，Kinema 是完全免费和开源的！**

**许可证：**

- 📜 **MIT 许可证** - 最宽松的开源许可证
- ✅ 可以用于商业项目
- ✅ 可以修改和分发
- ✅ 可以用于闭源项目
- ❌ 不需要公开你的源代码

**使用场景：**

- 个人项目 ✅
- 商业项目 ✅
- 教育用途 ✅
- 修改和二次开发 ✅
- 分发和销售 ✅

**注意事项：**

虽然 Kinema 本身是 MIT 许可，但：

- 某些插件可能有不同的许可证
- 第三方库和依赖项需要遵守各自的许可证
- 建议在商业使用前审查所有依赖项

---

## 支持哪些浏览器？

### 问题

Kinema 支持哪些浏览器？需要什么版本？

### 回答

**浏览器支持：**

| 浏览器        | WebGPU  | Canvas2D | 最低版本      |
| ------------- | ------- | -------- | ------------- |
| Chrome        | ✅      | ✅       | 113+ (WebGPU) |
| Edge          | ✅      | ✅       | 113+ (WebGPU) |
| Firefox       | ⚠️ 部分 | ✅       | 最新版        |
| Safari        | ❌      | ✅       | 最新版        |
| Opera         | ✅      | ✅       | 99+ (WebGPU)  |
| Mobile Chrome | ⚠️ 部分 | ✅       | 最新版        |
| Mobile Safari | ❌      | ✅       | iOS 16+       |

**推荐配置：**

- **最佳体验** - Chrome 113+ / Edge 113+（WebGPU 支持）
- **兼容性** - 使用 Canvas2D 后端
- **移动端** - 使用 Canvas2D 后端

**检测 WebGPU 支持：**

```typescript
async function checkWebGPUSupport(): Promise<boolean> {
  if (!navigator.gpu) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

// 使用
if (await checkWebGPUSupport()) {
  console.log('WebGPU 可用');
  // 使用 WebGPU 渲染器
} else {
  console.log('WebGPU 不可用，使用 Canvas2D');
  // 使用 Canvas2D 渲染器
}
```

**降级策略：**

Kinema 会自动降级到 Canvas2D：

```typescript
import { createScene } from '@kinema/core';

const scene = createScene({
  width: 1920,
  height: 1080,
  renderer: 'auto', // 自动选择：WebGPU > WebGL > Canvas2D
});
```

---

## 需要什么技术背景？

### 问题

使用 Kinema 需要什么技术背景？需要学习 TypeScript 吗？

### 回答

**必需技能：**

1. **JavaScript / TypeScript 基础**
   - 变量、函数、类
   - 异步编程（Promise、async/await）
   - ES6+ 语法

2. **基本编程概念**
   - 函数调用
   - 对象和数组
   - 错误处理

**推荐技能：**

1. **TypeScript 经验**（强烈推荐）
   - 类型注解
   - 接口和类型
   - 泛型（可选）

2. **动画基础**（有帮助但不是必需）
   - 缓动函数
   - 时间轴概念
   - 帧率和时长

3. **Canvas/WebGL 基础**（高级功能）
   - 2D/3D 坐标系统
   - 变换矩阵
   - 着色器（WebGPU）

**学习路径：**

```typescript
// 1. 从简单开始
import { createScene, VectorObject } from '@kinema/core';
import { FadeInAnimation } from '@kinema/core/animation';

const scene = createScene();
const circle = VectorObject.circle(1);
scene.addObject(circle);

// 2. 添加动画
const fadeIn = new FadeInAnimation(circle, { duration: 1 });
scene.schedule(fadeIn, 0);

// 3. 逐步学习更复杂的功能
// - 动画组合
// - 自定义对象
// - 性能优化
```

**学习资源：**

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [JavaScript MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [Kinema 快速开始](../guide/getting-started.md)
- [Kinema 动画教程](../guide/animation-basics.md)

---

## 可以在商业项目中使用吗？

### 问题

Kinema 可以在商业项目中使用吗？有什么限制？

### 回答

**是的，完全可以用于商业项目！**

**MIT 许可证允许：**

✅ **可以做的事：**

- 在商业产品中使用
- 修改源代码
- 分发修改后的版本
- 用于闭源项目
- 出售基于 Kinema 的产品
- 在公司内部使用

❌ **不能做的事：**

- 起诉开发者
- 要求责任担保

**示例场景：**

1. **商业视频制作**

```typescript
// 创建商业视频
const video = createCommercialVideo();
exportVideo(video, 'commercial.mp4');
// ✅ 完全合法
```

2. **SaaS 产品**

```typescript
// 在 SaaS 产品中使用
class MyAnimationService {
  createAnimation(config: Config) {
    return createScene(config);
  }
}
// ✅ 可以作为服务提供
```

3. **企业内部工具**

```typescript
// 企业内部动画工具
const internalTool = new AnimationTool();
// ✅ 可以在企业内部使用
```

**最佳实践：**

```typescript
// 1. 在项目中注明使用的库
package.json:
{
  "name": "my-project",
  "dependencies": {
    "@kinema/core": "^1.0.0"  // MIT 许可
  }
}

// 2. 在文档中提及
// "本产品使用 Kinema 动画框架 (MIT 许可)"

// 3. 遵守第三方库的许可证
// 检查所有依赖项的许可证
```

---

## Kinema 是 React 专用的吗？

### 问题

Kinema 只能在 React 项目中使用吗？支持其他框架吗？

### 回答

**不，Kinema 是框架无关的！**

**支持的使用方式：**

1. **纯 JavaScript / TypeScript**

```typescript
import { createScene } from '@kinema/core';

// 独立使用
const scene = createScene();
```

2. **React 集成**

```tsx
import { Scene } from '@kinema/react';

function App() {
  return (
    <Scene width={1920} height={1080}>
      {/* 动画内容 */}
    </Scene>
  );
}
```

3. **Vue 集成**

```vue
<template>
  <div ref="canvasRef"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { createScene } from '@kinema/core';

const canvasRef = ref<HTMLCanvasElement>();

onMounted(() => {
  const scene = createScene({
    canvas: canvasRef.value,
  });
});
</script>
```

4. **Angular 集成**

```typescript
@Component({
  selector: 'app-animation',
  template: '<canvas #canvas></canvas>',
})
export class AnimationComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    const scene = createScene({
      canvas: this.canvas.nativeElement,
    });
  }
}
```

5. **Svelte 集成**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createScene } from '@kinema/core';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const scene = createScene({ canvas });
  });
</script>

<canvas bind:this={canvas}></canvas>
```

**框架无关的优势：**

- ✅ 灵活集成到任何项目
- ✅ 小巧的核心库
- ✅ 可选的框架绑定
- ✅ 支持原生 JavaScript 项目

---

## 如何开始学习 Kinema？

### 问题

我完全没有动画编程经验，应该如何开始学习 Kinema？

### 回答

**推荐学习路径：**

**第 1 步：准备环境**

```bash
# 创建新项目
npm create vite@latest my-animation -- --template vanilla-ts

# 进入项目目录
cd my-animation

# 安装 Kinema
npm install @kinema/core
```

**第 2 步：第一个动画**

```typescript
// src/main.ts
import { createScene, VectorObject } from '@kinema/core';
import { FadeInAnimation } from '@kinema/core/animation';
import { smooth } from '@kinema/core/easing';

// 创建场景
const scene = createScene({
  width: 1920,
  height: 1080,
  fps: 60,
});

// 创建对象
const circle = VectorObject.circle(1)
  .withPosition({ x: 0, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#3498db']]));

// 添加到场景
scene.addObject(circle);

// 创建动画
const fadeIn = new FadeInAnimation(circle, {
  duration: 1,
  easing: smooth,
});

scene.schedule(fadeIn, 0);

// 渲染循环
let lastTime = 0;
function animate(time: number) {
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  const updatedScene = scene.updateTo(time / 1000);
  renderer.render(updatedScene.getObjects());

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

**第 3 步：学习资源**

1. 📖 [快速开始指南](../guide/getting-started.md)
2. 🎓 [动画创建入门](../guide/animation-basics.md)
3. 💡 [示例代码](../examples/)
4. 🔧 [API 参考](../api/)

**第 4 步：实践项目**

从简单到复杂：

1. 创建移动的圆形
2. 添加旋转动画
3. 组合多个动画
4. 创建自定义形状
5. 添加交互功能

**学习技巧：**

```typescript
// 1. 从现有示例开始
// 修改参数，观察变化

// 2. 使用 TypeScript 类型提示
const move = new MoveAnimation(
  circle, // IDE 会提示类型
  { x: 2, y: 0, z: 0 }, // IDE 会验证结构
  { duration: 1 }, // IDE 会显示所有选项
);

// 3. 查看类型定义
// Ctrl+Click (Cmd+Click) 跳转到定义

// 4. 使用浏览器调试工具
console.log('Scene state:', scene.getState());
```

---

## 相关文档

- [快速开始](../guide/getting-started.md) - 快速入门指南
- [核心概念](../guide/concepts.md) - 理解核心概念
- [性能问题 FAQ](./performance.md) - 性能相关问题
- [渲染问题 FAQ](./rendering.md) - 渲染相关问题
- [故障排除 FAQ](./troubleshooting.md) - 故障排除指南
