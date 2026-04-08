// Vignette Post-Processing Effect - WebGL2 (GLSL)
// Fragment Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_inputTexture;
uniform float u_intensity;
uniform float u_size;
uniform float u_roundness;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_inputTexture, v_uv);

  // Calculate distance from center
  vec2 center = vec2(0.5, 0.5);
  vec2 delta = v_uv - center;
  float dist = length(delta);

  // Apply vignette
  float aspectRatio = 1.0;
  vec2 adjustedUV = (v_uv - center) * vec2(1.0, aspectRatio);
  float vignette = 1.0 - smoothstep(u_size, u_size + u_roundness, length(adjustedUV) * 2.0);

  // Blend
  float factor = mix(1.0, vignette, u_intensity);

  fragColor = vec4(color.rgb * factor, color.a);
}
