// Color Correction Post-Processing Effect - WebGL2 (GLSL)
// Fragment Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_inputTexture;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_gamma;
uniform float u_temperature;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_inputTexture, v_uv);

  // Apply brightness
  color.rgb += u_brightness;

  // Apply contrast
  color.rgb = (color.rgb - 0.5) * (1.0 + u_contrast) + 0.5;

  // Apply saturation
  float gray = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb = mix(vec3(gray), color.rgb, u_saturation);

  // Apply temperature (warm/cool tint)
  color.r += u_temperature * 0.1;
  color.b -= u_temperature * 0.1;

  // Apply gamma correction
  color.rgb = pow(color.rgb, vec3(1.0 / u_gamma));

  fragColor = color;
}
