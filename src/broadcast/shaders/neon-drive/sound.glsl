// Neon Drive: the song. Original for this site: synthwave in A minor at 110 bpm,
// one chord a bar (Am F C G), 24 bars that loop (see common.glsl for the plan).
//
// Every part is a function of time and nothing else. The tones are sums of sine
// harmonics, so nothing aliases, and fewer or softer harmonics stand in for a
// filter. The echoes are the same part again, a dotted eighth later.

int SAMP; // this sample's number, for the noise

float mtof(float n) { return 440.0 * exp2((n - 69.0) / 12.0); }

// White noise, -1..1, a new value every sample.
float white(int s) {
  uint h = uint(s) * 747796405u + 2891336453u;
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
  h = (h >> 22u) ^ h;
  return float(h) * (2.0 / 4294967295.0) - 1.0;
}

// A saw from its first n harmonics; a bigger 'soft' rolls the top off, as a low-pass would.
float saw(float ph, float n, float soft) {
  float s = 0.0;
  for (float k = 1.0; k <= 12.0; k += 1.0) {
    if (k > n) break;
    s += sin(TAU * fract(ph * k)) * exp(-soft * k) / k;
  }
  return s;
}

// The same with odd harmonics only: a square, hollower and woodier.
float square(float ph, float n, float soft) {
  float s = 0.0;
  for (float k = 1.0; k <= 11.0; k += 2.0) {
    if (k > n) break;
    s += sin(TAU * fract(ph * k)) * exp(-soft * k) / k;
  }
  return s;
}

// One chord a bar, voiced close together.
vec3 chordAt(float bar) {
  float i = mod(bar, 4.0);
  if (i < 1.0) return vec3(57.0, 60.0, 64.0); // Am: A C E
  if (i < 2.0) return vec3(57.0, 60.0, 65.0); // F:  A C F
  if (i < 3.0) return vec3(55.0, 60.0, 64.0); // C:  G C E
  return vec3(55.0, 59.0, 62.0);              // G:  G B D
}

float rootAt(float bar) {
  float i = mod(bar, 4.0);
  return i < 1.0 ? 33.0 : i < 2.0 ? 29.0 : i < 3.0 ? 36.0 : 31.0; // A1 F1 C2 G1
}

// Pad: the chord on three detuned saws a note, spread left to right, held through
// the bar while the last bar's chord lets go underneath.
vec2 pad(float b) {
  float bar = floor(b / 4.0);
  float tb = (b - bar * 4.0) * BEAT;
  float soft = chorusIn(bar) ? 0.22 : 0.42;
  vec2 o = vec2(0.0);
  for (int c = 0; c < 2; c++) {
    float t = tb + float(c) * 4.0 * BEAT; // seconds since that chord began
    float env = c == 0 ? smoothstep(0.0, 0.3, t) : exp(-tb * 6.0);
    vec3 ch = chordAt(bar - float(c));
    for (int i = 0; i < 3; i++) {
      float f = mtof(ch[i]);
      for (int d = -1; d <= 1; d++) {
        float dd = float(d);
        float s = saw(f * (1.0 + dd * 0.0045) * t + float(i) * 0.31 + dd * 0.17, 8.0, soft);
        o += s * env * vec2(0.5 - dd * 0.4, 0.5 + dd * 0.4);
      }
    }
  }
  // quieter at the loop's seam, so the outro sinks into the intro
  float level = mix(0.55, 1.0, smoothstep(0.0, 8.0, b)) * mix(1.0, 0.55, smoothstep(80.0, 96.0, b));
  return o * level / 9.0;
}

// Bass: eighth notes, root then octave, each a pluck that closes as it goes.
float bass(float b) {
  float bar = floor(b / 4.0);
  if (!drumsIn(bar)) return 0.0;
  float e = floor(b * 2.0);
  float x = b * 2.0 - e; // 0..1 through the eighth
  float t = x * 0.5 * BEAT;
  float f = mtof(rootAt(bar) + (mod(e, 2.0) > 0.5 ? 12.0 : 0.0));
  float env = smoothstep(0.0, 0.004, t) * (1.0 - smoothstep(0.82, 0.96, x)) * (0.55 + 0.45 * exp(-t * 10.0));
  float soft = 0.12 + 0.55 * (1.0 - exp(-t * 16.0));
  return (saw(f * t, 12.0, soft) + 0.6 * sin(TAU * fract(f * t))) * env;
}

