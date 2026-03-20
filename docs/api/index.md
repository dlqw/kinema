# API 参考

完整的 AniMaker API 文档。

## 核心 API

### Animator

动画系统的核心控制器。

```typescript
class Animator {
  constructor(config: AnimatorConfig);

  // 播放控制
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;

  // 动画管理
  add(tween: Tween | Timeline): void;
  remove(tween: Tween | Timeline): void;
  clear(): void;

  // 插件管理
  use(plugin: Plugin): void;
  unuse(pluginName: string): void;
  hasPlugin(name: string): boolean;

  // 事件
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
  emit(event: string, ...args: any[]): void;

  // 配置
  configure(config: Partial<AnimatorConfig>): void;

  // 属性
  readonly scene: Scene;
  readonly renderer: Renderer;
  readonly isPlaying: boolean;
  readonly currentTime: number;
  readonly duration: number;
}
```

### Renderer

渲染器基类，所有渲染后端的基础接口。

```typescript
abstract class Renderer {
  abstract initialize(canvas: HTMLCanvasElement): void;
  abstract render(scene: Scene, deltaTime: number): void;
  abstract resize(width: number, height: number): void;
  abstract dispose(): void;

  // 渲染状态
  readonly context: RenderingContext;
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}
```

#### CanvasRenderer

基于 Canvas 2D 的渲染器。

```typescript
class CanvasRenderer extends Renderer {
  constructor(config?: CanvasRendererConfig);

  // Canvas 专用方法
  getContext(): CanvasRenderingContext2D;
  clear(): void;
  save(): void;
  restore(): void;
}
```

#### WebGLRenderer

基于 WebGL 的渲染器。

```typescript
class WebGLRenderer extends Renderer {
  constructor(config?: WebGLRendererConfig);

  // WebGL 专用方法
  getGL(): WebGLRenderingContext;
  createShader(type: number, source: string): WebGLShader;
  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram;
}
```

### Tween

补间动画类，定义属性值随时间的变化。

```typescript
class Tween {
  constructor(config: TweenConfig);

  // 播放控制
  play(): void;
  pause(): void;
  stop(): void;
  restart(): void;

  // 链式调用
  to(props: any, duration?: number): Tween;
  from(props: any, duration?: number): Tween;
  delay(duration: number): Tween;
  easing(easing: EasingFunction | string): Tween;
  repeat(times: number): Tween;
  yoyo(yoyo: boolean): Tween;
  loop(loop: boolean): Tween;

  // 事件
  onStart(callback: Function): Tween;
  onUpdate(callback: (progress: number) => void): Tween;
  onComplete(callback: Function): Tween;
  onStop(callback: Function): Tween;

  // 状态
  readonly isPlaying: boolean;
  readonly progress: number;
  readonly elapsed: number;
}
```

### Timeline

时间轴类，用于编排复杂的动画序列。

```typescript
class Timeline extends Tween {
  constructor(config?: TimelineConfig);

  // 动画编排
  add(tween: Tween): Timeline;
  sequence(tweens: Tween[]): Timeline;
  parallel(tweens: Tween[]): Timeline;
  insert(tween: Tween, time: number): Timeline;

  // 时间控制
  totalTime(): number;
  stretch(duration: number): Timeline;
  compress(duration: number): Timeline;
}
```

### Scene

场景图，管理所有可渲染对象。

```typescript
class Scene extends DisplayObject {
  // 场景管理
  add(...objects: DisplayObject[]): void;
  remove(object: DisplayObject): void;
  clear(): void;

  // 对象查询
  findById(id: string): DisplayObject | null;
  findByName(name: string): DisplayObject[];
  findByType<T>(type: Constructor<T>): T[];
  hitTest(point: Point): DisplayObject | null;

  // 场景属性
  readonly children: DisplayObject[];
  readonly objectCount: number;
}
```

### DisplayObject

显示对象基类。

