import { describe, expect, it } from '../../../-test.ts';
import { VideoSignals } from '../../Player.Video.Signals/mod.ts';

import { makeDeterministicSchedule } from './u.fixture.deterministicSchedule.ts';
import { pauseWindowLoopFixture } from './u.fixture.pauseWindowClamp.ts';

import { type t, TimecodeState } from '../common.ts';
import { PlaybackDriver } from '../mod.ts';

/**
 * Closed-loop integration
 * - Proves input → reduce → driver.apply → signals → input without React.
 * - Covers early-ended progression + pause-window monotonic timer ownership.
 */
describe(`Timecode.Driver closed-loop integration`, () => {
  const ms = (n: number): t.Msecs => n as t.Msecs;
  const sec = (n: number): t.Secs => n as t.Secs;
  const ix = (n: number): t.TimecodeState.Playback.BeatIndex =>
    n as t.TimecodeState.Playback.BeatIndex;

  const makeLoop = (timeline: t.TimecodeState.Playback.Timeline) => {
    const machine = TimecodeState.Playback;
    const { schedule, advance } = makeDeterministicSchedule();
    const A = VideoSignals.create();
    const B = VideoSignals.create();
    const inputs: t.TimecodeState.Playback.Input[] = [];

    const resolveBeatMedia: t.TimecodePlaybackDriver.ResolveBeatMedia = (beat) => {
      const url = timeline.beats[beat]?.media?.url;
      return url ? { src: url } : undefined;
    };

    const driver = PlaybackDriver.create({
      decks: { A, B },
      resolveBeatMedia,
      schedule,
      dispatch: (input) => inputs.push(input),
    });

    let snapshot = machine.init({ timeline });

    const apply = (next: t.TimecodeState.Playback.Snapshot) => {
      snapshot = next;
      driver.apply(next);
    };

    const drain = (onInput?: (input: t.TimecodeState.Playback.Input) => void) => {
      while (inputs.length > 0) {
        const input = inputs.shift()!;
        onInput?.(input);
        apply(machine.reduce(snapshot.state, input));
      }
    };

    const send = (input: t.TimecodeState.Playback.Input) => {
      apply(machine.reduce(snapshot.state, input));
      drain();
    };

    apply(snapshot);

    return {
      A,
      B,
      advance,
      drain,
      send,
      get snapshot() {
        return snapshot;
      },
      dispose() {
        driver.dispose();
      },
    };
  };

  it(`early-ended robustness closed-loop`, () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        {
          index: ix(0),
          vTime: ms(0),
          duration: ms(10_000),
          pause: ms(0),
          segmentId: 'seg:0',
          media: { url: 'u:0' },
        },
        {
          index: ix(1),
          vTime: ms(10_000),
          duration: ms(5_000),
          pause: ms(0),
          segmentId: 'seg:1',
          media: { url: 'u:1' },
        },
      ],
      segments: [
        { id: 'seg:0', beat: { from: ix(0), to: ix(1) } },
        { id: 'seg:1', beat: { from: ix(1), to: ix(2) } },
      ],
      virtualDuration: ms(15_000),
    };

    const loop = makeLoop(timeline);
    loop.A.props.ready.value = true;
    loop.B.props.ready.value = true;

    loop.send({ kind: 'playback:play' });

    loop.A.props.endedTick.value = 1;
    loop.drain();

    expect(loop.snapshot.state.currentBeat).to.equal(ix(1));
    expect(loop.snapshot.state.decks.active).to.equal('B');
    expect(loop.snapshot.state.phase).to.equal('active');

    loop.dispose();
  });

  it(`pause-window progression closed-loop`, () => {
    const fx = pauseWindowLoopFixture();
    const loop = makeLoop(fx.timeline);
    loop.A.props.ready.value = true;

    loop.send({ kind: 'playback:play' });

    const vTimes: t.Msecs[] = [];
    const collect = (input: t.TimecodeState.Playback.Input) => {
      if (input.kind === 'video:time') vTimes.push(input.vTime);
    };

    // Settle pending seek (first change seeds baseline, second clears pending seek).
    loop.A.props.currentTime.value = sec(0);
    loop.drain(collect);
    loop.A.props.currentTime.value = sec(0.01);
    loop.drain(collect);

    loop.A.props.currentTime.value = sec(Number(fx.mediaSecsAtPauseFrom) - 0.1);
    loop.drain();

    vTimes.length = 0;
    loop.A.props.currentTime.value = sec(Number(fx.mediaSecsAtPauseFrom) + 0.1);
    loop.drain(collect);

    loop.advance(1000);
    loop.drain(collect);
    loop.advance(1000);
    loop.drain(collect);

    expect(vTimes[0]).to.equal(fx.pauseFrom);
    expect(vTimes[vTimes.length - 1]).to.equal(fx.pauseTo);

    for (let i = 1; i < vTimes.length; i++) {
      expect(Number(vTimes[i]) >= Number(vTimes[i - 1])).to.equal(true);
    }

    loop.dispose();
  });
});
