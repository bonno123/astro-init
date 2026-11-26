// Embers: sparks rising off a fire below the screen, trailing smoke.
// Original for this site. Buffer A holds the light; this pass adds a halo,
// a warm glow from below, and brings it into range.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = toSpace(fragCoord);
  vec2 reach = vec2(iResolution.y / iResolution.x, 1.0) * 0.007;

  vec3 light = texture(iChannel0, uv).rgb;
  vec3 halo = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7854;
    halo += texture(iChannel0, uv + vec2(cos(a), sin(a)) * reach).rgb;
  }
  halo /= 8.0;

  vec3 col = mix(vec3(0.03, 0.028, 0.024), vec3(0.16, 0.06, 0.02), smoothstep(0.1, -0.75, p.y));
  col += light + halo * 0.9;

  col = 1.0 - exp(-col * 1.5);
  col *= 1.0 - 0.5 * dot(uv - 0.5, uv - 0.5);
  col += (hash2(fragCoord + fract(iTime)) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}
