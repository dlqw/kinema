# 示例集合

通过实战示例学习 Kinema 的各种功能。

## 基础示例

### 1. 简单移动

让一个矩形从左边移动到右边：

```typescript
import { Animator, CanvasRenderer, Rectangle, Tween } from '@kinema/core';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas);
const animator = new Animator({ renderer });

const rect = new Rectangle({
  width: 50,
  height: 50,
  x: 0,
  y: 100,
  fill: '#3498db',
});

animator.scene.add(rect);

const moveTween = new Tween({
  target: rect.position,
  to: { x: 300 },
  duration: 1000,
  easing: 'easeInOutQuad',
});

animator.add(moveTween);
animator.play();
```

### 2. 旋转动画

旋转一个正方形：

```typescript
const rect = new Rectangle({
  width: 100,
  height: 100,
  x: 150,
  y: 100,
  fill: '#e74c3c',
  pivot: { x: 0.5, y: 0.5 }, // 设置旋转中心
});

const rotateTween = new Tween({
  target: rect,
  to: { rotation: Math.PI * 2 },
  duration: 2000,
  easing: 'easeInOutCubic',
  loop: true,
});
```

### 3. 缩放动画

心形缩放效果：

```typescript
const heart = new Heart({
  x: 200,
  y: 150,
  size: 50,
  fill: '#e91e63',
});

const scaleTween = new Tween({
  target: heart.scale,
  to: { x: 1.5, y: 1.5 },
  duration: 500,
  easing: 'easeOutElastic',
  yoyo: true, // 自动往返
  repeat: Infinity,
});
```

## 进阶示例

### 4. 序列动画

按顺序执行多个动画：

```typescript
const timeline = new Timeline();

timeline.sequence([
  // 第一步：淡入
  new Tween({
    target: obj,
    to: { opacity: 1 },
    duration: 500,
  }),
  // 第二步：移动
  new Tween({
    target: obj.position,
    to: { x: 200, y: 100 },
    duration: 1000,
  }),
  // 第三步：旋转
  new Tween({
    target: obj,
    to: { rotation: Math.PI },
    duration: 800,
  }),
]);

animator.add(timeline);
animator.play();
```

### 5. 并行动画

同时执行多个动画：

```typescript
const timeline = new Timeline();

timeline.parallel([
  // 水平移动
  new Tween({
    target: obj.position,
    to: { x: 300 },
    duration: 1000,
  }),
  // 同时旋转
  new Tween({
    target: obj,
    to: { rotation: Math.PI * 4 },
    duration: 1000,
  }),
  // 同时改变颜色
  new Tween({
    target: obj,
    to: { fill: '#ff5722' },
    duration: 1000,
  }),
]);
```

### 6. 复杂编排

序列和并行混合：

```typescript
const timeline = new Timeline();

// 第一阶段：淡入并移动
timeline.parallel([
  new Tween({ target: obj, to: { opacity: 1 }, duration: 500 }),
  new Tween({ target: obj.position, to: { y: 200 }, duration: 500 }),
]);

// 第二阶段：旋转和缩放
timeline.parallel([
  new Tween({ target: obj, to: { rotation: Math.PI }, duration: 800 }),
  new Tween({ target: obj.scale, to: { x: 1.5, y: 1.5 }, duration: 800 }),
]);

// 第三阶段：淡出
timeline.add(
  new Tween({
    target: obj,
    to: { opacity: 0 },
    duration: 300,
  }),
);
```

## 交互示例

### 7. 鼠标跟随

对象跟随鼠标移动：

```typescript
const cursor = new Circle({
  radius: 10,
  fill: '#00bcd4',
  x: 0,
  y: 0,
});

animator.scene.add(cursor);

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 使用平滑移动
  new Tween({
    target: cursor.position,
    to: { x, y },
    duration: 100,
    easing: 'easeOutQuad',
  }).play();
});
```

### 8. 点击动画

点击时触发动画：

```typescript
const button = new Rectangle({
  width: 120,
  height: 40,
  x: 140,
  y: 130,
  fill: '#4caf50',
  cornerRadius: 5,
});

button.on('click', () => {
  // 点击时缩小
  const press = new Tween({
    target: button.scale,
    to: { x: 0.95, y: 0.95 },
    duration: 50,
    easing: 'easeOutQuad',
    onComplete: () => {
      // 释放时恢复
      new Tween({
        target: button.scale,
        to: { x: 1, y: 1 },
        duration: 200,
        easing: 'easeOutElastic',
      }).play();
    },
  });
  press.play();
});
```

### 9. 拖拽动画

拖拽时带动画效果：

```typescript
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const draggable = new Rectangle({
  width: 80,
  height: 80,
  x: 160,
  y: 110,
  fill: '#9c27b0',
});

draggable.on('mousedown', (e) => {
  isDragging = true;
  dragOffset.x = e.local.x;
  dragOffset.y = e.local.y;

  // 拖拽开始时放大
  new Tween({
    target: draggable.scale,
    to: { x: 1.1, y: 1.1 },
    duration: 150,
  }).play();
});

canvas.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;

    // 释放时恢复
    new Tween({
      target: draggable.scale,
      to: { x: 1, y: 1 },
      duration: 200,
      easing: 'easeOutElastic',
    }).play();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    draggable.x = e.clientX - rect.left - dragOffset.x;
    draggable.y = e.clientY - rect.top - dragOffset.y;
  }
});
```