// Arpeggio: sixteenths up the chord an octave above the pad, opening up through the verse.
float arp(float b) {
  b = mod(b, 96.0);
  float bar = floor(b / 4.0);
  if (bar < 2.0 || bar >= 22.0) return 0.0;
  float s16 = floor(b * 4.0);
  float x = b * 4.0 - s16;
  float t = x * 0.25 * BEAT;
  vec3 ch = chordAt(bar) + 12.0;
  float k = mod(s16, 4.0);
  float f = mtof(k < 1.0 ? ch.x : k < 2.0 ? ch.y : k < 3.0 ? ch.z : ch.x + 12.0);
  float env = smoothstep(0.0, 0.003, t) * exp(-t * 18.0) * (1.0 - smoothstep(0.85, 1.0, x));
  env *= mod(s16, 2.0) < 1.0 ? 1.0 : 0.7;
  float soft = chorusIn(bar) ? 0.2 : mix(0.9, 0.35, smoothstep(8.0, 48.0, b));
  float level = smoothstep(8.0, 16.0, b) * (1.0 - smoothstep(80.0, 88.0, b));
  return square(f * t, 9.0, soft) * env * level;
}

// The tune, over the chorus's 8 bars (32 beats): start beat, length in beats, note.
const vec3 TUNE[29] = vec3[29](
  vec3( 0.0, 1.5, 76.0), vec3( 1.5, 0.5, 74.0), vec3( 2.0, 1.0, 72.0), vec3( 3.0, 1.0, 69.0), // Am
  vec3( 4.0, 1.5, 72.0), vec3( 5.5, 0.5, 69.0), vec3( 6.0, 1.0, 72.0), vec3( 7.0, 1.0, 74.0), // F
  vec3( 8.0, 1.5, 76.0), vec3( 9.5, 0.5, 79.0), vec3(10.0, 1.0, 76.0), vec3(11.0, 1.0, 74.0), // C
  vec3(12.0, 2.0, 74.0), vec3(14.0, 1.0, 71.0), vec3(15.0, 1.0, 67.0),                         // G
  vec3(16.0, 1.5, 76.0), vec3(17.5, 0.5, 74.0), vec3(18.0, 1.0, 72.0), vec3(19.0, 1.0, 69.0), // Am
  vec3(20.0, 1.5, 72.0), vec3(21.5, 0.5, 69.0), vec3(22.0, 1.0, 72.0), vec3(23.0, 1.0, 74.0), // F
  vec3(24.0, 1.5, 76.0), vec3(25.5, 0.5, 79.0), vec3(26.0, 1.0, 76.0), vec3(27.0, 1.0, 74.0), // C
  vec3(28.0, 1.0, 74.0), vec3(29.0, 3.0, 76.0)                                                 // G, and up
);

// Lead: two saws a hair apart, with vibrato that comes in on the long notes.
float lead(float b) {
  b = mod(b, 96.0);
  float lb = b - 48.0;
  if (lb < 0.0 || lb >= 32.0) return 0.0;
  vec3 nt = TUNE[0];
  for (int i = 1; i < 29; i++) {
    if (TUNE[i].x <= lb) nt = TUNE[i];
  }
  float t = (lb - nt.x) * BEAT;
  float len = nt.y * BEAT;
  float env = smoothstep(0.0, 0.012, t) * (0.75 + 0.25 * exp(-t * 5.0)) * (1.0 - smoothstep(len - 0.05, len - 0.005, t));
  float f = mtof(nt.z);
  float vib = 0.005 * smoothstep(0.15, 0.45, t);
  float ph = f * t + vib * f * sin(TAU * 5.5 * t) / (TAU * 5.5);
  return (saw(ph, 10.0, 0.2) + saw(ph * 1.004 + 0.27, 10.0, 0.2)) * 0.5 * env;
}

// Kick: a sine whose pitch falls fast, from about 160 Hz to 48, with a click on top.
float kick(float b) {
  float sb = sinceKick(b);
  if (sb > 3.0) return 0.0;
  float t = sb * BEAT;
  float ph = 48.0 * t + (110.0 / 30.0) * (1.0 - exp(-t * 30.0));
  float click = 0.25 * white(SAMP) * exp(-t * 250.0);
  return (sin(TAU * fract(ph)) + click) * exp(-t * 9.0) * smoothstep(0.0, 0.0015, t);
}

