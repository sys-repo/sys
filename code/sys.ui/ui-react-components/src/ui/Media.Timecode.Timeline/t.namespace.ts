import type { HarnessProps } from './-dev/ui.tsx';
import type { t } from './common.ts';

/**
 * Media Timeline Component namespace:
 */
export namespace MediaTimeline {
  export type Lib = {
    useTimeline<P = unknown>(spec?: t.Timecode.Playback.Spec<P>): Timeline.Result<P>;
    readonly Dev: {
      readonly Harness: t.FC<HarnessProps>;
    };
  };

  /** Dev Harness. */
  export namespace Dev {
    export namespace Harness {
      export type Props = HarnessProps;
    }
  }

  /**
   * Virtual Timeline (Data).
   */
  export namespace Timeline {
    export type Result<P = unknown> = {
      readonly resolved?: t.Timecode.Composite.Resolved;
      readonly timeline?: t.Timecode.Experience.Timeline<P>;
    };
  }

  /**
   * Dev-only orchestration glue:
   * runtime → runner → snapshot → controller → init sequencing.
   *
   * Not part of the public/pure Timeline API.
   */
  export namespace Orchestrator {
    export type Args = {
      readonly bundle?: t.SpecTimelineBundle;
      readonly video?: t.VideoDeckRuntimeArgs;
      readonly docid?: string;
      readonly timeline?: t.Timecode.Experience.Timeline;
      readonly startBeat?: t.TimecodeState.Playback.BeatIndex;
    };
    export type Result = {
      readonly controller: t.TimelineController;
      readonly snapshot: t.PlaybackRunnerState;
      readonly selectedIndex?: t.TimecodeState.Playback.BeatIndex;
    };
  }
}
