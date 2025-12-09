import { type t } from './common.ts';

/**
 * `MM:SS`, `HH:MM:SS`, or `HH:MM:SS.mmm`.
 */
export namespace Timecode {
  export type Vtt = t.VttTimecode;
  export type Slice = t.TimecodeSlice;
  export type SliceString = t.TimecodeSliceString;
  export type SliceDuration = t.TimecodeSliceDuration;
  export type Map<T = unknown> = t.TimecodeMap<T>;
}
