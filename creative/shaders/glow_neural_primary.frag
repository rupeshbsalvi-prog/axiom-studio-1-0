// glow_neural_primary.frag
// Standard: AES-1.0
// Description: Neural blue crystal glow shader for Brain X background.

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Create a slow pulsing neural blue crystal light
    float pulse = 0.5 + 0.5 * sin(u_time * 0.8);
    float glow = 1.0 - length(uv - vec2(0.5));
    glow = pow(glow, 3.0) * pulse;
    
    vec3 color = vec3(0.06, 0.38, 0.85) * glow; // Neural crystal blue
    gl_FragColor = vec4(color, glow * 0.4);
}
