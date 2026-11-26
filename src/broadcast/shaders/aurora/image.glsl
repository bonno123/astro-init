// Aurora: slow ribbons of light over a dark ridge, in the site's colours.
// Original for this site. One pass, no inputs.

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.03 + 11.7;
    a *= 0.5;
  }
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  // height runs -0.5..0.5 whatever the screen's shape, so nothing depends on the resolution
  vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * 0.06;

  vec3 col = mix(vec3(0.035, 0.038, 0.03), vec3(0.075, 0.07, 0.055), uv.y);

  // stars, fading toward the horizon
  vec2 cell = floor(p * 90.0);
  vec2 f = fract(p * 90.0) - 0.5;
  float h = hash(cell);
  float star = step(0.993, h) * smoothstep(0.12, 0.0, length(f)) * (0.55 + 0.45 * sin(iTime * 1.7 + h * 80.0));
  col += vec3(0.93, 0.91, 0.86) * star * smoothstep(-0.15, 0.35, p.y) * 0.8;

  // three ribbons: a bent line each, a soft glow above it and a sharper edge below
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 q = p * vec2(1.4, 1.0) + vec2(t * (1.0 + fi * 0.35), fi * 1.7);
    float warp = fbm(q * 1.3 + vec2(0.0, t * 2.0));
    float y = 0.04 + fi * 0.11 + (warp - 0.5) * 0.55 + 0.05 * sin(p.x * 2.2 + t * 6.0 + fi);
    float d = p.y - y;
    float band = exp(-abs(d) * (d > 0.0 ? 4.5 : 26.0));
    float rays = 0.5 + 0.5 * fbm(vec2(p.x * 9.0 + fi * 3.1, t * 3.0));
    vec3 tint = mix(vec3(0.88, 0.66, 0.27), vec3(0.56, 0.73, 0.59), fi * 0.5); // amber to sage
    col += tint * band * rays * (0.6 - fi * 0.14);
  }

  // the ridge, edged to a pixel at any resolution
  float ridge = -0.34 + 0.09 * fbm(vec2(p.x * 1.6 + 3.0, 0.5)) + 0.03 * noise(vec2(p.x * 7.0, 2.0));
  col = mix(vec3(0.018, 0.019, 0.016), col, smoothstep(ridge, ridge + 1.5 / iResolution.y, p.y));

  col = 1.0 - exp(-col * 1.7);
  col *= 1.0 - 0.55 * dot(uv - 0.5, uv - 0.5);
  col += (hash(fragCoord + fract(iTime)) - 0.5) / 255.0; // dither, against banding in the dark
  fragColor = vec4(col, 1.0);
}
