# Changelog

All notable changes to AniMaker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Ongoing development and improvements

## [1.0.0] - 2026-03-19

### Added

#### Core Framework
- **Type System**: Complete TypeScript type definitions with branded types (ObjectId, Time, Alpha)
- **Render Objects**: Abstract base class with concrete implementations (VectorObject, TextObject, GroupObject)
- **Scene Management**: Scene class with scheduling, snapshots, and state management
- **Animation System**: Base animation class with AnimationBuilder for fluent API
- **Easing Functions**: 20+ easing functions (linear, smooth, easeIn/Out, elastic, bounce)

#### Animation Types
- TransformAnimation - Generic transform interpolation
- FadeAnimation - FadeIn, FadeOut, FadeTo animations
- RotateAnimation - Single and multi-axis rotation
- MoveAnimation - Linear and path-based movement
- AnimationGroup - Parallel, sequence, and lagged composition

#### Timeline System
- Timeline class with play/pause/stop controls
- Forward/reverse playback direction
- Speed control (0.1x to 10x)
- KeyframeTrack for property animation with 4 interpolation types (Linear, Step, Smooth, Cubic)
- TimeMarker system with 4 marker types (Section, Event, Label, Beat)
- TimelineController with undo/redo support

#### Event System
- EventEmitter with type-safe event handling
- Event bubbling through parent chain
- Priority-based listener execution
- Animation events (start, update, complete, repeat, pause, cancel, error)
- Scene events (init, objectAdded/Removed, frameRender, update, pause)
- Render events (beforeRender, afterRender, error, performance, resize, context events)
- Global EventBus for framework-wide event communication

#### Factory Functions
- Shape factories: Circle(), Rectangle(), Polygon(), Line(), Arc(), Path()
- Animation factories: fade(), move(), rotate(), scale(), parallel(), sequence()
- Scene factories: createScene(), createHDScene(), animateSequentially()
- High-level Chain API for fluent object manipulation

#### Export System
- ImageExporter - PNG/JPEG/WebP image sequence export
- GifExporter - Animated GIF export with quality controls
- VideoExporter - WebM/MP4 video export via MediaRecorder
- FrameEncoder - Canvas frame encoding abstraction

#### Documentation
- Framework core abstraction design document
- Rendering engine architecture documentation
- API reference documentation
- Animation creation tutorials
- E2E testing documentation

#### Testing
- Unit tests for core types
- Integration tests for render pipeline
- E2E test suite
- Test coverage reporting

### Changed
- Updated project structure to follow monorepo pattern with packages/ directory

### Security
- No security vulnerabilities in initial release

## [0.1.0] - 2026-03-19

### Added
- Project initialization
- Core documentation structure
- Developer contribution guidelines
