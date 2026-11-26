// kind: video. A full-screen video, muted so browsers let it start on its own,
// with a button for sound. It closes when the video ends (unless it loops; a
// pinned one always loops) and quietly if the file won't load. With motion off or Data Saver on it
// waits on the poster for a tap instead of playing.

import type { Renderer, VideoPayload } from "./types";

const ICON = {
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  muted: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="s" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="s" d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>`,
};

const video: Renderer = (stage, p: VideoPayload, ctx) => {
  const wrap = document.createElement("div");
  wrap.className = "bc-video";

  const v = document.createElement("video");
  // muted and playsinline before src: iOS decides on autoplay from these
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.loop = p.loop === true || ctx.pinned;
  v.disablePictureInPicture = true;
  v.style.objectFit = p.fit === "contain" ? "contain" : "cover";
  if (p.poster) v.poster = p.poster;

  const heading = document.createElement("h2");
  heading.id = ctx.labelId;
  heading.className = p.caption ? "bc-caption" : "bc-sr";
  heading.textContent = p.caption || "Video";

  const sound = document.createElement("button");
  sound.type = "button";
  sound.className = "bc-btn bc-sound";
  const syncSound = () => {
    sound.innerHTML = `${v.muted ? ICON.muted : ICON.sound}<span>${v.muted ? "sound on" : "sound off"}</span>`;
    sound.setAttribute("aria-pressed", String(!v.muted));
  };
  syncSound();
  sound.addEventListener("click", () => {
    v.muted = !v.muted;
    syncSound();
  });

  const play = document.createElement("button");
  play.type = "button";
  play.className = "bc-play";
  play.setAttribute("aria-label", "Play");
  play.innerHTML = ICON.play;
  play.hidden = true;
  const showPlay = () => {
    play.hidden = false;
    sound.hidden = true;
  };
  play.addEventListener("click", () => {
    play.hidden = true;
    sound.hidden = false;
    v.play().catch(() => showPlay());
  });

  v.addEventListener("ended", () => ctx.close());
  // A broken link or an unsupported file: go away rather than show a black screen.
  v.addEventListener("error", () => ctx.close());

  wrap.append(v, heading, play, sound);
  stage.append(wrap);

  const saveData = (navigator as any).connection?.saveData === true;
  if (ctx.still || saveData) {
    v.preload = "metadata"; // first frame or the poster, not the whole file
    v.src = p.src;
    showPlay();
  } else {
    v.preload = "auto";
    v.src = p.src;
    // Autoplay can still be refused (Low Power Mode on iOS): fall back to a tap.
    v.play().catch(() => showPlay());
  }

  return () => {
    v.pause();
    v.removeAttribute("src");
    v.load(); // stops the download
  };
};

export default video;
