// Buffer A: the light. Each frame keeps most of the last one (iChannel0 is this
// buffer), carried up and sideways by a slow curling drift, so every spark
// leaves a trail of smoke. New sparks are drawn on top.

const int SPARKS = 28;

vec2 drift(vec2 p, float t) {
  float a = noise(p * 2.5 + vec2(0.0, -t * 0.35)) * 6.2831;
  return vec2(cos(a) * 0.05, 0.11 + sin(a) * 0.03);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = toSpace(fragCoord);
  float dt = min(iTimeDelta, 0.05);
  float aspect = iResolution.x / iResolution.y;

  // where this pixel's light was a moment ago
  vec2 back = uv - drift(p, iTime) * dt * vec2(1.0 / aspect, 1.0);
  vec3 col = iFrame == 0 ? vec3(0.0) : texture(iChannel0, back).rgb * exp(-dt * 0.9);

  for (int i = 0; i < SPARKS; i++) {
    float fi = float(i);
    float life = 4.0 + 4.0 * hash1(fi * 1.7);
    float tt = iTime + hash1(fi * 7.31) * life;
    float age = mod(tt, life);
    float gen = floor(tt / life); // a new place to start from on every lap
    float x0 = (hash1(fi * 3.3 + gen * 1.37) - 0.5) * aspect * 0.95;
    float rise = 0.13 + 0.07 * hash1(fi * 5.1 + gen);
    vec2 pos = vec2(x0 + 0.06 * sin(age * 1.3 + fi) + 0.03 * sin(age * 3.1 + fi * 2.0), -0.56 + age * rise);
    float fade = smoothstep(0.0, 0.4, age) * (1.0 - smoothstep(life * 0.55, life, age));
    float r = 0.0035 + 0.002 * hash1(fi * 9.7);
    vec2 d = p - pos;
    float glow = exp(-dot(d, d) / (r * r));
    vec3 tint = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.75, 0.35), hash1(fi * 2.9));
    col += tint * glow * fade * dt * 40.0; // per second, so it's the same at 60 or 120 fps
  }

  fragColor = vec4(col, 1.0);
}
