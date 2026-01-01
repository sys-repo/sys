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

  it(`video:time emits from active deck currentTime only`, () => {
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
          vTime: ms(1500),
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
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    // Seed lastState for the signal bridge.
    driver.apply({ state, cmds: [], events: [] });

    // Active deck time change should emit video:time (pause excluded in mapping).
    A.props.currentTime.value = 1.1 as t.Secs; // 1100ms into media → beat0(1000) + 100ms → vTime=1500+100=1600ms
    expect(seen.length).to.equal(1);
    expect(seen[0]).to.eql({ kind: 'video:time', deck: 'A', vTime: ms(1600) });

    // Inactive deck time change should not emit.
    B.props.currentTime.value = 0.2 as t.Secs;
    expect(seen.length).to.equal(1);

    driver.dispose();
  });

  it(`video:ended emits from active deck endedTick only`, () => {
    const ms = (n: number): t.Msecs => n;
    const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        {
          index: ix(0),
          vTime: ms(0),
          duration: ms(1000),
          pause: ms(0),
          segmentId: 'seg:1',
          media: { url: 'u:0' },
        },
      ],
      segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(1) } }],
      virtualDuration: ms(1000),
    };

    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'play',
      timeline,
      currentBeat: ix(0),
      vTime: ms(0),
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Active deck bump should emit.
    A.props.endedTick.value = A.props.endedTick.value + 1;
    expect(seen.length).to.equal(1);
    expect(seen[0]).to.eql({ kind: 'video:ended', deck: 'A' });

    // Inactive deck bump should not emit.
    B.props.endedTick.value = B.props.endedTick.value + 1;
    expect(seen.length).to.equal(1);

    driver.dispose();
  });

  it(`dispose stops signal emissions`, () => {
    const ms = (n: number): t.Msecs => n;
    const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        {
          index: ix(0),
          vTime: ms(0),
          duration: ms(1000),
          pause: ms(0),
          segmentId: 'seg:1',
          media: { url: 'u:0' },
        },
      ],
      segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(1) } }],
      virtualDuration: ms(1000),
    };

    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'play',
      timeline,
      currentBeat: ix(0),
      vTime: ms(0),
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });
    driver.dispose();

    A.props.currentTime.value = 0.25 as t.Secs;
    A.props.endedTick.value = A.props.endedTick.value + 1;
    B.props.currentTime.value = 0.25 as t.Secs;
    B.props.endedTick.value = B.props.endedTick.value + 1;

    expect(seen).to.eql([]);
  });

  it(`suppresses video:time after video:ended until cmd rebase`, async () => {
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
          vTime: ms(1500),
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

    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Emit one time tick (baseline run emits nothing; first change should emit).
    A.props.currentTime.value = 0.5 as t.Secs; // 500ms into beat0
    expect(seen).to.eql([{ kind: 'video:time', deck: 'A', vTime: ms(500) }]);

    // Ended → latch suppression.
    A.props.endedTick.value = 1;
    expect(seen).to.eql([
      { kind: 'video:time', deck: 'A', vTime: ms(500) },
      { kind: 'video:ended', deck: 'A' },
    ]);

    // Further time updates suppressed.
    A.props.currentTime.value = 0.75 as t.Secs;
    expect(seen).to.eql([
      { kind: 'video:time', deck: 'A', vTime: ms(500) },
      { kind: 'video:ended', deck: 'A' },
    ]);

    // Cmd-based rebase resumes time emission.
    driver.apply({
      state,
      cmds: [{ kind: 'cmd:deck:seek', deck: 'A', vTime: ms(0) }],
      events: [],
    });

    A.props.currentTime.value = 0.8 as t.Secs;
    expect(seen).to.eql([
      { kind: 'video:time', deck: 'A', vTime: ms(500) },
      { kind: 'video:ended', deck: 'A' },
      { kind: 'video:time', deck: 'A', vTime: ms(800) },
    ]);

    driver.dispose();
  });
});
