// Vignette Post-Processing Effect - WebGPU (WGSL)
// Darkens the edges of the image for a cinematic look

struct VignetteUniforms {
  intensity: f32,
  size: f32,
  roundness: f32,
  padding: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var sampler_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: VignetteUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );

  var output: VertexOutput;
  let pos = positions[vertex_index];
  output.position = vec4<f32>(pos, 0.0, 1.0);
  output.uv = pos * 0.5 + 0.5;
  output.uv.y = 1.0 - output.uv.y;
  return output;
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let color = textureSample(input_texture, sampler_sampler, uv);

  // Calculate distance from center
  let center = vec2<f32>(0.5, 0.5);
  let delta = uv - center;
  let dist = length(delta);

  // Apply vignette based on roundness
  let aspect_ratio = 1.0; // Could be passed as uniform for non-square viewports
  let adjusted_uv = (uv - center) * vec2<f32>(1.0, aspect_ratio);
  let vignette = 1.0 - smoothstep(uniforms.size, uniforms.size + uniforms.roundness, length(adjusted_uv) * 2.0);

  // Blend between original and darkened
  let factor = mix(1.0, vignette, uniforms.intensity);

  return vec4<f32>(color.rgb * factor, color.a);
}
