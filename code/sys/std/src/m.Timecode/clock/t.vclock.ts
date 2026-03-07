import type { t } from '../common.ts';

/**
 * Factory and helpers for constructing `VirtualClock` instances.
 */
export type VirtualClockLib = {
  /** Create a new virtual clock bound to a resolved timeline. */
  make(timeline?: t.TimecodeCompositionResolved, opts?: VirtualClockOpts): t.VirtualClock;

  /**
   * Create a virtual clock when only the total duration is known.
   *
   * - No segments are provided
   * - mapToSource() will always return null
   *
   * This is the canonical interop seam for hosts that only need vTime advancement/clamping.
   */
  makeForTotal(total: t.Msecs, opts?: VirtualClockOpts): t.VirtualClock;
};

/** Options controlling initial playback and behavior. */
export type VirtualClockOpts = {
  readonly startAt?: t.Msecs; //  start position (default 0)
  readonly loop?: boolean; //     wrap to start when reaching end
  readonly speed?: number; //     playback rate multiplier (default: 1 = realtime)
};

/** Immutable snapshot of a virtual clock’s current state. */
export type VirtualClockState = {
  readonly vtime: t.VTime;
  readonly index: number; // -1 if none
  readonly seg?: t.TimecodeResolvedSegment; // undefined if none
  readonly playing: boolean;
};

/**
 * Virtual clock:
 * - Exclusive end semantics: [0,total)
 * - Caller drives progression via `advance(deltaMsecs)` — the elapsed real time in milliseconds
 */
export type VirtualClock = {
  /** Current state snapshot. */
  get(): VirtualClockState;

  /** Begin playback. */
  play(): VirtualClockState;

  /** Pause playback. */
  pause(): VirtualClockState;

  /** Seek to a virtual time position. */
  seek(v: t.VTime): VirtualClockState;

  /** Adjust playback speed multiplier. */
  setSpeed(n: number): VirtualClockState;

  /** Advance the clock by Δms (caller supplies timebase). */
  advance(delta: t.Msecs): VirtualClockState;

  /** Map a virtual time to its source segment and offsets. */
  mapToSource(v: t.VTime): {
    index: number;
    seg: t.TimecodeResolvedSegment;
    srcTime: t.Msecs;
    offset: t.Msecs;
  } | null;
};
