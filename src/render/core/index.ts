/**
 * AniMaker Rendering Engine - Core Module
 *
 * This module exports all core rendering functionality including:
 * - RenderEngine: Main engine entry point
 * - RenderContext: Canvas and presentation management
 * - Capability: GPU capability detection
 * - RenderStats: Performance statistics
 * - Types: Core type definitions
 *
 * @module render/core
 */

// Main engine
export { RenderEngine } from './RenderEngine';

// Context management
export { RenderContextImpl, type RenderContext } from './RenderContext';

// Capability detection
export { CapabilityDetector, RenderAPI } from './Capability';
export type { RenderCapability, DeviceLimits } from './Capability';

// Statistics
export { RenderStatsCollector } from './RenderStats';
export type { RenderStats } from './RenderStats';

// Types
export * from './types';
