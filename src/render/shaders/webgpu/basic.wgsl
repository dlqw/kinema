// AniMaker - Basic Vertex Shader (WebGPU/WGSL)
//
// This shader provides basic vertex transformation with model-view-projection matrix.
// It's the foundation for most rendering operations.

// =============================================================================
// Uniform Buffers
// =============================================================================

// Camera uniform buffer (binding 0)
struct CameraUniforms {
  view_proj: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  position: vec3<f32>,
  time: f32,
}

@group(0) @binding(0)
var<uniform> camera: CameraUniforms;

// Model uniform buffer (binding 1)
struct ModelUniforms {
  model: mat4x4<f32>,
  normal_matrix: mat4x4<f32>,
}

@group(0) @binding(1)
var<uniform> model: ModelUniforms;

// =============================================================================
// Vertex Input
// =============================================================================

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) color: vec4<f32>,
}

// =============================================================================
// Vertex Output / Fragment Input
// =============================================================================

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) world_pos: vec3<f32>,
  @location(3) normal: vec3<f32>,
}

// =============================================================================
// Vertex Shader Main
// =============================================================================

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Transform position to world space
  let world_pos = model.model * vec4<f32>(input.position, 1.0);

  // Transform to clip space
  output.position = camera.view_proj * world_pos;

  // Pass through UV and color
  output.uv = input.uv;
  output.color = input.color;

  // Transform normal to world space
  output.normal = normalize((model.normal_matrix * vec4<f32>(input.normal, 0.0)).xyz);

  // Output world position (without projection)
  output.world_pos = world_pos.xyz;

  return output;
}
