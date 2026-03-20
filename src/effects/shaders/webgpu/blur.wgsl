// Gaussian Blur Post-Processing Effect - WebGPU (WGSL)
// Applies separable Gaussian blur (horizontal and vertical passes)

struct BlurUniforms {
  radius: f32,
  sigma: f32,
  direction: f32, // 0.0 = horizontal, 1.0 = vertical
  padding: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var sampler_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: BlurUniforms;

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

// Gaussian weight function
fn gaussian(x: f32, sigma: f32) -> f32 {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159) * sigma);
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let tex_size = vec2<f32>(textureDimensions(input_texture));
  let texel_size = 1.0 / tex_size;

  var result = vec4<f32>(0.0);
  var total_weight = 0.0;

  let samples = i32(uniforms.radius);

  for (var i = -samples; i <= samples; i++) {
    let weight = gaussian(f32(i), uniforms.sigma);
    let offset = f32(i) * texel_size;

    let sample_uv = uv + vec2<f32>(
      offset * (1.0 - uniforms.direction),
      offset * uniforms.direction
    );

    let sample_color = textureSample(input_texture, sampler_sampler, sample_uv);
    result += sample_color * weight;
    total_weight += weight;
  }

  return result / total_weight;
}
