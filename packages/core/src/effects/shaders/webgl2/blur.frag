// Gaussian Blur Post-Processing Effect - WebGL2 (GLSL)
// Fragment Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_sigma;
uniform float u_direction; // 0.0 = horizontal, 1.0 = vertical

in vec2 v_uv;
out vec4 fragColor;

float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159) * sigma);
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 result = vec4(0.0);
  float totalWeight = 0.0;

  int samples = int(u_radius);

  for (int i = -50; i <= 50; i++) {
    if (i > samples) break;
    if (i < -samples) continue;

    float weight = gaussian(float(i), u_sigma);
    vec2 offset = float(i) * texelSize;

    vec2 sampleUV = v_uv + vec2(
      offset * (1.0 - u_direction),
      offset * u_direction
    );

    vec4 sampleColor = texture(u_inputTexture, sampleUV);
    result += sampleColor * weight;
    totalWeight += weight;
  }

  fragColor = result / totalWeight;
}
