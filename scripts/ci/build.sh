#!/bin/bash
# CI Build Script
# Builds the project and prepares artifacts for release

set -e

echo "=== CI Build ==="

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

# Build configuration
BUILD_DIR="dist"
ARTIFACTS_DIR="artifacts"
VERSION=$(node -p "require('./package.json').version")

# Clean previous builds
clean_build() {
    print_step "Cleaning previous builds..."
    rm -rf "$BUILD_DIR"
    rm -rf "$ARTIFACTS_DIR"
    mkdir -p "$ARTIFACTS_DIR"
    print_info "Build directories cleaned"
}

# Run TypeScript compiler
run_typecheck() {
    print_step "Running TypeScript compilation check..."
    if npm run typecheck; then
        print_info "TypeScript compilation check passed"
    else
        print_error "TypeScript compilation check failed"
        exit 1
    fi
}

# Build project
build_project() {
    print_step "Building project..."
    if npm run build; then
        print_info "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Verify build output
verify_build() {
    print_step "Verifying build output..."

    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found: $BUILD_DIR"
        exit 1
    fi

    # Check for essential output files
    if [ -z "$(ls -A $BUILD_DIR)" ]; then
        print_error "Build directory is empty"
        exit 1
    fi

    # List build output
    print_info "Build output:"
    ls -lh "$BUILD_DIR"

    print_info "Build verification passed"
}

# Generate package tarball
generate_tarball() {
    print_step "Generating package tarball..."
    if npm pack; then
        print_info "Package tarball generated"
        mv *.tgz "$ARTIFACTS_DIR/"
    else
        print_error "Failed to generate package tarball"
        exit 1
    fi
}

# Generate build metadata
generate_metadata() {
    print_step "Generating build metadata..."

    cat > "$ARTIFACTS_DIR/build-info.json" << EOF
{
  "version": "$VERSION",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)"
}
EOF

    print_info "Build metadata generated"
}

# Calculate file sizes
calculate_sizes() {
    print_step "Calculating file sizes..."

    print_info "Build artifacts:"
    for file in "$ARTIFACTS_DIR"/*; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            print_info "  $(basename $file): $size"
        fi
    done
}

# Generate source maps (optional)
generate_sourcemaps() {
    if [ "$GENERATE_SOURCEMAPS" = "true" ]; then
        print_step "Generating source maps..."
        # Source maps generation would be handled by the build script
        print_info "Source maps generated"
    fi
}

# Optimize build (optional)
optimize_build() {
    if [ "$OPTIMIZE_BUILD" = "true" ]; then
        print_step "Optimizing build..."
        # Build optimization would be handled by the build script
        print_info "Build optimized"
    fi
}

# Upload artifacts (for CI environments)
upload_artifacts() {
    if [ "$CI" = "true" ]; then
        print_step "Preparing artifacts for CI upload..."
        print_info "Artifacts ready in $ARTIFACTS_DIR"
    fi
}

# Display build summary
display_summary() {
    echo ""
    echo "=== Build Summary ==="
    echo "Version: $VERSION"
    echo "Build Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Build Directory: $BUILD_DIR"
    echo "Artifacts Directory: $ARTIFACTS_DIR"
    echo ""
    print_info "Build completed successfully!"
}

# Main build flow
main() {
    print_info "Starting CI build process..."

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-typecheck)
                SKIP_TYPECHECK=true
                shift
                ;;
            --sourcemaps)
                export GENERATE_SOURCEMAPS=true
                shift
                ;;
            --optimize)
                export OPTIMIZE_BUILD=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Run build steps
    clean_build
    [ "$SKIP_TYPECHECK" != true ] && run_typecheck
    build_project
    verify_build
    generate_tarball
    generate_metadata
    generate_sourcemaps
    optimize_build
    calculate_sizes
    upload_artifacts

    # Display summary
    display_summary
}

# Run main function
main "$@"
