// Neon Drive: the picture. Original for this site. A sun over a neon grid and a
// road, driving in time with the song (sound.glsl): the grid pulses on the kick
// and moves twice as fast in the chorus, the horizon flashes on the snare, the
// camera leans in the chorus, and the sun rises through the intro and sinks
// through the outro, so the loop has no seam.

float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i), hash1(i + 1.0), f);
}

float ridge(float x) {
  float h = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    h += a * noise1(x);
    x = x * 2.03 + 17.0;
    a *= 0.5;
  }
  return h;
}

// How far the car has gone, in grid squares: half a square a beat, a whole one in
// the chorus. That's 64 over the song, a whole number, so the grid is back where
// it started when the song loops.
float travel(float b) { return 0.5 * b + 0.5 * clamp(b - 48.0, 0.0, 32.0); }

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float b = songBeat(iTime);
  float kick = exp(-sinceKick(b) * 3.0);
  float snare = exp(-sinceSnare(b) * 4.0);
  float chorus = smoothstep(47.0, 48.0, b) * (1.0 - smoothstep(79.0, 81.0, b));
  float drop = b >= 48.0 && b < 56.0 ? exp(-(b - 48.0) * 1.2) : 0.0;
  float lines = mix(0.35, 1.0, smoothstep(12.0, 16.0, b)) * mix(1.0, 0.35, smoothstep(80.0, 92.0, b));
  float sunUp = mix(0.3, 1.0, smoothstep(0.0, 16.0, b) * (1.0 - smoothstep(80.0, 96.0, b)));

  // in the chorus the camera leans with the bars
  float lean = 0.035 * chorus * sin(b * PI * 0.25);
  uv = mat2(cos(lean), sin(lean), -sin(lean), cos(lean)) * uv;
  float horizon = -0.06 - 0.006 * kick * chorus;
  float above = uv.y - horizon;
  float aa = 1.5 / iResolution.y;

  // sky: deep violet overhead, pink at the horizon, warmer as the sun comes up
  vec3 low = mix(vec3(0.25, 0.04, 0.3), vec3(0.85, 0.18, 0.45), sunUp);
  vec3 col = mix(low, vec3(0.03, 0.01, 0.08), smoothstep(0.0, 0.5, above));
  col += vec3(1.0, 0.3, 0.6) * exp(-abs(above) * 18.0) * (0.25 + 0.35 * snare);

  // stars, fewer as the sun comes up
  vec2 sc = floor(uv * 120.0);
  float star = hash2(sc);
  if (star > 0.985) {
    float tw = 0.6 + 0.4 * sin(iTime * 3.0 + star * 100.0);
    float dot_ = smoothstep(0.18, 0.0, length(fract(uv * 120.0) - 0.5));
    col += vec3(0.9, 0.85, 1.0) * dot_ * tw * (1.0 - 0.7 * sunUp) * smoothstep(0.05, 0.3, above);
  }

  // the sun, banded across its lower half, the bands drifting down
  float r = 0.27;
  vec2 d = uv - vec2(0.0, horizon + mix(-0.12, 0.16, sunUp));
  float dist = length(d);
  float y = d.y / r; // -1 at its bottom, 1 at its top
  vec3 sunCol = mix(vec3(1.0, 0.15, 0.5), vec3(1.0, 0.85, 0.3), smoothstep(-0.9, 0.8, y));
  float band = fract(y * 7.0 + b * 0.125);
  float gap = smoothstep(0.15, -1.0, y) * 0.65;
  float bw = fwidth(band) + 1e-4;
  float cut = y < 0.15 ? 1.0 - smoothstep(gap - bw, gap + bw, band) : 0.0;
  float disk = smoothstep(r + aa, r - aa, dist) * (1.0 - cut);
  col += vec3(1.0, 0.35, 0.55) * exp(-max(dist - r, 0.0) * 9.0) * 0.35 * (0.6 + 0.4 * sunUp) * (1.0 - disk);
  col = mix(col, sunCol * (1.0 + 0.3 * snare), disk);

  // two ridges of mountains, low in the middle so the sun shows, their tops lit
  float am = 2.0 / iResolution.y;
  float ridgeFar = horizon + (0.03 + 0.2 * ridge(uv.x * 2.2 + 4.0)) * smoothstep(0.05, 0.75, abs(uv.x));
  vec3 farCol = vec3(0.08, 0.02, 0.14) + vec3(0.9, 0.2, 0.7) * exp(-(ridgeFar - uv.y) * 90.0) * 0.6;
  col = mix(col, farCol, smoothstep(ridgeFar + am, ridgeFar - am, uv.y));
  float ridgeNear = horizon + (0.01 + 0.12 * ridge(uv.x * 3.7 + 31.0)) * smoothstep(0.25, 0.9, abs(uv.x));
  vec3 nearCol = vec3(0.03, 0.01, 0.06) + vec3(0.2, 0.8, 1.0) * exp(-(ridgeNear - uv.y) * 120.0) * 0.5 * (0.6 + 0.4 * chorus);
  col = mix(col, nearCol, smoothstep(ridgeNear + am, ridgeNear - am, uv.y));

  // the ground: a grid coming at you, and a road down the middle with a dashed line
  if (above < 0.0) {
    float z = 1.0 / -above; // how far away this row of ground is
    float x = uv.x * z;
    vec2 g = vec2(x * 2.0, z * 2.0 + travel(b));
    vec2 gw = max(fwidth(g), vec2(1e-4));
    vec2 px = (0.5 - abs(fract(g) - 0.5)) / gw; // pixels to the nearest line
    float road = 1.0 - smoothstep(0.95, 1.0, abs(x));
    float dash = step(0.5, fract(g.y * 0.5));
    float vx = smoothstep(1.2, 0.0, px.x) * mix(1.0, abs(g.x) < 0.5 ? dash : 0.0, road);
    float hy = smoothstep(1.2, 0.0, px.y) * mix(1.0, 0.3, road);
    float glow = max(exp(-px.x * 0.35) * (1.0 - road), exp(-px.y * 0.35) * mix(1.0, 0.3, road));
    float haze = smoothstep(0.3, 1.0, max(gw.x, gw.y)); // far off, the lines crowd into a glow
    float fade = exp(-z * 0.035);
    vec3 lc = mix(vec3(1.0, 0.2, 0.75), vec3(0.2, 0.85, 1.0), chorus);
    float pulse = 0.55 + 0.9 * kick;
    col = vec3(0.02, 0.0, 0.04) * (1.0 - 0.5 * road);
    col += lc * (max(vx, hy) + 0.35 * glow) * (1.0 - haze) * fade * lines * pulse;
    col += lc * haze * 0.22 * lines;
    col += vec3(1.0, 0.3, 0.6) * exp(above * 25.0) * (0.35 + 0.35 * snare);
  }

  // the moment the chorus lands
  col += vec3(1.0, 0.45, 0.8) * drop * 0.3;

  vec2 q = fragCoord / iResolution.xy;
  col *= 0.6 + 0.4 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.25);
  col += (hash2(fragCoord + fract(iTime) * 100.0) - 0.5) / 255.0;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
