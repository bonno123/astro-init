// Night Ride: what both passes need. The ride (where the bike is on each beat),
// the director's cuts (shot), and the camera you can drag round the bike, whose
// state Buffer A keeps. Neon Drive's common.glsl, the song's clock, comes in
// front of this file.
//
// Metres. x across the street (right is +), y up, z forward. The bike stays near
// z = 0 and the city slides past it.

const float P = 12.0; // metres between streetlights, and the width of a building
const float LAP = 129.0; // streetlights passed in one lap of the song (see travel)

float gD; // how far the bike has gone this lap
vec3 gBike; // where it is
float gLean; // and how far it leans, radians
float gKick;

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

/** Where everything is at beat b: sets gD, gKick, gBike and gLean. */
void ride(float b) {
  gD = travel(b);
  gKick = exp(-sinceKick(b) * 4.0);
  float w = b * PI / 8.0; // a slow weave across the lane, four bars each way
  gBike = vec3(1.7 + 0.5 * sin(w), 0.0, 0.0);
  gLean = 0.12 * sin(w);
}

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

// --- the camera you can drag ---
//
// It sits on a sphere round the bike: yaw round it (0 is in front, PI behind),
// pitch up from level, and a distance. Its limits keep it out of the road and
// short of the buildings (their fronts are 8 m out from the middle of the street).

const float PITCH_MIN = -0.06;
const float PITCH_MAX = 1.25; // about 72 degrees: looking well down, not straight down
const float DIST_MIN = 2.6;
const float DIST_MAX = 5.2;
const float ORBIT_ZOOM = 1.5;

/** What the camera you drag looks at and swings round: the middle of the bike and rider. */
vec3 pivot() { return gBike + vec3(0.0, 0.8, 0.0); }

/** An offset from the pivot as yaw, pitch and distance. */
vec3 toOrbit(vec3 d) {
  float len = max(length(d), 1e-4);
  return vec3(atan(d.x, d.z), asin(clamp(d.y / len, -1.0, 1.0)), len);
}

/** Where yaw, pitch and distance put the camera. */
vec3 fromOrbit(vec3 s) { return pivot() + s.z * vec3(cos(s.y) * sin(s.x), sin(s.y), cos(s.y) * cos(s.x)); }

/** An angle brought into -PI..PI. */
float wrapAngle(float a) { return a - TAU * floor((a + PI) / TAU); }

/** One of Buffer A's four slots of camera state (see buffer-a.glsl): a pixel each, in a row. */
vec4 cameraSlot(sampler2D state, int i) { return texelFetch(state, ivec2(i, 0), 0); }
