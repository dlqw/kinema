# Kinema

Kinema is a TypeScript monorepo with two active products:

- `@kinema/core`: the animation and rendering engine
- `@kinema/workstation`: the Electron desktop editor built on top of the core package

The root of the repository is now an orchestration layer only. Buildable source code lives under `packages/`.

## Repository Layout

```text
VideoMaker/
├── packages/
│   ├── core/                 # Publishable rendering and animation engine
│   └── workstation/          # Electron desktop application
├── tests/                    # Unit, integration, and E2E coverage
├── video/                    # Sample scenes and render scripts
├── docs/                     # Product and developer documentation
├── changelogs/               # Release notes
└── package.json              # Workspace orchestration
```

Detailed structure notes live in `docs/project-structure.md`.

## Getting Started

```bash
npm install
```

Common commands from the repository root:

```bash
# Build both packages
npm run build

# Type-check root, core, and workstation
npm run typecheck

# Run the Vitest suite
npm run test

# Launch the Electron workstation in development
npm run electron:dev

# Build the Electron workstation bundle
npm run electron:build
```

Package-specific commands are available through workspaces:

```bash
npm run build --workspace @kinema/core
npm run dev --workspace @kinema/workstation
```

## Development Notes

- Root scripts are responsible for cross-package orchestration.
- `packages/core` is the source of truth for runtime APIs and export logic.
- `packages/workstation` contains the Electron main process, preload layer, and React renderer.
- `tests/` validates the shared runtime and export flows.
- `video/` contains sample entrypoints used for render experiments and manual verification.

## Verification

The current baseline for this repository is:

- `npm run build`
- `npm run typecheck`
- `npm test`

## License

MIT
