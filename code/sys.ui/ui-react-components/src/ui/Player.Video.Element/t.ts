import type { t } from './common.ts';
export type * from './t.Elapsed.ts';
export type * from './t.stateful.ts';

/**
 * https://html.spec.whatwg.org/multipage/media.html#ready-states
 */
export type NumberMediaReadyState = 0 | 1 | 2 | 3 | 4;

/** Specifies a range to narrow the video within. */
export type VideoCropRange = { start?: t.Secs; end?: t.Secs };
export type VideoCropRangeTuple = [t.Secs, t.Secs];

/**
 * Component:
 */
export type VideoElementProps = {
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
  crop?: t.VideoCropRange | VideoCropRangeTuple;

  buffering?: boolean;
  buffered?: t.Secs;

  // Apperance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Commands:
  jumpTo?: t.VideoPlayerSeekCmd;

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
  onPlayingChange?: (e: { playing: boolean; reason: t.VideoPlayerEventReason }) => void;
  onMutedChange?: (e: { muted: boolean; reason: t.VideoPlayerEventReason }) => void;

  /**
   * Events fired relating to the underlying time/duration of the media.
   */
  onTimeUpdate?: (e: { secs: t.Secs }) => void;
  onDurationChange?: (e: { secs: t.Secs }) => void;

  /** Events related to buffering status. */
  onBufferingChange?: (e: { buffering: boolean; reason: t.VideoPlayerEventReason }) => void;
  onBufferedChange?: (e: { buffered: t.Percent; reason: t.VideoPlayerEventReason }) => void;

  /**
   * Fired when media ends (native `ended` or loop boundary if you care).
   */
  onEnded?: (e: { reason: VideoPlayerEventReason }) => void;
};

/**
 * Events:
 */
export type VideoPlayerEventReason =
  | 'user-toggle-play'
  | 'user-toggle-mute'
  | 'autoplay-start'
  | 'autoplay-muted-retry'
  | 'autoplay-gesture'
  | 'prop-change'
  | 'media-ended'
  | 'src-change'
  | 'element-event'
  | 'ended';
