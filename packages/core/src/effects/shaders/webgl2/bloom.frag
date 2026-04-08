// Bloom Post-Processing Effect - WebGL2 (GLSL)
// Fragment Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform float u_threshold;
uniform float u_softness;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_inputTexture, v_uv);

  // Calculate brightness
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

  // Extract bright pixels with soft threshold
  float softThreshold = u_threshold - u_softness;
  float bright = max(brightness - softThreshold, 0.0);
  float contribution = smoothstep(0.0, u_softness, bright);

  fragColor = vec4(color.rgb * contribution * u_intensity, color.a);
}
