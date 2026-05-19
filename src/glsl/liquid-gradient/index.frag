// Liquid Gradient Blob Shader
// Smooth, organic flowing shapes with vibrant colors
// Perfect for light themes - modern and premium feel

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal brownian motion for organic movement
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

// Smooth blob shape
float blob(vec2 uv, vec2 center, float size, float softness) {
    float dist = length(uv - center);
    return smoothstep(size + softness, size - softness, dist);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;
    
    float time = u_time * 0.3;
    
    // Define vibrant colors that work on light backgrounds
    // Cyan to blue to purple to pink gradient
    vec3 color1 = vec3(0.0, 0.85, 0.88);    // Bright cyan
    vec3 color2 = vec3(0.36, 0.42, 0.98);   // Electric blue
    vec3 color3 = vec3(0.62, 0.32, 0.94);   // Vivid purple
    vec3 color4 = vec3(0.95, 0.45, 0.65);   // Soft pink
    vec3 color5 = vec3(0.98, 0.65, 0.45);   // Peach/coral
    
    // Create flowing noise field
    float noise1 = fbm(p * 1.5 + vec2(time * 0.5, time * 0.3));
    float noise2 = fbm(p * 2.0 - vec2(time * 0.4, time * 0.6));
    float noise3 = fbm(p * 1.2 + vec2(time * 0.2, -time * 0.4));
    
    // Animated blob centers
    vec2 center1 = vec2(
        sin(time * 0.7) * 0.5,
        cos(time * 0.5) * 0.5
    );
    vec2 center2 = vec2(
        cos(time * 0.6) * 0.6,
        sin(time * 0.8) * 0.4
    );
    vec2 center3 = vec2(
        sin(time * 0.9 + 2.0) * 0.4,
        cos(time * 0.7 + 1.0) * 0.6
    );
    vec2 center4 = vec2(
        cos(time * 0.5 + 3.0) * 0.5,
        sin(time * 0.6 + 2.0) * 0.5
    );
    
    // Create organic blobs with noise distortion
    float blob1 = blob(p + noise1 * 0.3, center1, 0.6 + noise2 * 0.2, 0.4);
    float blob2 = blob(p + noise2 * 0.25, center2, 0.5 + noise1 * 0.15, 0.35);
    float blob3 = blob(p + noise3 * 0.2, center3, 0.55 + noise3 * 0.18, 0.38);
    float blob4 = blob(p - noise1 * 0.2, center4, 0.45 + noise2 * 0.12, 0.32);
    
    // Mix colors based on position and time
    float colorMix1 = sin(p.x * 2.0 + time) * 0.5 + 0.5;
    float colorMix2 = cos(p.y * 2.0 - time * 0.8) * 0.5 + 0.5;
    float colorMix3 = sin((p.x + p.y) * 1.5 + time * 0.6) * 0.5 + 0.5;
    
    // Create gradient color field
    vec3 gradientColor = mix(color1, color2, colorMix1);
    gradientColor = mix(gradientColor, color3, colorMix2 * 0.7);
    gradientColor = mix(gradientColor, color4, colorMix3 * 0.5);
    gradientColor = mix(gradientColor, color5, noise1 * 0.3 + 0.2);
    
    // Combine blobs
    float blobField = blob1 + blob2 * 0.8 + blob3 * 0.7 + blob4 * 0.6;
    blobField = smoothstep(0.3, 1.2, blobField);
    
    // Add subtle iridescent shimmer
    float shimmer = sin(p.x * 15.0 + p.y * 15.0 + time * 3.0) * 0.03;
    shimmer += sin(p.x * 10.0 - p.y * 8.0 + time * 2.5) * 0.02;
    
    // Background - soft off-white with subtle gradient
    vec3 bgColor = vec3(0.97, 0.97, 0.98);
    bgColor += vec3(0.02) * (1.0 - length(p) * 0.3);
    
    // Final color composition
    vec3 finalColor = mix(bgColor, gradientColor + shimmer, blobField * 0.85);
    
    // Add soft glow around blobs
    float glow = smoothstep(1.5, 0.0, blobField) * 0.15;
    finalColor += gradientColor * glow;
    
    // Subtle vignette
    float vignette = 1.0 - length(p) * 0.2;
    finalColor *= vignette;
    
    // Ensure colors stay vibrant but not oversaturated
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
