# 渲染问题 FAQ

关于 Kinema 渲染相关的常见问题解答。

---

## WebGPU vs Canvas2D 如何选择？

### 问题

Kinema 支持 WebGPU 和 Canvas2D 两种渲染器，应该如何选择？

### 回答

**渲染器对比：**

| 特性           | Canvas2D | WebGPU |
| -------------- | -------- | ------ |
| **浏览器支持** | 广泛     | 有限   |
| **性能**       | 中等     | 高     |
| **3D 支持**    | 有限     | 完整   |
| **着色器**     | 不支持   | 支持   |
| **计算着色器** | 不支持   | 支持   |
| **学习曲线**   | 简单     | 复杂   |
| **调试工具**   | 完善     | 有限   |

**选择建议：**

### 使用 Canvas2D 的情况：

```typescript
// ✅ 最大兼容性
const scene = createScene({
  renderer: 'canvas2d',
});

// 适用场景：
// - 需要支持旧浏览器
// - 简单的 2D 动画
// - 快速原型开发
// - 不需要高级图形功能
```

### 使用 WebGPU 的情况：

```typescript
// ✅ 最佳性能
const scene = createScene({
  renderer: 'webgpu',
});

// 适用场景：
// - 需要高性能渲染
// - 大量对象或粒子
// - 3D 渲染
// - 自定义着色器
// - GPU 计算
```

### 自动选择（推荐）：

```typescript
// ✅ 让 Kinema 自动选择
const scene = createScene({
  renderer: 'auto', // WebGPU > Canvas2D
});

// 自动检测逻辑：
// 1. 检查 WebGPU 支持
// 2. 如果支持，使用 WebGPU
// 3. 否则，使用 Canvas2D
```

**运行时切换：**

```typescript
async function switchRenderer(): Promise<void> {
  const currentScene = createScene({ renderer: 'canvas2d' });

  // 检测 WebGPU 支持
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        console.log('切换到 WebGPU');
        // 重新创建场景使用 WebGPU
        const newScene = createScene({
          renderer: 'webgpu',
        });
        return newScene;
      }
    } catch (error) {
      console.warn('WebGPU 不可用，继续使用 Canvas2D');
    }
  }

  return currentScene;
}
```

---

## 为什么渲染结果不正确？

### 问题

动画渲染结果与预期不符，可能是什么原因？

### 回答

**常见问题和解决方案：**

### 1. 坐标系统错误

**症状：** 对象位置不正确

**解决方案：**

```typescript
// Kinema 使用笛卡尔坐标系
// Y 轴向上为正（与 Canvas 相反）
// 原点在屏幕中心

// 正确的坐标理解
const origin = { x: 0, y: 0, z: 0 }; // 屏幕中心
const right = { x: 1, y: 0, z: 0 }; // 向右
const up = { x: 0, y: 1, z: 0 }; // 向上
const forward = { x: 0, y: 0, z: 1 }; // 向前（屏幕外）

// 转换 Canvas 坐标到 Kinema 坐标
function canvasToKinema(x: number, y: number, width: number, height: number): Point3D {
  return {
    x: (x - width / 2) / (width / 2), // 归一化 X
    y: -(y - height / 2) / (height / 2), // 归一化 Y（取反）
    z: 0,
  };
}
```

### 2. 变换顺序错误

**症状：** 对象变换不符合预期

**解决方案：**

```typescript
// Kinema 变换顺序：平移 → 旋转 → 缩放
// 这是最常见的变换顺序

const obj = VectorObject.rectangle(1, 1)
  .withPosition({ x: 2, y: 0, z: 0 }) // 先平移
  .withRotation({ x: 0, y: 0, z: 45 }) // 再旋转
  .withScale({ x: 1.5, y: 1.5, z: 1 }); // 最后缩放

// 如果需要不同的变换顺序，使用组合变换
function combineTransforms(position: Point3D, rotation: Point3D, scale: Point3D): Transform {
  // 应用自定义变换顺序
  return {
    position,
    rotation,
    scale,
    opacity: 1,
  };
}
```

### 3. Z-Index 问题

**症状：** 对象渲染顺序不正确

**解决方案：**

```typescript
// Kinema 使用 z_index 控制渲染顺序
// 值越大，越靠前渲染

const background = circle.withZIndex(0);
const middle = square.withZIndex(1);
const foreground = triangle.withZIndex(2);

// 添加到场景时，会按 z_index 自动排序
scene.addObjects(background, middle, foreground);

// 渲染顺序：background → middle → foreground
```

### 4. 缓存状态问题

**症状：** 状态更新后渲染不变化

**解决方案：**

```typescript
// Kinema 使用不可变数据模式
// 所有修改都会返回新实例

let scene = createScene();

// ✅ 正确：使用返回的新实例
scene = scene.addObject(circle);
scene = scene.schedule(animation, 0);

// ❌ 错误：期望原地修改
scene.addObject(circle); // 这样不会修改 scene！
```

---

## 如何处理透明度和混合模式？

### 问题

如何实现半透明效果和不同的混合模式？

### 回答

### 透明度处理

```typescript
// 设置对象透明度
const semiTransparentCircle = VectorObject.circle(1)
  .withOpacity(0.5) // 50% 透明
  .withStyles(new Map([['fillColor', '#3498db']]));

// 动画透明度
const fadeOut = new FadeOutAnimation(circle, {
  duration: 1,
  easing: smooth,
});

// 自定义透明度动画
const customFade = new TransformAnimation(
  circle,
  {
    id: circle.getState().id,
    transform: {
      position: circle.getState().transform.position,
      rotation: circle.getState().transform.rotation,
      scale: circle.getState().transform.scale,
      opacity: 0.3, // 目标透明度
    },
    visible: true,
    z_index: 0,
    styles: new Map(),
  },
  {
    duration: 1,
    easing: smooth,
  },
);
```

