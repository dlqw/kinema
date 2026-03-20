#!/bin/bash
# CI Test Script
# Runs all tests and generates coverage reports

set -e

echo "=== CI Test Suite ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Test result tracking
TESTS_PASSED=true
TEST_RESULTS=()

# Run ESLint
run_lint() {
    print_step "Running ESLint..."
    if npm run lint; then
        print_info "ESLint passed"
        TEST_RESULTS+=("ESLint: PASSED")
    else
        print_error "ESLint failed"
        TEST_RESULTS+=("ESLint: FAILED")
        TESTS_PASSED=false
    fi
}

# Run TypeScript type checking
run_typecheck() {
    print_step "Running TypeScript type check..."
    if npm run typecheck; then
        print_info "TypeScript type check passed"
        TEST_RESULTS+=("TypeScript: PASSED")
    else
        print_error "TypeScript type check failed"
        TEST_RESULTS+=("TypeScript: FAILED")
        TESTS_PASSED=false
    fi
}

# Run unit tests
run_unit_tests() {
    print_step "Running unit tests..."
    if npm run test -- --run; then
        print_info "Unit tests passed"
        TEST_RESULTS+=("Unit Tests: PASSED")
    else
        print_error "Unit tests failed"
        TEST_RESULTS+=("Unit Tests: FAILED")
        TESTS_PASSED=false
    fi
}

# Run integration tests
run_integration_tests() {
    print_step "Running integration tests..."
    if npm run test:integration -- --run; then
        print_info "Integration tests passed"
        TEST_RESULTS+=("Integration Tests: PASSED")
    else
        print_error "Integration tests failed"
        TEST_RESULTS+=("Integration Tests: FAILED")
        TESTS_PASSED=false
    fi
}

# Generate coverage report
generate_coverage() {
    print_step "Generating coverage report..."
    if npm run test:coverage; then
        print_info "Coverage report generated"
        TEST_RESULTS+=("Coverage: GENERATED")

        # Display coverage summary
        if [ -f "coverage/coverage-summary.json" ]; then
            print_info "Coverage Summary:"
            node -e "
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            const total = coverage.total;
            console.log(\`  Lines: \${total.lines.pct}%\`);
            console.log(\`  Functions: \${total.functions.pct}%\`);
            console.log(\`  Branches: \${total.branches.pct}%\`);
            console.log(\`  Statements: \${total.statements.pct}%\`);
            "
        fi
    else
        print_warning "Coverage generation failed"
        TEST_RESULTS+=("Coverage: FAILED")
    fi
}

# Run E2E tests
run_e2e_tests() {
    if [ -n "$RUN_E2E" ]; then
        print_step "Running E2E tests..."
        if npm run test:e2e -- --project=chromium; then
            print_info "E2E tests passed"
            TEST_RESULTS+=("E2E Tests: PASSED")
        else
            print_error "E2E tests failed"
            TEST_RESULTS+=("E2E Tests: FAILED")
            TESTS_PASSED=false
        fi
    else
        print_warning "Skipping E2E tests (set RUN_E2E=true to run)"
    fi
}

# Display test results summary
display_summary() {
    echo ""
    echo "=== Test Results Summary ==="
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
    done
    echo ""

    if [ "$TESTS_PASSED" = true ]; then
        print_info "All tests passed!"
        return 0
    else
        print_error "Some tests failed!"
        return 1
    fi
}

# Cleanup on exit
cleanup() {
    print_info "Cleaning up..."
    # Keep test artifacts for debugging
}

# Trap exit for cleanup
trap cleanup EXIT

# Main test flow
main() {
    print_info "Starting CI test suite..."

    # Parse command line arguments
    SKIP_LINT=false
    SKIP_TYPECHECK=false
    SKIP_UNIT=false
    SKIP_INTEGRATION=false
    SKIP_COVERAGE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-lint)
                SKIP_LINT=true
                shift
                ;;
            --skip-typecheck)
                SKIP_TYPECHECK=true
                shift
                ;;
            --skip-unit)
                SKIP_UNIT=true
                shift
                ;;
            --skip-integration)
                SKIP_INTEGRATION=true
                shift
                ;;
            --skip-coverage)
                SKIP_COVERAGE=true
                shift
                ;;
            --with-e2e)
                export RUN_E2E=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Run tests
    [ "$SKIP_LINT" = false ] && run_lint
    [ "$SKIP_TYPECHECK" = false ] && run_typecheck
    [ "$SKIP_UNIT" = false ] && run_unit_tests
    [ "$SKIP_INTEGRATION" = false ] && run_integration_tests
    [ "$SKIP_COVERAGE" = false ] && generate_coverage
    run_e2e_tests

    # Display summary and exit
    display_summary
}

# Run main function
main "$@"
