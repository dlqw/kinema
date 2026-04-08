// Chromatic Aberration Post-Processing Effect - WebGL2 (GLSL)
// Fragment Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_inputTexture;
uniform float u_strength;
uniform float u_offset;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 delta = v_uv - center;
  float dist = length(delta);
  vec2 direction = normalize(delta);

  // Calculate chromatic aberration offset
  vec2 aberrationOffset = direction * dist * u_strength;

  // Sample each channel with different offsets
  vec2 redOffset = aberrationOffset * u_offset;
  vec2 greenOffset = vec2(0.0, 0.0);
  vec2 blueOffset = -aberrationOffset * u_offset;

  vec2 redUV = clamp(v_uv + redOffset, vec2(0.0), vec2(1.0));
  vec2 greenUV = v_uv;
  vec2 blueUV = clamp(v_uv + blueOffset, vec2(0.0), vec2(1.0));

  float redChannel = texture(u_inputTexture, redUV).r;
  float greenChannel = texture(u_inputTexture, greenUV).g;
  float blueChannel = texture(u_inputTexture, blueUV).b;
  float alpha = texture(u_inputTexture, v_uv).a;

  fragColor = vec4(redChannel, greenChannel, blueChannel, alpha);
}
