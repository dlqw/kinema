// Kinema - Basic Vertex Shader (WebGL2/GLSL)
//
// This shader provides basic vertex transformation with model-view-projection matrix.
// Compatible with WebGL 2.0+.

#version 300 es

// =============================================================================
// Precision qualifiers
// =============================================================================

precision highp float;
precision highp int;

// =============================================================================
// Uniform Buffers
// =============================================================================

// Camera uniform buffer (binding 0)
layout(std140) uniform CameraUniforms {
  mat4 view_proj;
  mat4 view;
  mat4 projection;
  vec3 position;
  float time;
} camera;

// Model uniform buffer (binding 1)
layout(std140) uniform ModelUniforms {
  mat4 model;
  mat4 normal_matrix;
} model;

// =============================================================================
// Vertex Input
// =============================================================================

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec4 a_color;

// =============================================================================
// Vertex Output
// =============================================================================

out vec2 v_uv;
out vec4 v_color;
out vec3 v_world_pos;
out vec3 v_normal;

// =============================================================================
// Vertex Shader Main
// =============================================================================

void main() {
  // Transform position to world space
  vec4 world_pos = model.model * vec4(a_position, 1.0);

  // Transform to clip space
  gl_Position = camera.view_proj * world_pos;

  // Pass through to fragment shader
  v_uv = a_uv;
  v_color = a_color;
  v_world_pos = world_pos.xyz;
  v_normal = normalize((model.normal_matrix * vec4(a_normal, 0.0)).xyz);
}
