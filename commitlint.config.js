/**
 * Commitlint Configuration
 * Enforces Conventional Commits specification
 * @see https://conventionalcommits.org/
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only
        'style', // Code style (formatting, semicolons, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Adding or modifying tests
        'build', // Build system or dependencies
        'ci', // CI/CD configuration
        'chore', // Maintenance tasks
        'revert', // Revert a previous commit
      ],
    ],
    // Subject case
    'subject-case': [2, 'always', 'lower-case'],
    // Subject must not end with a period
    'subject-full-stop': [2, 'never', '.'],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type must not be empty
    'type-empty': [2, 'never'],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Header max length
    'header-max-length': [2, 'always', 100],
    // Body must start with a blank line
    'body-leading-blank': [2, 'always'],
    // Footer must start with a blank line
    'footer-leading-blank': [2, 'always'],
  },
};