## 特效示例

### 10. 粒子系统

创建爆炸粒子效果：

```typescript
const particles: Circle[] = [];

function createExplosion(x: number, y: number) {
  const colors = ['#ff5722', '#ff9800', '#ffc107', '#ffeb3b'];

  for (let i = 0; i < 50; i++) {
    const particle = new Circle({
      radius: Math.random() * 5 + 2,
      x,
      y,
      fill: colors[Math.floor(Math.random() * colors.length)],
    });

    const angle = (Math.PI * 2 * i) / 50;
    const velocity = Math.random() * 200 + 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    animator.scene.add(particle);
    particles.push(particle);

    // 粒子动画
    new Tween({
      target: particle.position,
      to: {
        x: particle.x + vx,
        y: particle.y + vy,
      },
      duration: 1000,
      easing: 'easeOutQuad',
    }).play();

    new Tween({
      target: particle,
      to: { opacity: 0 },
      duration: 1000,
      onComplete: () => {
        animator.scene.remove(particle);
        particles.splice(particles.indexOf(particle), 1);
      },
    }).play();
  }
}

// 点击触发爆炸
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  createExplosion(e.clientX - rect.left, e.clientY - rect.top);
});
```

### 11. 路径动画

沿路径移动：

```typescript
const path = new Path([
  { x: 50, y: 200 },
  { x: 150, y: 50 },
  { x: 250, y: 200 },
  { x: 350, y: 50 },
]);

const obj = new Circle({
  radius: 15,
  fill: '#e91e63',
});

animator.scene.add(path);
animator.scene.add(obj);

const pathTween = new Tween({
  target: obj.position,
  to: { path: path.points },
  duration: 3000,
  easing: 'linear',
  loop: true,
});

animator.add(pathTween);
animator.play();
```

### 12. 弹簧物理

弹簧物理效果：

```typescript
class SpringAnimation {
  private position = 0;
  private velocity = 0;
  private target = 0;
  private stiffness = 0.1;
  private damping = 0.8;

  update(): void {
    const force = (this.target - this.position) * this.stiffness;
    this.velocity += force;
    this.velocity *= this.damping;
    this.position += this.velocity;
  }

  setTarget(value: number): void {
    this.target = value;
  }

  getPosition(): number {
    return this.position;
  }
}

const spring = new SpringAnimation();
const obj = new Rectangle({ width: 50, height: 50, x: 175, y: 125 });

animator.on('update', () => {
  spring.update();
  obj.y = 125 + spring.getPosition();
});

canvas.addEventListener('click', () => {
  spring.setTarget(spring.getTarget() === 0 ? 100 : 0);
});
```

## 完整项目示例

### 13. 简单游戏

一个小型的接球游戏：

```typescript
// 游戏配置
const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 10;

// 创建挡板
const paddle = new Rectangle({
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  x: (GAME_WIDTH - PADDLE_WIDTH) / 2,
  y: GAME_HEIGHT - 30,
  fill: '#2196f3',
});

// 创建球
const ball = new Circle({
  radius: BALL_RADIUS,
  x: GAME_WIDTH / 2,
  y: 50,
  fill: '#f44336',
});

let ballVelocity = { x: 3, y: 3 };
let score = 0;
let lives = 3;

// 显示分数
const scoreText = new Text({
  text: `Score: ${score}`,
  x: 10,
  y: 20,
  fontSize: 20,
  fill: '#333',
});

animator.scene.add(paddle, ball, scoreText);

// 鼠标控制挡板
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left - PADDLE_WIDTH / 2;
  paddle.x = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, paddle.x));
});

// 游戏循环
animator.on('update', () => {
  // 更新球位置
  ball.x += ballVelocity.x;
  ball.y += ballVelocity.y;

  // 墙壁碰撞
  if (ball.x <= BALL_RADIUS || ball.x >= GAME_WIDTH - BALL_RADIUS) {
    ballVelocity.x *= -1;
  }
  if (ball.y <= BALL_RADIUS) {
    ballVelocity.y *= -1;
  }

  // 挡板碰撞
  if (
    ball.y + BALL_RADIUS >= paddle.y &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + PADDLE_WIDTH &&
    ballVelocity.y > 0
  ) {
    ballVelocity.y *= -1;
    score += 10;
    scoreText.text = `Score: ${score}`;

    // 撞击动画
    new Tween({
      target: paddle,
      to: { fill: '#64b5f6' },
      duration: 100,
      yoyo: true,
      repeat: 1,
    }).play();
  }

  // 掉落检测
  if (ball.y > GAME_HEIGHT) {
    lives--;
    if (lives <= 0) {
      animator.stop();
      alert(`Game Over! Score: ${score}`);
    } else {
      ball.x = GAME_WIDTH / 2;
      ball.y = 50;
      ballVelocity = { x: 3, y: 3 };
    }
  }
});

animator.play();
```
