import { describe, expect, it } from '../../../-test.ts';

import { type t, Is } from '../common.ts';
import { PlaybackDriver } from '../mod.ts';

type Timeline = t.TimecodeState.Playback.Timeline;
type BeatIndex = t.TimecodeState.Playback.BeatIndex;
type Input = t.TimecodeState.Playback.Input;

describe('PlaybackDriver.Util.controller', () => {
  it('does not dispatch on construction', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);
    PlaybackDriver.Util.controller(dispatch);
    expect(calls.length).to.eql(0);
  });

  it('exposes a controller id with `kind` and `instance`', () => {
    const dispatch = (_input: Input) => {};
    const controller = PlaybackDriver.Util.controller(dispatch);

    expect(controller.id.kind).to.eql('Media.Timecode.PlaybackDriver.Util.Controller');
    expect(Is.str(controller.id.instance)).to.eql(true);
    expect(controller.id.instance.length > 3).to.eql(true);
  });

  it('init dispatches playback:init with timeline and optional startBeat', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);
    const controller = PlaybackDriver.Util.controller(dispatch);

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

    const controller = PlaybackDriver.Util.controller(dispatch);

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

    const controller = PlaybackDriver.Util.controller(dispatch);
    controller.play();

    expect(calls).to.eql([{ kind: 'playback:play' }]);
  });

  it('pause dispatches playback:pause', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = PlaybackDriver.Util.controller(dispatch);
    controller.pause();

    expect(calls).to.eql([{ kind: 'playback:pause' }]);
  });

  it('toggle dispatches playback:toggle', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = PlaybackDriver.Util.controller(dispatch);
    controller.toggle();
    expect(calls).to.eql([{ kind: 'playback:toggle' }]);
  });

  it('seekToBeat dispatches playback:seek:beat with beat index', () => {
    const calls: Input[] = [];
    const dispatch = (input: Input) => calls.push(input);

    const controller = PlaybackDriver.Util.controller(dispatch);

    const beat = 3 as BeatIndex;
    controller.seekToBeat(beat);

    expect(calls.length).to.eql(1);
    expect(calls[0]?.kind).to.eql('playback:seek:beat');
    expect((calls[0] as { readonly beat: BeatIndex }).beat).to.eql(beat);
  });
});
