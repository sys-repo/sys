import { type t, slug } from './common.ts';

type Input = t.TimecodeState.Playback.Input;

/**
 * Create a pure TimelineController.
 *
 * This controller is intentionally "dumb":
 * - it does not read machine state
 * - it performs no effects
 * - it only emits PlaybackAction-kind inputs (a subset of Playback.Input) via dispatch(...)
 */
export const createController: t.TimecodePlaybackDriverLib['controller'] = (dispatch) => {
  const send = (input: Input) => dispatch(input);
  return {
    id: { kind: 'Media.Timecode.PlaybackDriver.Controller', instance: slug() },
    init(args) {
      const { timeline, startBeat } = args;
      send({ kind: 'playback:init', timeline, startBeat });
    },
    play: () => send({ kind: 'playback:play' }),
    pause: () => send({ kind: 'playback:pause' }),
    toggle: () => send({ kind: 'playback:toggle' }),
    seekToBeat: (beat) => send({ kind: 'playback:seek:beat', beat }),
  };
};
