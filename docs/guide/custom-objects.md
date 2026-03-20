# 自定义渲染对象

本教程将指导你如何创建自定义渲染对象，扩展 AniMaker 的图形能力，以及实现特殊的视觉效果。

## 目录

- [渲染对象基础](#渲染对象基础)
- [创建简单几何对象](#创建简单几何对象)
- [复杂形状实现](#复杂形状实现)
- [文本对象](#文本对象)
- [粒子系统](#粒子系统)
- [3D 对象](#3d-对象)
- [性能优化](#性能优化)

---

## 渲染对象基础

### RenderObject 接口

所有渲染对象都实现 `RenderObject` 接口：

```typescript
import { RenderObject, RenderObjectState, ObjectId, Transform, BoundingBox } from '@animaker/core';

interface RenderObject {
  // 获取当前状态
  getState(): RenderObjectState;

  // 更新变换
  withTransform(transform: Transform): RenderObject;

  // 更新位置
  withPosition(position: Point3D): RenderObject;

  // 更新旋转
  withRotation(rotation: Point3D): RenderObject;

  // 更新缩放
  withScale(scale: Point3D): RenderObject;

  // 更新透明度
  withOpacity(opacity: number): RenderObject;

  // 更新可见性
  withVisible(visible: boolean): RenderObject;

  // 更新 z-index
  withZIndex(z_index: number): RenderObject;

  // 更新样式
  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): RenderObject;

  // 获取边界框
  getBoundingBox(): BoundingBox;

  // 渲染方法
  render(renderer: Renderer): void;
}
```

### 核心原则

1. **不可变性**: 所有修改方法都返回新实例
2. **类型安全**: 使用 TypeScript 严格类型检查
3. **状态管理**: 通过 `RenderObjectState` 管理所有状态
4. **渲染分离**: 渲染逻辑与状态管理分离

---

## 创建简单几何对象

### 示例 1: 星形对象

创建一个可配置的星形对象：

```typescript
import {
  RenderObject,
  RenderObjectState,
  Transform,
  Point3D,
  BoundingBox,
  generateObjectId
} from '@animaker/core';

interface StarConfig {
  outerRadius: number;     // 外半径
  innerRadius: number;     // 内半径
  points: number;          // 星形角数
  fillColor?: string;      // 填充颜色
  strokeColor?: string;    // 描边颜色
  strokeWidth?: number;    // 描边宽度
}

class StarObject implements RenderObject {
  private readonly state: RenderObjectState;
  private readonly config: StarConfig;

  constructor(config: StarConfig, position: Point3D = { x: 0, y: 0, z: 0 }) {
    this.config = config;

    this.state = {
      id: generateObjectId('star'),
      transform: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1
      },
      visible: true,
      z_index: 0,
      styles: new Map([
        ['fillColor', config.fillColor ?? '#FFD700'],
        ['strokeColor', config.strokeColor ?? '#FFA500'],
        ['strokeWidth', config.strokeWidth ?? 0.02]
      ])
    };
  }

  getState(): RenderObjectState {
    return this.state;
  }

  withTransform(transform: Transform): StarObject {
    const newObj = new StarObject(this.config, this.state.transform.position);
    newObj.state.transform = transform;
    return newObj;
  }

  withPosition(position: Point3D): StarObject {
    return this.withTransform({
      ...this.state.transform,
      position
    });
  }

  withRotation(rotation: Point3D): StarObject {
    return this.withTransform({
      ...this.state.transform,
      rotation
    });
  }

  withScale(scale: Point3D): StarObject {
    return this.withTransform({
      ...this.state.transform,
      scale
    });
  }

  withOpacity(opacity: number): StarObject {
    return this.withTransform({
      ...this.state.transform,
      opacity
    });
  }

  withVisible(visible: boolean): StarObject {
    const newObj = new StarObject(this.config, this.state.transform.position);
    newObj.state.visible = visible;
    return newObj;
  }

  withZIndex(z_index: number): StarObject {
    const newObj = new StarObject(this.config, this.state.transform.position);
    newObj.state.z_index = z_index;
    return newObj;
  }

  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): StarObject {
    const newObj = new StarObject(this.config, this.state.transform.position);
    newObj.state.styles = new Map([...this.state.styles, ...styles]);
    return newObj;
  }

  getBoundingBox(): BoundingBox {
    const { position, scale } = this.state.transform;
    const maxRadius = this.config.outerRadius * Math.max(scale.x, scale.y);

    return {
      min: {
        x: position.x - maxRadius,
        y: position.y - maxRadius,
        z: position.z
      },
      max: {
        x: position.x + maxRadius,
        y: position.y + maxRadius,
        z: position.z
      },
      center: position
    };
  }

  // 生成星形顶点
  private getVertices(): Point2D[] {
    const vertices: Point2D[] = [];
    const angleStep = Math.PI / this.config.points;

    for (let i = 0; i < this.config.points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const radius = i % 2 === 0 ? this.config.outerRadius : this.config.innerRadius;

      vertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }

    return vertices;
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const vertices = this.getVertices();
    const transform = this.state.transform;

    // 应用变换矩阵
    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.rotateX(transform.rotation.x);
    renderer.rotateY(transform.rotation.y);
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity);

    // 渲染星形
    renderer.beginPath();
    renderer.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      renderer.lineTo(vertices[i].x, vertices[i].y);
    }

    renderer.closePath();

    // 填充
    const fillColor = this.state.styles.get('fillColor') as string;
    if (fillColor) {
      renderer.setFillColor(fillColor);
      renderer.fill();
    }

    // 描边
    const strokeColor = this.state.styles.get('strokeColor') as string;
    const strokeWidth = this.state.styles.get('strokeWidth') as number;
    if (strokeColor && strokeWidth > 0) {
      renderer.setStrokeColor(strokeColor);
      renderer.setStrokeWidth(strokeWidth);
      renderer.stroke();
    }

    renderer.popMatrix();
  }

  // 静态工厂方法
  static fivePointed(outerRadius: number, innerRadius?: number): StarObject {
    return new StarObject({
      points: 5,
      outerRadius,
      innerRadius: innerRadius ?? outerRadius * 0.4
    });
  }

  static sixPointed(outerRadius: number, innerRadius?: number): StarObject {
    return new StarObject({
      points: 6,
      outerRadius,
      innerRadius: innerRadius ?? outerRadius * 0.5
    });
  }
}

// 使用示例
const star = StarObject.fivePointed(1, 0.4)
  .withPosition({ x: 0, y: 2, z: 0 })
  .withOpacity(0.8);

scene.addObject(star);
```

### 示例 2: 正多边形对象

创建通用的正多边形对象：

```typescript
interface PolygonConfig {
  sides: number;           // 边数
  radius: number;          // 半径
  rotation?: number;       // 初始旋转角度
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

class PolygonObject implements RenderObject {
  private readonly state: RenderObjectState;
  private readonly config: PolygonConfig;

  constructor(config: PolygonConfig, position: Point3D = { x: 0, y: 0, z: 0 }) {
    this.config = config;

    this.state = {
      id: generateObjectId('polygon'),
      transform: {
        position,
        rotation: { x: 0, y: 0, z: config.rotation ?? 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1
      },
      visible: true,
      z_index: 0,
      styles: new Map([
        ['fillColor', config.fillColor ?? '#4A90E2'],
        ['strokeColor', config.strokeColor ?? '#2E5C8A'],
        ['strokeWidth', config.strokeWidth ?? 0.02]
      ])
    };
  }

  // 实现与 StarObject 类似的方法
  getState(): RenderObjectState { return this.state; }

  withTransform(transform: Transform): PolygonObject {
    const newObj = new PolygonObject(this.config, this.state.transform.position);
    newObj.state.transform = transform;
    return newObj;
  }

  withPosition(position: Point3D): PolygonObject {
    return this.withTransform({ ...this.state.transform, position });
  }

  withRotation(rotation: Point3D): PolygonObject {
    return this.withTransform({ ...this.state.transform, rotation });
  }

  withScale(scale: Point3D): PolygonObject {
    return this.withTransform({ ...this.state.transform, scale });
  }

  withOpacity(opacity: number): PolygonObject {
    return this.withTransform({ ...this.state.transform, opacity });
  }

  withVisible(visible: boolean): PolygonObject {
    const newObj = new PolygonObject(this.config, this.state.transform.position);
    newObj.state.visible = visible;
    return newObj;
  }

  withZIndex(z_index: number): PolygonObject {
    const newObj = new PolygonObject(this.config, this.state.transform.position);
    newObj.state.z_index = z_index;
    return newObj;
  }

  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): PolygonObject {
    const newObj = new PolygonObject(this.config, this.state.transform.position);
    newObj.state.styles = new Map([...this.state.styles, ...styles]);
    return newObj;
  }

  getBoundingBox(): BoundingBox {
    const { position, scale } = this.state.transform;
    const maxRadius = this.config.radius * Math.max(scale.x, scale.y);

    return {
      min: { x: position.x - maxRadius, y: position.y - maxRadius, z: position.z },
      max: { x: position.x + maxRadius, y: position.y + maxRadius, z: position.z },
      center: position
    };
  }

  private getVertices(): Point2D[] {
    const vertices: Point2D[] = [];
    const angleStep = (Math.PI * 2) / this.config.sides;

    for (let i = 0; i < this.config.sides; i++) {
      const angle = i * angleStep;
      vertices.push({
        x: Math.cos(angle) * this.config.radius,
        y: Math.sin(angle) * this.config.radius
      });
    }

    return vertices;
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const vertices = this.getVertices();
    const transform = this.state.transform;

    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity);

    renderer.beginPath();
    renderer.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      renderer.lineTo(vertices[i].x, vertices[i].y);
    }

    renderer.closePath();

    const fillColor = this.state.styles.get('fillColor') as string;
    if (fillColor) {
      renderer.setFillColor(fillColor);
      renderer.fill();
    }

    const strokeColor = this.state.styles.get('strokeColor') as string;
    const strokeWidth = this.state.styles.get('strokeWidth') as number;
    if (strokeColor && strokeWidth > 0) {
      renderer.setStrokeColor(strokeColor);
      renderer.setStrokeWidth(strokeWidth);
      renderer.stroke();
    }

    renderer.popMatrix();
  }

  // 静态工厂方法
  static triangle(size: number): PolygonObject {
    return new PolygonObject({ sides: 3, radius: size });
  }

  static square(size: number): PolygonObject {
    return new PolygonObject({ sides: 4, radius: size, rotation: Math.PI / 4 });
  }

  static pentagon(size: number): PolygonObject {
    return new PolygonObject({ sides: 5, radius: size });
  }

  static hexagon(size: number): PolygonObject {
    return new PolygonObject({ sides: 6, radius: size });
  }

  static octagon(size: number): PolygonObject {
    return new PolygonObject({ sides: 8, radius: size });
  }
}

// 使用示例
const triangle = PolygonObject.triangle(1)
  .withPosition({ x: -2, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#E74C3C']]));

const hexagon = PolygonObject.hexagon(1.2)
  .withPosition({ x: 2, y: 0, z: 0 })
  .withStyles(new Map([['fillColor', '#27AE60']]));

scene.addObjects(triangle, hexagon);
```

---

## 复杂形状实现

### 示例 3: 渐变填充对象

创建支持线性渐变填充的对象：

```typescript
interface GradientConfig {
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string }>;
  angle?: number;         // 线性渐变角度
  startRadius?: number;   // 径向渐变起始半径
  endRadius?: number;     // 径向渐变结束半径
}

class GradientPolygonObject extends PolygonObject {
  private readonly gradient: GradientConfig;

  constructor(
    polygonConfig: PolygonConfig,
    gradient: GradientConfig,
    position: Point3D = { x: 0, y: 0, z: 0 }
  ) {
    super(polygonConfig, position);
    this.gradient = gradient;
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const vertices = this.getVertices();
    const transform = this.state.transform;
    const bbox = this.getBoundingBox();

    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity);

    // 创建渐变
    let gradient;
    if (this.gradient.type === 'linear') {
      const angle = this.gradient.angle ?? 0;
      const x1 = Math.cos(angle) * bbox.min.x;
      const y1 = Math.sin(angle) * bbox.min.y;
      const x2 = Math.cos(angle) * bbox.max.x;
      const y2 = Math.sin(angle) * bbox.max.y;
      gradient = renderer.createLinearGradient(x1, y1, x2, y2);
    } else {
      const cx = 0;
      const cy = 0;
      const r1 = this.gradient.startRadius ?? 0;
      const r2 = this.gradient.endRadius ?? this.config.radius;
      gradient = renderer.createRadialGradient(cx, cy, r1, cx, cy, r2);
    }

    // 添加颜色断点
    for (const stop of this.gradient.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    renderer.setFillColor(gradient);

    // 绘制多边形
    renderer.beginPath();
    renderer.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      renderer.lineTo(vertices[i].x, vertices[i].y);
    }

    renderer.closePath();
    renderer.fill();
    renderer.popMatrix();
  }

  // 静态工厂方法
  static sunsetGradient(sides: number, radius: number): GradientPolygonObject {
    return new GradientPolygonObject(
      { sides, radius },
      {
        type: 'linear',
        angle: Math.PI / 4,
        stops: [
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#FFD93D' },
          { offset: 1, color: '#6BCB77' }
        ]
      }
    );
  }

  static oceanGradient(sides: number, radius: number): GradientPolygonObject {
    return new GradientPolygonObject(
      { sides, radius },
      {
        type: 'radial',
        stops: [
          { offset: 0, color: '#4FC3F7' },
          { offset: 0.5, color: '#0288D1' },
          { offset: 1, color: '#01579B' }
        ]
      }
    );
  }
}

// 使用示例
const sunsetPoly = GradientPolygonObject.sunsetGradient(6, 1.5)
  .withPosition({ x: -3, y: 0, z: 0 });

const oceanPoly = GradientPolygonObject.oceanGradient(5, 1.2)
  .withPosition({ x: 3, y: 0, z: 0 });

scene.addObjects(sunsetPoly, oceanPoly);
```

### 示例 4: 阴影对象

创建带阴影效果的对象：

```typescript
interface ShadowConfig {
  color: string;           // 阴影颜色
  offsetX: number;         // X 偏移
  offsetY: number;         // Y 偏移
  blur: number;            // 模糊程度
}

class ShadowPolygonObject extends PolygonObject {
  private readonly shadow: ShadowConfig;

  constructor(
    polygonConfig: PolygonConfig,
    shadow: ShadowConfig,
    position: Point3D = { x: 0, y: 0, z: 0 }
  ) {
    super(polygonConfig, position);
    this.shadow = shadow;
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const transform = this.state.transform;

    // 渲染阴影
    renderer.pushMatrix();
    renderer.translate(
      transform.position.x + this.shadow.offsetX,
      transform.position.y + this.shadow.offsetY,
      transform.position.z - 0.01  // 略低于主对象
    );
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity * 0.5);  // 阴影半透明

    // 应用阴影模糊
    renderer.setShadow(this.shadow.color, this.shadow.blur);

    // 绘制阴影
    const vertices = this.getVertices();
    renderer.beginPath();
    renderer.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      renderer.lineTo(vertices[i].x, vertices[i].y);
    }

    renderer.closePath();
    renderer.setFillColor(this.shadow.color);
    renderer.fill();

    renderer.clearShadow();
    renderer.popMatrix();

    // 渲染主对象
    super.render(renderer);
  }

  // 静态工厂方法
  static softShadow(sides: number, radius: number): ShadowPolygonObject {
    return new ShadowPolygonObject(
      { sides, radius },
      {
        color: 'rgba(0, 0, 0, 0.3)',
        offsetX: 0.1,
        offsetY: -0.1,
        blur: 0.2
      }
    );
  }

  static hardShadow(sides: number, radius: number): ShadowPolygonObject {
    return new ShadowPolygonObject(
      { sides, radius },
      {
        color: 'rgba(0, 0, 0, 0.5)',
        offsetX: 0.15,
        offsetY: -0.15,
        blur: 0
      }
    );
  }
}

// 使用示例
const softShadowHex = ShadowPolygonObject.softShadow(6, 1)
  .withPosition({ x: 0, y: 1, z: 0 })
  .withStyles(new Map([['fillColor', '#9B59B6']]));

scene.addObject(softShadowHex);
```

---

## 文本对象

### 示例 5: 基础文本对象

```typescript
interface TextConfig {
  text: string;            // 文本内容
  fontSize: number;        // 字体大小
  fontFamily?: string;     // 字体系列
  fontWeight?: string;     // 字体粗细
  fillColor?: string;      // 文本颜色
  align?: 'left' | 'center' | 'right';  // 对齐方式
}

class TextObject implements RenderObject {
  private readonly state: RenderObjectState;
  private readonly config: TextConfig;

  constructor(config: TextConfig, position: Point3D = { x: 0, y: 0, z: 0 }) {
    this.config = config;

    this.state = {
      id: generateObjectId('text'),
      transform: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1
      },
      visible: true,
      z_index: 0,
      styles: new Map([
        ['text', config.text],
        ['fontSize', config.fontSize],
        ['fontFamily', config.fontFamily ?? 'Arial'],
        ['fontWeight', config.fontWeight ?? 'normal'],
        ['fillColor', config.fillColor ?? '#FFFFFF'],
        ['align', config.align ?? 'center']
      ])
    };
  }

  // 实现标准 RenderObject 方法
  getState(): RenderObjectState { return this.state; }

  withTransform(transform: Transform): TextObject {
    const newObj = new TextObject(this.config, this.state.transform.position);
    newObj.state.transform = transform;
    return newObj;
  }

  withPosition(position: Point3D): TextObject {
    return this.withTransform({ ...this.state.transform, position });
  }

  withRotation(rotation: Point3D): TextObject {
    return this.withTransform({ ...this.state.transform, rotation });
  }

  withScale(scale: Point3D): TextObject {
    return this.withTransform({ ...this.state.transform, scale });
  }

  withOpacity(opacity: number): TextObject {
    return this.withTransform({ ...this.state.transform, opacity });
  }

  withVisible(visible: boolean): TextObject {
    const newObj = new TextObject(this.config, this.state.transform.position);
    newObj.state.visible = visible;
    return newObj;
  }

  withZIndex(z_index: number): TextObject {
    const newObj = new TextObject(this.config, this.state.transform.position);
    newObj.state.z_index = z_index;
    return newObj;
  }

  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): TextObject {
    const newObj = new TextObject(this.config, this.state.transform.position);
    newObj.state.styles = new Map([...this.state.styles, ...styles]);
    return newObj;
  }

  // 更新文本内容
  withText(text: string): TextObject {
    const newConfig = { ...this.config, text };
    const newObj = new TextObject(newConfig, this.state.transform.position);
    newObj.state.transform = this.state.transform;
    return newObj;
  }

  getBoundingBox(): BoundingBox {
    const { position } = this.state.transform;
    const fontSize = this.config.fontSize * this.state.transform.scale.x;
    const textWidth = this.estimateTextWidth();
    const textHeight = fontSize;

    return {
      min: {
        x: position.x - textWidth / 2,
        y: position.y - textHeight / 2,
        z: position.z
      },
      max: {
        x: position.x + textWidth / 2,
        y: position.y + textHeight / 2,
        z: position.z
      },
      center: position
    };
  }

  private estimateTextWidth(): number {
    // 简单估算：每个字符约为字体大小的 0.6 倍
    return this.config.text.length * this.config.fontSize * 0.6;
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const transform = this.state.transform;
    const fontSize = this.state.styles.get('fontSize') as number;
    const fontFamily = this.state.styles.get('fontFamily') as string;
    const fontWeight = this.state.styles.get('fontWeight') as string;
    const fillColor = this.state.styles.get('fillColor') as string;
    const align = this.state.styles.get('align') as string;

    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity);

    renderer.setFont(fontFamily, fontSize, fontWeight);
    renderer.setFillColor(fillColor);
    renderer.setTextAlign(align as 'left' | 'center' | 'right');

    renderer.fillText(this.config.text, 0, 0);

    renderer.popMatrix();
  }

  // 静态工厂方法
  static title(text: string): TextObject {
    return new TextObject({
      text,
      fontSize: 0.5,
      fontWeight: 'bold',
      fillColor: '#FFFFFF'
    });
  }

  static subtitle(text: string): TextObject {
    return new TextObject({
      text,
      fontSize: 0.3,
      fillColor: '#CCCCCC'
    });
  }

  static body(text: string): TextObject {
    return new TextObject({
      text,
      fontSize: 0.2,
      fillColor: '#AAAAAA'
    });
  }
}

// 使用示例
const title = TextObject.title('AniMaker 框架')
  .withPosition({ x: 0, y: 2, z: 0 });

const subtitle = TextObject.subtitle('现代化动画渲染系统')
  .withPosition({ x: 0, y: 1.5, z: 0 });

scene.addObjects(title, subtitle);
```

---

## 粒子系统

### 示例 6: 基础粒子系统

```typescript
interface Particle {
  position: Point3D;
  velocity: Point3D;
  life: number;          // 生命值 [0, 1]
  size: number;
  color: string;
}

interface ParticleSystemConfig {
  maxParticles: number;      // 最大粒子数
  emissionRate: number;      // 发射速率（粒子/秒）
  particleLife: number;      // 粒子寿命（秒）
  initialVelocity: Point3D;  // 初始速度
  velocityVariance: Point3D; // 速度变化范围
  gravity?: Point3D;         // 重力
  colors: string[];          // 粒子颜色数组
  sizeRange: [number, number]; // 大小范围
}

class ParticleSystemObject implements RenderObject {
  private readonly state: RenderObjectState;
  private readonly config: ParticleSystemConfig;
  private particles: Particle[] = [];
  private accumulatedTime: number = 0;

  constructor(config: ParticleSystemConfig, position: Point3D = { x: 0, y: 0, z: 0 }) {
    this.config = config;

    this.state = {
      id: generateObjectId('particle-system'),
      transform: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1
      },
      visible: true,
      z_index: 0,
      styles: new Map()
    };
  }

  getState(): RenderObjectState {
    return this.state;
  }

  withTransform(transform: Transform): ParticleSystemObject {
    const newObj = new ParticleSystemObject(this.config, this.state.transform.position);
    newObj.state.transform = transform;
    newObj.particles = [...this.particles];
    return newObj;
  }

  withPosition(position: Point3D): ParticleSystemObject {
    return this.withTransform({ ...this.state.transform, position });
  }

  withRotation(rotation: Point3D): ParticleSystemObject {
    return this.withTransform({ ...this.state.transform, rotation });
  }

  withScale(scale: Point3D): ParticleSystemObject {
    return this.withTransform({ ...this.state.transform, scale });
  }

  withOpacity(opacity: number): ParticleSystemObject {
    return this.withTransform({ ...this.state.transform, opacity });
  }

  withVisible(visible: boolean): ParticleSystemObject {
    const newObj = new ParticleSystemObject(this.config, this.state.transform.position);
    newObj.state.visible = visible;
    return newObj;
  }

  withZIndex(z_index: number): ParticleSystemObject {
    const newObj = new ParticleSystemObject(this.config, this.state.transform.position);
    newObj.state.z_index = z_index;
    return newObj;
  }

  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): ParticleSystemObject {
    const newObj = new ParticleSystemObject(this.config, this.state.transform.position);
    newObj.state.styles = new Map([...this.state.styles, ...styles]);
    return newObj;
  }

  getBoundingBox(): BoundingBox {
    const { position } = this.state.transform;
    return {
      min: { x: position.x - 1, y: position.y - 1, z: position.z },
      max: { x: position.x + 1, y: position.y + 1, z: position.z },
      center: position
    };
  }

  // 更新粒子系统
  update(deltaTime: number): ParticleSystemObject {
    const newObj = new ParticleSystemObject(this.config, this.state.transform.position);
    newObj.state.transform = this.state.transform;
    newObj.state.visible = this.state.visible;
    newObj.state.z_index = this.state.z_index;
    newObj.particles = [...this.particles];
    newObj.accumulatedTime = this.accumulatedTime + deltaTime;

    // 发射新粒子
    const particlesToEmit = Math.floor(newObj.accumulatedTime * this.config.emissionRate);
    if (particlesToEmit > 0) {
      newObj.accumulatedTime = 0;

      for (let i = 0; i < particlesToEmit; i++) {
        if (newObj.particles.length < this.config.maxParticles) {
          newObj.particles.push(this.createParticle());
        }
      }
    }

    // 更新现有粒子
    newObj.particles = newObj.particles.map(particle => {
      // 应用重力
      if (this.config.gravity) {
        particle.velocity.x += this.config.gravity.x * deltaTime;
        particle.velocity.y += this.config.gravity.y * deltaTime;
        particle.velocity.z += this.config.gravity.z * deltaTime;
      }

      // 更新位置
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      // 更新生命值
      particle.life -= deltaTime / this.config.particleLife;

      return particle;
    }).filter(p => p.life > 0);

    return newObj;
  }

  private createParticle(): Particle {
    const velocity = {
      x: this.config.initialVelocity.x + (Math.random() - 0.5) * this.config.velocityVariance.x,
      y: this.config.initialVelocity.y + (Math.random() - 0.5) * this.config.velocityVariance.y,
      z: this.config.initialVelocity.z + (Math.random() - 0.5) * this.config.velocityVariance.z
    };

    const size = this.config.sizeRange[0] +
                 Math.random() * (this.config.sizeRange[1] - this.config.sizeRange[0]);

    const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

    return {
      position: { ...this.state.transform.position },
      velocity,
      life: 1,
      size,
      color
    };
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const transform = this.state.transform;

    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.setOpacity(transform.opacity);

    // 渲染所有粒子
    for (const particle of this.particles) {
      renderer.pushMatrix();
      renderer.translate(particle.position.x, particle.position.y, particle.position.z);

      renderer.setFillColor(particle.color);
      renderer.setOpacity(particle.life * transform.opacity);

      // 绘制圆形粒子
      renderer.beginPath();
      renderer.arc(0, 0, particle.size, 0, Math.PI * 2);
      renderer.fill();

      renderer.popMatrix();
    }

    renderer.popMatrix();
  }

  // 静态工厂方法
  static fire(position: Point3D): ParticleSystemObject {
    return new ParticleSystemObject(
      {
        maxParticles: 100,
        emissionRate: 50,
        particleLife: 1,
        initialVelocity: { x: 0, y: 2, z: 0 },
        velocityVariance: { x: 1, y: 0.5, z: 0 },
        gravity: { x: 0, y: -2, z: 0 },
        colors: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4266'],
        sizeRange: [0.02, 0.08]
      },
      position
    );
  }

  static smoke(position: Point3D): ParticleSystemObject {
    return new ParticleSystemObject(
      {
        maxParticles: 50,
        emissionRate: 20,
        particleLife: 2,
        initialVelocity: { x: 0, y: 1, z: 0 },
        velocityVariance: { x: 0.3, y: 0.2, z: 0 },
        gravity: { x: 0, y: 0, z: 0 },
        colors: ['#CCCCCC', '#AAAAAA', '#888888'],
        sizeRange: [0.05, 0.15]
      },
      position
    );
  }

  static sparkles(position: Point3D): ParticleSystemObject {
    return new ParticleSystemObject(
      {
        maxParticles: 30,
        emissionRate: 30,
        particleLife: 0.5,
        initialVelocity: { x: 0, y: 0, z: 0 },
        velocityVariance: { x: 3, y: 3, z: 0 },
        gravity: { x: 0, y: -5, z: 0 },
        colors: ['#FFFFFF', '#FFFACD', '#F0E68C'],
        sizeRange: [0.01, 0.03]
      },
      position
    );
  }
}

// 使用示例
const fireParticles = ParticleSystemObject.fire({ x: 0, y: -2, z: 0 });
const sparkles = ParticleSystemObject.sparkles({ x: 2, y: 1, z: 0 });

scene.addObjects(fireParticles, sparkles);

// 在动画循环中更新粒子系统
function animate(deltaTime: number) {
  fireParticles = fireParticles.update(deltaTime);
  sparkles = sparkles.update(deltaTime);

  renderer.render([fireParticles, sparkles]);
}
```

---

## 3D 对象

### 示例 7: 简单 3D 立方体

```typescript
interface CubeConfig {
  size: number;            // 立方体大小
  colors?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  };
}

class CubeObject implements RenderObject {
  private readonly state: RenderObjectState;
  private readonly config: CubeConfig;

  constructor(config: CubeConfig, position: Point3D = { x: 0, y: 0, z: 0 }) {
    this.config = config;

    this.state = {
      id: generateObjectId('cube'),
      transform: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        opacity: 1
      },
      visible: true,
      z_index: 0,
      styles: new Map([
        ['frontColor', config.colors?.front ?? '#FF6B6B'],
        ['backColor', config.colors?.back ?? '#4ECDC4'],
        ['leftColor', config.colors?.left ?? '#45B7D1'],
        ['rightColor', config.colors?.right ?? '#96CEB4'],
        ['topColor', config.colors?.top ?? '#FFEAA7'],
        ['bottomColor', config.colors?.bottom ?? '#DFE6E9']
      ])
    };
  }

  // 实现标准 RenderObject 方法（省略具体实现）
  getState(): RenderObjectState { return this.state; }

  withTransform(transform: Transform): CubeObject {
    const newObj = new CubeObject(this.config, this.state.transform.position);
    newObj.state.transform = transform;
    return newObj;
  }

  withPosition(position: Point3D): CubeObject {
    return this.withTransform({ ...this.state.transform, position });
  }

  withRotation(rotation: Point3D): CubeObject {
    return this.withTransform({ ...this.state.transform, rotation });
  }

  withScale(scale: Point3D): CubeObject {
    return this.withTransform({ ...this.state.transform, scale });
  }

  withOpacity(opacity: number): CubeObject {
    return this.withTransform({ ...this.state.transform, opacity });
  }

  withVisible(visible: boolean): CubeObject {
    const newObj = new CubeObject(this.config, this.state.transform.position);
    newObj.state.visible = visible;
    return newObj;
  }

  withZIndex(z_index: number): CubeObject {
    const newObj = new CubeObject(this.config, this.state.transform.position);
    newObj.state.z_index = z_index;
    return newObj;
  }

  withStyles(styles: ReadonlyMap<string, unknown> | Map<string, unknown>): CubeObject {
    const newObj = new CubeObject(this.config, this.state.transform.position);
    newObj.state.styles = new Map([...this.state.styles, ...styles]);
    return newObj;
  }

  getBoundingBox(): BoundingBox {
    const { position, scale } = this.state.transform;
    const halfSize = (this.config.size / 2) * Math.max(scale.x, scale.y, scale.z);

    return {
      min: {
        x: position.x - halfSize,
        y: position.y - halfSize,
        z: position.z - halfSize
      },
      max: {
        x: position.x + halfSize,
        y: position.y + halfSize,
        z: position.z + halfSize
      },
      center: position
    };
  }

  render(renderer: Renderer): void {
    if (!this.state.visible) return;

    const transform = this.state.transform;
    const size = this.config.size;

    renderer.pushMatrix();
    renderer.translate(transform.position.x, transform.position.y, transform.position.z);
    renderer.rotateX(transform.rotation.x);
    renderer.rotateY(transform.rotation.y);
    renderer.rotateZ(transform.rotation.z);
    renderer.scale(transform.scale.x, transform.scale.y, transform.scale.z);
    renderer.setOpacity(transform.opacity);

    const halfSize = size / 2;

    // 前面
    renderer.setFillColor(this.state.styles.get('frontColor') as string);
    renderer.drawQuad(
      { x: -halfSize, y: -halfSize, z: halfSize },
      { x: halfSize, y: -halfSize, z: halfSize },
      { x: halfSize, y: halfSize, z: halfSize },
      { x: -halfSize, y: halfSize, z: halfSize }
    );

    // 后面
    renderer.setFillColor(this.state.styles.get('backColor') as string);
    renderer.drawQuad(
      { x: halfSize, y: -halfSize, z: -halfSize },
      { x: -halfSize, y: -halfSize, z: -halfSize },
      { x: -halfSize, y: halfSize, z: -halfSize },
      { x: halfSize, y: halfSize, z: -halfSize }
    );

    // 左面
    renderer.setFillColor(this.state.styles.get('leftColor') as string);
    renderer.drawQuad(
      { x: -halfSize, y: -halfSize, z: -halfSize },
      { x: -halfSize, y: -halfSize, z: halfSize },
      { x: -halfSize, y: halfSize, z: halfSize },
      { x: -halfSize, y: halfSize, z: -halfSize }
    );

    // 右面
    renderer.setFillColor(this.state.styles.get('rightColor') as string);
    renderer.drawQuad(
      { x: halfSize, y: -halfSize, z: halfSize },
      { x: halfSize, y: -halfSize, z: -halfSize },
      { x: halfSize, y: halfSize, z: -halfSize },
      { x: halfSize, y: halfSize, z: halfSize }
    );

    // 上面
    renderer.setFillColor(this.state.styles.get('topColor') as string);
    renderer.drawQuad(
      { x: -halfSize, y: halfSize, z: halfSize },
      { x: halfSize, y: halfSize, z: halfSize },
      { x: halfSize, y: halfSize, z: -halfSize },
      { x: -halfSize, y: halfSize, z: -halfSize }
    );

    // 下面
    renderer.setFillColor(this.state.styles.get('bottomColor') as string);
    renderer.drawQuad(
      { x: -halfSize, y: -halfSize, z: -halfSize },
      { x: halfSize, y: -halfSize, z: -halfSize },
      { x: halfSize, y: -halfSize, z: halfSize },
      { x: -halfSize, y: -halfSize, z: halfSize }
    );

    renderer.popMatrix();
  }

  // 静态工厂方法
  static rainbow(size: number): CubeObject {
    return new CubeObject({
      size,
      colors: {
        front: '#FF0000',
        back: '#00FF00',
        left: '#0000FF',
        right: '#FFFF00',
        top: '#FF00FF',
        bottom: '#00FFFF'
      }
    });
  }

  static monochrome(size: number, color: string): CubeObject {
    return new CubeObject({
      size,
      colors: {
        front: color,
        back: color,
        left: color,
        right: color,
        top: color,
        bottom: color
      }
    });
  }
}

// 使用示例
const rotatingCube = CubeObject.rainbow(1)
  .withPosition({ x: 0, y: 0, z: 0 });

scene.addObject(rotatingCube);

// 旋转动画
const rotateCube = new RotateAnimation(rotatingCube, 'y', 360, {
  duration: 3,
  easing: smooth
});

scene.schedule(rotateCube, 0);
```

---

## 性能优化

### 渲染优化技巧

1. **批量渲染**: 相同类型的对象批量处理
2. **视锥剔除**: 不渲染视野外的对象
3. **LOD (Level of Detail)**: 根据距离使用不同细节级别
4. **对象池**: 复用对象减少 GC 压力

### 示例：对象池实现

```typescript
class ObjectPool<T extends RenderObject> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  size(): number {
    return this.pool.length;
  }
}

// 使用示例
const particlePool = new ObjectPool(
  () => new CircleObject(0.05),
  (obj) => obj.withPosition({ x: 0, y: 0, z: 0 }).withOpacity(0),
  100
);

// 获取粒子
const particle = particlePool.acquire();
const activeParticle = particle
  .withPosition({ x: Math.random() * 10, y: Math.random() * 10, z: 0 })
  .withOpacity(1);

// 释放粒子
particlePool.release(particle);
```

---

## 相关文档

- [核心类型 API](../api/core.md) - RenderObject 接口定义
- [动画 API](../api/animation.md) - 动画系统 API
- [自定义动画](./custom-animations.md) - 自定义动画教程
- [性能优化指南](./performance.md) - 性能优化详细指南
