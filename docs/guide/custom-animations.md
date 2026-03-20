# 自定义动画

本教程将指导你如何创建自定义动画类型，扩展现有动画系统，以及实现复杂的动画效果。

## 目录

- [动画基础架构](#动画基础架构)
- [创建简单自定义动画](#创建简单自定义动画)
- [复杂动画实现](#复杂动画实现)
- [动画组合模式](#动画组合模式)
- [性能优化技巧](#性能优化技巧)

---

## 动画基础架构

### Animation 基类

所有自定义动画都继承自 `Animation` 抽象基类：

```typescript
import type { Animation, AnimationConfig, InterpolationResult, RenderObject, Alpha } from '@animaker/core';

abstract class CustomAnimation<T extends RenderObject = RenderObject> implements Animation<T> {
  constructor(
    public readonly target: T,
    protected readonly config: AnimationConfig
  ) {}

  // 获取动画总时长（包括延迟）
  abstract getTotalDuration(): number;

  // 在给定时间点插值动画
  abstract interpolate(elapsedTime: number): InterpolationResult<T>;

  // 获取动画名称（用于调试）
  getName(): string {
    return this.config.name || this.constructor.name;
  }

  // 获取配置
  getConfig(): Readonly<AnimationConfig> {
    return this.config;
  }
}
```

### 核心概念

**插值（Interpolation）**: 在两个状态之间计算中间值的过程。

**缓动（Easing）**: 控制动画速度曲线的函数。

**时间管理**:
- `elapsedTime`: 从动画开始经过的时间
- `duration`: 动画持续时间
- `delay`: 开始前的延迟时间

---

## 创建简单自定义动画

### 示例 1: 抖动动画（Shake）

创建一个左右抖动的动画效果：

```typescript
import {
  Animation,
  AnimationConfig,
  InterpolationResult,
  RenderObject,
  generateObjectId
} from '@animaker/core';

interface ShakeConfig extends AnimationConfig {
  intensity?: number;    // 抖动强度
  frequency?: number;    // 抖动频率
}

class ShakeAnimation extends Animation {
  private readonly intensity: number;
  private readonly frequency: number;

  constructor(
    target: RenderObject,
    config: ShakeConfig
  ) {
    super(target, config);
    this.intensity = config.intensity ?? 0.1;
    this.frequency = config.frequency ?? 10;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    // 考虑延迟
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));

    // 计算进度
    let alpha = adjustedTime / this.config.duration;
    alpha = Math.min(1, Math.max(0, alpha));

    // 应用缓动函数
    const easedAlpha = this.config.easing(alpha as Alpha);

    // 计算抖动偏移
    const shake = Math.sin(easedAlpha * Math.PI * 2 * this.frequency) *
                  this.intensity *
                  (1 - easedAlpha); // 逐渐减弱

    // 应用抖动到 X 轴
    const currentTransform = this.target.getState().transform;
    const newTransform = {
      ...currentTransform,
      position: {
        ...currentTransform.position,
        x: currentTransform.position.x + shake
      }
    };

    // 返回插值结果
    const updatedObject = this.target.withTransform(newTransform);

    return {
      object: updatedObject,
      complete: easedAlpha >= 1
    };
  }
}

// 使用示例
import { smooth } from '@animaker/core/easing';

const shake = new ShakeAnimation(myObject, {
  duration: 1,
  easing: smooth,
  intensity: 0.2,
  frequency: 15,
  name: 'shake-effect'
});

scene.schedule(shake, 0);
```

### 示例 2: 脉冲动画（Pulse）

创建一个周期性缩放的脉冲效果：

```typescript
interface PulseConfig extends AnimationConfig {
  minScale?: number;    // 最小缩放比例
  maxScale?: number;    // 最大缩放比例
  cycles?: number;      // 脉冲周期数
}

class PulseAnimation extends Animation {
  private readonly minScale: number;
  private readonly maxScale: number;
  private readonly cycles: number;

  constructor(
    target: RenderObject,
    config: PulseConfig
  ) {
    super(target, config);
    this.minScale = config.minScale ?? 0.8;
    this.maxScale = config.maxScale ?? 1.2;
    this.cycles = config.cycles ?? 1;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));
    let alpha = adjustedTime / this.config.duration;
    alpha = Math.min(1, Math.max(0, alpha));

    // 计算脉冲周期
    const cycleAlpha = alpha * this.cycles;
    const pulse = Math.sin(cycleAlpha * Math.PI * 2) * 0.5 + 0.5;

    // 插值缩放比例
    const scale = this.minScale + (this.maxScale - this.minScale) * pulse;

    // 应用到所有轴
    const currentTransform = this.target.getState().transform;
    const newTransform = {
      ...currentTransform,
      scale: {
        x: scale,
        y: scale,
        z: scale
      }
    };

    const updatedObject = this.target.withTransform(newTransform);

    return {
      object: updatedObject,
      complete: alpha >= 1
    };
  }
}

// 使用示例
const pulse = new PulseAnimation(heartObject, {
  duration: 2,
  easing: smooth,
  minScale: 0.9,
  maxScale: 1.3,
  cycles: 3,
  name: 'heartbeat'
});
```

### 示例 3: 路径跟随动画（Path Follow）

让对象沿着指定路径移动：

```typescript
import { Point3D, lerpPoint } from '@animaker/core';

interface PathFollowConfig extends AnimationConfig {
  path: Point3D[];      // 路径点数组
  loop?: boolean;       // 是否循环
}

class PathFollowAnimation extends Animation {
  private readonly path: ReadonlyArray<Point3D>;
  private readonly loop: boolean;

  constructor(
    target: RenderObject,
    config: PathFollowConfig
  ) {
    super(target, config);
    this.path = config.path;
    this.loop = config.loop ?? false;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));
    let alpha = adjustedTime / this.config.duration;
    alpha = Math.min(1, Math.max(0, alpha));

    const easedAlpha = this.config.easing(alpha as Alpha);

    // 计算当前在路径上的位置
    const totalSegments = this.path.length - 1;
    const segmentProgress = easedAlpha * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const segmentAlpha = segmentProgress - currentSegment;

    // 处理循环
    let segIndex = currentSegment;
    if (this.loop) {
      segIndex = segIndex % totalSegments;
    }

    // 确保索引在有效范围内
    if (segIndex >= totalSegments) {
      const lastPoint = this.path[this.path.length - 1];
      const newTransform = {
        ...this.target.getState().transform,
        position: lastPoint
      };
      const updatedObject = this.target.withTransform(newTransform);
      return {
        object: updatedObject,
        complete: true
      };
    }

    // 在当前段内插值
    const startPoint = this.path[segIndex];
    const endPoint = this.path[segIndex + 1];
    const currentPosition = lerpPoint(startPoint, endPoint, segmentAlpha);

    // 应用新位置
    const currentTransform = this.target.getState().transform;
    const newTransform = {
      ...currentTransform,
      position: currentPosition
    };

    const updatedObject = this.target.withTransform(newTransform);

    return {
      object: updatedObject,
      complete: easedAlpha >= 1 && !this.loop
    };
  }
}

// 使用示例
const path: Point3D[] = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: 2, y: 0, z: 0 },
  { x: 3, y: 1, z: 0 },
  { x: 4, y: 0, z: 0 }
];

const pathFollow = new PathFollowAnimation(birdObject, {
  duration: 5,
  easing: smooth,
  path: path,
  loop: false,
  name: 'bird-flight'
});
```

---

## 复杂动画实现

### 示例 4: 弹性形变动画

实现一个带有弹性效果的形变动画：

```typescript
interface ElasticDeformConfig extends AnimationConfig {
  axis: 'x' | 'y' | 'z';     // 形变轴
  stretchFactor?: number;     // 拉伸系数
  compressFactor?: number;    // 压缩系数
}

class ElasticDeformAnimation extends Animation {
  private readonly axis: 'x' | 'y' | 'z';
  private readonly stretchFactor: number;
  private readonly compressFactor: number;

  constructor(
    target: RenderObject,
    config: ElasticDeformConfig
  ) {
    super(target, config);
    this.axis = config.axis;
    this.stretchFactor = config.stretchFactor ?? 1.3;
    this.compressFactor = config.compressFactor ?? 0.7;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));
    let alpha = adjustedTime / this.config.duration;
    alpha = Math.min(1, Math.max(0, alpha));

    const easedAlpha = this.config.easing(alpha as Alpha);

    // 计算弹性效果
    // 开始时拉伸，中间压缩，结束时恢复
    let scale = 1;
    if (easedAlpha < 0.3) {
      // 拉伸阶段
      const stretchProgress = easedAlpha / 0.3;
      scale = 1 + (this.stretchFactor - 1) * Math.sin(stretchProgress * Math.PI / 2);
    } else if (easedAlpha < 0.7) {
      // 压缩阶段
      const compressProgress = (easedAlpha - 0.3) / 0.4;
      scale = 1 + (this.compressFactor - 1) * Math.sin(compressProgress * Math.PI);
    } else {
      // 恢复阶段
      const recoverProgress = (easedAlpha - 0.7) / 0.3;
      scale = this.compressFactor + (1 - this.compressFactor) * recoverProgress;
    }

    // 应用形变
    const currentTransform = this.target.getState().transform;
    const newScale = {
      ...currentTransform.scale,
      [this.axis]: currentTransform.scale[this.axis] * scale
    };

    // 保持体积不变（在其他轴上反向缩放）
    const volumeFactor = 1 / Math.sqrt(scale);
    if (this.axis === 'x') {
      newScale.y = currentTransform.scale.y * volumeFactor;
      newScale.z = currentTransform.scale.z * volumeFactor;
    } else if (this.axis === 'y') {
      newScale.x = currentTransform.scale.x * volumeFactor;
      newScale.z = currentTransform.scale.z * volumeFactor;
    } else {
      newScale.x = currentTransform.scale.x * volumeFactor;
      newScale.y = currentTransform.scale.y * volumeFactor;
    }

    const newTransform = {
      ...currentTransform,
      scale: newScale
    };

    const updatedObject = this.target.withTransform(newTransform);

    return {
      object: updatedObject,
      complete: easedAlpha >= 1
    };
  }
}

// 使用示例
const elasticDeform = new ElasticDeformAnimation(ballObject, {
  duration: 1.5,
  easing: smooth,
  axis: 'y',
  stretchFactor: 1.4,
  compressFactor: 0.6,
  name: 'bounce-deform'
});
```

### 示例 5: 文本打字机效果

创建文本逐字显示的效果（适用于 TextObject）：

```typescript
interface TypewriterConfig extends AnimationConfig {
  text: string;              // 目标文本
  cursor?: string;           // 光标字符
  blinkRate?: number;        // 光标闪烁速率
}

class TypewriterAnimation extends Animation {
  private readonly targetText: string;
  private readonly cursor: string;
  private readonly blinkRate: number;

  constructor(
    target: RenderObject,
    config: TypewriterConfig
  ) {
    super(target, config);
    this.targetText = config.text;
    this.cursor = config.cursor ?? '|';
    this.blinkRate = config.blinkRate ?? 3;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));
    let alpha = adjustedTime / this.config.duration;
    alpha = Math.min(1, Math.max(0, alpha));

    const easedAlpha = this.config.easing(alpha as Alpha);

    // 计算当前应显示的字符数
    const totalChars = this.targetText.length;
    const currentCharIndex = Math.floor(easedAlpha * totalChars);

    // 构建当前文本
    let displayText = this.targetText.substring(0, currentCharIndex);

    // 添加光标（闪烁效果）
    if (easedAlpha < 1) {
      const blinkPhase = (elapsedTime * this.blinkRate) % 1;
      if (blinkPhase < 0.5) {
        displayText += this.cursor;
      }
    }

    // 更新对象样式（假设 TextObject 有 setText 方法）
    // 这里需要根据实际的 TextObject 实现调整
    const styles = new Map(this.target.getState().styles);
    styles.set('text', displayText);

    const updatedObject = this.target.withStyles(styles);

    return {
      object: updatedObject,
      complete: easedAlpha >= 1
    };
  }
}

// 使用示例
const typewriter = new TypewriterAnimation(textObject, {
  duration: 3,
  easing: linear,
  text: 'Hello, AniMaker!',
  cursor: '_',
  blinkRate: 4,
  name: 'typing-effect'
});
```

---

## 动画组合模式

### 嵌套动画组

创建复杂的嵌套动画组合：

```typescript
import { AnimationGroup, CompositionType } from '@animaker/core/animation';

// 创建多层嵌套动画
const complexAnimation = new AnimationGroup(
  mainObject,
  [
    // 第一层：并行动画
    new AnimationGroup(
      mainObject,
      [
        new MoveAnimation(mainObject, { x: 2, y: 0, z: 0 }, { duration: 1 }),
        new RotateAnimation(mainObject, 'z', 360, { duration: 1 })
      ],
      CompositionType.Parallel
    ),

    // 第二层：顺序动画
    new AnimationGroup(
      mainObject,
      [
        new ScaleAnimation(mainObject, { x: 1.5, y: 1.5, z: 1 }, { duration: 0.5 }),
        new ScaleAnimation(mainObject, { x: 1, y: 1, z: 1 }, { duration: 0.5 })
      ],
      CompositionType.Sequence
    ),

    // 第三层：自定义动画
    new ShakeAnimation(mainObject, { duration: 0.5, intensity: 0.1 })
  ],
  CompositionType.Sequence
);

scene.schedule(complexAnimation, 0);
```

### 条件动画

根据条件执行不同的动画：

```typescript
class ConditionalAnimation extends Animation {
  private condition: () => boolean;
  private trueAnimation: Animation;
  private falseAnimation: Animation;

  constructor(
    target: RenderObject,
    condition: () => boolean,
    trueAnimation: Animation,
    falseAnimation: Animation,
    config: AnimationConfig
  ) {
    super(target, config);
    this.condition = condition;
    this.trueAnimation = trueAnimation;
    this.falseAnimation = falseAnimation;
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const selectedAnimation = this.condition() ? this.trueAnimation : this.falseAnimation;
    return selectedAnimation.interpolate(elapsedTime);
  }
}

// 使用示例
const conditionalMove = new ConditionalAnimation(
  playerObject,
  () => playerHasPowerUp,  // 条件函数
  new MoveAnimation(playerObject, { x: 5, y: 0, z: 0 }, { duration: 1 }),  // 有能量时
  new MoveAnimation(playerObject, { x: 2, y: 0, z: 0 }, { duration: 1 }),  // 无能量时
  { duration: 1, easing: smooth }
);
```

---

## 性能优化技巧

### 1. 避免不必要的对象创建

```typescript
// 不好的做法：每次插值都创建新对象
interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
  const newTransform = {
    position: { x: 0, y: 0, z: 0 },  // 每次都创建
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    opacity: 1
  };
  // ...
}

// 好的做法：复用现有对象
interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
  const currentTransform = this.target.getState().transform;
  const newTransform = {
    ...currentTransform,
    position: {
      ...currentTransform.position,
      x: currentTransform.position.x + offset  // 只修改需要的属性
    }
  };
  // ...
}
```

### 2. 缓存计算结果

```typescript
class OptimizedAnimation extends Animation {
  private cachedDuration?: number;
  private cachedPath?: Point3D[];

  getTotalDuration(): number {
    if (this.cachedDuration === undefined) {
      this.cachedDuration = this.calculateDuration();
    }
    return this.cachedDuration;
  }

  private calculateDuration(): number {
    // 复杂的计算逻辑
    return this.config.duration + (this.config.delay ?? 0);
  }
}
```

### 3. 使用对象池

对于频繁创建销毁的对象，使用对象池：

```typescript
class TransformPool {
  private pool: Transform[] = [];

  acquire(): Transform {
    return this.pool.pop() || {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      opacity: 1
    };
  }

  release(transform: Transform): void {
    this.pool.push(transform);
  }
}
```

---

## 调试自定义动画

### 可视化调试

```typescript
class DebuggableAnimation extends Animation {
  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const result = super.interpolate(elapsedTime);

    // 调试输出
    if (this.config.name) {
      console.log(`[${this.config.name}] t=${elapsedTime.toFixed(2)}:`, {
        position: result.object.getState().transform.position,
        complete: result.complete
      });
    }

    return result;
  }
}
```

### 性能分析

```typescript
class ProfiledAnimation extends Animation {
  private startTime: number = 0;
  private frameCount: number = 0;

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const frameStart = performance.now();
    const result = super.interpolate(elapsedTime);
    const frameEnd = performance.now();

    this.frameCount++;

    if (result.complete) {
      const totalTime = frameEnd - this.startTime;
      const avgFrameTime = totalTime / this.frameCount;
      console.log(`Animation ${this.getName()} completed:`);
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Frames: ${this.frameCount}`);
      console.log(`  Avg frame time: ${avgFrameTime.toFixed(2)}ms`);
    }

    return result;
  }
}
```

---

## 完整示例：弹性球动画

结合多个概念创建一个完整的弹性球动画：

```typescript
class BouncingBallAnimation extends Animation {
  private readonly gravity: number = 9.8;
  private readonly bounceFactor: number = 0.7;
  private readonly floorY: number = -2;

  constructor(
    target: RenderObject,
    config: AnimationConfig
  ) {
    super(target, config);
  }

  getTotalDuration(): number {
    return this.config.duration + (this.config.delay ?? 0);
  }

  interpolate(elapsedTime: number): InterpolationResult<RenderObject> {
    const adjustedTime = Math.max(0, elapsedTime - (this.config.delay ?? 0));

    // 物理模拟
    const t = adjustedTime;
    const startY = 0;
    const velocity = -5;  // 初始向上速度

    // 计算位置（考虑重力）
    let y = startY + velocity * t + 0.5 * this.gravity * t * t;
    let scaleY = 1;

    // 地面碰撞检测
    if (y < this.floorY) {
      const impactTime = Math.sqrt(2 * (startY - this.floorY) / this.gravity);
      const bounceVelocity = -velocity - this.gravity * impactTime;
      const remainingTime = t - impactTime;

      if (remainingTime > 0) {
        y = this.floorY + bounceVelocity * remainingTime - 0.5 * this.gravity * remainingTime * remainingTime;

        // 落地时压缩形变
        const impactForce = Math.abs(bounceVelocity) / 10;
        scaleY = Math.max(0.6, 1 - impactForce * 0.3);
      }
    }

    // 应用变换
    const currentTransform = this.target.getState().transform;
    const newTransform = {
      ...currentTransform,
      position: {
        ...currentTransform.position,
        y: Math.max(this.floorY, y)
      },
      scale: {
        x: currentTransform.scale.x * (2 - scaleY),  // 保持体积
        y: currentTransform.scale.y * scaleY,
        z: currentTransform.scale.z * (2 - scaleY)
      }
    };

    const updatedObject = this.target.withTransform(newTransform);

    return {
      object: updatedObject,
      complete: adjustedTime >= this.config.duration
    };
  }
}

// 使用示例
const bouncingBall = new BouncingBallAnimation(ballObject, {
  duration: 3,
  easing: linear,  // 物理模拟不需要缓动
  name: 'bouncing-ball'
});

scene.schedule(bouncingBall, 0);
```

---

## 相关文档

- [动画 API](../api/animation.md) - 动画系统 API 参考
- [缓动函数 API](../api/easing.md) - 缓动函数完整参考
- [动画创建入门](./animation-basics.md) - 动画基础教程
- [性能优化指南](./performance.md) - 性能优化详细指南
