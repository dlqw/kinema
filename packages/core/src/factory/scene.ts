/**
 * Scene Factory - Convenient factory functions for creating scenes
 *
 * Provides simplified API for scene creation and rendering.
 *
 * @module factory/scene
 */

import type { SceneConfig } from '../types';
import { Scene, SceneBuilder } from '../scene';
import { VectorObject } from '../core';
import type { RenderObject, Animation } from '../types';

// ============================================================================
// Scene Creation
// ============================================================================

/**
 * Create a scene with standard configuration
 *
 * @param options - Scene configuration options
 * @returns A new Scene instance
 *
 * @example
 * ```typescript
 * const scene = createScene({
 *   width: 1920,
 *   height: 1080,
 *   fps: 60,
 *   backgroundColor: '#000000'
 * });
 * ```
 */
export function createScene(options: {
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
} = {}): Scene {
  const config: SceneConfig = {
    width: options.width ?? 1920,
    height: options.height ?? 1080,
    fps: options.fps ?? 60,
    backgroundColor: options.backgroundColor
  };

  return new Scene(config);
}

/**
 * Create a scene with HD resolution (1920x1080)
 *
 * @param options - Optional scene configuration
 * @returns A new Scene instance
 */
export function createHDScene(options: {
  fps?: number;
  backgroundColor?: string;
} = {}): Scene {
  return createScene({
    width: 1920,
    height: 1080,
    ...options
  });
}

/**
 * Create a scene with Full HD resolution (1920x1080)
 *
 * @param options - Optional scene configuration
 * @returns A new Scene instance
 */
export function createFullHDScene(options: {
  fps?: number;
  backgroundColor?: string;
} = {}): Scene {
  return createHDScene(options);
}

/**
 * Create a scene with 4K resolution (3840x2160)
 *
 * @param options - Optional scene configuration
 * @returns A new Scene instance
 */
export function create4KScene(options: {
  fps?: number;
  backgroundColor?: string;
} = {}): Scene {
  return createScene({
    width: 3840,
    height: 2160,
    ...options
  });
}

/**
 * Create a square scene (e.g., for social media)
 *
 * @param size - Square dimensions
 * @param options - Optional scene configuration
 * @returns A new Scene instance
 */
export function createSquareScene(
  size: number = 1080,
  options: {
    fps?: number;
    backgroundColor?: string;
  } = {}
): Scene {
  return createScene({
    width: size,
    height: size,
    ...options
  });
}

/**
 * Create a vertical scene (e.g., for mobile)
 *
 * @param options - Optional scene configuration
 * @returns A new Scene instance
 */
export function createVerticalScene(options: {
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
} = {}): Scene {
  return createScene({
    width: options.width ?? 1080,
    height: options.height ?? 1920,
    ...options
  });
}

/**
 * Scene builder for fluent API
 *
 * @example
 * ```typescript
 * const scene = sceneBuilder()
 *   .withDimensions(1920, 1080)
 *   .withFps(60)
 *   .withBackgroundColor('#000000')
 *   .build();
 * ```
 */
export function sceneBuilder(): SceneBuilder {
  return new SceneBuilder();
}

// ============================================================================
// Common Presets
// ============================================================================

/**
 * Scene size presets
 */
export const ScenePresets = {
  /** 1920x1080 - Full HD */
  FullHD: { width: 1920, height: 1080 },
  /** 2560x1440 - 2K */
  '2K': { width: 2560, height: 1440 },
  /** 3840x2160 - 4K */
  '4K': { width: 3840, height: 2160 },
  /** 1080x1080 - Square */
  Square: { width: 1080, height: 1080 },
  /** 1080x1920 - Vertical/Story */
  Story: { width: 1080, height: 1920 },
  /** 1080x1350 - Portrait */
  Portrait: { width: 1080, height: 1350 },
  /** 1280x720 - HD */
  HD: { width: 1280, height: 720 },
  /** 640x360 - SD */
  SD: { width: 640, height: 360 }
} as const;

/**
 * FPS presets
 */
export const FPSPresets = {
  /** Film standard */
  film: 24,
  /** NTSC standard */
  ntsc: 30,
  /** PAL standard */
  pal: 25,
  /** Smooth animation */
  smooth: 60,
  /** High refresh rate */
  high: 120,
  /** Ultra high refresh rate */
  ultra: 144
} as const;

/**
 * Create a scene from preset
 *
 * @param preset - Scene size preset
 * @param fps - Frame rate (default: 60)
 * @param backgroundColor - Background color
 * @returns A new Scene instance
 *
 * @example
 * ```typescript
 * const scene4K = createSceneFromPreset(ScenePresets['4K'], FPSPresets.film);
 * const sceneStory = createSceneFromPreset(ScenePresets.Story);
 * ```
 */
export function createSceneFromPreset(
  preset: keyof typeof ScenePresets | { width: number; height: number },
  fps: number = 60,
  backgroundColor?: string
): Scene {
  const size = typeof preset === 'string' ? ScenePresets[preset] : preset;

  return createScene({
    width: size.width,
    height: size.height,
    fps,
    backgroundColor
  });
}

