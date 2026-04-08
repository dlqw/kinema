// Common Post-Processing Vertex Shader
// Shared vertex shader for all 2D post-processing effects

#ifdef GL_ES
precision mediump float;
#endif

// Vertex input
in vec2 a_position;

// Output to fragment shader
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL convention
}
