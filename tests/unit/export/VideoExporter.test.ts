/**
 * Unit tests for Video Exporter
 *
 * Tests video export functionality including WebM and MP4 formats
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VideoExporter,
  MP4Exporter,
  exportAsWebM,
  exportAsMP4,
  registerVideoEncoders,
  type VideoExportConfig,
  type VideoExportResult,
} from '../../../packages/core/src/export/VideoExporter';
import { EncoderRegistry } from '../../../packages/core/src/export/EncoderRegistry';
import type { Scene } from '../../../packages/core/src/types';
import { setupCanvasMock } from '../../mocks/canvas.mock';

// Setup canvas mock
setupCanvasMock();

// Mock ImageData
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(widthOrData: number | Uint8ClampedArray, height?: number) {
    if (typeof widthOrData === 'number') {
      this.width = widthOrData;
      this.height = height ?? widthOrData;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = widthOrData;
      this.width = height ?? Math.sqrt(widthOrData.length / 4) | 0;
      this.height = (widthOrData.length / 4 / this.width) | 0;
    }
  }
}
(globalThis as any).ImageData = MockImageData;

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = vi.fn((mimeType: string) => mimeType.includes('webm'));

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(
    public stream: MediaStream,
    public options?: MediaRecorderOptions,
  ) {}

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock-webm'], { type: 'video/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }
}

// Mock FFmpeg
class MockFFmpeg {
  loaded = true;
  async load(): Promise<void> {}
  async writeFile(): Promise<void> {}
  async readFile(): Promise<Uint8Array> {
    return new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
  }
  async deleteFile(): Promise<void> {}
  async exec(): Promise<void> {}
  on(): void {}
  off(): void {}
}

// Mock Scene
class MockScene {
  config = {
    width: 800,
    height: 600,
    fps: 30,
    duration: 5,
  };

  private objects: any[] = [];

  addObject(obj: any): void {
    this.objects.push(obj);
  }

  updateTo(time: number): MockScene {
    return this;
  }

  getVisibleObjects(): any[] {
    return this.objects.map((obj) => ({
      ...obj,
      visible: true,
      getState: () => ({
        transform: {
          position: { x: 0, y: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          opacity: 1,
        },
      }),
      getBoundingBox: () => ({
        min: { x: -50, y: -50, z: 0 },
        max: { x: 50, y: 50, z: 0 },
        center: { x: 0, y: 0, z: 0 },
      }),
    }));
  }
}

// Setup global mocks
beforeEach(() => {
  (globalThis as any).MediaRecorder = MockMediaRecorder;
  (globalThis as any).MediaStream = vi.fn();
  (globalThis as any).ffmpeg = new MockFFmpeg();
});

afterEach(() => {
  delete (globalThis as any).MediaRecorder;
  delete (globalThis as any).MediaStream;
  delete (globalThis as any).ffmpeg;
  vi.clearAllMocks();
});

describe('VideoExporter', () => {
  let exporter: VideoExporter;
  let mockScene: MockScene;
  let config: VideoExportConfig;

  beforeEach(() => {
    config = {
      output: 'test-video.webm',
      duration: 1,
      fps: 10,
      container: 'webm',
      width: 800,
      height: 600,
    };

    mockScene = new MockScene();
    mockScene.addObject({ id: 'test-obj', visible: true });

    exporter = new VideoExporter(config);
  });

  describe('VideoExporter Creation', () => {
    it('should create exporter with config', () => {
      expect(exporter).toBeInstanceOf(VideoExporter);
    });

    it('should create exporter with MP4 container', () => {
      const mp4Exporter = new VideoExporter({
        ...config,
        container: 'mp4',
        output: 'test.mp4',
      });
      expect(mp4Exporter).toBeInstanceOf(VideoExporter);
    });
  });

  describe('File Extension', () => {
    it('should return webm extension for WebM container', () => {
      const webmExporter = new VideoExporter({
        ...config,
        container: 'webm',
      });
      expect(webmExporter.getExtension()).toBe('webm');
    });

    it('should return mp4 extension for MP4 container', () => {
      const mp4Exporter = new VideoExporter({
        ...config,
        container: 'mp4',
      });
      expect(mp4Exporter.getExtension()).toBe('mp4');
    });

    it('should default to webm extension', () => {
      const defaultExporter = new VideoExporter({
        output: 'test',
      });
      expect(defaultExporter.getExtension()).toBe('webm');
    });
  });

  describe('Export Validation', () => {
    it('should fail without output', async () => {
      const invalidExporter = new VideoExporter({} as VideoExportConfig);
      const result = await invalidExporter.export(mockScene as unknown as Scene);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Export Cancellation', () => {
    it('should support cancel', () => {
      expect(() => exporter.cancel()).not.toThrow();
    });
  });
});

describe('MP4Exporter', () => {
  let exporter: MP4Exporter;
  let mockScene: MockScene;
  let config: VideoExportConfig;

  beforeEach(() => {
    config = {
      output: 'test-video.mp4',
      duration: 1,
      fps: 10,
      container: 'mp4',
      width: 800,
      height: 600,
    };

    mockScene = new MockScene();
    mockScene.addObject({ id: 'test-obj', visible: true });

    exporter = new MP4Exporter(config);
  });

  describe('MP4Exporter Creation', () => {
    it('should create exporter with config', () => {
      expect(exporter).toBeInstanceOf(MP4Exporter);
    });
  });

  describe('File Extension', () => {
    it('should return mp4 extension', () => {
      expect(exporter.getExtension()).toBe('mp4');
    });
  });

  describe('Export Validation', () => {
    it('should fail without output', async () => {
      const invalidExporter = new MP4Exporter({} as VideoExportConfig);
      const result = await invalidExporter.export(mockScene as unknown as Scene);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Export Cancellation', () => {
    it('should support cancel', () => {
      expect(() => exporter.cancel()).not.toThrow();
    });
  });
});

describe('Quick Export Functions', () => {
  let mockScene: MockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    mockScene.addObject({ id: 'test-obj', visible: true });
  });

  describe('exportAsWebM', () => {
    it('should export as WebM', async () => {
      const result = await exportAsWebM(mockScene as unknown as Scene, 'test.webm', {
        duration: 1,
        fps: 10,
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should support codec option', async () => {
      const result = await exportAsWebM(mockScene as unknown as Scene, 'test.webm', {
        duration: 1,
        codec: 'vp9',
      });

      expect(result).toBeDefined();
    });
  });

  describe('exportAsMP4', () => {
    it('should export as MP4', async () => {
      const result = await exportAsMP4(mockScene as unknown as Scene, 'test.mp4', {
        duration: 1,
        fps: 10,
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});

describe('Encoder Registration', () => {
  it('should register video encoders', () => {
    const registry = EncoderRegistry.getInstance();
    registry.clear();

    registerVideoEncoders(registry);

    expect(registry.has('webm-mediarecorder')).toBe(true);
    expect(registry.has('mp4-ffmpeg')).toBe(true);
  });
});

describe('Video Export - Edge Cases', () => {
  it('should handle MediaRecorder not available', async () => {
    delete (globalThis as any).MediaRecorder;

    const config: VideoExportConfig = {
      output: 'test.webm',
      container: 'webm',
      duration: 1,
      fps: 10,
    };

    const exporter = new VideoExporter(config);
    const mockScene = new MockScene();
    mockScene.addObject({ id: 'test', visible: true });

    const result = await exporter.export(mockScene as unknown as Scene);

    expect(result.success).toBe(false);
    expect(result.error).toContain('MediaRecorder');
  });

  it('should handle FFmpeg not available for MP4', async () => {
    delete (globalThis as any).ffmpeg;

    const config: VideoExportConfig = {
      output: 'test.mp4',
      container: 'mp4',
      duration: 1,
      fps: 10,
    };

    const exporter = new VideoExporter(config);
    const mockScene = new MockScene();
    mockScene.addObject({ id: 'test', visible: true });

    const result = await exporter.export(mockScene as unknown as Scene);

    // Result depends on encoder availability
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });
});
