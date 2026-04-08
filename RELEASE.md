# Kinema Release Process

This document describes the release process for the Kinema project.

## Version Convention

Kinema follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Example: `1.0.0`, `1.1.0`, `1.1.1`

## Pre-Release Checklist

Before creating a release:

- [ ] All tests passing
- [ ] Test coverage ≥ 80%
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Release notes written in `changelogs/vX.X.X.md`
- [ ] No critical bugs open
- [ ] Dependencies up to date
- [ ] Security audit passed

## Release Steps

### 1. Update Version

Update version in `package.json`:

```bash
# For major release
npm version major

# For minor release
npm version minor

# For patch release
npm version patch
```

Or manually update all `package.json` files in the monorepo:

```json
{
  "version": "1.0.0"
}
```

### 2. Update CHANGELOG

Add a new section to `CHANGELOG.md`:

```markdown
## [1.0.0] - 2026-03-19

### Added

- New feature 1
- New feature 2

### Changed

- Updated existing feature

### Fixed

- Bug fix 1
```

### 3. Create Release Notes

Create a new file `changelogs/v1.0.0.md` with:

- Overview
- New features
- Breaking changes
- Migration guide
- Contributors
- Known issues

### 4. Update Documentation

Ensure documentation reflects the changes:

- Update API reference
- Add examples for new features
- Update migration guides
- Add new tutorials if needed

### 5. Build and Test

```bash
# Clean build
npm run clean

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage
npm run test:coverage
```

### 6. Git Tag and Push

```bash
# Stage changes
git add CHANGELOG.md changelogs/vX.X.X.md package.json

# Commit
git commit -m "chore: release v1.0.0"

# Create tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push
git push origin main
git push origin v1.0.0
```

### 7. Publish to npm

```bash
# Build packages
npm run build

# Publish all packages
npm run publish

# Or publish individual packages
cd packages/core
npm publish --access public
```

### 8. Create GitHub Release

1. Go to GitHub > Releases
2. Click "Draft a new release"
3. Choose the tag (e.g., `v1.0.0`)
4. Copy release notes from `changelogs/v1.0.0.md`
5. Attach any binaries if applicable
6. Publish release

## Post-Release

### 1. Announce

Announce the release on:

- GitHub Discussions
- Project website/news
- Community channels (Discord, Slack, etc.)

### 2. Monitor

Monitor for:

- Bug reports
- Installation issues
- Documentation gaps
- Performance issues

### 3. Prepare Next Version

Add `[Unreleased]` section to CHANGELOG:

```markdown
## [Unreleased]

### Added

- (New features being worked on)
```

## Hotfix Process

For critical bug fixes:

1. Create branch from release tag: `hotfix/v1.0.1`
2. Implement fix
3. Update CHANGELOG with fix description
4. Bump patch version
5. Test thoroughly
6. Merge to `main` branch
7. Tag and release as `v1.0.1`

## Conventional Commits

The project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description   | Examples                           |
| ---------- | ------------- | ---------------------------------- |
| `feat`     | New feature   | `feat: add keyframe interpolation` |
| `fix`      | Bug fix       | `fix: correct easing calculation`  |
| `docs`     | Documentation | `docs: update API reference`       |
| `style`    | Formatting    | `style: format code with prettier` |
| `refactor` | Refactoring   | `refactor: simplify event emitter` |
| `perf`     | Performance   | `perf: optimize render loop`       |
| `test`     | Tests         | `test: add event system tests`     |
| `chore`    | Maintenance   | `chore: update dependencies`       |
| `ci`       | CI/CD         | `ci: add workflow for releases`    |

### Scopes

Use scopes to indicate the affected module:

```
feat(core): add branded types
fix(export): correct GIF encoding
docs(events): update event examples
```

## Release Channels

### Stable

Released to `npm` as:

- `@kinema/core@1.0.0`
- `@kinema/renderer@1.0.0`
- etc.

### Beta/Pre-release

Pre-release versions use semantic versioning pre-release tags:

- `1.0.0-beta.1`
- `1.0.0-rc.1`
- `2.0.0-alpha.1`

Published as:

- `@kinema/core@beta`
- `@kinema/core@next`
- `@kinema/core@canary`

## Rollback Procedure

If a critical issue is discovered post-release:

1. **Deprecate** the npm package version immediately
2. **Unpublish** if necessary (only for security issues):
   ```bash
   npm unpublish @kinema/core@1.0.0
   ```
3. **Yank** from GitHub releases (mark as deprecated)
4. **Issue security advisory** if applicable
5. **Prepare hotfix** following hotfix process above
6. **Communicate** transparently with users

## Automated Release (Future)

Planned automation:

- Automated version bumping
- Automated CHANGELOG generation from commits
- Automated release notes from PR descriptions
- CI/CD pipeline for publishing
- Automated dependency updates

## Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Publishing](https://docs.npmjs.com/cli/v9/commands/npm-publish)
