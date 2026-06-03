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

  /** Timecode helper library surface. */
  export type Lib = {
    readonly Ops: Ops.Lib;
    readonly Slice: Slice.Lib;
    readonly Composite: Composite.Lib;
    readonly Experience: Experience.Lib;

    readonly VTime: t.VTime.Lib;
    readonly VClock: t.VirtualClock.Lib;

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

  /** Pure functional operations over canonical TimeMap data. */
  export namespace Ops {
    /** Timecode operations helper library surface. */
    export type Lib = {
      /**
       * Return the first entry matching a predicate.
       * Mirrors Array.prototype.find semantics.
       */
      readonly find: <V>(
        map: t.TimecodeMap<V>,
        predicate: (entry: t.TimecodeEntry<V>) => boolean,
      ) => t.TimecodeEntry<V> | undefined;

      /** Find the latest entry whose timestamp ≤ target time (in seconds). */
      readonly findAtOrBefore: <V>(
        map: t.TimecodeMap<V>,
        secs: number,
      ) => t.TimecodeEntry<V> | undefined;

      /** Return the previous and next entries around the given time (in seconds). */
      readonly neighbors: <V>(
        map: t.TimecodeMap<V>,
        secs: number,
      ) => { readonly prev?: t.TimecodeEntry<V>; readonly next?: t.TimecodeEntry<V> };

      /** Return all entries whose timestamps fall within [start, end). */
      readonly between: <V>(
        map: t.TimecodeMap<V>,
        startSecs: number,
        endSecs: number,
      ) => readonly t.TimecodeEntry<V>[];

      /**
       * Return the N entries closest to the given time (in seconds),
       * sorted by absolute temporal distance.
       */
      readonly nearest: <V>(
        map: t.TimecodeMap<V>,
        secs: number,
        n: number,
      ) => readonly t.TimecodeEntry<V>[];
    };
  }

  /** Helpers parsing and resolving timecode slice strings. */
  export namespace Slice {
    export type Normalized = t.TimecodeSliceNormalized;
    export type Duration = t.TimecodeSliceDuration;
    export type String = t.TimecodeSliceString;
    export type StringInput = t.TimecodeSliceStringInput;

    /** Timecode slice helper library surface. */
    export type Lib = {
      /** Quick structural check for the slice lexical form. */
      is(input: unknown): input is t.TimecodeSliceString;

      /** Parse a valid slice string into a normalized structure. */
      parse(input: t.TimecodeSliceStringInput): t.TimecodeSliceNormalized;

      /** Resolve a parsed slice into an absolute millisecond window against total duration. */
      resolve(slice: t.TimecodeSliceNormalized, total: t.Msecs): t.TimeWindow;

      /** Render a parsed slice back to its canonical string form. */
      toString(slice?: string | t.TimecodeSliceNormalized): t.TimecodeSliceString;

      /** Build a canonical slice string from a concrete window. */
      from(window: t.TimeWindow, total?: t.Msecs): t.TimecodeSliceString;

      /** Split a slice string into friendly {start,end} parts without validation. */
      split(input?: string | t.TimecodeSliceNormalized): t.TimecodeSliceParts;

      /** Compute duration between slice bounds. */
      duration(
        slice: string | t.TimecodeSliceNormalized,
        opts?: { unit?: t.TimeUnit; round?: number; total?: t.Msecs },
      ): t.TimecodeSliceDuration | undefined;

      /** Compute formatted start/end summaries for a slice. */
      positions(
        slice: string | t.TimecodeSliceNormalized,
        opts?: { round?: number; total?: t.Msecs },
      ): t.TimecodeSlicePositions | undefined;

      /** Convert a slice into a millisecond span [from,to). */
      toRange(input?: t.TimecodeSliceStringInput, total?: t.Secs): t.MsecSpan | undefined;
    };
  }

  export namespace VirtualClock {
    export type Instance = t.VirtualClock;
    export type State = t.VirtualClockState;
  }

  export namespace Composite {
    /** Composite timecode helper library surface. */
    export type Lib = {
      /** Build a resolved timeline from authoring spec + known durations. */
      readonly resolve: Composite.Resolve.Fn;

      /** Mapping helpers between virtual-time and source-time domains. */
      readonly Map: Composite.Map.Lib;

      /** Small time utilities on the virtual timeline. */
      readonly Time: {
        /** Clamp a virtual time into [0,total]. */
        clamp(v: t.TimecodeVTime, total: t.Msecs): t.TimecodeVTime;
        /** Convert a source timestamp inside a segment to virtual time. */
        toVirtual(
          segments: t.Ary<t.TimecodeResolvedSegment>,
          index: number,
          srcTime: t.Msecs,
        ): t.TimecodeVTime;
      };

      /** Validate spec+durations for composability; never throws. */
      validate(
        spec: t.TimecodeCompositionSpec,
        durations: t.TimecodeDurationMap,
      ): { readonly ok: boolean; readonly issues: readonly t.TimecodeCompositeIssue[] };

      /** Sanitize authoring input (trim, drop empty slices, normalise tuples, etc.). */
      normalize(spec: t.TimecodeCompositionSpec): t.TimecodeCompositionSpec;

      /** Duration helpers (env-specific probing is left to caller; this is the contract). */
      readonly Durations: {
        /** Resolve durations per src (implementation may be provided by host app). */
        probe(srcs: readonly string[]): Promise<t.TimecodeDurationMap>;
        /** List srcs whose duration changed. */
        diff(prev: t.TimecodeDurationMap, next: t.TimecodeDurationMap): readonly string[];
        /** Return a normalized spec with missing durations filled from map. */
        with(
          spec: t.TimecodeCompositionSpec,
          map: t.TimecodeDurationMap,
        ): t.TimecodeCompositionSpec;
      };

      /** Indexing helpers over a resolved composition. */
      cursor(resolved: t.TimecodeCompositionResolved): {
        /** Lookup segment at virtual time (or null if out of range). */
        at(v: t.TimecodeVTime): t.TimecodeMapToSourceResult | null;
        /** Next segment index or null if none. */
        next(index: number): number | null;
        /** Previous segment index or null if none. */
        prev(index: number): number | null;
      };

      /** Pure transforms on resolved timelines. */
      readonly Ops: {
        /** Insert pieces at segment boundary; returns a new resolved timeline. */
        splice(
          resolved: t.TimecodeCompositionResolved,
          at: number,
          pieces: t.TimecodeCompositionSpec,
          durations: t.TimecodeDurationMap,
        ): t.TimecodeCompositionResolved;

        /** Concatenate two resolved timelines, rebasing vFrom/vTo. */
        concat(
          a: t.TimecodeCompositionResolved,
          b: t.TimecodeCompositionResolved,
        ): t.TimecodeCompositionResolved;
      };

      /** Build a purely-virtual resolved timeline from authoring spec only. */
      readonly toVirtualTimeline: (spec?: t.TimecodeCompositionSpec) => t.TimecodeResolved;
    };

    /** Mapping operations between the virtual timeline and source/slice domains. */
    export namespace Map {
      /** Composite map helper library surface. */
      export type Lib = {
        /** Map a virtual time to its backing source segment/time (or null). */
        readonly toSource: t.TimecodeMapToSource;
      };
    }

    /** Composition resolver operation contracts. */
    export namespace Resolve {
      export type Fn = t.TimecodeResolveComposition;
      export type Result = t.TimecodeCompositionResolved;
    }

    export type Piece = t.TimecodeCompositePiece;
    export type Resolved = t.TimecodeResolved;
    export type Spec = t.TimecodeCompositionSpec;
  }

  export namespace Experience {
    /** Experience timeline helper library surface. */
    export type Lib = {
      /**
       * Project source-anchored beats onto a resolved composite timeline.
       * Returns a stable, ordered timeline and total virtual duration.
       */
      readonly toTimeline: <P>(
        resolved: t.TimecodeCompositionResolved,
        beats: readonly t.TimecodeExperienceBeat<P>[],
      ) => t.TimecodeTimeline<P>;
    };

    export type Timeline<P = unknown> = t.TimecodeTimeline<P>;
    export type Beat<P = unknown> = t.TimecodeExperienceBeat<P>;
  }

  export namespace Playback {
    export type Spec<P> = t.TimecodePlaybackSpec<P>;
    export type Beat<P = unknown> = t.TimecodePlaybackBeat<P>;
    export type BeatSrc = t.TimecodePlaybackBeatSrc;
    export type MediaKind = t.PlaybackMediaKind;
    export type ResolverArgs = t.MediaResolverArgs;
    export type Resolver = t.MediaResolver;
  }
}
