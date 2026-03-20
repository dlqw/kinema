#!/bin/bash
# CI Setup Script
# Sets up the environment for CI/CD pipelines

set -e

echo "=== CI Setup ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check Node.js version
check_node_version() {
    print_info "Checking Node.js version..."
    REQUIRED_NODE_VERSION="20"
    CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

    if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        print_error "Node.js version $REQUIRED_NODE_VERSION or higher is required"
        print_error "Current version: $(node -v)"
        exit 1
    fi
    print_info "Node.js version: $(node -v)"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    if [ -f "package-lock.json" ]; then
        npm ci
    elif [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    else
        npm install
    fi
}

# Setup environment
setup_env() {
    print_info "Setting up environment..."

    # Create necessary directories
    mkdir -p dist
    mkdir -p coverage
    mkdir -p test-results
    mkdir -p playwright-report

    # Set environment variables
    export CI=true
    export NODE_ENV=test

    print_info "Environment setup complete"
}

# Install Playwright browsers (if needed)
install_playwright_browsers() {
    if grep -q '"@playwright/test"' package.json; then
        print_info "Installing Playwright browsers..."
        npx playwright install --with-deps chromium firefox webkit
    fi
}

# Validate setup
validate_setup() {
    print_info "Validating setup..."

    # Check if TypeScript is available
    if ! command -v tsc &> /dev/null; then
        print_error "TypeScript compiler not found"
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules directory not found"
        exit 1
    fi

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi

    print_info "Setup validation complete"
}

# Main setup flow
main() {
    print_info "Starting CI setup..."

    check_node_version
    install_dependencies
    setup_env
    install_playwright_browsers
    validate_setup

    print_info "CI setup completed successfully!"
    print_info "Run './scripts/ci/test.sh' to run tests"
}

# Run main function
main "$@"
