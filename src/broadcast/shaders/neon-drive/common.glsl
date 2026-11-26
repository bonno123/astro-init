// Neon Drive: the song's clock. Original for this site.
// Both the sound (sound.glsl) and the picture (image.glsl) read their timing
// from here, so the grid lands on the kick and the horizon flashes on the snare.
//
// 110 bpm, 24 bars of 4 beats, then it loops:
//   bars  0-3   intro    pad, then the arpeggio; a snare fill into
//   bars  4-11  verse    drums, bass
//   bars 12-19  chorus   the tune, four-on-the-floor kick, faster grid
//   bars 20-23  outro    drums out, back down to the pad

const float PI = 3.14159265;
const float TAU = 6.28318531;

const float BPM = 110.0;
const float BEAT = 60.0 / BPM;
const float BARS = 24.0;
const float SONG = BARS * 4.0 * BEAT; // about 52.4 s

/** Where in the song this time is, in beats, 0 up to 96. */
float songBeat(float t) { return mod(t, SONG) / BEAT; }

bool drumsIn(float bar) { return bar >= 4.0 && bar < 20.0; }
bool chorusIn(float bar) { return bar >= 12.0 && bar < 20.0; }

/** Beats since the last kick: beats 1 and 3 of each bar in the verse, every beat in the chorus. 99 when there's none. */
float sinceKick(float b) {
  float every = chorusIn(floor(b / 4.0)) ? 1.0 : 2.0;
  float hit = floor(b / every) * every;
  return drumsIn(floor(hit / 4.0)) ? b - hit : 99.0;
}

/** Beats since the last snare, on beats 2 and 4. 99 when there's none. */
float sinceSnare(float b) {
  float hit = floor((b - 1.0) / 2.0) * 2.0 + 1.0;
  return hit >= 0.0 && drumsIn(floor(hit / 4.0)) ? b - hit : 99.0;
}
