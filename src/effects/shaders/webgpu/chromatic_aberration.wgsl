// Chromatic Aberration Post-Processing Effect - WebGPU (WGSL)
// Creates color fringing by shifting RGB channels

struct ChromaticAberrationUniforms {
  strength: f32,
  offset: f32,
  padding1: f32,
  padding2: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var sampler_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: ChromaticAberrationUniforms;

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
  let center = vec2<f32>(0.5, 0.5);
  let delta = uv - center;
  let dist = length(delta);
  let direction = normalize(delta);

  // Calculate chromatic aberration offset based on distance from center
  let aberration_offset = direction * dist * uniforms.strength;

  // Sample each channel with different offsets
  let red_offset = aberration_offset * uniforms.offset;
  let green_offset = vec2<f32>(0.0, 0.0);
  let blue_offset = -aberration_offset * uniforms.offset;

  let red_uv = clamp(uv + red_offset, vec2<f32>(0.0), vec2<f32>(1.0));
  let green_uv = uv;
  let blue_uv = clamp(uv + blue_offset, vec2<f32>(0.0), vec2<f32>(1.0));

  let red_channel = textureSample(input_texture, sampler_sampler, red_uv).r;
  let green_channel = textureSample(input_texture, sampler_sampler, green_uv).g;
  let blue_channel = textureSample(input_texture, sampler_sampler, blue_uv).b;
  let alpha = textureSample(input_texture, sampler_sampler, uv).a;

  return vec4<f32>(red_channel, green_channel, blue_channel, alpha);
}