// ============================================================================
// Scene Composition Helpers
// ============================================================================

/**
 * Add multiple objects to a scene
 *
 * @param scene - The scene
 * @param objects - Objects to add
 * @returns A new scene with the objects added
 */
export function addObjects(
  scene: Scene,
  ...objects: RenderObject[]
): Scene {
  return scene.addObjects(...objects);
}

/**
 * Schedule multiple animations on a scene
 *
 * @param scene - The scene
 * @param animations - Array of animations and their delays
 * @returns A new scene with animations scheduled
 *
 * @example
 * ```typescript
 * const scene = scheduleAnimations(initialScene, [
 *   { animation: fadeIn, delay: 0 },
 *   { animation: rotate, delay: 1 },
 *   { animation: fadeOut, delay: 3 }
 * ]);
 * ```
 */
export function scheduleAnimations(
  scene: Scene,
  animations: Array<{ animation: Animation; delay: number }>
): Scene {
  return animations.reduce(
    (s, { animation, delay }) => s.schedule(animation, delay),
    scene
  );
}

/**
 * Render a scene to a specific time
 *
 * @param scene - The scene
 * @param time - Time to render at
 * @returns Array of visible objects at the given time
 */
export function renderAt(scene: Scene, time: number): ReadonlyArray<RenderObject> {
  return scene.updateTo(time).getVisibleObjects();
}

/**
 * Get all frames for a scene over a duration
 *
 * @param scene - The scene
 * @param duration - Duration in seconds
 * @returns Array of frames (each frame is an array of objects)
 */
export function generateFrames(
  scene: Scene,
  duration: number
): ReadonlyArray<ReadonlyArray<RenderObject>> {
  const fps = scene.fps;
  const frameCount = Math.floor(duration * fps);
  const frames: ReadonlyArray<RenderObject>[] = [];

  for (let i = 0; i < frameCount; i++) {
    const time = i / fps;
    frames.push(scene.updateTo(time).getVisibleObjects());
  }

  return frames;
}

/**
 * Create a snapshot at a specific time
 *
 * @param scene - The scene
 * @param time - Time to snapshot
 * @returns A scene snapshot
 */
export function snapshotAt(scene: Scene, time: number): ReturnType<Scene['createSnapshot']> {
  return scene.updateTo(time).createSnapshot();
}

// ============================================================================
// Animation Helper Functions
// ============================================================================

/**
 * Animate objects appearing one after another
 *
 * @param scene - The scene
 * @param objects - Objects to animate
 * @param animation - Animation function for each object
 * @param delay - Delay between each animation
 * @returns A new scene with animations scheduled
 *
 * @example
 * ```typescript
 * const scene = animateSequentially(
 *   initialScene,
 *   [circle1, circle2, circle3],
 *   (obj) => fade(obj, { duration: 0.5 }),
 *   0.2
 * );
 * ```
 */
export function animateSequentially(
  scene: Scene,
  objects: RenderObject[],
  animation: (obj: RenderObject, index: number) => Animation,
  delay: number = 0.5
): Scene {
  return objects.reduce((s, obj, index) => {
    const anim = animation(obj, index);
    const startDelay = index * delay;
    return s.schedule(anim, startDelay);
  }, scene);
}

/**
 * Animate objects appearing simultaneously
 *
 * @param scene - The scene
 * @param objects - Objects to animate
 * @param animation - Animation function for each object
 * @returns A new scene with animations scheduled
 */
export function animateSimultaneously(
  scene: Scene,
  objects: RenderObject[],
  animation: (obj: RenderObject, index: number) => Animation
): Scene {
  return objects.reduce((s, obj, index) => {
    const anim = animation(obj, index);
    return s.schedule(anim, 0);
  }, scene);
}

/**
 * Animate objects with a wave effect
 *
 * @param scene - The scene
 * @param objects - Array of objects
 * @param animation - Animation to apply to each object
 * @param delay - Delay between each object
 * @returns A new scene with wave animations scheduled
 *
 * @example
 * ```typescript
 * const scene = wave(
 *   initialScene,
 *   [circle1, circle2, circle3, circle4],
 *   (obj) => fade(obj, { duration: 1 }),
 *   0.3
 * );
 * ```
 */
export function wave(
  scene: Scene,
  objects: RenderObject[],
  animation: (obj: RenderObject, index: number) => Animation,
  delay: number = 0.3
): Scene {
  return animateSequentially(scene, objects, animation, delay);
}

// ============================================================================
// Default export
// ============================================================================

export default {
  // Scene creation
  createScene,
  createHDScene,
  createFullHDScene,
  create4KScene,
  createSquareScene,
  createVerticalScene,
  sceneBuilder,

  // Presets
  ScenePresets,
  FPSPresets,
  createSceneFromPreset,

  // Composition
  addObjects,
  scheduleAnimations,
  renderAt,
  generateFrames,
  snapshotAt,

  // Animation helpers
  animateSequentially,
  animateSimultaneously,
  wave
};
