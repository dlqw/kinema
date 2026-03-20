// AniMaker - Basic Fragment Shader (WebGL2/GLSL)
//
// This shader provides basic per-fragment coloring with optional lighting.
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

// Material uniform buffer (binding 2)
layout(std140) uniform MaterialUniforms {
  vec4 base_color;
  vec3 emissive;
  float roughness;
  float metallic;
  float ambient_strength;
} material;

// Light uniform buffer (binding 3)
layout(std140) uniform LightUniforms {
  vec3 position;
  vec3 color;
  float intensity;
  float _padding;
} light;

// =============================================================================
// Textures
// =============================================================================

uniform sampler2D base_color_texture;

// =============================================================================
// Fragment Input
// =============================================================================

in vec2 v_uv;
in vec4 v_color;
in vec3 v_world_pos;
in vec3 v_normal;

// =============================================================================
// Fragment Output
// =============================================================================

layout(location = 0) out vec4 frag_color;

// =============================================================================
// Fragment Shader Main
// =============================================================================

void main() {
  // Sample base color from texture
  vec4 texture_color = texture(base_color_texture, v_uv);

  // Combine with vertex color and material base color
  vec4 base_color = v_color * texture_color * material.base_color;

  // Calculate lighting
  vec3 light_dir = normalize(light.position - v_world_pos);
  vec3 normal = normalize(v_normal);

  // Ambient term
  float ambient = material.ambient_strength;

  // Diffuse term (Lambertian)
  float diffuse = max(dot(normal, light_dir), 0.0);

  // Combine lighting
  float lighting = ambient + diffuse;

  // Final color with light intensity
  frag_color = vec4(
    (base_color.rgb * light.color * light.intensity * lighting) + material.emissive,
    base_color.a
  );
}
