# AniMaker

High-performance 2D animation rendering framework for the web.

## Features

- **High-performance rendering**: Optimized Canvas 2D rendering with batch operations
- **Flexible animation system**: Tweening, timelines, and easing functions
- **Scene graph**: Hierarchical node system with transform composition
- **Type-safe**: Written in TypeScript with strict mode enabled
- **Well-tested**: 80%+ test coverage with comprehensive test suite

## Installation

```bash
pnpm install
```

## Quick Start

```typescript
import { Scene, SpriteNode, Animator } from 'animaker';

// Create a scene
const scene = new Scene();

// Add a sprite
const sprite = new SpriteNode({
  position: { x: 100, y: 100 },
  size: { width: 50, height: 50 },
  color: '#ff0000',
});

scene.add(sprite);

// Animate the sprite
const animator = new Animator();
animator.tween(sprite.position, { x: 200, y: 200 }, {
  duration: 1000,
  easing: 'easeInOutQuad',
});
```

## Development

### Setup

```bash
# Install dependencies
pnpm install
```

### Commands

```bash
# Development mode (watch mode)
pnpm run dev

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Format code
pnpm run format

# Build
pnpm run build

# Run all CI checks
pnpm run ci

# Documentation
pnpm run docs:dev      # Start documentation dev server
pnpm run docs:build    # Build documentation
pnpm run docs:api      # Generate API reference
```

### Testing

The project uses Vitest for testing with the following test organization:

- **Unit tests**: `tests/unit/` - Test individual functions and classes
- **Integration tests**: `tests/integration/` - Test module interactions
- **E2E tests**: `tests/e2e/` - Test complete workflows
- **Fixtures**: `tests/fixtures/` - Test data and helper objects
- **Mocks**: `tests/mocks/` - Mock implementations for external dependencies

### Project Structure

```
AniMaker/
├── src/              # Source code
├── tests/            # Test files
├── docs/             # Documentation
├── examples/         # Example code
└── changelogs/       # Version changelogs
```

See `docs/project-structure.md` for detailed structure guidelines.

## Quality Standards

- **Test coverage**: 80%+ across all metrics
- **Type safety**: TypeScript strict mode enabled
- **Code style**: ESLint + Prettier with enforced rules
- **Documentation**: JSDoc comments on all public APIs

See `docs/quality-standards.md` for detailed quality requirements.

## Contributing

1. Create a feature branch from `develop`
2. Implement your changes with tests
3. Ensure all CI checks pass
4. Submit a pull request

## License

MIT

## Team

- **Project Lead**: Coordinates development and architecture
- **Graphics Renderer**: Handles rendering engine and graphics
- **Framework Designer**: Designs animation framework and abstractions
- **Documenter**: Maintains documentation and examples
- **Quality Specialist**: Ensures code quality and test coverage
