import { type t } from './common.ts';

/**
 * Drives a virtual playback clock over a resolved timeline.
 * Purely logical (no media elements); frame-based via RAF or off-thread driver.
 */
export type UseVirtualPlayback = (
  resolved?: t.TimecodeCompositionResolved,
  opts?: UseVirtualPlaybackOptions,
) => UseVirtualPlaybackReturn;

/**
 * Options for `useVirtualPlayback`.
 */
export type UseVirtualPlaybackOptions = {
  readonly startAt?: t.Msecs;
  readonly autoPlay?: boolean; // default true
  readonly loop?: boolean; // default false
  readonly speed?: number; // default 1
  readonly life?: t.LifeLike; // optional lifecycle for scheduling/cleanup
  readonly driver?: 'raf' | 'off';
  readonly debug?: { onClock?: (c: t.VirtualClock) => void };
};

/**
 * Public API surface of the `useVirtualPlayback` hook.
 */
export type UseVirtualPlaybackReturn = {
  readonly vtime: t.TimecodeVTime;
  readonly index: number;
  readonly seg?: t.TimecodeResolvedSegment;
  readonly playing: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly seek: (v: t.TimecodeVTime) => void;
  readonly setSpeed: (n: number) => void;
  readonly mapToSource: (v: t.TimecodeVTime) => ReturnType<t.VirtualClock['mapToSource']>;
};
