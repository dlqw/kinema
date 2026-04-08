# 故障排除 FAQ

关于 Kinema 常见错误和调试问题的解答。

---

## 常见错误及解决方案

### 错误：Cannot find module '@kinema/core'

**症状：**

```
Error: Cannot find module '@kinema/core'
```

**解决方案：**

1. 检查安装

```bash
# 检查 package.json
cat package.json | grep kinema

# 如果没有，重新安装
npm install @kinema/core
```

2. 清理缓存

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

3. 检查 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

---

### 错误：Type 'X' is not assignable to type 'Y'

**症状：**

```
Type 'CircleObject' is not assignable to type 'RenderObject'
```

**解决方案：**

1. 检查类型导入

```typescript
// ✅ 正确导入
import { RenderObject } from '@kinema/core';
import { CircleObject } from '@kinema/core/objects';

const circle: CircleObject = VectorObject.circle(1);
const obj: RenderObject = circle; // 可以赋值
```

2. 使用类型断言

```typescript
// 如果确定类型正确
const obj = unknownObject as RenderObject;
```

3. 检查泛型类型

```typescript
// ✅ 正确使用泛型
const animation: Animation<RenderObject> = new MoveAnimation(circle, ...);

// ✅ 或使用具体类型
const circleAnimation: Animation<CircleObject> = new MoveAnimation(circle, ...);
```

---

### 错误：Cannot read property 'getState' of undefined

**症状：**

```
TypeError: Cannot read property 'getState' of undefined
```

**解决方案：**

1. 检查对象是否存在

```typescript
// ✅ 添加存在性检查
const obj = scene.getObject(id);
if (obj) {
  const state = obj.getState();
  // 使用 state
} else {
  console.warn('Object not found:', id);
}
```

2. 使用可选链

```typescript
// ✅ 使用可选链操作符
const state = obj?.getState();
if (state) {
  // 使用 state
}
```

3. 检查场景初始化

```typescript
// ✅ 确保场景已正确初始化
let scene: Scene;
try {
  scene = createScene();
} catch (error) {
  console.error('Failed to create scene:', error);
}
```

---

### 错误：WebGPU not available

**症状：**

```
Error: WebGPU is not available in this browser
```

**解决方案：**

1. 检查浏览器支持

```typescript
// ✅ 检测 WebGPU 支持
async function checkWebGPU(): Promise<boolean> {
  if (!navigator.gpu) {
    console.warn('WebGPU not supported');
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch (error) {
    console.error('WebGPU error:', error);
    return false;
  }
}

// 使用
if (await checkWebGPU()) {
  const scene = createScene({ renderer: 'webgpu' });
} else {
  const scene = createScene({ renderer: 'canvas2d' });
}
```

2. 启用 WebGPU 标志

```typescript
// Chrome: 访问 chrome://flags
// 搜索 "WebGPU" 并启用
```

3. 降级到 Canvas2D

```typescript
// ✅ 自动降级
const scene = createScene({
  renderer: 'auto', // 自动选择可用渲染器
});
```

---

### 错误：Maximum call stack size exceeded

**症状：**

```
RangeError: Maximum call stack size exceeded
```

**解决方案：**

1. 检查无限递归

```typescript
// ❌ 错误：无限递归
class BadAnimation extends Animation {
  interpolate(elapsedTime: number): InterpolationResult {
    return this.interpolate(elapsedTime); // 无限递归！
  }
}

// ✅ 正确：终止条件
class GoodAnimation extends Animation {
  interpolate(elapsedTime: number): InterpolationResult {
    const alpha = elapsedTime / this.config.duration;

    if (alpha >= 1) {
      return { object: this.target, complete: true };
    }

    // 实际插值逻辑
    return { object: this.interpolateState(alpha), complete: false };
  }
}
```

2. 检查循环引用

```typescript
// ❌ 错误：循环引用
const obj1 = createObject();
const obj2 = createObject();
obj1.parent = obj2;
obj2.parent = obj1; // 循环引用！

// ✅ 正确：避免循环引用
const root = createObject();
const child1 = createObject();
const child2 = createObject();

root.addChild(child1);
root.addChild(child2);
```

3. 增加栈大小（不推荐）

```typescript
// 临时解决方案：增加 Node.js 栈大小
// node --stack-size=10000 your-script.js
```

---

### 错误：Memory allocation failed

**症状：**

```
Error: Out of memory
```

**解决方案：**

1. 释放不需要的资源

```typescript
// ✅ 及时释放资源
function cleanup(scene: Scene): Scene {
  const objects = scene.getObjects();

  // 移除不可见的对象
  const visibleObjects = objects.filter((obj) => obj.getState().visible);

  let cleanedScene = scene.clear();
  return cleanedScene.addObjects(...visibleObjects);
}
```

2. 使用对象池