```typescript
abstract class DisplayObject {
  // 变换
  readonly position: Vector2;
  readonly scale: Vector2;
  readonly pivot: Vector2;
  rotation: number;
  skew: Vector2;

  // 显示属性
  opacity: number;
  visible: boolean;
  zOrder: number;

  // 尺寸
  readonly width: number;
  readonly height: number;
  readonly bounds: Rectangle;

  // 交互
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
  emit(event: string, ...args: any[]): void;

  // 生命周期
  update(deltaTime: number): void;
  render(renderer: Renderer): void;
}
```

## 图形对象

### Shape

图形基类。

```typescript
abstract class Shape extends DisplayObject {
  fill: string | Color | Gradient;
  stroke: string | Color;
  strokeWidth: number;
  strokeCap: CanvasLineCap;
  strokeJoin: CanvasLineJoin;
}
```

### Rectangle

矩形。

```typescript
class Rectangle extends Shape {
  constructor(config: RectangleConfig);

  width: number;
  height: number;
  cornerRadius: number;
}
```

### Circle

圆形。

```typescript
class Circle extends Shape {
  constructor(config: CircleConfig);

  radius: number;
  startAngle: number;
  endAngle: number;
  anticlockwise: boolean;
}
```

### Ellipse

椭圆。

```typescript
class Ellipse extends Shape {
  constructor(config: EllipseConfig);

  radiusX: number;
  radiusY: number;
  rotation: number;
  startAngle: number;
  endAngle: number;
}
```

### Polygon

多边形。

```typescript
class Polygon extends Shape {
  constructor(config: PolygonConfig);

  points: Vector2[];
  closePath: boolean;
}
```

### Text

文本。

```typescript
class Text extends Shape {
  constructor(config: TextConfig);

  text: string;
  font: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  lineHeight: number;
  letterSpacing: number;
  maxWidth: number;
}
```

### Path

路径。

```typescript
class Path extends Shape {
  constructor(config?: PathConfig);

  commands: PathCommand[];
  points: Vector2[];
  closePath: boolean;

  // 路径操作
  moveTo(x: number, y: number): Path;
  lineTo(x: number, y: number): Path;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): Path;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): Path;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): Path;
}
```

### Sprite

精灵（图片）。

```typescript
class Sprite extends DisplayObject {
  constructor(config: SpriteConfig);

  texture: Texture;
  frame: Rectangle;
  readonly image: HTMLImageElement;

  // 动画支持
  frames: Rectangle[];
  frameRate: number;
  readonly isPlaying: boolean;
  play(): void;
  pause(): void;
  stop(): void;
  gotoFrame(frame: number): void;
}
```

### Container

容器对象。

```typescript
class Container extends DisplayObject {
  constructor(config?: ContainerConfig);

  // 子对象管理
  add(...objects: DisplayObject[]): void;
  remove(object: DisplayObject): void;
  removeAt(index: number): void;
  clear(): void;
  indexOf(object: DisplayObject): number;
  contains(object: DisplayObject): boolean;

  // 排序
  sort(method: (a: DisplayObject, b: DisplayObject) => number): void;

  // 属性
  readonly children: DisplayObject[];
  readonly numChildren: number;
}
```

## 数学工具

### Vector2

二维向量。

```typescript
class Vector2 {
  constructor(x: number = 0, y: number = 0);

  x: number;
  y: number;

  // 向量运算
  add(v: Vector2): Vector2;
  sub(v: Vector2): Vector2;
  mul(scalar: number): Vector2;
  div(scalar: number): Vector2;
  dot(v: Vector2): number;
  cross(v: Vector2): number;
  length(): number;
  lengthSquared(): number;
  normalize(): Vector2;
  distanceTo(v: Vector2): number;
  angle(): number;
  rotate(angle: number): Vector2;
  clone(): Vector2;
  copy(v: Vector2): Vector2;

  // 静态方法
  static distance(a: Vector2, b: Vector2): number;
  static angleBetween(a: Vector2, b: Vector2): number;
  static lerp(a: Vector2, b: Vector2, t: number): Vector2;
}
```

