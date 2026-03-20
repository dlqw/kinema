# 迁移指南

从其他动画框架迁移到 AniMaker。

## 从 GSAP 迁移

### 时间轴

**GSAP:**
```javascript
const tl = gsap.timeline();
tl.to('.box', { x: 100, duration: 1 })
  .to('.box', { y: 100, duration: 1 });
```

**AniMaker:**
```typescript
const tl = new Timeline();
tl.sequence([
  new Tween({ target: box.position, to: { x: 100 }, duration: 1000 }),
  new Tween({ target: box.position, to: { y: 100 }, duration: 1000 }),
]);
```

### 补间动画

**GSAP:**
```javascript
gsap.to('.box', {
  x: 100,
  rotation: 360,
  duration: 1,
  ease: 'power2.inOut',
  delay: 0.5,
  repeat: 3,
  yoyo: true,
});
```

**AniMaker:**
```typescript
new Tween({
  target: box.position,
  to: { x: 100 },
  duration: 1000,
  easing: 'easeInOutQuad',
  delay: 500,
  repeat: 3,
  yoyo: true,
});
new Tween({
  target: box,
  to: { rotation: Math.PI * 2 },
  duration: 1000,
});
```

## 从 Anime.js 迁移

### 基本动画

**Anime.js:**
```javascript
anime({
  targets: '.box',
  translateX: 250,
  rotate: '1turn',
  backgroundColor: '#FFF',
  duration: 800,
  easing: 'easeInOutQuad',
});
```

**AniMaker:**
```typescript
new Tween({
  target: box.position,
  to: { x: 250 },
  duration: 800,
  easing: 'easeInOutQuad',
});
new Tween({
  target: box,
  to: { rotation: Math.PI * 2 },
  duration: 800,
});
new Tween({
  target: box,
  to: { fill: '#FFF' },
  duration: 800,
});
```

### 时间轴

**Anime.js:**
```javascript
const tl = anime.timeline({
  easing: 'easeOutExpo',
  duration: 750,
});

tl.add({
  targets: '.box',
  translateX: 250,
}).add({
  targets: '.circle',
  translateY: 250,
}, '-=500');
```

**AniMaker:**
```typescript
const tl = new Timeline();
tl.add(new Tween({
  target: box.position,
  to: { x: 250 },
  duration: 750,
  easing: 'easeOutExpo',
}));
tl.insert(new Tween({
  target: circle.position,
  to: { y: 250 },
  duration: 750,
  easing: 'easeOutExpo',
}), 250); // 750 - 500 = 250ms offset
```

## 从 Lottie 迁移

Lottie 用于 After Effects 动画导出，而 AniMaker 是程序化动画框架。

### 加载 Lottie

AniMaker 支持通过插件加载 Lottie 动画：

```typescript
import { LottiePlugin } from '@animaker/plugin-lottie';

animator.use(new LottiePlugin());

// 加载 Lottie 动画
const lottieAnimation = await animator.loaders.lottie('animation.json');
animator.scene.add(lottieAnimation);
```

### 重写为代码

将 Lottie 动画重写为 AniMaker 代码：

**Lottie (JSON):**
```json
{
  "layers": [
    {
      "ty": 4,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [360] }] }
      }
    }
  ]
}
```

**AniMaker:**
```typescript
const obj = new Rectangle({ width: 100, height: 100 });
animator.scene.add(obj);

new Tween({
  target: obj,
  to: { rotation: Math.PI * 2 },
  duration: 1000,
});
```

## 从 Three.js 动画迁移

Three.js 主要用于 3D，AniMaker 支持 2D/3D。

### Three.js 动画循环

**Three.js:**
```javascript
function animate() {
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}
```

**AniMaker (WebGL):**
```typescript
const renderer = new WebGLRenderer({ canvas });
const scene = new Scene();
const mesh = new Mesh3D({ geometry, material });

animator.scene.add(scene);
animator.on('update', (deltaTime) => {
  mesh.rotation.x += deltaTime * 0.001;
  mesh.rotation.y += deltaTime * 0.001;
});

animator.play();
```

## 常见模式对比

### 淡入淡出

| 框架 | 代码 |
|------|------|
| GSAP | `gsap.to(el, { opacity: 0 })` |
| Anime.js | `anime({ targets: el, opacity: 0 })` |
| AniMaker | `new Tween({ target: el, to: { opacity: 0 } })` |

### 并行动画

| 框架 | 代码 |
|------|------|
| GSAP | `gsap.to([el1, el2], { x: 100 })` |
| Anime.js | `anime({ targets: [el1, el2], translateX: 100 })` |
| AniMaker | `timeline.parallel([tween1, tween2])` |

### 缓动函数映射

| GSAP | Anime.js | AniMaker |
|------|----------|----------|
| none | linear | linear |
| power1.out | easeOutQuad | easeOutQuad |
| power2.inOut | easeInOutCubic | easeInOutCubic |
| elastic.out | easeOutElastic | easeOutElastic |
| bounce.out | easeOutBounce | easeOutBounce |

### 时间单位

| 框架 | 时间单位 | 示例 |
|------|----------|------|
| GSAP | 秒 | `duration: 1` = 1秒 |
| Anime.js | 毫秒 | `duration: 1000` = 1秒 |
| AniMaker | 毫秒 | `duration: 1000` = 1秒 |

## 迁移检查清单

- [ ] 将时间单位转换为毫秒
- [ ] 将 CSS 选择器替换为对象引用
- [ ] 将颜色值转换为标准格式
- [ ] 调整缓动函数名称
- [ ] 重构时间轴结构
- [ ] 测试所有动画效果
- [ ] 优化性能（对象池、批量渲染等）

## 获取帮助

如果迁移过程中遇到问题：

1. 查看 [API 参考](./api/)
2. 参考 [示例集合](./examples/)
3. 提交 [GitHub Issue](https://github.com/your-username/animaker/issues)
