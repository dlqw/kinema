// Color Correction Post-Processing Effect - WebGPU (WGSL)
// Applies brightness, contrast, saturation, gamma, and temperature adjustments

struct ColorCorrectionUniforms {
  brightness: f32,
  contrast: f32,
  saturation: f32,
  gamma: f32,
  temperature: f32,
  padding1: f32,
  padding2: f32,
  padding3: f32,
};

@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var sampler_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: ColorCorrectionUniforms;

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
  var color = textureSample(input_texture, sampler_sampler, uv);

  // Apply brightness
  color.rgb += uniforms.brightness;

  // Apply contrast
  color.rgb = (color.rgb - 0.5) * (1.0 + uniforms.contrast) + 0.5;

  // Apply saturation
  let gray = dot(color.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
  color.rgb = mix(vec3<f32>(gray), color.rgb, uniforms.saturation);

  // Apply temperature (warm/cool tint)
  let temperature = uniforms.temperature;
  color.r += temperature * 0.1;
  color.b -= temperature * 0.1;

  // Apply gamma correction
  color.rgb = pow(color.rgb, vec3<f32>(1.0 / uniforms.gamma));

  return color;
}