### 混合模式

```typescript
// Kinema 支持多种混合模式
enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply', // 正片叠底
  Screen = 'screen', // 滤色
  Overlay = 'overlay', // 叠加
  Darken = 'darken', // 变暗
  Lighten = 'lighten', // 变亮
  ColorDodge = 'color-dodge', // 颜色减淡
  ColorBurn = 'color-burn', // 颜色加深
  HardLight = 'hard-light', // 强光
  SoftLight = 'soft-light', // 柔光
  Difference = 'difference', // 差值
  Exclusion = 'exclusion', // 排除
}

// 使用混合模式
const blendedObject = circle.withStyles(
  new Map([
    ['fillColor', '#3498db'],
    ['blendMode', BlendMode.Multiply],
  ]),
);

// Canvas2D 混合模式
if (renderer instanceof Canvas2DRenderer) {
  renderer.setGlobalBlendOperation('multiply', 'screen');
}

// WebGPU 混合模式
const blendState = {
  color: {
    srcFactor: 'src-alpha',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
  alpha: {
    srcFactor: 'one',
    dstFactor: 'one-minus-src-alpha',
    operation: 'add',
  },
};
```

---

## 为什么有些颜色显示不正确？

### 问题

设置的颜色与实际显示的颜色不一致。

### 回答

### 常见颜色问题

### 1. 颜色格式问题

```typescript
// ✅ 支持的颜色格式
const validColors = [
  '#3498db', // HEX
  '#3498dbff', // HEX with alpha
  'rgb(52, 152, 219)', // RGB
  'rgba(52, 152, 219, 1)', // RGBA
  'hsl(204, 70%, 53%)', // HSL
  'hsla(204, 70%, 53%, 1)', // HSLA
];

// 使用颜色
const obj = VectorObject.circle(1).withStyles(
  new Map([
    ['fillColor', '#3498db'], // 使用标准颜色
    ['strokeColor', 'rgba(52, 152, 219, 0.5)'],
  ]),
);
```

### 2. 颜色空间问题

```typescript
// WebGPU 和 Canvas2D 使用不同的颜色空间
// WebGPU 默认使用 sRGB
// Canvas2D 使用 sRGB

// 确保颜色一致
function convertToSRGB(color: string): string {
  // 如果颜色是其他颜色空间，转换为 sRGB
  // 这里简化实现
  return color;
}

const obj = VectorObject.circle(1).withStyles(new Map([['fillColor', convertToSRGB('#3498db')]]));
```

### 3. 透明度混合

```typescript
// 半透明颜色会与背景色混合
const backgroundColor = '#000000';
const foregroundColor = 'rgba(255, 255, 255, 0.5)';

// 实际显示的颜色是两者的混合
// 在黑色背景上，50% 白色显示为灰色
```

### 4. HDR 和宽色域

```typescript
// 检测 HDR 支持
function checkHDRSupport(): boolean {
  // WebGPU 支持 HDR
  if (navigator.gpu) {
    // 检查 swap chain 是否支持 HDR
    return true;
  }
  return false;
}

// 使用 HDR 颜色
const hdrColor = {
  r: 1.5, // 超过 1.0 的值
  g: 1.0,
  b: 0.8,
  a: 1.0,
};
```

---

## 如何处理高 DPI 屏幕？

### 问题

在高 DPI（Retina）屏幕上渲染模糊或不清晰。

### 回答

### DPI 缩放处理

```typescript
// 获取设备 DPI
function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

// 配置场景以支持高 DPI
const dpr = getDevicePixelRatio();

const scene = createScene({
  width: 1920 * dpr, // 乘以 DPI 缩放
  height: 1080 * dpr,
  dpi: dpr,
});

// Canvas2D 渲染器 DPI 处理
if (renderer instanceof Canvas2DRenderer) {
  const canvas = renderer.getCanvas();

  // 设置 canvas 实际尺寸
  canvas.width = 1920 * dpr;
  canvas.height = 1080 * dpr;

  // 设置 canvas CSS 尺寸
  canvas.style.width = '1920px';
  canvas.style.height = '1080px';

  // 缩放上下文
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
}
```

### WebGPU DPI 处理

```typescript
// WebGPU 渲染器 DPI 处理
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const context = canvas.getContext('webgpu') as GPUCanvasContext;

const dpr = getDevicePixelRatio();

// 配置 swap chain
context.configure({
  device,
  format: 'bgra8unorm-srgb',
  alphaMode: 'premultiplied',
  // DPI 处理
  // WebGPU 自动处理 DPI 缩放
});
```

### 动态 DPI 变化

```typescript
// 监听 DPI 变化
window.matchMedia('screen and (min-resolution: 2dppx)').addEventListener('change', (e) => {
  if (e.matches) {
    console.log('高 DPI 屏幕');
    handleHighDPI();
  } else {
    console.log('普通 DPI 屏幕');
    handleNormalDPI();
  }
});

function handleHighDPI(): void {
  const dpr = getDevicePixelRatio();
  // 重新配置场景
  reconfigureScene(dpr);
}

function handleNormalDPI(): void {
  const dpr = 1;
  reconfigureScene(dpr);
}
```

---

## 相关文档

- [渲染问题 FAQ](./rendering.md) - 渲染相关问题
- [性能问题 FAQ](./performance.md) - 性能相关问题
- [故障排除 FAQ](./troubleshooting.md) - 故障排除指南
- [WebGPU 文档](https://gpuweb.github.io/gpuweb/) - WebGPU 规范
