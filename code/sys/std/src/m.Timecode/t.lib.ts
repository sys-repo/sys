import type { t } from './common.ts';

/**
 * Public library surface for timecodes.
 * Implementation should provide a single frozen object matching this shape.
 */
export type TimecodeLib = {
  readonly Ops: t.TimecodeOpsLib;
  readonly Slice: t.TimecodeSliceLib;
  readonly Composite: t.TimecodeCompositeLib;
  readonly Experience: t.TimecodeExperienceLib;

  readonly VTime: t.VTimeLib;
  readonly VClock: t.VirtualClockLib;

  /** Regular-expression patterns. */
  readonly Pattern: {
    readonly timecode: t.StringReg;
    readonly slice: t.StringReg;
  };

  /** Type guard: true when input matches the grammar. */
  readonly is: (input: unknown) => input is t.VttTimecode;

  /** Return the lexical form of a valid timecode. */
  readonly kindOf: (timecode: string) => t.TimecodeKind;

  /** Parse a valid timecode to milliseconds. */
  readonly parse: (timecode: string) => t.Msecs;

  /**
   * Stable sort by time:
   * - valid timecodes first, ordered by time
   * - non-timecodes after, original relative order preserved
   */
  readonly sort: (timecodes: string[]) => readonly string[];

  /** Convert a record of timestamp-like keys to sorted validated entries. */
  readonly toEntries: <T>(bag: Readonly<Record<string, T>>) => readonly t.TimecodeEntry<T>[];

  /**
   * Format milliseconds into a minimal legal timecode.
   * - withMsecs: include .mmm
   * - forceHours: emit HH:MM:SS even when HH === 0
   */
  readonly format: (
    ms: t.Msecs,
    opts?: { withMsecs?: boolean; forceHours?: boolean },
  ) => t.VttTimecode;
};
