// Night Ride: the picture. Original for this site.
// A motorbike down a wet city street at night in the rain, to Neon Drive's song
// (its common.glsl comes in front of this file). A streetlight passes on every
// beat, twice as fast in the chorus; the road mirrors the lights, the city and
// the bike's tail light; the camera cuts on the bar lines (shot), and lightning
// marks the chorus landing.
//
// It's ray marched: the bike, the rider, the buildings and the poles are
// distance functions (map), the road is a flat plane hit exactly (ground), and
// the haze around each light is worked out along the ray rather than marched
// (glow). Everything repeats along the street with a period that divides one lap
// of the song, so the loop has no seam.
//
// Metres. x across the street (right is +), y up, z forward. The bike stays near
// z = 0 and the city slides past it.

const float P = 12.0; // metres between streetlights, and the width of a building
const float LAP = 129.0; // streetlights passed in one lap of the song (see travel)
const float KERB = 4.5; // half the road's width
const float LAMP_X = 3.85; // where a streetlight's head hangs, either side
const float LAMP_Y = 5.36;
const vec3 LAMP = vec3(1.0, 0.52, 0.2) * 70.0; // sodium orange
const vec3 PINK = vec3(1.0, 0.18, 0.55);
const vec3 CYAN = vec3(0.15, 0.75, 1.0);
const vec3 FOG = vec3(0.012, 0.009, 0.02);

float gD; // how far the bike has gone this lap
vec3 gBike; // where it is
float gLean; // and how far it leans, radians
float gKick;
float gChorus; // 1 through the chorus
float gFlash; // lightning, when the chorus lands
float gSecs; // seconds into the song

// --- hashes and noise (integer hashes: sin() ones break on phones) ---

