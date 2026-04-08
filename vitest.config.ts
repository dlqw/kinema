import { defineConfig } from 'vitest/config';
import { coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'packages/core/src/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      '**/node_modules/**',
      'tests/e2e/**',
      '**/*.e2e.test.ts',
      '**/*.e2e.spec.ts',
      // Legacy compatibility suites that target superseded APIs.
      'tests/unit/core/Easing.test.ts',
      'tests/unit/core/RenderObject.test.ts',
      'tests/unit/core/Scene.test.ts',
      'tests/unit/core/Timeline.test.ts',
      'tests/unit/export/Export.test.ts',
      // Exclude tests that reference deleted modules
      'tests/unit/render/**',
      'tests/integration/rendering/pipeline.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        '**/*.d.ts',
      ],
      // 80% minimum coverage requirement
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Enable isolated environment for each test
    isolate: true,
    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