### Color

颜色工具。

```typescript
class Color {
  constructor(value: string | number);

  r: number;
  g: number;
  b: number;
  a: number;

  // 转换方法
  toHex(): string;
  toRgb(): string;
  toRgba(): string;
  toHsl(): HslColor;
  toArray(): number[];

  // 静态方法
  static fromHex(hex: string): Color;
  static fromRgb(r: number, g: number, b: number, a?: number): Color;
  static fromHsl(h: number, s: number, l: number, a?: number): Color;
  static lerp(a: Color, b: Color, t: number): Color;
}
```

## 插件 API

### Plugin

插件接口。

```typescript
interface Plugin {
  name: string;
  version?: string;
  dependencies?: string[];

  install(animator: Animator): void;
  uninstall(animator: Animator): void;
  config?: PluginConfig;
}
```

## 工具函数

### Easing

缓动函数。

```typescript
type EasingFunction = (t: number) => number;

namespace Easing {
  // Linear
  linear: EasingFunction;

  // Quad
  easeInQuad: EasingFunction;
  easeOutQuad: EasingFunction;
  easeInOutQuad: EasingFunction;

  // Cubic
  easeInCubic: EasingFunction;
  easeOutCubic: EasingFunction;
  easeInOutCubic: EasingFunction;

  // Quart
  easeInQuart: EasingFunction;
  easeOutQuart: EasingFunction;
  easeInOutQuart: EasingFunction;

  // Quint
  easeInQuint: EasingFunction;
  easeOutQuint: EasingFunction;
  easeInOutQuint: EasingFunction;

  // Sine
  easeInSine: EasingFunction;
  easeOutSine: EasingFunction;
  easeInOutSine: EasingFunction;

  // Expo
  easeInExpo: EasingFunction;
  easeOutExpo: EasingFunction;
  easeInOutExpo: EasingFunction;

  // Circ
  easeInCirc: EasingFunction;
  easeOutCirc: EasingFunction;
  easeInOutCirc: EasingFunction;

  // Elastic
  easeOutElastic: EasingFunction;
  easeInOutElastic: EasingFunction;

  // Back
  easeInBack: EasingFunction;
  easeOutBack: EasingFunction;
  easeInOutBack: EasingFunction;

  // Bounce
  easeOutBounce: EasingFunction;
  easeInOutBounce: EasingFunction;
}
```

### Utils

工具函数。

```typescript
namespace Utils {
  // 数值
  clamp(value: number, min: number, max: number): number;
  lerp(a: number, b: number, t: number): number;
  mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
  degToRad(degrees: number): number;
  radToDeg(radians: number): number;

  // 数组
  randomInt(min: number, max: number): number;
  randomFloat(min: number, max: number): number;
  randomChoice<T>(array: T[]): T;

  // 字符串
  uid(prefix?: string): string;
  camelCase(str: string): string;
  kebabCase(str: string): string;

  // 性能
  debounce(func: Function, wait: number): Function;
  throttle(func: Function, limit: number): Function;
}
```

## 类型定义

```typescript
// 配置类型
interface AnimatorConfig {
  renderer: Renderer;
  fps?: number;
  autoPlay?: boolean;
  loop?: boolean;
  plugins?: Plugin[];
}

interface TweenConfig {
  target: any;
  to?: any;
  from?: any;
  duration?: number;
  delay?: number;
  easing?: EasingFunction | string;
  repeat?: number;
  yoyo?: boolean;
  loop?: boolean;
  onStart?: Function;
  onUpdate?: (progress: number) => void;
  onComplete?: Function;
}

// 事件类型
type AnimatorEvent = 'play' | 'pause' | 'stop' | 'update' | 'complete';
type TweenEvent = 'start' | 'update' | 'complete' | 'stop';
```