// Snare: a short tone and a burst of noise with a gated tail, the eighties way.
// The last beat of bars 3 and 11 is a fill instead: sixteenths, getting louder.
vec2 snare(float b) {
  float bar = floor(b / 4.0);
  float inBar = b - bar * 4.0;
  float sb = sinceSnare(b);
  float gain = 1.0;
  if ((bar == 3.0 || bar == 11.0) && inBar >= 3.0) {
    float x = (inBar - 3.0) * 4.0;
    sb = fract(x) * 0.25;
    gain = 0.35 + 0.65 * floor(x) / 3.0;
  }
  if (sb > 3.0) return vec2(0.0);
  float t = sb * BEAT;
  float body = sin(TAU * fract(185.0 * t)) * exp(-t * 25.0);
  float tail = exp(-t * 22.0) + 0.4 * exp(-t * 5.0) * (1.0 - smoothstep(0.2, 0.26, t));
  // two samples averaged: a little darker than white noise. Left and right differ, so it's wide.
  vec2 n = 0.5 * vec2(white(SAMP) + white(SAMP - 1), white(SAMP + 7919) + white(SAMP + 7918));
  return (vec2(body * 0.7) + n * tail) * gain * smoothstep(0.0, 0.001, t);
}

// Hats: the difference of two noise samples, which leaves only the highs.
// Offbeat eighths in the verse, sixteenths in the chorus.
vec2 hats(float b) {
  float bar = floor(b / 4.0);
  if (!drumsIn(bar)) return vec2(0.0);
  bool chorus = chorusIn(bar);
  float every = chorus ? 0.25 : 0.5;
  float h = floor(b / every);
  float t = (b - h * every) * BEAT;
  float accent = chorus ? (mod(h, 4.0) == 2.0 ? 1.0 : 0.45) : (mod(h, 2.0) == 1.0 ? 1.0 : 0.4);
  float l = white(SAMP) - white(SAMP - 1);
  float r = white(SAMP + 31337) - white(SAMP + 31336);
  return vec2(0.8 * l + 0.2 * r, 0.2 * l + 0.8 * r) * exp(-t * 50.0) * accent * smoothstep(0.0, 0.001, t);
}

// A rush of noise up into the verse and the chorus, and a crash when each lands.
vec2 swells(float b) {
  vec2 n = vec2(white(SAMP + 104729) - white(SAMP + 104728), white(SAMP + 1299709) - white(SAMP + 1299708));
  float since = b < 16.0 ? 99.0 : b < 48.0 ? b - 16.0 : b - 48.0;
  float t = since * BEAT;
  float crash = since < 16.0 ? exp(-t * 1.6) * smoothstep(0.0, 0.002, t) : 0.0;
  float rise = (b >= 12.0 && b < 16.0) || (b >= 44.0 && b < 48.0) ? pow(fract(b / 4.0), 3.0) : 0.0;
  return n * (crash * 0.5 + rise * 0.25);
}

vec2 mainSound(int samp, float time) {
  SAMP = samp;
  float b = songBeat(time);
  // everything but the drums ducks under the kick: the genre's pump
  float duck = 1.0 - 0.5 * exp(-sinceKick(b) * BEAT * 9.0);

  vec2 o = vec2(0.0);
  o += kick(b) * 0.7;
  o += snare(b) * 0.3;
  o += hats(b) * 0.22;
  o += swells(b) * 0.3;
  o += bass(b) * 0.26 * duck;
  o += pad(b) * 0.55 * duck;
  // the arpeggio and the tune, each echoed twice a dotted eighth apart, left then right
  const float D = 0.75;
  o += (vec2(arp(b)) + arp(b - D) * vec2(0.45, 0.15) + arp(b - 2.0 * D) * vec2(0.08, 0.25)) * 0.16 * duck;
  o += (vec2(lead(b)) + lead(b - D) * vec2(0.35, 0.1) + lead(b - 2.0 * D) * vec2(0.06, 0.2)) * 0.2;
  return tanh(o * 1.1); // a soft limit, so the loudest moments round off instead of clipping
}
