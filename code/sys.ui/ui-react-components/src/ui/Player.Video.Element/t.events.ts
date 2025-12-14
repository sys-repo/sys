import type { t } from './common.ts';

type P = t.VideoElementProps;

/**
 * Typed event payloads for `VideoElementProps` handlers.
 *
 * Why: handler props are optional, so extracting parameter types inline
 * requires `NonNullable<...>` noise at call sites.
 */
export type VideoOnPlayingChange = NonNullable<P['onPlayingChange']>;
export type VideoOnPlayingChangeArgs = Parameters<VideoOnPlayingChange>[0];

export type VideoOnMutedChange = NonNullable<P['onMutedChange']>;
export type VideoOnMutedChangeArgs = Parameters<VideoOnMutedChange>[0];

export type VideoOnBufferingChange = NonNullable<P['onBufferingChange']>;
export type VideoOnBufferingChangeArgs = Parameters<VideoOnBufferingChange>[0];

export type VideoOnBufferedChange = NonNullable<P['onBufferedChange']>;
export type VideoOnBufferedChangeArgs = Parameters<VideoOnBufferedChange>[0];

export type VideoOnEnded = NonNullable<P['onEnded']>;
export type VideoOnEndedArgs = Parameters<VideoOnEnded>[0];
