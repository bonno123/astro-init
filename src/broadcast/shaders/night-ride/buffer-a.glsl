// Night Ride, Buffer A: the camera you can drag (iChannel0 is this buffer).
//
// Drag on the picture and the camera swings round the bike, from where the
// director had it, while the ride and the song carry on. Let go with a flick and
// it keeps turning a little, slowing. Left alone for HOLD seconds, or at a double
// tap, the director takes it back over BACK seconds, into whichever cut is on by
// then. A tap alone does nothing: the camera is taken once a drag goes past MOVE.
//
// On a still picture (motion off) time doesn't move, and the runner redraws it
// only while it's dragged and for a moment after: it turns round that moment,
// stays where it's let go, with no flick, and goes back only at a double tap.
//
// The buffer is four pixels in a row (sizes in index.ts), a slot each, and
// iResolution here is still the picture's (cameraSlot in common.glsl reads one):
//   0: how much it's yours (0 the director's, 1 yours), yaw, pitch, distance
//   1: yaw and pitch speed (radians a second), seconds since let go, 1 while held
//   2: yaw and pitch when this drag began, 1 once this press has moved, 0
//   3: iTime's fraction of a second last frame (a 16-bit buffer can't hold iTime
//      itself), 1 if the last press was a tap, 1 while a double tap is held,
//      seconds since the last press ended
// How much it's yours comes first: a device that can't render this buffer reads
// black there, and the camera stays the director's.
//
// A drag is measured from where it began (iMouse.zw), not frame by frame, so on a
// device with 16-bit buffers the rounding can't add up into a drift.

const float HOLD = 4.0; // seconds left alone before the director takes the camera back
const float BACK = 1.6; // how long the handback takes
const float GRAB = 0.35; // how long taking it takes
const float MOVE = 0.012; // how far a press goes, in frame units (frameUnit), before it's a drag (about 8 px on a phone)
const float TWICE = 0.3; // seconds between the taps of a double tap
const vec2 TURN = vec2(2.8, 1.8); // radians for a drag the picture's height, across and up

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  int slot = int(fragCoord.x);
  vec4 s0 = vec4(0.0);
  vec4 s1 = vec4(0.0);
  vec4 s2 = vec4(0.0);
  vec4 s3 = vec4(0.0, 0.0, 0.0, 60.0);
  if (iFrame > 0) {
    s0 = cameraSlot(iChannel0, 0);
    s1 = cameraSlot(iChannel0, 1);
    s2 = cameraSlot(iChannel0, 2);
    s3 = cameraSlot(iChannel0, 3);
  }
  float dt = clamp(iTimeDelta, 0.0, 0.1);
  // a still picture, redrawn for a drag: no time has gone (a frame at 60 a second moves this by 0.017)
  float sec = fract(iTime);
  float moved = abs(sec - s3.x);
  bool frozen = iFrame > 0 && min(moved, 1.0 - moved) < 0.002;

  if (iMouse.z > 0.0) {
    if (s1.w < 0.5) {
      // just pressed: soon after a tap, it's a double tap
      s3.z = s3.y > 0.5 && s3.w < TWICE ? 1.0 : 0.0;
      s2.z = 0.0;
      s1.xy = vec2(0.0);
    }
    vec2 drag = (iMouse.xy - abs(iMouse.zw)) / frameUnit();
    if (s2.z < 0.5 && length(drag) > MOVE && s3.z < 0.5) {
      // it's a drag: if the director has the camera, start from where it is
      if (s0.x < 0.01) {
        float b = songBeat(iTime);
        ride(b);
        vec3 ro, ta, up;
        float zoom, vel;
        shot(b, ro, ta, up, zoom, vel);
        vec3 o = toOrbit(ro - pivot());
        s0.yzw = vec3(o.x, clamp(o.y, PITCH_MIN, PITCH_MAX), clamp(o.z, DIST_MIN, DIST_MAX));
      }
      s2.xy = s0.yz;
      s2.z = 1.0;
    }
    if (s2.z > 0.5) {
      // drag right and the bike turns to the right; drag down to look down on it
      vec2 turn = drag * TURN;
      vec2 was = s0.yz;
      s0.y = wrapAngle(s2.x + turn.x);
      s0.z = clamp(s2.y - turn.y, PITCH_MIN, PITCH_MAX);
      if (dt > 0.0) s1.xy = mix(s1.xy, vec2(wrapAngle(s0.y - was.x), s0.z - was.y) / dt, 0.4);
      s0.x = min(1.0, s0.x + dt / GRAB);
    }
    s1.zw = vec2(0.0, 1.0);
  } else {
    if (s1.w > 0.5) {
      // just let go: a flick carries on, unless the hand stopped first or the picture is still
      if (length(s1.xy) < 0.4 || frozen) s1.xy = vec2(0.0);
      s3.y = s2.z < 0.5 && s3.z < 0.5 ? 1.0 : 0.0; // a tap, which a second one can make a double tap
      if (s3.z > 0.5) s1.z = HOLD; // the double tap: hand it back now
      s3.zw = vec2(0.0);
      s1.w = 0.0;
    }
    s0.y = wrapAngle(s0.y + s1.x * dt);
    s0.z = clamp(s0.z + s1.y * dt, PITCH_MIN, PITCH_MAX);
    s1.xy *= exp(-3.0 * dt);
    if (!frozen) s1.z = min(s1.z + dt, 60.0); // a still picture stays where it's left
    if (s1.z >= HOLD) s0.x = max(0.0, s0.x - dt / BACK);
    s3.w = min(s3.w + dt, 60.0);
  }
  s3.x = sec;

  fragColor = slot == 0 ? s0 : slot == 1 ? s1 : slot == 2 ? s2 : s3;
}
