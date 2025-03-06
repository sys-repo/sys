import type {
  MediaPauseEvent,
  MediaPlayerProps,
  MediaPlayEvent,
  MediaPlayingEvent,
} from '@vidstack/react';
import type { t } from './common.ts';

/**
 * Component: Video Player.
 */
export type VideoPlayerProps = {
  debug?: boolean;
  title?: string;
  video?: string;
  style?: t.CssInput;
  onPlay?: MediaPlayerProps['onPlay'];
  onPlaying?: MediaPlayerProps['onPlaying'];
  onPause?: MediaPlayerProps['onPause'];
};

/**
 * Hook: usePlayerEvents.
 */
export type UseVideoPlayerEvents = {
  readonly $: t.Observable<t.VideoPlayerEvent>;
  readonly play$: t.Observable<t.VideoStats>;
  readonly playing$: t.Observable<t.VideoStats>;
  readonly pause$: t.Observable<t.VideoStats>;
  readonly handlers: {
    onPlay: (nativeEvent: MediaPlayEvent) => void;
    onPlaying: (nativeEvent: MediaPlayingEvent) => void;
    onPause: (nativeEvent: MediaPauseEvent) => void;
  };
};

/**
 * Statistics about a video.
 */
export type VideoStats = {
  readonly percent: t.Percent;
  readonly duration: t.Secs;
  readonly elapsed: t.Secs;
};

/**
 * Player Events
 */
export type VideoPlayerEvent = VideoPlayEvent | VideoPlayingEvent | VideoPauseEvent;

/** Event: Video started playing. */
export type VideoPlayEvent = { type: 'Video/play'; payload: VideoStats };

/** Event: Video playing (timestamp). */
export type VideoPlayingEvent = { type: 'Video/playing'; payload: VideoStats };

/** Event: Video stopped playing. */
export type VideoPauseEvent = { type: 'Video/pause'; payload: VideoStats };
