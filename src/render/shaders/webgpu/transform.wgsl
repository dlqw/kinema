// AniMaker - Transform Compute Shader (WebGPU/WGSL)
//
// This shader demonstrates GPU-based transform computation using compute shaders.
// Useful for skinning, particle simulation, and other transform-heavy operations.

// =============================================================================
// Bindings
// =============================================================================

// Input matrices (binding 0)
@group(0) @binding(0)
var<storage, read> input_matrices: array<mat4x4<f32>>;

// Output matrices (binding 1)
@group(0) @binding(1)
var<storage, read_write> output_matrices: array<mat4x4<f32>>;

// Transform parameters (binding 2)
struct TransformParams {
  num_matrices: u32,
  delta_time: f32,
  _padding: array<f32, 2>,
}

@group(0) @binding(2)
var<uniform> params: TransformParams;

// =============================================================================
// Compute Shader Main
// =============================================================================

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  // Check bounds
  if (index >= params.num_matrices) {
    return;
  }

  // Get input matrix
  let input_mat = input_matrices[index];

  // Example transform: rotation over time
  let angle = params.delta_time * 0.001; // Slow rotation
  let cos_a = cos(angle);
  let sin_a = sin(angle);

  // Create rotation matrix (Y-axis)
  let rotation = mat4x4<f32>(
    vec4<f32>(cos_a, 0.0, sin_a, 0.0),
    vec4<f32>(0.0, 1.0, 0.0, 0.0),
    vec4<f32>(-sin_a, 0.0, cos_a, 0.0),
    vec4<f32>(0.0, 0.0, 0.0, 1.0),
  );

  // Apply transform
  output_matrices[index] = rotation * input_mat;
}
