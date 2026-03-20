// AniMaker - Basic Fragment Shader (WebGPU/WGSL)
//
// This shader provides basic per-fragment coloring with optional lighting.
// Supports ambient, diffuse, and specular lighting.

// =============================================================================
// Uniform Buffers
// =============================================================================

// Material uniform buffer (binding 2)
struct MaterialUniforms {
  base_color: vec4<f32>,
  emissive: vec3<f32>,
  roughness: f32,
  metallic: f32,
  ambient_strength: f32,
}

@group(0) @binding(2)
var<uniform> material: MaterialUniforms;

// Light uniform buffer (binding 3)
struct LightUniforms {
  position: vec3<f32>,
  color: vec3<f32>,
  intensity: f32,
  _padding: f32,
}

@group(0) @binding(3)
var<uniform> light: LightUniforms;

// Texture samplers
@group(0) @binding(4)
var base_color_texture: texture_2d<f32>;

@group(0) @binding(5)
var sampler_linear: sampler;

// =============================================================================
// Fragment Input
// =============================================================================

struct FragmentInput {
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) world_pos: vec3<f32>,
  @location(3) normal: vec3<f32>,
}

// =============================================================================
// Fragment Output
// =============================================================================

struct FragmentOutput {
  @location(0) color: vec4<f32>,
}

// =============================================================================
// Fragment Shader Main
// =============================================================================

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  var output: FragmentOutput;

  // Sample base color from texture
  let texture_color = textureSample(base_color_texture, sampler_linear, input.uv);

  // Combine with vertex color and material base color
  let base_color = input.color * texture_color * material.base_color;

  // Calculate lighting
  let light_dir = normalize(light.position - input.world_pos);
  let normal = normalize(input.normal);

  // Ambient term
  let ambient = material.ambient_strength;

  // Diffuse term (Lambertian)
  let diffuse = max(dot(normal, light_dir), 0.0);

  // Combine lighting
  let lighting = ambient + diffuse;

  // Final color with light intensity
  output.color = vec4<f32>(
    (base_color.rgb * light.color * light.intensity * lighting) + material.emissive,
    base_color.a
  );

  return output;
}