```typescript
// ✅ 使用对象池减少内存分配
const pool = new ObjectPool();

// 使用对象
const obj = pool.acquire();

// 完成后释放
pool.release(obj);
```

3. 分批处理大数据

```typescript
// ✅ 分批处理
function processLargeData(data: unknown[], batchSize: number = 100): void {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    processBatch(batch);

    // 让出控制权，允许垃圾回收
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
```

---

## 如何调试动画？

### 问题

动画不按预期工作，如何调试？

### 回答

### 1. 使用日志调试

```typescript
// ✅ 添加调试日志
class DebuggableAnimation extends Animation {
  interpolate(elapsedTime: number): InterpolationResult {
    const result = super.interpolate(elapsedTime);

    // 输出调试信息
    console.log(`[${this.getName()}] t=${elapsedTime.toFixed(2)}`, {
      position: result.object.getState().transform.position,
      complete: result.complete,
    });

    return result;
  }
}
```

### 2. 使用性能分析器

```typescript
// ✅ 使用内置性能分析器
import { Profiler } from '@kinema/core';

const profiler = new Profiler();

profiler.start('animation-update');
scene.updateTo(elapsedTime);
profiler.end('animation-update');

const report = profiler.getResults();
console.log('Performance:', report);
```

### 3. 可视化调试

```typescript
// ✅ 可视化对象边界
function drawBoundingBox(obj: RenderObject, renderer: Renderer): void {
  const bbox = obj.getBoundingBox();

  renderer.pushMatrix();
  renderer.setStrokeColor('#FF0000');
  renderer.setLineWidth(0.01);

  // 绘制边界框
  renderer.strokeRect(bbox.min.x, bbox.min.y, bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);

  renderer.popMatrix();
}

// 渲染时绘制边界
objects.forEach((obj) => {
  renderer.render(obj);
  drawBoundingBox(obj, renderer); // 调试边界
});
```

### 4. 使用浏览器开发者工具

```typescript
// ✅ 集成浏览器开发者工具
function inspectObject(obj: RenderObject): void {
  const state = obj.getState();

  console.group(`Object: ${state.id}`);
  console.log('Position:', state.transform.position);
  console.log('Rotation:', state.transform.rotation);
  console.log('Scale:', state.transform.scale);
  console.log('Opacity:', state.transform.opacity);
  console.log('Visible:', state.visible);
  console.log('Z-Index:', state.z_index);
  console.groupEnd();
}

// 使用
inspectObject(circle);
```

---

## TypeScript 类型错误怎么办？

### 问题

TypeScript 报告各种类型错误，如何解决？

### 回答

### 1. 严格模式问题

```typescript
// ❌ 错误：类型不匹配
const position: Point3D = { x: 0, y: 0 }; // 缺少 z

// ✅ 正确：提供完整类型
const position: Point3D = { x: 0, y: 0, z: 0 };

// ✅ 或使用类型断言
const position = { x: 0, y: 0 } as Point3D;
```

### 2. 只读属性修改

```typescript
// ❌ 错误：不能修改只读属性
const obj = VectorObject.circle(1);
obj.getState().transform.position.x = 2; // 错误！

// ✅ 正确：使用 with 方法
const newObj = obj.withPosition({ x: 2, y: 0, z: 0 });
```

### 3. 泛型类型推断

```typescript
// ❌ 错误：类型推断失败
const animation = new MoveAnimation(circle, { x: 2 }, config);

// ✅ 正确：明确指定类型
const animation = new MoveAnimation<CircleObject>(circle, { x: 2, y: 0, z: 0 }, config);
```

### 4. 联合类型处理

```typescript
// ✅ 使用类型守卫
function isCircleObject(obj: RenderObject): obj is CircleObject {
  return 'getRadius' in obj;
}

if (isCircleObject(obj)) {
  const radius = obj.getRadius(); // 类型安全
}
```

---

## 构建失败如何处理？

### 问题

项目构建失败，如何排查和解决？

### 回答

### 1. 检查依赖版本

```bash
# 检查已安装的版本
npm list @kinema/core

# 更新到最新版本
npm update @kinema/core

# 或安装特定版本
npm install @kinema/core@latest
```

### 2. 清理构建缓存

```bash
# 清理构建缓存
npm run clean

# 或手动删除
rm -rf dist build .tsbuildinfo

# 重新构建
npm run build
```

### 3. 检查 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 4. 检查构建工具配置

```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@kinema/core': '/path/to/kinema/packages/core/src',
    },
  },
  build: {
    target: 'es2020',
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
  },
});
```

---

## 相关文档

- [一般问题 FAQ](./general.md) - 基础问题解答
- [性能问题 FAQ](./performance.md) - 性能相关问题
- [渲染问题 FAQ](./rendering.md) - 渲染相关问题
- [调试指南](../guide/debugging.md) - 详细调试指南