uint pcgu(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float hashf(float n) { return float(pcgu(uint(int(n) + 1048576))) * (1.0 / 4294967296.0); }
float hashv(vec2 c) {
  return float(pcgu(uint(int(c.x) + 1048576) + pcgu(uint(int(c.y) + 1048576)))) * (1.0 / 4294967296.0);
}

/** Value noise that repeats every `per` cells in y, so the road is the same when the lap comes round. */
float vnoise(vec2 x, float per) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, per);
  float y1 = mod(i.y + 1.0, per);
  float a = hashv(vec2(i.x, y0));
  float b = hashv(vec2(i.x + 1.0, y0));
  float c = hashv(vec2(i.x, y1));
  float d = hashv(vec2(i.x + 1.0, y1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// --- the ride ---

// Eases from 0 to a slope of 1 over x = 0..1: the integral of smoothstep.
float ramp(float x) {
  x = max(x, 0.0);
  return x < 1.0 ? x * x * x - 0.5 * x * x * x * x : x - 0.5;
}

// Metres gone at beat b: one streetlight a beat, two a beat through the chorus
// (easing up over the beat before it and back down after). 129 lights a lap, a
// whole number, so the street is back where it started when the song loops.
// The half-light offset puts a light right over the bike on each beat.
float travel(float b) { return P * (b + ramp(b - 47.0) - ramp(b - 80.0) + 0.5); }

/** How fast that is, in metres a second. */
float speed(float b) { return P * (1.0 + smoothstep(47.0, 48.0, b) - smoothstep(80.0, 81.0, b)) / BEAT; }

// --- distance functions ---

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdCap(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdEll(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

vec3 toBike(vec3 p) {
  vec3 q = p - gBike;
  q.xy = mat2(cos(gLean), sin(gLean), -sin(gLean), cos(gLean)) * q.xy;
  return q;
}
vec3 fromBike(vec3 q) {
  q.xy = mat2(cos(gLean), -sin(gLean), sin(gLean), cos(gLean)) * q.xy;
  return q + gBike;
}

float tyre(vec3 q) { return length(vec2(length(q.yz) - 0.26, q.x)) - 0.075; }
float rim(vec3 q) {
  float r = length(q.yz);
  return min(max(abs(q.x) - 0.018, r - 0.215), max(abs(q.x) - 0.07, r - 0.05)); // the disc, and the hub through it
}

// Materials: 1 tyre, 2 paint, 3 chrome, 4 riding suit, 5 helmet, 6 building, 7 pole, 8 lamp
vec2 bike(vec3 q) {
  vec3 qs = vec3(abs(q.x), q.yz); // for the parts that come in pairs
  vec2 r = vec2(min(tyre(q - vec3(0.0, 0.33, 0.72)), tyre(q - vec3(0.0, 0.33, -0.72))), 1.0);
  // the wheels' rims and hubs, solid discs: spokes would only strobe at this speed
  float rims = min(rim(q - vec3(0.0, 0.33, 0.72)), rim(q - vec3(0.0, 0.33, -0.72)));

  float body = sdEll(q - vec3(0.0, 0.80, 0.12), vec3(0.17, 0.13, 0.32)); // tank
  body = smin(body, sdCap(q, vec3(0.0, 0.82, -0.18), vec3(0.0, 0.92, -0.80), 0.075), 0.08); // seat and tail
  body = smin(body, sdEll(q - vec3(0.0, 0.93, 0.56), vec3(0.17, 0.16, 0.16)), 0.06); // fairing
  body = smin(body, sdBox(q - vec3(0.0, 0.46, -0.02), vec3(0.11, 0.13, 0.24)) - 0.05, 0.1); // engine
  if (body < r.x) r = vec2(body, 2.0);

  float ch = sdCap(qs, vec3(0.09, 0.33, 0.72), vec3(0.08, 0.92, 0.48), 0.028); // forks
  ch = min(ch, sdCap(q, vec3(0.16, 0.34, -0.15), vec3(0.19, 0.52, -0.92), 0.055)); // exhaust
  ch = min(ch, sdCap(qs, vec3(0.08, 0.40, -0.10), vec3(0.06, 0.33, -0.72), 0.03)); // swingarm
  ch = min(ch, sdCap(qs, vec3(0.0, 1.0, 0.44), vec3(0.32, 1.02, 0.38), 0.018)); // bars
  ch = min(ch, rims);
  if (ch < r.x) r = vec2(ch, 3.0);

  float man = sdCap(q, vec3(0.0, 0.98, -0.33), vec3(0.0, 1.36, 0.0), 0.15); // torso, leaning in
  man = smin(man, sdCap(q, vec3(-0.17, 1.31, -0.01), vec3(0.17, 1.31, -0.01), 0.085), 0.08); // shoulders
  man = smin(man, sdCap(qs, vec3(0.17, 1.32, 0.0), vec3(0.25, 1.12, 0.17), 0.055), 0.05); // upper arms
  man = min(man, sdCap(qs, vec3(0.25, 1.12, 0.17), vec3(0.30, 1.03, 0.38), 0.045)); // forearms
  man = smin(man, sdCap(qs, vec3(0.12, 0.96, -0.30), vec3(0.20, 0.86, 0.12), 0.08), 0.05); // thighs
  man = min(man, sdCap(qs, vec3(0.20, 0.86, 0.12), vec3(0.19, 0.45, -0.18), 0.06)); // shins
  man = min(man, sdBox(qs - vec3(0.19, 0.40, -0.14), vec3(0.05, 0.05, 0.12)) - 0.02); // boots
  if (man < r.x) r = vec2(man, 4.0);

  float helmet = sdEll(q - vec3(0.0, 1.5, 0.12), vec3(0.135, 0.14, 0.16));
  if (helmet < r.x) r = vec2(helmet, 5.0);
  return r;
}

/** Which building a point is beside, and where along it: id, then z from its middle. */
vec2 block(vec3 p) {
  float wz = p.z + gD;
  float cell = floor(wz / P);
  return vec2(mod(cell, LAP) * 2.0 + (p.x > 0.0 ? 1.0 : 0.0), wz - (cell + 0.5) * P);
}

vec2 city(vec3 p) {
  float lx = abs(p.x);
  vec2 bl = block(p);
  // a building a streetlight wide, each its own height and a little set back or forward
  float h = 7.0 + 26.0 * pow(hashf(bl.x), 1.5);
  float front = 8.0 + 1.6 * hashf(bl.x + 500.0);
  float d = sdBox(vec3(lx - front - 10.0, p.y - h * 0.5, bl.y), vec3(10.0, h * 0.5, P * 0.5 - 0.4));
  // the next one along may be taller: never step past this one's end
  d = min(d, P * 0.5 - abs(bl.y) + 0.4);
  vec2 r = vec2(d, 6.0);

  // a streetlight in the middle of each, its arm out over the road
  vec3 q = vec3(lx - 4.9, p.y, bl.y);
  float pole = sdCap(q, vec3(0.0), vec3(0.0, 5.4, 0.0), 0.09);
  pole = min(pole, sdCap(q, vec3(0.0, 5.4, 0.0), vec3(-1.0, 5.52, 0.0), 0.05));
  if (pole < r.x) r = vec2(pole, 7.0);
  float head = sdBox(q - vec3(-1.05, 5.46, 0.0), vec3(0.3, 0.05, 0.14)) - 0.03;
  if (head < r.x) r = vec2(head, 8.0);
  return r;
}

vec2 map(vec3 p) {
  vec2 r = city(p);
  vec3 q = toBike(p);
  float bound = length(q - vec3(0.0, 0.85, 0.0)) - 1.35;
  if (bound > 0.2) {
    if (bound < r.x) r = vec2(bound, 0.0); // too far off to need the bike's detail
  } else {
    vec2 bk = bike(q);
    if (bk.x < r.x) r = bk;
  }
  return r;
}

/** Distance and material along a ray, material -1 for nothing before tmax. */
vec2 march(vec3 ro, vec3 rd, float tmax, int steps) {
  float t = 0.0;
  for (int i = 0; i < steps; i++) {
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0005 + 0.0008 * t && h.y > 0.5) return vec2(t, h.y);
    t += h.x;
    if (t > tmax) break;
  }
  return vec2(tmax, -1.0);
}

vec3 normalAt(vec3 p) {
  const vec2 e = vec2(0.0015, -0.0015);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

/** The road (y = 0) and the pavements (a kerb's height up), hit exactly. kind 0 road, 1 pavement; t is 1e9 for none. */
float ground(vec3 ro, vec3 rd, out vec3 n, out float kind) {
  n = vec3(0.0, 1.0, 0.0);
  kind = 0.0;
  if (rd.y >= 0.0) return 1e9;
  float t = -ro.y / rd.y;
  vec3 p = ro + rd * t;
  if (abs(p.x) < KERB) return t;
  kind = 1.0;
  float t1 = (0.15 - ro.y) / rd.y;
  if (abs(ro.x + rd.x * t1) >= KERB) return t1;
  n = vec3(-sign(p.x), 0.0, 0.0); // the kerb's face
  return (sign(p.x) * KERB - ro.x) / rd.x;
}

// --- light ---

vec3 sky(vec3 r) {
  float y = max(r.y, 0.0);
  vec3 c = mix(vec3(0.09, 0.035, 0.07), vec3(0.003, 0.003, 0.01), pow(y, 0.35));
  c += vec3(0.5, 0.55, 0.9) * gFlash * (0.4 + 0.6 * y);
  // low cloud, lit orange from the city underneath
  vec2 uv = r.xz / (r.y + 0.08);
  c += vec3(0.05, 0.02, 0.03) * smoothstep(0.45, 0.9, vnoise(uv * 1.5 + vec2(0.0, gD * 0.002), 1e6)) * (1.0 - y);
  return c;
}

/** Light from the streetlights nearest p: the diffuse and the shine. */
void lampsAt(vec3 p, vec3 n, vec3 v, float shin, out vec3 dif, out vec3 spe) {
  dif = vec3(0.0);
  spe = vec3(0.0);
  float k0 = floor((p.z + gD) / P);
  for (int j = -1; j <= 2; j++) {
    float zc = (k0 + float(j) + 0.5) * P - gD;
    for (int s = 0; s < 2; s++) {
      vec3 L = vec3(s == 0 ? -LAMP_X : LAMP_X, LAMP_Y - 0.1, zc) - p;
      float d2 = dot(L, L);
      vec3 l = L * inversesqrt(d2);
      float fall = l.y * l.y * l.y * step(0.0, l.y) * 1.6 / (1.0 + d2); // they shine down, in pools
      dif += max(dot(n, l), 0.0) * fall;
      spe += pow(max(dot(n, normalize(l + v)), 0.0), shin) * fall * (shin + 8.0) / 25.0;
    }
  }
  dif *= LAMP;
  spe *= LAMP;
}

/**
 * The haze lit by each streetlight along a ray, to tmax: a faint wide part (the
 * integral of 1/distance² along the ray) and a tight bright core round the bulb,
 * if nothing's in front of it. soft widens both, for blurry reflections.
 */
vec3 glow(vec3 ro, vec3 rd, float tmax, float soft) {
  float acc = 0.0;
  float k0 = floor((ro.z + gD) / P);
  for (int j = -1; j < 14; j++) {
    float zc = (k0 + float(j) + 0.5) * P - gD;
    for (int s = 0; s < 2; s++) {
      vec3 oc = vec3(s == 0 ? -LAMP_X : LAMP_X, LAMP_Y - 0.12, zc) - ro;
      float tc = dot(oc, rd);
      float h2 = max(dot(oc, oc) - tc * tc, 0.0) + soft;
      float h = sqrt(h2);
      float haze = (atan((tmax - tc) / h) + atan(tc / h)) / h;
      float core = tc < tmax ? 0.04 / (h2 + 0.02 * soft) : 0.0;
      acc += (0.06 * haze + core) * exp(-0.05 * length(oc));
    }
  }
  return acc * LAMP * 0.0004;
}

/**
 * Each streetlight as the wet road mirrors it: a streak down the road toward the
 * eye, narrow across and long along, as rough wet surfaces do. r is the mirrored
 * ray from road point p, which meets something at tmax; rough 0 for a puddle (a
 * tight mirror) up to 1.
 */
vec3 streaks(vec3 p, vec3 r, float rough, float tmax) {
  float acc = 0.0;
  float k0 = floor((p.z + gD) / P);
  float sx = mix(0.006, 0.045, rough); // how wide, and how long, in radians
  float sy = mix(0.04, 0.6, rough);
  for (int j = -1; j < 10; j++) {
    float zc = (k0 + float(j) + 0.5) * P - gD;
    for (int s = 0; s < 2; s++) {
      vec3 L = vec3(s == 0 ? -LAMP_X : LAMP_X, LAMP_Y - 0.12, zc) - p;
      float d2 = dot(L, L);
      if (d2 > tmax * tmax + 1.0) continue; // something's in front of it
      vec3 l = L * inversesqrt(d2);
      vec3 side = normalize(cross(l, vec3(0.0, 1.0, 0.0)));
      vec3 off = r - l;
      float across = dot(off, side);
      float along = length(off - side * across);
      acc += exp(-across * across / (sx * sx) - along * along / (sy * sy)) / (sqrt(sx * sy) * (1.0 + 0.004 * d2));
    }
  }
  return acc * LAMP * 0.006;
}

/**
 * Rain landing in the puddles: rings spreading out, a drop to each half-metre
 * cell at its own moment. g is metres across and along the road. A ring every
 * RIP seconds, a whole number of them a lap, so the loop doesn't jump.
 */
vec2 ripples(vec2 g) {
  const float RIP = SONG / 70.0;
  vec2 n = vec2(0.0);
  vec2 cell = floor(g / 0.5);
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 id = cell + vec2(float(i), float(j));
      id.y = mod(id.y, LAP * P / 0.5);
      float h = hashv(id);
      float age = fract(gSecs / RIP + h);
      vec2 d = g - (cell + vec2(float(i), float(j)) + 0.5 + 0.6 * (vec2(h, fract(h * 17.0)) - 0.5)) * 0.5;
      float r = length(d) + 1e-4;
      float ring = r - age * 0.3;
      n += d / r * sin(ring * 90.0) * exp(-ring * ring * 1500.0) * (1.0 - age) * (1.0 - age);
    }
  }
  return n;
}

/** A small light's own glow (the tail light), if nothing's in front of it. */
vec3 pointGlow(vec3 ro, vec3 rd, vec3 c, float tmax, float size) {
  vec3 oc = c - ro;
  float tc = dot(oc, rd);
  if (tc < 0.0 || tc > tmax + 0.1) return vec3(0.0);
  float h2 = dot(oc, oc) - tc * tc;
  return vec3(size / (h2 + size * 0.2));
}

/** What a building's wall gives off: windows, a shopfront, sometimes a neon sign. */
vec3 facade(vec3 p, vec3 n) {
  vec2 bl = block(p);
  float id = bl.x;
  if (n.y > 0.5) return vec3(0.0); // a roof
  vec2 uv = abs(n.x) > 0.5 ? vec2(bl.y, p.y) : vec2(abs(p.x) * 1.3, p.y);
  vec2 ci = floor(uv / vec2(1.4, 3.0));
  vec2 f = fract(uv / vec2(1.4, 3.0)) - 0.5;
  vec3 e = vec3(0.0);
  if (ci.y >= 1.0) {
    float hw = hashv(vec2(id * 37.0 + ci.x, ci.y));
    float win = (1.0 - smoothstep(0.3, 0.34, abs(f.x))) * (1.0 - smoothstep(0.24, 0.28, abs(f.y)));
    if (hw > 0.6) e = win * mix(vec3(1.0, 0.62, 0.32), vec3(0.45, 0.6, 1.0), step(0.9, hw)) * (0.04 + 0.3 * fract(hw * 13.0));
  } else if (abs(n.x) > 0.5) {
    // the ground floor: a lit shop window, most of the way along
    float glass = step(0.6, p.y) * step(p.y, 2.5) * step(abs(bl.y), 4.6) * step(0.4, hashf(id + 9.0));
    glass *= 1.0 - smoothstep(0.42, 0.46, abs(fract(bl.y / 1.15) - 0.5)); // frames between the panes
    vec3 tint = mix(vec3(1.0, 0.8, 0.6), hashf(id + 3.0) > 0.5 ? PINK : CYAN, 0.5);
    e = glass * tint * (0.05 + 0.06 * hashf(id + 4.0)) * (0.6 + 0.4 * smoothstep(0.6, 2.5, p.y));
  }
  if (abs(n.x) > 0.5 && hashf(id + 77.0) > 0.45) {
    // a tall neon sign near one end, its tube a little brighter on the kick
    float at = (hashf(id + 78.0) > 0.5 ? 1.0 : -1.0) * 4.2;
    float tube = 1.0 - smoothstep(0.12, 0.2, abs(bl.y - at));
    tube *= step(4.0, p.y) * step(p.y, 4.0 + 3.0 + 6.0 * hashf(id + 79.0));
    e += tube * (hashf(id + 80.0) > 0.5 ? PINK : CYAN) * 2.0 * (1.0 + 0.5 * gKick) * (1.0 + 0.8 * gChorus);
  }
  return e;
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float m) {
  vec3 v = -rd;
  vec3 alb = vec3(0.03);
  float shin = 20.0;
  float ks = 0.2;
  vec3 emit = vec3(0.0);
  if (m < 1.5) {
    alb = vec3(0.012);
    shin = 8.0;
    ks = 0.05;
  } else if (m < 2.5) {
    alb = vec3(0.22, 0.012, 0.03); // deep red paint
    shin = 60.0;
    ks = 0.7;
    vec3 q = toBike(p);
    if (q.z > 0.68) emit = vec3(6.0, 5.6, 4.8); // headlight
    if (q.z < -0.8 && abs(q.y - 0.9) < 0.035) emit = vec3(5.0, 0.04, 0.05); // tail light
  } else if (m < 3.5) {
    alb = vec3(0.02);
    shin = 120.0;
    ks = 1.6;
  } else if (m < 4.5) {
    alb = vec3(0.008);
    shin = 24.0;
    ks = 0.3;
  } else if (m < 5.5) {
    alb = vec3(0.5, 0.5, 0.53);
    shin = 80.0;
    ks = 0.8;
    vec3 q = toBike(p) - vec3(0.0, 1.5, 0.12);
    if (q.z > 0.04 && abs(q.y + 0.01) < 0.05) alb = vec3(0.005); // the visor
    if (abs(q.x) < 0.025) alb = PINK * 0.4; // a stripe
  } else if (m < 6.5) {
    alb = vec3(0.014, 0.013, 0.016);
    emit = facade(p, n);
  } else if (m < 7.5) {
    alb = vec3(0.04);
    shin = 30.0;
    ks = 0.4;
  } else {
    emit = n.y < -0.5 ? LAMP * 0.06 : vec3(0.0);
  }
  vec3 dif, spe;
  lampsAt(p, n, v, shin, dif, spe);
  // the city's neon on the sides of things, pink from the left, cyan from the right
  vec3 amb = mix(PINK, CYAN, n.x * 0.5 + 0.5) * 0.03 * (0.6 + 0.4 * n.y) + vec3(0.004) + vec3(0.6, 0.65, 1.0) * gFlash * max(n.y, 0.2);
  vec3 c = alb * (dif + amb) + ks * spe * 0.2 + emit;
  float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  c += ks * fr * sky(reflect(rd, n)) * 0.6;
  // the bike and rider catch the neon round their edges, so they stand out of the dark
  if (m < 5.5) c += mix(PINK, CYAN, n.x * 0.5 + 0.5) * pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.12 * (0.7 + 0.3 * gKick);
  return c;
}

vec3 shadeGround(vec3 p, vec3 n, float kind, vec3 rd) {
  vec3 v = -rd;
  float wz = p.z + gD;
  vec2 g = vec2(p.x, wz);
  float big = vnoise(g / 3.0, LAP * P / 3.0) * 0.65 + vnoise(g, LAP * P) * 0.35;
  float puddle = kind < 0.5 ? smoothstep(0.5, 0.64, big) : 0.0;
  float grain = vnoise(g * 4.0, LAP * P * 4.0);
  vec3 alb = vec3(0.022 + 0.018 * grain);
  float paint = 0.0;
  if (kind < 0.5) {
    paint = (1.0 - smoothstep(0.07, 0.09, abs(p.x))) * step(0.5, fract(wz / 6.0)); // dashed, down the middle
    paint = max(paint, 1.0 - smoothstep(0.07, 0.09, abs(abs(p.x) - 4.2))); // the edges
    paint *= 0.4 + 0.6 * grain;
    alb = mix(alb, vec3(0.45), paint);
  } else {
    alb = vec3(0.05) * (0.8 + 0.4 * grain);
    alb *= 0.75 + 0.25 * smoothstep(0.0, 0.04, abs(fract(wz / 1.5) - 0.5)); // paving slabs
  }

  vec3 dif, spe;
  lampsAt(p, n, v, 30.0, dif, spe);
  // the headlight on the road ahead
  vec3 hl = fromBike(vec3(0.0, 0.95, 0.74));
  vec3 L = hl - p;
  float d2 = dot(L, L);
  vec3 l = L * inversesqrt(d2);
  float cone = smoothstep(0.9, 0.985, dot(-l, normalize(vec3(0.0, -0.12, 1.0))));
  dif += vec3(1.0, 0.95, 0.85) * 120.0 * cone * max(dot(n, l), 0.0) / (1.0 + d2);
  // the tail light's red on the road behind
  vec3 tl = fromBike(vec3(0.0, 0.88, -0.86));
  L = tl - p;
  d2 = dot(L, L);
  dif += vec3(1.0, 0.03, 0.05) * 1.2 * max(dot(n, L * inversesqrt(d2)), 0.0) / (0.05 + d2);
  // and a little shadow right under the bike
  dif *= mix(0.3, 1.0, smoothstep(0.1, 1.0, length((p.xz - gBike.xz) * vec2(2.6, 0.95))));
  vec3 c = alb * dif;

  // what the wet road mirrors: sharp in the puddles, smeared elsewhere
  vec2 e = vec2(0.15, 0.0);
  vec2 slope = vec2(vnoise(g * 6.0 + e, 1e6) - vnoise(g * 6.0 - e, 1e6), vnoise(g * 6.0 + e.yx, 1e6) - vnoise(g * 6.0 - e.yx, 1e6));
  vec2 rip = puddle > 0.01 ? ripples(g) * puddle : vec2(0.0);
  vec3 rn = normalize(n + vec3(slope.x, 0.0, slope.y) * 0.06 * (1.0 - puddle) + vec3(rip.x, 0.0, rip.y) * 0.25);
  vec3 r = reflect(rd, rn);
  vec3 ro = p + n * 0.01;
  vec2 h = march(ro, r, 90.0, 48);
  vec3 rc;
  if (h.y > 0.0) {
    vec3 q = ro + r * h.x;
    rc = shade(q, normalAt(q), r, h.y);
  } else rc = sky(r);
  rc = mix(rc, FOG, 1.0 - exp(-h.x * 0.02));
  rc += glow(ro, r, h.x, 0.5) * 0.3 + streaks(p, r, 1.0 - puddle, h.x);
  rc += vec3(1.0, 0.05, 0.08) * pointGlow(ro, r, tl, h.x, mix(0.02, 0.002, puddle));
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(rn, v), 0.0), 5.0);
  float wet = (kind < 0.5 ? mix(0.5, 1.0, puddle) : 0.3) * (1.0 - 0.6 * paint);
  return c + rc * fr * wet;
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

/**
 * Where the camera is, cut on the bar lines: down from above in the intro, then
 * behind, beside the wheel and in front through the verse; low and fast, from
 * overhead and round the side in the chorus; and in the outro it stops and the
 * bike rides off. vel is how fast the camera goes through the city (for the rain).
 */
void shot(float b, out vec3 ro, out vec3 ta, out vec3 up, out float zoom, out float vel) {
  vec3 k = gBike;
  float bar = floor(b / 4.0);
  up = vec3(0.0, 1.0, 0.0);
  zoom = 1.7;
  vel = speed(b);
  if (bar < 4.0) {
    // the intro: high over the street, coming down behind the rider
    float s = smoothstep(0.0, 1.0, b / 16.0);
    ro = vec3(0.8, mix(18.0, 2.2, s), mix(-26.0, -6.0, s));
    ta = vec3(k.x * 0.6, 0.8, mix(18.0, 4.0, s));
    zoom = 1.6;
  } else if (bar < 8.0) {
    // behind, the drums come in
    ro = vec3(0.7 + k.x * 0.6, 1.3 + 0.006 * gKick, -3.8);
    ta = vec3(0.2 + k.x * 0.85, 0.85, 2.5);
  } else if (bar < 10.0) {
    // low beside it on the left, the wheel close and the street rushing behind
    float s = (b - 32.0) / 8.0;
    ro = k + vec3(-1.7, 0.4, mix(1.4, -0.5, s));
    ta = k + vec3(0.0, 0.65, 0.3);
    zoom = 1.35;
  } else if (bar < 12.0) {
    // in front, looking back into the headlight
    float s = (b - 40.0) / 8.0;
    ro = k + vec3(0.5 - 1.0 * s, 1.05, 4.6 - 1.2 * s);
    ta = k + vec3(0.0, 0.85, 0.0);
    zoom = 1.9;
  } else if (bar < 16.0) {
    // the chorus: low and close behind, wide, shaken by the kick
    ro = k + vec3(0.4, 0.55 + 0.02 * gKick, -2.3);
    ta = k + vec3(-0.1, 0.75, 4.0);
    zoom = 1.2;
  } else if (bar < 18.0) {
    // straight down from above, rising
    float s = (b - 64.0) / 8.0;
    ro = k + vec3(0.0, 4.0 + 2.0 * s, -0.3);
    ta = k + vec3(0.0, 0.0, 0.2);
    up = vec3(0.0, 0.0, 1.0);
    zoom = 2.2;
  } else if (bar < 20.0) {
    // round the right-hand side to the front
    float a = mix(-0.9, 1.1, (b - 72.0) / 8.0);
    ro = k + vec3(2.3 * cos(a), 0.9, 2.3 * sin(a));
    ta = k + vec3(0.0, 0.75, 0.2);
    zoom = 1.6;
  } else {
    // the outro: the camera stops in the street, and the bike rides off into the night
    float z = -4.0 - (gD - travel(80.0));
    ro = vec3(0.4, 1.5, z);
    ta = vec3(1.0, 1.1, z + 30.0);
    vel = 0.0;
  }
}

/**
 * Rain: drops on four sheets in front of the camera, each sheet sweeping toward
 * it (or away) as the camera moves and starting over. Each drop is drawn as the
 * short streak it makes across the screen in a fiftieth of a second. s is the
 * point on screen, zoom the lens, V the rain's speed past the camera in the
 * camera's own axes. Returns how much rain covers this pixel, and how lit it is
 * by the streetlights in light.
 */
float rain(vec2 s, float zoom, vec3 V, vec3 ro, vec3 cu, vec3 cv, vec3 cw, out vec3 light) {
  float acc = 0.0;
  light = vec3(0.0);
  float px = 2.0 / iResolution.y;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float span = 3.0 + 3.0 * fk;
    float near = 1.2 + 1.5 * fk;
    float c = gSecs * -V.z / span + hashf(fk * 7.0 + 3.0);
    float cyc = floor(c);
    float qz = near + span * (1.0 - fract(c));
    float fade = smoothstep(0.0, 0.25, fract(c)) * smoothstep(1.0, 0.8, fract(c));
    float cellm = 0.28 + 0.1 * fk;
    vec2 u = s * qz / zoom - V.xy * gSecs; // where the pixel looks, in the drops' own frame
    vec2 gi = floor(u / cellm);
    float a = 0.0;
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 id = gi + vec2(float(i), float(j));
        float h = hashv(id + vec2(cyc * 131.0 + fk * 17.0, cyc * 7.0 + fk * 3.0));
        if (h > 0.24) continue;
        vec2 Q = (id + vec2(fract(h * 23.0), fract(h * 71.0))) * cellm + V.xy * gSecs;
        vec2 sd = zoom * Q / qz;
        vec2 vel = zoom * (V.xy * qz - Q * V.z) / (qz * qz);
        vec2 tail = vel * 0.02;
        vec2 pa = s - sd;
        float t = clamp(dot(pa, -tail) / max(dot(tail, tail), 1e-9), 0.0, 1.0);
        float d = length(pa + tail * t);
        float w = px * 0.8;
        a += smoothstep(w * 1.5, 0.0, d) * px * 4.0 / (px * 4.0 + length(tail)) * fract(h * 41.0);
      }
    }
    a *= fade * (0.5 + 0.5 * fract(cyc * 0.618 + fk * 0.3));
    // lit by the nearest streetlight either side of where this sheet is
    vec3 W = ro + (cu * s.x + cv * s.y + cw * zoom) * (qz / zoom);
    float zc = (floor((W.z + gD) / P) + 0.5) * P - gD;
    float lit = 0.0;
    for (int sd2 = 0; sd2 < 2; sd2++) {
      vec3 L = vec3(sd2 == 0 ? -LAMP_X : LAMP_X, LAMP_Y, zc) - W;
      lit += 1.0 / (1.0 + dot(L, L) * 0.08);
    }
    light += a * (LAMP * 0.007 * lit + vec3(0.035, 0.04, 0.07));
    acc += a;
  }
  return acc;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float b = songBeat(iTime);
  gSecs = b * BEAT;
  gD = travel(b);
  gKick = exp(-sinceKick(b) * 4.0);
  gChorus = smoothstep(47.0, 48.0, b) * (1.0 - smoothstep(79.0, 81.0, b));
  // lightning when the chorus lands: a flash, a flicker after it
  float fl = b - 48.0;
  gFlash = fl > 0.0 && fl < 3.0 ? exp(-fl * 5.0) + 0.6 * exp(-abs(fl - 0.35) * 25.0) : 0.0;
  float w = b * PI / 8.0; // a slow weave across the lane, four bars each way
  gBike = vec3(1.7 + 0.5 * sin(w), 0.0, 0.0);
  gLean = 0.12 * sin(w);

  vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  vec3 ro, ta, up;
  float zoom, vel;
  shot(b, ro, ta, up, zoom, vel);
  vec3 cw = normalize(ta - ro);
  vec3 cu = normalize(cross(up, cw));
  vec3 cv = cross(cw, cu);
  vec3 rd = normalize(uv.x * cu + uv.y * cv + zoom * cw);

  vec3 gn;
  float kind;
  float tg = ground(ro, rd, gn, kind);
  float tmax = min(tg, 160.0);
  vec2 h = march(ro, rd, tmax, 110);
  vec3 col;
  float t = h.x;
  if (h.y > 0.0) {
    vec3 p = ro + rd * t;
    col = shade(p, normalAt(p), rd, h.y);
  } else if (tg < 160.0) {
    col = shadeGround(ro + rd * tg, gn, kind, rd);
  } else {
    col = sky(rd);
  }
  col = mix(col, FOG + vec3(0.1, 0.11, 0.18) * gFlash, 1.0 - exp(-t * 0.02));
  col += glow(ro, rd, t, 0.015);
  col += vec3(1.0, 0.05, 0.08) * pointGlow(ro, rd, fromBike(vec3(0.0, 0.9, -0.86)), t, 0.0002);
  // the headlight, blinding when it points at the camera
  vec3 hl = fromBike(vec3(0.0, 0.95, 0.76));
  float facing = smoothstep(0.3, 0.95, dot(normalize(ro - hl), vec3(0.0, 0.0, 1.0)));
  col += vec3(1.0, 0.95, 0.85) * pointGlow(ro, rd, hl, t + 0.3, 0.004) * facing * 1.5;

  // the rain, falling past at 7 m/s, and the camera's own speed through it
  vec3 V = vec3(0.6, -7.0, -vel);
  vec3 rl;
  rain(uv, zoom, vec3(dot(V, cu), dot(V, cv), dot(V, cw)), ro, cu, cv, cw, rl);
  col += rl;

  col = aces(col * 1.2);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 q = fragCoord / iResolution.xy;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.2);
  col += (hashv(fragCoord + vec2(iFrame % 64, 0)) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}
