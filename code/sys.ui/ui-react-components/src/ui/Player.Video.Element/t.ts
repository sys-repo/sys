import type { t } from './common.ts';
export type * from './t.stateful.ts';
export type * from './t.Elapsed.ts';

/**
 * https://html.spec.whatwg.org/multipage/media.html#ready-states
 */
export type NumberMediaReadyState = 0 | 1 | 2 | 3 | 4;

/**
 * <Component>:
 */
export type VideoElement2Props = {
  src?: string;
  poster?: string;
  loop?: boolean;
  aspectRatio?: string; // e.g. "16/9"
  cornerRadius?: t.Pixels;
  scale?: t.Percent | t.VideoPlayerScale;
  fadeMask?: t.VideoPlayerFadeMask;
  showControls?: boolean;
  showFullscreenButton?: boolean;
  showVolumeControl?: boolean;

  buffering?: boolean;
  buffered?: t.Secs;

  // Apperance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Commands:
  jumpTo?: t.VideoPlayerJumpTo;

  /**
   * Playback intent:
   *  - If `playing` is defined => controlled.
   *  - Else uses `autoPlay` (default true) as initial start intent.
   */
  playing?: boolean;
  autoPlay?: boolean;

  /**
   * Mute control:
   *  - If `muted` defined => controlled.
   *  - Else uses `defaultMuted` (was previously `muted` prop) as initial.
   */
  muted?: boolean;
  defaultMuted?: boolean;

  /**
   * Events fired when underlying element state changes.
   * Parent is expected to re-render with new `playing`/`muted` if controlling.
   */
  onPlayingChange?: (e: { playing: boolean; ctx: t.MediaCtx }) => void;
  onMutedChange?: (e: { muted: boolean; ctx: t.MediaCtx }) => void;

  /**
   * Events fired relating to the underlying time/duration of the media.
   */
  onTimeUpdate?: (e: { secs: t.Secs }) => void;
  onDurationChange?: (e: { secs: t.Secs }) => void;

  /** Events related to buffering status. */
  onBufferingChange?: (e: { buffering: boolean; ctx: t.MediaCtx }) => void;
  onBufferedChange?: (e: { buffered: t.Percent; ctx: t.MediaCtx }) => void;

  /**
   * Fired when media ends (native `ended` or loop boundary if you care).
   */
  onEnded?: (e: { ctx: t.MediaCtx }) => void;
};

/**
 * Events:
 */
export type MediaCtxReason =
  | 'user-toggle-play'
  | 'user-toggle-mute'
  | 'autoplay-start'
  | 'autoplay-muted-retry'
  | 'autoplay-gesture'
  | 'prop-change'
  | 'media-ended'
  | 'element-event'
  | 'src-change'
  | 'ended';
export type MediaCtx = { reason: MediaCtxReason };
