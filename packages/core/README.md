# @kinema/core

High-performance 2D animation rendering framework for TypeScript/JavaScript.

## Install

```bash
npm install @kinema/core
```

## Quick Start

```typescript
import { createScene, RenderEngine, MoveAnimation, easeInOut } from '@kinema/core';

// Create a scene
const scene = createScene({ width: 1920, height: 1080 });

// Add objects and animations
const rect = scene.addRectangle({ x: 100, y: 100, width: 200, height: 150, fill: '#ff6600' });

rect.animate(
  new MoveAnimation(rect, { targetX: 800, targetY: 400, duration: 2, easing: easeInOut }),
);

// Render
const engine = new RenderEngine();
await engine.render(scene);
```

## Features

- **Object Hierarchy** — RenderObject, VectorObject, TextObject, GroupObject
- **Animation System** — Keyframe animations with composable AnimationGroup
- **Scene Management** — SceneBuilder for declarative scene construction
- **Rendering Pipeline** — WebGPU (primary) / WebGL2 fallback / Canvas 2D
- **Post-Processing** — Bloom, blur, vignette, chromatic aberration, color correction
- **Export** — Image sequences, GIF, WebM, MP4
- **Easing** — 30+ built-in easing functions + custom bezier curves
- **Timeline** — Precise temporal control with markers and keyframes

## API Modules

| Module      | Description                            |
| ----------- | -------------------------------------- |
| `core`      | Render objects and object hierarchy    |
| `animation` | Animation classes and builders         |
| `scene`     | Scene management and builders          |
| `timeline`  | Timeline and keyframe control          |
| `render`    | Rendering pipeline and graphics device |
| `effects`   | Post-processing effects                |
| `export`    | Image and video export                 |
| `easing`    | Easing functions                       |
| `events`    | Typed event system                     |

## Requirements

- Node.js >= 18
- Browser with WebGPU, WebGL2, or Canvas 2D support

## License

MIT
