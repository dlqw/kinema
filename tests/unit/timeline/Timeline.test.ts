/**
 * Unit tests for Timeline and timeline control functionality
 * Tests playback control, time management, keyframes, and markers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Timeline,
  TimelineDirection,
  PlaybackState,
  TimelineEventType,
  type TimelineConfig,
  type TimelineEvent,
  type TimelineEventListener,
} from '../../../packages/core/src/timeline/Timeline';

describe('Timeline', () => {
  let timeline: Timeline;
  let testConfig: TimelineConfig;

  beforeEach(() => {
    testConfig = {
      duration: 10,
      fps: 60,
      loop: false,
      timeScale: 1,
    };
    timeline = new Timeline(testConfig);
  });

  describe('Timeline Creation and Configuration', () => {
    it('should create timeline with config', () => {
      expect(timeline.getDuration()).toBe(10);
      expect(timeline.getFPS()).toBe(60);
      expect(timeline.getTotalFrames()).toBe(600);
      expect(timeline.getTime()).toBe(0);
    });

    it('should use default values when not specified', () => {
      const minimalTimeline = new Timeline({ duration: 5, fps: 30 });
      expect(minimalTimeline.isLooping()).toBe(false);
      expect(minimalTimeline.getTimeScale()).toBe(1);
    });

    it('should calculate total frames correctly', () => {
      expect(timeline.getTotalFrames()).toBe(10 * 60); // 600 frames
    });

    it('should convert between time and frames', () => {
      expect(timeline.getTimeForFrame(30)).toBe(0.5);
      expect(timeline.getFrameForTime(0.5)).toBe(30);
    });

    it('should get current frame number', () => {
      expect(timeline.getCurrentFrame()).toBe(0);
      timeline.seek(1);
      expect(timeline.getCurrentFrame()).toBe(60);
    });
  });

  describe('Playback Control', () => {
    it('should start playing', () => {
      timeline.play();
      expect(timeline.getState()).toBe(PlaybackState.Playing);
      expect(timeline.isPlaying()).toBe(true);
    });

    it('should pause playback', () => {
      timeline.play();
      timeline.pause();
      expect(timeline.getState()).toBe(PlaybackState.Paused);
      expect(timeline.isPaused()).toBe(true);
    });

    it('should stop playback and reset to beginning', () => {
      timeline.play();
      timeline.seek(5);
      timeline.stop();
      expect(timeline.getState()).toBe(PlaybackState.Stopped);
      expect(timeline.getTime()).toBe(0);
    });

    it('should resume from paused state', () => {
      timeline.play();
      timeline.pause();
      timeline.resume();
      expect(timeline.getState()).toBe(PlaybackState.Playing);
    });

    it('should handle multiple play calls', () => {
      timeline.play();
      const state1 = timeline.getState();
      timeline.play();
      const state2 = timeline.getState();
      expect(state1).toBe(state2);
    });

    it('should handle pause when not playing', () => {
      timeline.pause();
      expect(timeline.getState()).toBe(PlaybackState.Stopped);
    });
  });

  describe('Time Control', () => {
    it('should get current time', () => {
      expect(timeline.getTime()).toBe(0);
      timeline.seek(5);
      expect(timeline.getTime()).toBe(5);
    });

    it('should get duration', () => {
      expect(timeline.getDuration()).toBe(10);
    });

    it('should get progress as ratio', () => {
      expect(timeline.getProgress()).toBe(0);
      timeline.seek(5);
      expect(timeline.getProgress()).toBe(0.5);
      timeline.seek(10);
      expect(timeline.getProgress()).toBe(1);
    });

    it('should seek to specific time', () => {
      timeline.seek(5);
      expect(timeline.getTime()).toBe(5);
    });

    it('should clamp seek to duration', () => {
      timeline.seek(15);
      expect(timeline.getTime()).toBe(10);
    });

    it('should clamp seek to zero', () => {
      timeline.seek(-5);
      expect(timeline.getTime()).toBe(0);
    });

    it('should seek to specific frame', () => {
      timeline.seekToFrame(30);
      expect(timeline.getTime()).toBe(0.5);
    });

    it('should seek to frame beyond duration', () => {
      timeline.seekToFrame(1000);
      expect(timeline.getTime()).toBe(10);
    });
  });

  describe('Speed and Direction Control', () => {
    it('should get default speed', () => {
      expect(timeline.getSpeed()).toBe(1);
    });

    it('should set playback speed', () => {
      timeline.setSpeed(0.5);
      expect(timeline.getSpeed()).toBe(0.5);

      timeline.setSpeed(2);
      expect(timeline.getSpeed()).toBe(2);
    });

    it('should clamp speed to reasonable range', () => {
      timeline.setSpeed(0.01);
      expect(timeline.getSpeed()).toBe(0.1);

      timeline.setSpeed(100);
      expect(timeline.getSpeed()).toBe(10);
    });

    it('should get default direction', () => {
      expect(timeline.getDirection()).toBe(TimelineDirection.Forward);
    });

    it('should set playback direction', () => {
      timeline.setDirection(TimelineDirection.Backward);
      expect(timeline.getDirection()).toBe(TimelineDirection.Backward);
    });

    it('should reverse direction', () => {
      timeline.reverse();
      expect(timeline.getDirection()).toBe(TimelineDirection.Backward);

      timeline.reverse();
      expect(timeline.getDirection()).toBe(TimelineDirection.Forward);
    });

    it('should toggle direction', () => {
      timeline.toggleDirection();
      expect(timeline.getDirection()).toBe(TimelineDirection.Backward);

      timeline.toggleDirection();
      expect(timeline.getDirection()).toBe(TimelineDirection.Forward);
    });
  });

  describe('Loop Control', () => {
    it('should check if looping', () => {
      expect(timeline.isLooping()).toBe(false);
    });

    it('should set loop mode', () => {
      timeline.setLoop(true);
      expect(timeline.isLooping()).toBe(true);

      timeline.setLoop(false);
      expect(timeline.isLooping()).toBe(false);
    });

    it('should toggle loop mode', () => {
      timeline.toggleLoop();
      expect(timeline.isLooping()).toBe(true);

      timeline.toggleLoop();
      expect(timeline.isLooping()).toBe(false);
    });
  });

  describe('Time Scale Control', () => {
    it('should get time scale', () => {
      expect(timeline.getTimeScale()).toBe(1);
    });

    it('should set time scale', () => {
      timeline.setTimeScale(0.5);
      expect(timeline.getTimeScale()).toBe(0.5);

      timeline.setTimeScale(2);
      expect(timeline.getTimeScale()).toBe(2);
    });

    it('should clamp time scale to reasonable range', () => {
      timeline.setTimeScale(0.01);
      expect(timeline.getTimeScale()).toBe(0.1);

      timeline.setTimeScale(100);
      expect(timeline.getTimeScale()).toBe(10);
    });
  });

  describe('Keyframes', () => {
    it('should add keyframe', () => {
      const callback = vi.fn();
      const id = timeline.addKeyframe(5, callback);

      expect(id).toBeDefined();
      expect(id).toMatch(/^kf-/);
      expect(timeline.getKeyframes().size).toBe(1);
    });

    it('should remove keyframe by ID', () => {
      const callback = vi.fn();
      const id = timeline.addKeyframe(5, callback);

      const removed = timeline.removeKeyframe(id);
      expect(removed).toBe(true);
      expect(timeline.getKeyframes().size).toBe(0);
    });

    it('should return false when removing non-existent keyframe', () => {
      const removed = timeline.removeKeyframe('non-existent');
      expect(removed).toBe(false);
    });

    it('should get all keyframes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      timeline.addKeyframe(1, callback1);
      timeline.addKeyframe(5, callback2);

      const keyframes = timeline.getKeyframes();
      expect(keyframes.size).toBe(2);
    });

    it('should trigger keyframe when time is reached', () => {
      const callback = vi.fn();
      timeline.addKeyframe(5, callback);

      timeline.seek(5);

      expect(callback).toHaveBeenCalled();
    });

    it('should trigger keyframe when passing through in forward direction', () => {
      const callback = vi.fn();
      timeline.addKeyframe(5, callback);

      timeline.seek(3);
      timeline.seek(7);

      expect(callback).toHaveBeenCalled();
    });

    it('should trigger keyframe when passing through in backward direction', () => {
      const callback = vi.fn();
      timeline.addKeyframe(5, callback);

      timeline.seek(7);
      timeline.setDirection(TimelineDirection.Backward);
      timeline.seek(3);

      expect(callback).toHaveBeenCalled();
    });

    it('should not trigger keyframe when not passing through', () => {
      const callback = vi.fn();
      timeline.addKeyframe(5, callback);

      timeline.seek(3);
      timeline.seek(4);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Markers', () => {
    it('should add marker', () => {
      const added = timeline.addMarker('test', 5, { data: 'test' });

      expect(added).toBe(true);
      expect(timeline.getMarkers().size).toBe(1);
    });

    it('should not add duplicate marker', () => {
      timeline.addMarker('test', 5);
      const added = timeline.addMarker('test', 10);

      expect(added).toBe(false);
      expect(timeline.getMarkers().size).toBe(1);
    });

    it('should remove marker', () => {
      timeline.addMarker('test', 5);
      const removed = timeline.removeMarker('test');

      expect(removed).toBe(true);
      expect(timeline.getMarkers().size).toBe(0);
    });

    it('should return false when removing non-existent marker', () => {
      const removed = timeline.removeMarker('non-existent');
      expect(removed).toBe(false);
    });

    it('should get marker by name', () => {
      timeline.addMarker('test', 5, { data: 'test' });
      const marker = timeline.getMarker('test');

      expect(marker).toBeDefined();
      expect(marker?.time).toBe(5);
    });

    it('should return undefined for non-existent marker', () => {
      const marker = timeline.getMarker('non-existent');
      expect(marker).toBeUndefined();
    });

    it('should get all markers', () => {
      timeline.addMarker('marker1', 1);
      timeline.addMarker('marker2', 5);

      const markers = timeline.getMarkers();
      expect(markers.size).toBe(2);
    });

    it('should jump to marker', () => {
      timeline.addMarker('test', 5);
      const jumped = timeline.goToMarker('test');

      expect(jumped).toBe(true);
      expect(timeline.getTime()).toBe(5);
    });

    it('should return false when jumping to non-existent marker', () => {
      const jumped = timeline.goToMarker('non-existent');
      expect(jumped).toBe(false);
    });

    it('should trigger marker callback when time is reached', () => {
      timeline.addMarker('test', 5);
      timeline.seek(5);

      const marker = timeline.getMarker('test');
      expect(marker?.triggered).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should add event listener', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Play,
        })
      );
    });

    it('should remove event listener', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);
      timeline.off(listener);

      timeline.play();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit play event', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Play,
          time: 0,
        })
      );
    });

    it('should emit pause event', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();
      timeline.pause();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Pause,
        })
      );
    });

    it('should emit stop event', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();
      timeline.stop();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Stop,
          time: 0,
        })
      );
    });

    it('should emit seek event', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.seek(5);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Seek,
          time: 5,
        })
      );
    });

    it('should emit keyframe event', () => {
      const listener: TimelineEventListener = vi.fn();
      const callback = vi.fn();

      timeline.on(listener);
      timeline.addKeyframe(5, callback);
      timeline.seek(5);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Keyframe,
          time: 5,
        })
      );
    });

    it('should emit marker event', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.addMarker('test', 5);
      timeline.seek(5);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Marker,
          time: 5,
        })
      );
    });

    it('should emit loop event when toggling', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.toggleLoop();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TimelineEventType.Loop,
        })
      );
    });

    it('should get event queue', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();
      timeline.seek(5);

      const queue = timeline.getEventQueue();
      expect(queue.length).toBeGreaterThan(0);
    });

    it('should clear event queue', () => {
      const listener: TimelineEventListener = vi.fn();
      timeline.on(listener);

      timeline.play();
      timeline.clearEventQueue();

      const queue = timeline.getEventQueue();
      expect(queue).toHaveLength(0);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener: TimelineEventListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalListener: TimelineEventListener = vi.fn();

      timeline.on(errorListener);
      timeline.on(normalListener);

      timeline.play();

      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      const listener1: TimelineEventListener = vi.fn();
      const listener2: TimelineEventListener = vi.fn();

      timeline.on(listener1);
      timeline.on(listener2);
      timeline.removeAllListeners();

      timeline.play();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero duration', () => {
      const zeroTimeline = new Timeline({ duration: 0, fps: 60 });
      expect(zeroTimeline.getDuration()).toBe(0);
      expect(zeroTimeline.getTotalFrames()).toBe(0);
    });

    it('should handle very high FPS', () => {
      const highFpsTimeline = new Timeline({ duration: 10, fps: 120 });
      expect(highFpsTimeline.getTotalFrames()).toBe(1200);
    });

    it('should handle very low FPS', () => {
      const lowFpsTimeline = new Timeline({ duration: 10, fps: 1 });
      expect(lowFpsTimeline.getTotalFrames()).toBe(10);
    });

    it('should handle seeking to exact duration', () => {
      timeline.seek(10);
      expect(timeline.getTime()).toBe(10);
    });

    it('should handle fractional time values', () => {
      timeline.seek(0.5);
      expect(timeline.getTime()).toBe(0.5);
    });

    it('should handle multiple consecutive seeks', () => {
      timeline.seek(2);
      timeline.seek(4);
      timeline.seek(6);

      expect(timeline.getTime()).toBe(6);
    });

    it('should handle setting minimum speed', () => {
      timeline.setSpeed(0.001);
      expect(timeline.getSpeed()).toBe(0.1);
    });

    it('should handle setting maximum speed', () => {
      timeline.setSpeed(1000);
      expect(timeline.getSpeed()).toBe(10);
    });
  });

  describe('String Representation', () => {
    it('should return string representation', () => {
      const str = timeline.toString();
      expect(str).toContain('time=0.00s');
      expect(str).toContain('state=stopped');
      expect(str).toContain('speed=1x');
    });

    it('should update string representation after state changes', () => {
      timeline.play();
      const str = timeline.toString();
      expect(str).toContain('state=playing');
    });

    it('should update string representation after time change', () => {
      timeline.seek(5.5);
      const str = timeline.toString();
      expect(str).toContain('time=5.50s');
    });
  });

  describe('Configuration Getters', () => {
    it('should get config', () => {
      const config = timeline.getConfig();
      expect(config.duration).toBe(10);
      expect(config.fps).toBe(60);
    });

    it('should return readonly config', () => {
      const config1 = timeline.getConfig();
      const config2 = timeline.getConfig();

      expect(config1).toBe(config2);
    });
  });
});
