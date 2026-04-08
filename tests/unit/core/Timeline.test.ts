/**
 * Timeline unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Timeline,
  TimelineDirection,
  PlaybackState,
  TimelineEventType,
  TimelineConfig,
} from '../../../packages/core/src/timeline/Timeline';

describe('Timeline', () => {
  let timeline: Timeline;
  const defaultConfig: TimelineConfig = {
    duration: 10,
    fps: 60,
    loop: false,
    timeScale: 1,
  };

  beforeEach(() => {
    timeline = new Timeline(defaultConfig);
  });

  describe('Constructor', () => {
    it('should create timeline with default config', () => {
      expect(timeline.getTime()).toBe(0);
      expect(timeline.getState()).toBe(PlaybackState.Stopped);
      expect(timeline.getDuration()).toBe(10);
      expect(timeline.getFPS()).toBe(60);
    });

    it('should handle custom duration and fps', () => {
      const customTimeline = new Timeline({
        duration: 30,
        fps: 24,
        loop: true,
      });

      expect(customTimeline.getDuration()).toBe(30);
      expect(customTimeline.getFPS()).toBe(24);
      expect(customTimeline.isLooping()).toBe(true);
    });
  });

  describe('Playback Control', () => {
    it('should start playing', () => {
      timeline.play();

      expect(timeline.getState()).toBe(PlaybackState.Playing);
      expect(timeline.isPlaying()).toBe(true);
      expect(timeline.isPaused()).toBe(false);
    });

    it('should pause playback', () => {
      timeline.play();
      timeline.pause();

      expect(timeline.getState()).toBe(PlaybackState.Paused);
      expect(timeline.isPlaying()).toBe(false);
      expect(timeline.isPaused()).toBe(true);
    });

    it('should stop and reset', () => {
      timeline.play();
      timeline.stop();

      expect(timeline.getState()).toBe(PlaybackState.Stopped);
      expect(timeline.getTime()).toBe(0);
    });

    it('should handle multiple play calls gracefully', () => {
      timeline.play();
      timeline.play(); // Should not cause issues

      expect(timeline.getState()).toBe(PlaybackState.Playing);
    });

    it('should resume from pause', () => {
      timeline.play();
      timeline.pause();
      timeline.resume();

      expect(timeline.getState()).toBe(PlaybackState.Playing);
    });
  });

  describe('Time Control', () => {
    it('should get current time', () => {
      expect(timeline.getTime()).toBe(0);

      timeline.seek(5);
      expect(timeline.getTime()).toBe(5);
    });

    it('should seek to specific time', () => {
      timeline.seek(3.5);
      expect(timeline.getTime()).toBe(3.5);
    });

    it('should clamp seek time to duration', () => {
      timeline.seek(15); // Duration is 10
      expect(timeline.getTime()).toBe(10);
    });

    it('should get total frames', () => {
      expect(timeline.getTotalFrames()).toBe(600); // 10 seconds * 60 fps
    });

    it('should get current frame number', () => {
      timeline.seek(1); // 1 second at 60 fps = frame 60
      expect(timeline.getCurrentFrame()).toBe(60);
    });

    it('should seek to frame', () => {
      timeline.seekToFrame(120); // 120 / 60 = 2 seconds
      expect(timeline.getTime()).toBe(2);
    });

    it('should get frame for time', () => {
      expect(timeline.getFrameForTime(1.5)).toBe(90); // 1.5 * 60 = 90
    });

    it('should get time for frame', () => {
      expect(timeline.getTimeForFrame(180)).toBe(3); // 180 / 60 = 3
    });

    it('should get playback progress', () => {
      timeline.seek(5); // 5 / 10 = 0.5
      expect(timeline.getProgress()).toBe(0.5);
    });
  });

  describe('Speed and Direction', () => {
    it('should get default speed', () => {
      expect(timeline.getSpeed()).toBe(1);
    });

    it('should set playback speed', () => {
      timeline.setSpeed(0.5);
      expect(timeline.getSpeed()).toBe(0.5);

      timeline.setSpeed(2);
      expect(timeline.getSpeed()).toBe(2);
    });

    it('should clamp speed to valid range', () => {
      timeline.setSpeed(0.05); // Below minimum
      expect(timeline.getSpeed()).toBe(0.1);

      timeline.setSpeed(15); // Above maximum
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

  describe('Keyframes', () => {
    it('should add keyframe', () => {
      const id = timeline.addKeyframe(5, () => {});

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(timeline.getKeyframes().size).toBe(1);
    });

    it('should remove keyframe', () => {
      const id = timeline.addKeyframe(3, () => {});
      const removed = timeline.removeKeyframe(id);

      expect(removed).toBe(true);
      expect(timeline.getKeyframes().size).toBe(0);
    });

    it('should return false when removing non-existent keyframe', () => {
      const removed = timeline.removeKeyframe('non-existent');

      expect(removed).toBe(false);
    });

    it('should get all keyframes', () => {
      timeline.addKeyframe(1, () => {});
      timeline.addKeyframe(3, () => {});
      timeline.addKeyframe(5, () => {});

      expect(timeline.getKeyframes().size).toBe(3);
    });
  });

  describe('Markers', () => {
    it('should add marker', () => {
      const added = timeline.addMarker('intro', 2.5, { label: 'Introduction' });

      expect(added).toBe(true);
      expect(timeline.getMarker('intro')).toBeDefined();
      expect(timeline.getMarker('intro')?.time).toBe(2.5);
    });

    it('should not add duplicate marker', () => {
      timeline.addMarker('intro', 2.5);
      const added = timeline.addMarker('intro', 3.5); // Same name

      expect(added).toBe(false);
    });

    it('should remove marker', () => {
      timeline.addMarker('outro', 8);
      const removed = timeline.removeMarker('outro');

      expect(removed).toBe(true);
      expect(timeline.getMarker('outro')).toBeUndefined();
    });

    it('should get marker by name', () => {
      timeline.addMarker('checkpoint', 5, { passed: false });

      const marker = timeline.getMarker('checkpoint');
      expect(marker).toBeDefined();
      expect(marker?.name).toBe('checkpoint');
      expect(marker?.data).toEqual({ passed: false });
    });

    it('should get all markers', () => {
      timeline.addMarker('m1', 1);
      timeline.addMarker('m2', 3);
      timeline.addMarker('m3', 5);

      expect(timeline.getMarkers().size).toBe(3);
    });

    it('should jump to marker', () => {
      timeline.addMarker('target', 7.5);
      timeline.goToMarker('target');

      expect(timeline.getTime()).toBe(7.5);
    });

    it('should return false when going to non-existent marker', () => {
      const result = timeline.goToMarker('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Loop Configuration', () => {
    it('should check loop status', () => {
      expect(timeline.isLooping()).toBe(false);

      const loopingTimeline = new Timeline({
        duration: 10,
        fps: 60,
        loop: true,
      });

      expect(loopingTimeline.isLooping()).toBe(true);
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

  describe('Time Scale', () => {
    it('should get default time scale', () => {
      expect(timeline.getTimeScale()).toBe(1);
    });

    it('should set time scale', () => {
      timeline.setTimeScale(0.5);
      expect(timeline.getTimeScale()).toBe(0.5);
    });

    it('should clamp time scale to valid range', () => {
      timeline.setTimeScale(0.05); // Below minimum
      expect(timeline.getTimeScale()).toBe(0.1);

      timeline.setTimeScale(15); // Above maximum
      expect(timeline.getTimeScale()).toBe(10);
    });
  });

  describe('Event System', () => {
    it('should add event listener', () => {
      const listener = vi.fn();
      timeline.on(listener);

      // Trigger event by playing
      timeline.play();

      expect(listener).toHaveBeenCalled();
    });

    it('should remove event listener', () => {
      const listener = vi.fn();
      timeline.on(listener);
      timeline.off(listener);

      timeline.play();
      // Play again after removing
      timeline.play();

      // Listener should have been called only once (before removal)
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      timeline.on(listener1);
      timeline.on(listener2);
      timeline.removeAllListeners();

      timeline.play();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should get event queue', () => {
      timeline.play();
      timeline.pause();

      const events = timeline.getEventQueue();
      expect(events.length).toBeGreaterThan(0);

      // Check event types
      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain(TimelineEventType.Play);
      expect(eventTypes).toContain(TimelineEventType.Pause);
    });

    it('should clear event queue', () => {
      timeline.play();
      timeline.pause();
      timeline.clearEventQueue();

      expect(timeline.getEventQueue().length).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should get timeline config', () => {
      const config = timeline.getConfig();

      expect(config.duration).toBe(10);
      expect(config.fps).toBe(60);
      expect(config.loop).toBe(false);
    });

    it('should return readonly config', () => {
      const config = timeline.getConfig();

      // Config should be a valid configuration object
      expect(config).toBeDefined();
      expect(config.duration).toBe(10);
      expect(config.fps).toBe(60);
    });
  });

  describe('String Representation', () => {
    it('should return string representation', () => {
      const str = timeline.toString();

      expect(str).toContain('Timeline');
      expect(str).toContain('0.00s');
      expect(str).toContain('stopped');
    });

    it('should update string with state changes', () => {
      timeline.play();
      const str = timeline.toString();

      expect(str).toContain('playing');

      timeline.seek(5.5);
      const str2 = timeline.toString();

      expect(str2).toContain('5.50s');
    });
  });
});
