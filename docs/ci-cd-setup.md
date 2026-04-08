# CI/CD Pipeline Documentation

This document describes the continuous integration and continuous deployment (CI/CD) pipeline for the Kinema project.

## Overview

The Kinema project uses GitHub Actions for CI/CD automation. The pipeline is divided into several workflows:

- **CI Workflow** (`.github/workflows/ci.yml`) - Code quality checks and unit tests
- **E2E Test Workflow** (`.github/workflows/test.yml`) - End-to-end testing
- **Release Workflow** (`.github/workflows/release.yml`) - Version releases
- **Dependencies Workflow** (`.github/workflows/dependencies.yml`) - Dependency management

## CI Workflow

The CI workflow runs on every push and pull request to `main` and `develop` branches.

### Jobs

#### 1. Lint Job

- Runs ESLint to check code quality
- Runs TypeScript type checking
- Fails if any linting errors are found

#### 2. Test Job

- Runs unit tests on Node.js versions 18, 20, and 22
- Runs integration tests
- Generates coverage report
- Uploads coverage to Codecov (optional)
- Uploads coverage artifacts

#### 3. Coverage Check Job

- Verifies that coverage thresholds are met
- Currently requires 80%+ coverage for lines, functions, branches, and statements

#### 4. Build Job

- Builds the TypeScript project
- Verifies build output exists
- Uploads build artifacts

#### 5. Security Job

- Runs npm audit for security vulnerabilities
- Runs Snyk security scan (optional, requires SNYK_TOKEN)
- Continues on error (doesn't block the pipeline)

#### 6. Summary Job

- Creates a workflow summary with job statuses
- Fails if any critical jobs fail

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

## E2E Test Workflow

The E2E test workflow runs comprehensive end-to-end tests using Playwright.

### Jobs

#### 1. E2E Tests Job

- Runs E2E tests on Chromium, Firefox, and WebKit
- Uses sharding to parallelize test execution (4 shards per browser)
- Captures screenshots on failure
- Uploads test results and screenshots as artifacts

#### 2. E2E Report Job

- Downloads test results from all shards and browsers
- Merges HTML reports
- Uploads merged report as artifact
- Generates test summary

#### 3. Visual Regression Job

- Runs visual regression tests on Chromium
- Uploads comparison results

#### 4. Performance Job

- Runs performance tests
- Uploads performance metrics

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
```

## Release Workflow

The release workflow handles version releases and publishing.

### Jobs

#### 1. Validate Job

- Validates version format (e.g., v1.0.0)
- Checks that changelog exists
- Determines if release is from main branch

#### 2. Test Job

- Runs all tests before release
- Ensures code quality

#### 3. Build Job

- Builds the project
- Generates package tarball
- Uploads build artifacts

#### 4. Publish NPM Job

- Publishes package to npm registry
- Only runs for releases from main branch
- Requires NPM_TOKEN secret

#### 5. Publish GPR Job

- Publishes package to GitHub Packages registry
- Requires GITHUB_TOKEN (automatically provided)

#### 6. Create Release Job

- Creates GitHub Release with changelog
- Attaches package tarball to release
- Marks as prerelease if version contains dash (e.g., v1.0.0-beta.1)

#### 7. Post Release Job

- Creates milestone for next version (placeholder)
- Sends release notifications (placeholder)
- Updates documentation (placeholder)

#### 8. Rollback Job

- Runs if release fails
- Provides rollback instructions

### Triggers

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., v1.0.0)'
        required: true
        type: string
```

### How to Release

#### Automated Release (Tag-based)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

#### Manual Release (Workflow Dispatch)

1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version (e.g., v1.0.0)
5. Click "Run workflow"

#### Pre-release Checklist

- [ ] Update version in package.json
- [ ] Create changelog entry in `changelogs/vX.X.X.md`
- [ ] All tests passing
- [ ] Coverage targets met (80%+)
- [ ] Documentation updated
- [ ] Commits pushed to main branch

## Dependencies Workflow

The dependencies workflow manages dependency updates and security.

### Jobs

#### 1. Audit Job

- Runs npm audit for vulnerabilities
- Uploads audit results

#### 2. Update Job

- Checks for dependency updates
- Runs tests with updated dependencies
- Creates PR if tests fail

#### 3. Lockfile Lint Job

- Validates lockfile integrity
- Ensures secure package sources

#### 4. Bundle Size Job

- Analyzes bundle size changes
- Comments on PR with size comparison

#### 5. License Check Job

- Validates all dependency licenses
- Generates license report
- Fails if GPL licenses found

### Triggers

```yaml
on:
  push:
    paths: ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch:
```

## CI Scripts

The project includes CI helper scripts in `scripts/ci/`:

### setup.sh

Sets up the CI environment:

- Checks Node.js version
- Installs dependencies
- Creates necessary directories
- Installs Playwright browsers (if needed)

```bash
./scripts/ci/setup.sh
```

### test.sh

Runs all tests with options:

```bash
# Run all tests
./scripts/ci/test.sh

# Skip specific test types
./scripts/ci/test.sh --skip-lint --skip-integration

# Include E2E tests
./scripts/ci/test.sh --with-e2e
```

### build.sh

Builds the project:

```bash
# Standard build
./scripts/ci/build.sh

# Build with source maps
./scripts/ci/build.sh --sourcemaps

# Optimized build
./scripts/ci/build.sh --optimize
```

## Required Secrets

Configure these secrets in GitHub repository settings:

### For CI

- `CODECOV_TOKEN` - Codecov token for coverage uploads (optional)

### For Release

- `NPM_TOKEN` - npm authentication token for publishing
- `SNYK_TOKEN` - Snyk token for security scanning (optional)

### Configuration Steps

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

## Caching

The CI/CD pipeline uses caching to speed up builds:

### Node Modules Cache

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Playwright Browsers Cache

Playwright browsers are automatically cached across runs.

## Coverage Requirements

The project requires 80%+ coverage for:

- Lines
- Functions
- Branches
- Statements

Coverage is checked on every pull request and must meet thresholds before merging.

## Status Badges

Add these badges to your README:

```markdown
[![CI](https://github.com/your-org/kinema/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/kinema/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/your-org/kinema/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/kinema/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/your-org/kinema/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/kinema)
```

## Troubleshooting

### Common Issues

#### Test Failures

- Check test logs in Actions tab
- Download test artifacts for detailed output
- Run tests locally: `npm test`

#### Build Failures

- Verify TypeScript version
- Check for syntax errors
- Run locally: `npm run build`

#### Release Failures

- Verify NPM_TOKEN is set correctly
- Check version format (vX.X.X)
- Ensure changelog exists
- Verify branch is main

### Debug Mode

Enable debug logging by adding these secrets:

- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

## Local CI Testing

Test CI workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act  # Windows

# Run CI workflow locally
act -j lint
act -j test
```

## Best Practices

1. **Always test locally** before pushing
2. **Keep dependencies updated** but test thoroughly
3. **Monitor coverage** and improve tests when below 80%
4. **Review security alerts** promptly
5. **Use semantic versioning** for releases
6. **Document breaking changes** in changelog
7. **Tag releases** properly for automated workflow

## Performance Optimization

The CI/CD pipeline is optimized for speed:

- Parallel job execution
- Dependency caching
- Test sharding for E2E tests
- Incremental builds
- Artifact reuse between jobs

## Future Improvements

- [ ] Add deployment to staging/production
- [ ] Implement automated canary releases
- [ ] Add performance regression detection
- [ ] Integrate with issue tracker
- [ ] Add automated changelog generation
- [ ] Implement blue-green deployment
