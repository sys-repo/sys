import { describe, expect, it } from '../../../-test.ts';

import type { t } from '../common.ts';
import { TimecodeDriver } from '../mod.ts';

type Input = t.TimecodeState.Playback.Input;
type BeatIndex = t.TimecodeState.Playback.BeatIndex;
type Timeline = t.TimecodeState.Playback.Timeline;

describe('TimecodeDriver.Playback.controller', () => {
  it('does not dispatch on construction', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);
    TimecodeDriver.Playback.controller(dispatch);
    expect(calls.length).to.eql(0);
  });

  it('init dispatches playback:init with timeline and optional startBeat', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);
    const controller = TimecodeDriver.Playback.controller(dispatch);

    // Test boundary: controller is pass-through; timeline shape is owned elsewhere.
    const timeline = {} as Timeline;
    const startBeat = 7 as BeatIndex;

    controller.init({ timeline, startBeat });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.kind).to.eql('playback:init');
    expect((calls[0] as { readonly timeline: Timeline }).timeline).to.eql(timeline);
    expect((calls[0] as { readonly startBeat?: BeatIndex }).startBeat).to.eql(startBeat);
  });

  it('init dispatches playback:init without startBeat when omitted', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = TimecodeDriver.Playback.controller(dispatch);

    const timeline = {} as unknown as Timeline;

    controller.init({ timeline });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.kind).to.eql('playback:init');
    expect((calls[0] as { readonly timeline: Timeline }).timeline).to.eql(timeline);
    expect((calls[0] as { readonly startBeat?: BeatIndex }).startBeat).to.eql(undefined);
  });

  it('play dispatches playback:play', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = TimecodeDriver.Playback.controller(dispatch);
    controller.play();

    expect(calls).to.eql([{ kind: 'playback:play' }]);
  });

  it('pause dispatches playback:pause', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = TimecodeDriver.Playback.controller(dispatch);
    controller.pause();

    expect(calls).to.eql([{ kind: 'playback:pause' }]);
  });

  it('toggle dispatches playback:toggle', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = TimecodeDriver.Playback.controller(dispatch);
    controller.toggle();
    expect(calls).to.eql([{ kind: 'playback:toggle' }]);
  });

  it('seekToBeat dispatches playback:seek:beat with beat index', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = TimecodeDriver.Playback.controller(dispatch);

    const beat = 3 as BeatIndex;
    controller.seekToBeat(beat);

    expect(calls.length).to.eql(1);
    expect(calls[0]?.kind).to.eql('playback:seek:beat');
    expect((calls[0] as { readonly beat: BeatIndex }).beat).to.eql(beat);
  });
});
