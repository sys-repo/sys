import { describe, expect, it } from '../../../-test.ts';
import { playerSignalsFactory } from '../../Player.Video.Signals/m.Signals.ts';

import { type t } from '../common.ts';
import { PlaybackDriver } from '../mod.ts';

describe(`Timecode.Driver`, () => {
  it(`cmd:deck:seek maps vTime → seconds excluding pauses and does not force play`, async () => {
    const ms = (n: number): t.Msecs => n;
    const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        {
          index: ix(0),
          vTime: ms(0),
          duration: ms(1000),
          pause: ms(500),
          segmentId: 'seg:1',
          media: { url: 'u:0' },
        },
        {
          index: ix(1),
          vTime: ms(1500), // includes the prior 500ms pause
          duration: ms(1000),
          segmentId: 'seg:1',
          media: { url: 'u:0' },
        },
      ],
      segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(2) } }],
      virtualDuration: ms(2500),
    };

    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'play',
      timeline,
      currentBeat: ix(0),
      vTime: ms(0),
      decks: {
        active: 'A',
        standby: 'B',
        status: { A: 'ready', B: 'ready' },
      },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();

    const inputs: readonly t.TimecodeState.Playback.Input[] = [];
    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({
      state,
      cmds: [
        { kind: 'cmd:deck:load', deck: 'A', beat: ix(0) },
        { kind: 'cmd:deck:seek', deck: 'A', vTime: ms(1500) }, // beat-1 boundary
      ],
      events: [],
    });

    // beat1 boundary should be 1.0s into media (pause excluded).
    expect(A.props.jumpTo.value?.second).to.equal(1);
    expect(A.props.jumpTo.value?.play).to.equal(undefined);

    // Sanity: no reducer-input spam introduced by this unit.
    expect(seen).to.eql(inputs);
    driver.dispose();
  });
});
