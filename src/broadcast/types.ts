/** What GET /api/broadcast returns for the one live now. */
export type Broadcast = {
  id: string;
  kind: string;
  payload: unknown;
  frequency: "once" | "session" | "always";
  /** 0 means it stays until closed. */
  dismissAfterMs: number;
  /** No close button, no Esc, no timer. It goes when it's turned off or ends. */
  pinned: boolean;
  /** Changes on every save, so an open page knows to redraw it. */
  version: string;
};

/** What showBroadcast hands back once the overlay is on screen. */
export type Shown = {
  /** Takes it down, pinned or not. */
  close: () => void;
  /** Resolves when it's gone, however it went. */
  closed: Promise<void>;
};

export type GreetingPayload = {
  title: string;
  subtitle?: string | null;
  effect?: "confetti" | "none";
  colors?: string[];
};

export type RenderContext = {
  /** No motion: reduced-motion is set, or the site's quiet mode is on. */
  still: boolean;
  /** Close the overlay (same as the close button). Works when pinned too. */
  close: () => void;
  /** The visitor can't close it, so don't let it end on its own either. */
  pinned: boolean;
  /** Put this id on the renderer's heading; the dialog is labelled by it. */
  labelId: string;
};

/**
 * Draws one kind of broadcast into the full-screen stage.
 * Returns a cleanup that stops anything it started.
 */
export type Renderer = (stage: HTMLElement, payload: any, ctx: RenderContext) => void | (() => void);

export type VideoPayload = {
  /** https link to an .mp4 or .webm (R2, a CDN, ...). */
  src: string;
  /** Shown before it plays, and instead of it when motion is off. */
  poster?: string | null;
  caption?: string | null;
  fit?: "cover" | "contain";
  /** Otherwise the overlay closes when the video ends. */
  loop?: boolean;
};

export type ShaderPayload = {
  /** A key in src/broadcast/shaders/index.ts. The code ships with the site; this only names it. */
  shader: string;
  caption?: string | null;
};
