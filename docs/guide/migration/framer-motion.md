# 从 Framer Motion 迁移到 AniMaker

本指南帮助你从 React 的 Framer Motion 迁移到 AniMaker。

## 目录

- [概述](#概述)
- [概念对比](#概念对比)
- [API 映射](#api-映射)
- [代码转换示例](#代码转换示例)
- [React 集成](#react-集成)

---

## 概述

### 主要差异

| 方面 | Framer Motion | AniMaker |
|------|---------------|----------|
| **框架** | React | 框架无关 |
| **组件** | motion 组件 | RenderObject |
| **动画** | props / useAnimation | Animation 类 |
| **状态** | React State | 不可变对象 |
| **布局** | Layout API | 手动计算 |
| **手势** | Gesture API | 自定义实现 |

### AniMaker 的优势

1. **框架无关** - 可用于任何 JavaScript 项目
2. **3D 支持** - 原生 3D 渲染
3. **WebGPU** - 更好的性能
4. **粒子系统** - 内置粒子效果

---

## 概念对比

### motion 组件对应

```jsx
// Framer Motion
import { motion } from "framer-motion";

function MyComponent() {
  return (
    <motion.div
      animate={{ x: 100, opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    />
  );
}
```

```typescript
// AniMaker
import { createScene, VectorObject } from '@animaker/core';
import { TransformAnimation } from '@animaker/core/animation';
import { easeInOut } from '@animaker/core/easing';

const scene = createScene();
const div = VectorObject.rectangle(1, 1)
  .withPosition({ x: 0, y: 0, z: 0 })
  .withOpacity(0);

const animate = new TransformAnimation(div, {
  id: div.getState().id,
  transform: {
    position: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    opacity: 1
  },
  visible: true,
  z_index: 0,
  styles: new Map()
}, {
  duration: 1,
  easing: easeInOut
});

scene.schedule(animate, 0);
```

### useAnimation Hook 对应

```jsx
// Framer Motion
import { useAnimation } from "framer-motion";

function MyComponent() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      x: 100,
      transition: { duration: 1 }
    });
  }, []);

  return <motion.div animate={controls} />;
}
```

```typescript
// AniMaker + React
import { useEffect, useRef } from 'react';
import { useScene } from '@animaker/react';
import { MoveAnimation } from '@animaker/core/animation';

function MyComponent() {
  const scene = useScene();
  const animationRef = useRef<MoveAnimation | null>(null);

  useEffect(() => {
    const animation = new MoveAnimation(obj, { x: 2, y: 0, z: 0 }, {
      duration: 1
    });

    animationRef.current = animation;
    scene.schedule(animation, 0);
  }, []);

  return null;  // 渲染由 Scene 组件处理
}
```

---

## API 映射

### 动画属性

| Framer Motion | AniMaker | 说明 |
|---------------|----------|------|
| `animate` | Animation 类 | 动画定义 |
| `initial` | 初始状态 | 初始状态 |
| `exit` | FadeOutAnimation | 退出动画 |
| `transition` | AnimationConfig | 动画配置 |
| `whileHover` | 鼠标事件处理 | 悬停状态 |
| `whileTap` | 点击事件处理 | 点击状态 |
| `whileDrag` | 拖拽事件处理 | 拖拽状态 |

### Transition 配置

| Framer Motion | AniMaker | 说明 |
|---------------|----------|------|
| `duration` | `duration` | 持续时间 |
| `ease` | `easing` | 缓动函数 |
| `delay` | `delay` | 延迟 |
| `repeat` | 循环调度 | 重复次数 |
| `repeatType` | 循环类型 | 重复类型 |
| `yoyo` | `thereAndBack` | 往返动画 |

### Variants

| Framer Motion | AniMaker | 说明 |
|---------------|----------|------|
| `variants` | 配置对象 | 变体定义 |
| `initial="hidden"` | 初始状态 | 初始变体 |
| `animate="visible"` | 动画状态 | 目标变体 |
| `whileHover="hover"` | 悬停变体 | 悬停状态 |

### 手势

| Framer Motion | AniMaker | 说明 |
|---------------|----------|------|
| `onHoverStart` | 事件监听 | 悬停开始 |
| `onHoverEnd` | 事件监听 | 悬停结束 |
| `onTap` | 事件监听 | 点击 |
| `onPan` | 事件监听 | 拖拽 |
| `onPinch` | 事件监听 | 缩放 |

---

## 代码转换示例

### 示例 1: 基础动画

**Framer Motion 代码：**
```jsx
import { motion } from "framer-motion";

function BasicAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      style={{ width: 100, height: 100, background: "blue" }}
    />
  );
}
```

**AniMaker 代码：**
```typescript
import { createScene, VectorObject } from '@animaker/core';
import {
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  AnimationGroup,
  CompositionType
} from '@animaker/core/animation';
import { easeInOut } from '@animaker/core/easing';

const scene = createScene();

const box = VectorObject.rectangle(1, 1)
  .withPosition({ x: -2, y: 0, z: 0 })
  .withOpacity(0)
  .withStyles(new Map([['fillColor', '#3498db']]));

// 进入动画
const enter = new AnimationGroup(
  box,
  [
    new FadeInAnimation(box, { duration: 1, easing: easeInOut }),
    new MoveAnimation(box, { x: 0, y: 0, z: 0 }, { duration: 1, easing: easeInOut })
  ],
  CompositionType.Parallel
);

// 退出动画
const exit = new AnimationGroup(
  box,
  [
    new FadeOutAnimation(box, { duration: 1, easing: easeInOut }),
    new MoveAnimation(box, { x: 2, y: 0, z: 0 }, { duration: 1, easing: easeInOut })
  ],
  CompositionType.Parallel
);

// React 集成
import { useEffect } from 'react';
import { useScene } from '@animaker/react';

function BasicAnimation() {
  const scene = useScene();

  useEffect(() => {
    scene.addObject(box);
    scene.schedule(enter, 0);
  }, []);

  useEffect(() => {
    return () => {
      // 组件卸载时播放退出动画
      scene.schedule(exit, 0);
    };
  }, []);

  return null;  // 由 Scene 组件渲染
}
```

### 示例 2: Variants

**Framer Motion 代码：**
```jsx
import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
  hover: { scale: 1.2, transition: { duration: 0.2 } }
};

function VariantsExample() {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      style={{ width: 100, height: 100, background: "red" }}
    />
  );
}
```

**AniMaker 代码：**
```typescript
import { VectorObject } from '@animaker/core';
import {
  FadeInAnimation,
  MoveAnimation,
  ScaleAnimation,
  AnimationGroup,
  CompositionType
} from '@animaker/core/animation';
import { easeInOut, smooth } from '@animaker/core/easing';

// 定义变体配置
const variants = {
  hidden: {
    opacity: 0,
    position: { x: -2, y: 0, z: 0 }
  },
  visible: {
    opacity: 1,
    position: { x: 0, y: 0, z: 0 }
  },
  hover: {
    scale: { x: 1.2, y: 1.2, z: 1 }
  }
};

// 创建对象
const box = VectorObject.rectangle(1, 1)
  .withPosition(variants.hidden.position)
  .withOpacity(variants.hidden.opacity)
  .withStyles(new Map([['fillColor', '#e74c3c']]));

// 创建变体动画
const toVisible = new AnimationGroup(
  box,
  [
    new FadeInAnimation(box, { duration: 1, easing: easeInOut }),
    new MoveAnimation(box, variants.visible.position, { duration: 1, easing: easeInOut })
  ],
  CompositionType.Parallel
);

const toHover = new ScaleAnimation(box, variants.hover.scale, {
  duration: 0.2,
  easing: smooth
});

// React 集成
function VariantsExample() {
  const scene = useScene();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    scene.addObject(box);
    scene.schedule(toVisible, 0);
  }, []);

  useEffect(() => {
    if (isHovered) {
      scene.schedule(toHover, 0);
    }
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
}
```

### 示例 3: AnimatePresence

**Framer Motion 代码：**
```jsx
import { motion, AnimatePresence } from "framer-motion";

function List({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {item.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

**AniMaker 代码：**
```typescript
import { VectorObject, TextObject } from '@animaker/core';
import {
  FadeInAnimation,
  FadeOutAnimation,
  MoveAnimation,
  AnimationGroup,
  CompositionType
} from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

// 创建列表项
function createListItem(text: string, index: number): {
  textObj: TextObject;
  bgObj: RenderObject;
  enterAnim: Animation;
  exitAnim: Animation;
} {
  const bg = VectorObject.rectangle(4, 0.6)
    .withPosition({ x: 0, y: -index * 0.8, z: 0 })
    .withOpacity(0)
    .withStyles(new Map([['fillColor', '#ecf0f1']]));

  const text = TextObject.body(text)
    .withPosition({ x: 0, y: -index * 0.8, z: 0 })
    .withOpacity(0);

  // 进入动画
  const enter = new AnimationGroup(
    bg,
    [
      new FadeInAnimation(bg, { duration: 0.3, easing: smooth }),
      new FadeInAnimation(text, { duration: 0.3, easing: smooth }),
      new MoveAnimation(bg, { x: 0, y: -index * 0.8 + 0.2, z: 0 }, { duration: 0.3, easing: smooth }),
      new MoveAnimation(text, { x: 0, y: -index * 0.8 + 0.2, z: 0 }, { duration: 0.3, easing: smooth })
    ],
    CompositionType.Parallel
  );

  // 退出动画
  const exit = new AnimationGroup(
    bg,
    [
      new FadeOutAnimation(bg, { duration: 0.3, easing: smooth }),
      new FadeOutAnimation(text, { duration: 0.3, easing: smooth }),
      new MoveAnimation(bg, { x: 0, y: -index * 0.8 - 0.2, z: 0 }, { duration: 0.3, easing: smooth }),
      new MoveAnimation(text, { x: 0, y: -index * 0.8 - 0.2, z: 0 }, { duration: 0.3, easing: smooth })
    ],
    CompositionType.Parallel
  );

  return { textObj: text, bgObj: bg, enterAnim: enter, exitAnim: exit };
}

// React 集成
function List({ items }: { items: Array<{ id: string; text: string }> }) {
  const scene = useScene();
  const listItems = useRef<Map<string, ReturnType<typeof createListItem>>>(new Map());

  useEffect(() => {
    // 添加新项
    items.forEach((item, index) => {
      if (!listItems.current.has(item.id)) {
        const listItem = createListItem(item.text, index);
        listItems.current.set(item.id, listItem);

        scene.addObject(listItem.bgObj);
        scene.addObject(listItem.textObj);
        scene.schedule(listItem.enterAnim, 0);
      }
    });

    // 移除旧项
    listItems.current.forEach((listItem, id) => {
      if (!items.find(item => item.id === id)) {
        scene.schedule(listItem.exitAnim, 0);

        // 动画完成后移除
        setTimeout(() => {
          scene.removeObject(listItem.bgObj.getState().id);
          scene.removeObject(listItem.textObj.getState().id);
        }, 300);
      }
    });
  }, [items]);

  return null;
}
```

### 示例 4: Layout 动画

**Framer Motion 代码：**
```jsx
import { motion, LayoutGroup } from "framer-motion";

function LayoutExample() {
  const [items, setItems] = useState([1, 2, 3]);

  return (
    <LayoutGroup>
      {items.map(item => (
        <motion.div
          key={item}
          layout
          transition={{ duration: 0.5 }}
          style={{ width: 50, height: 50, background: "blue", margin: 10 }}
        />
      ))}

      <button onClick={() => setItems([...items, items.length + 1])}>
        Add
      </button>
    </LayoutGroup>
  );
}
```

**AniMaker 代码：**
```typescript
import { VectorObject } from '@animaker/core';
import { MoveAnimation, AnimationGroup, CompositionType } from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

// 计算布局
function calculateLayout(count: number): Point3D[] {
  const positions: Point3D[] = [];
  const spacing = 0.6;

  for (let i = 0; i < count; i++) {
    positions.push({
      x: (i % 5) * spacing - 1.2,
      y: -Math.floor(i / 5) * spacing,
      z: 0
    });
  }

  return positions;
}

// 创建项目
function createItem(id: number, position: Point3D) {
  return VectorObject.rectangle(0.5, 0.5)
    .withPosition(position)
    .withStyles(new Map([['fillColor', '#3498db']]));
}

// React 集成
function LayoutExample() {
  const scene = useScene();
  const [items, setItems] = useState([1, 2, 3]);
  const itemObjects = useRef<Map<number, RenderObject>>(new Map());

  useEffect(() => {
    const newLayout = calculateLayout(items.length);
    const animations: Animation[] = [];

    // 更新现有项目位置
    items.forEach((id, index) => {
      const newPosition = newLayout[index];
      const existing = itemObjects.current.get(id);

      if (existing) {
        // 创建移动动画到新位置
        const move = new MoveAnimation(existing, newPosition, {
          duration: 0.5,
          easing: smooth
        });
        animations.push(move);
      } else {
        // 创建新项目
        const obj = createItem(id, newPosition);
        itemObjects.current.set(id, obj);
        scene.addObject(obj);
      }
    });

    // 移除多余项目
    itemObjects.current.forEach((obj, id) => {
      if (!items.includes(id)) {
        scene.removeObject(obj.getState().id);
        itemObjects.current.delete(id);
      }
    });

    // 执行布局动画
    if (animations.length > 0) {
      const layoutAnimation = new AnimationGroup(
        items[0],
        animations,
        CompositionType.Parallel
      );
      scene.schedule(layoutAnimation, 0);
    }
  }, [items]);

  return (
    <button onClick={() => setItems([...items, items.length + 1])}>
      Add
    </button>
  );
}
```

---

## React 集成

### 安装 React 集成包

```bash
npm install @animaker/react
```

### Scene 组件

```tsx
import { Scene, useScene } from '@animaker/react';
import { VectorObject } from '@animaker/core';
import { FadeInAnimation } from '@animaker/core/animation';

function MyAnimation() {
  const scene = useScene();

  useEffect(() => {
    const circle = VectorObject.circle(1)
      .withPosition({ x: 0, y: 0, z: 0 })
      .withStyles(new Map([['fillColor', '#3498db']]));

    scene.addObject(circle);

    const fadeIn = new FadeInAnimation(circle, { duration: 1 });
    scene.schedule(fadeIn, 0);
  }, []);

  return null;
}

function App() {
  return (
    <Scene
      width={1920}
      height={1080}
      backgroundColor="#1a1a2e"
      fps={60}
    >
      <MyAnimation />
    </Scene>
  );
}
```

### useAnimation Hook

```typescript
import { useAnimation } from '@animaker/react';
import { MoveAnimation } from '@animaker/core/animation';
import { smooth } from '@animaker/core/easing';

function AnimatedBox() {
  const { target, animate } = useAnimation();

  useEffect(() => {
    // 移动动画
    animate(new MoveAnimation(target, { x: 2, y: 0, z: 0 }, {
      duration: 1,
      easing: smooth
    }));
  }, []);

  return null;
}
```

### usePresence Hook

```typescript
import { usePresence } from '@animaker/react';
import { FadeOutAnimation } from '@animaker/core/animation';

function ListItem({ onExit }: { onExit: () => void }) {
  const { target } = usePresence();

  useEffect(() => {
    const exitAnim = new FadeOutAnimation(target, { duration: 0.3 });

    // 监听动画完成
    const checkComplete = setInterval(() => {
      const result = exitAnim.interpolate(Date.now() / 1000);
      if (result.complete) {
        onExit();
        clearInterval(checkComplete);
      }
    }, 16);
  }, []);

  return null;
}
```

---

## 迁移检查清单

### 准备阶段

- [ ] 安装 AniMaker 和 React 集成包
- [ ] 设置 Scene 组件
- [ ] 了解 AniMaker 对象模型

### 迁移阶段

- [ ] 转换 motion 组件
- [ ] 转换 animate 属性
- [ ] 转换 variants
- [ ] 转换 AnimatePresence
- [ ] 转换手势处理

### 测试阶段

- [ ] 功能测试
- [ ] React 集成测试
- [ ] 性能测试

---

## 相关文档

- [动画创建入门](../animation-basics.md) - AniMaker 动画基础
- [React 集成](../../api/react.md) - React API 文档
- [自定义动画](../custom-animations.md) - 创建自定义动画
- [性能优化指南](../performance.md) - 性能优化建议
