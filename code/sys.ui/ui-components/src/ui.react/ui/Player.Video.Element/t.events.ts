import type { t } from './common.ts';

type P = t.VideoElementProps;

/**
 * Typed event payloads for `VideoElementProps` handlers.
 *
 * Why: handler props are optional, so extracting parameter types inline
 * requires `NonNullable<...>` noise at call sites.
 */
export type VideoOnPlayingChange = NonNullable<P['onPlayingChange']>;
/** Payload delivered by `onPlayingChange`. */
export type VideoOnPlayingChangeArgs = Parameters<VideoOnPlayingChange>[0];

/** Handler type for muted-state transitions. */
export type VideoOnMutedChange = NonNullable<P['onMutedChange']>;
/** Payload delivered by `onMutedChange`. */
export type VideoOnMutedChangeArgs = Parameters<VideoOnMutedChange>[0];

/** Handler type for buffering-state transitions. */
export type VideoOnBufferingChange = NonNullable<P['onBufferingChange']>;
/** Payload delivered by `onBufferingChange`. */
export type VideoOnBufferingChangeArgs = Parameters<VideoOnBufferingChange>[0];

/** Handler type for buffered-range updates. */
export type VideoOnBufferedChange = NonNullable<P['onBufferedChange']>;
/** Payload delivered by `onBufferedChange`. */
export type VideoOnBufferedChangeArgs = Parameters<VideoOnBufferedChange>[0];

/** Handler type for playback-ended notifications. */
export type VideoOnEnded = NonNullable<P['onEnded']>;
/** Payload delivered by `onEnded`. */
export type VideoOnEndedArgs = Parameters<VideoOnEnded>[0];
