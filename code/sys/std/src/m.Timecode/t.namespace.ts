import type { t } from './common.ts';

/**
 * `MM:SS`, `HH:MM:SS`, or `HH:MM:SS.mmm`.
 */
export namespace Timecode {
  export type Vtt = t.VttTimecode;
  export type VTime = t.TimecodeVTime;
  export type Map<T = unknown> = t.TimecodeMap<T>;
  export type DurationMap = t.TimecodeDurationMap;
  export type Resolved = t.TimecodeResolved;
  export type ResolvedSegment = t.TimecodeResolvedSegment;

  export namespace Slice {
    export type Normalized = t.TimecodeSliceNormalized;
    export type Duration = t.TimecodeSliceDuration;
    export type String = t.TimecodeSliceString;
    export type StringInput = t.TimecodeSliceStringInput;
  }

  export namespace VirtualClock {
    export type Instance = t.VirtualClock;
    export type State = t.VirtualClockState;
  }

  export namespace Composite {
    export type Lib = t.TimecodeCompositeLib;
    export type Piece = t.TimecodeCompositePiece;
    export type Resolved = t.TimecodeCompositionResolved;
    export type Spec = t.TimecodeCompositionSpec;
  }

  export namespace Experience {
    export type Timeline<P = unknown> = t.TimecodeTimeline<P>;
  }

  export namespace Playback {
    export type Spec<P> = t.TimecodePlaybackSpec<P>;
    export type MediaKind = t.PlaybackMediaKind;
    export type ResolverArgs = t.MediaResolverArgs;
    export type Resolver = t.MediaResolver;
  }
}
