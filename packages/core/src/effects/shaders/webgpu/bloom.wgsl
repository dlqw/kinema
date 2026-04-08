// Bloom Post-Processing Effect - WebGPU (WGSL)
// Creates a glow effect around bright areas

struct BloomUniforms {
  intensity: f32,
  threshold: f32,
  softness: f32,
  padding: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var sampler_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: BloomUniforms;

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
  output.uv.y = 1.0 - output.uv.y; // Flip Y for WebGL convention
  return output;
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let color = textureSample(input_texture, sampler_sampler, uv);

  // Extract bright pixels
  let brightness = dot(color.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
  let soft_threshold = uniforms.threshold - uniforms.softness;
  let bright = max(brightness - soft_threshold, 0.0);
  let contribution = smoothstep(0.0, uniforms.softness, bright);

  return vec4<f32>(color.rgb * contribution * uniforms.intensity, color.a);
}
