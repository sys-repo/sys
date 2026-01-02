import { describe, expect, it } from '../../../-test.ts';
import { playerSignalsFactory } from '../../Player.Video.Signals/m.Signals.ts';

import { pauseClampFixture } from './u.fixture.pauseWindowClamp.ts';
import { makeDeterministicSchedule } from './u.fixture.u.deterministicSchedule.ts';

import { type t } from '../common.ts';
import { TimecodeDriver } from '../mod.ts';

describe(`TimecodeDriver.Playback.driver`, () => {
  const ms = (n: number): t.Msecs => n;
  const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

  it(`cmd:deck:seek maps vTime → seconds excluding pauses and does not force play`, async () => {
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

    const driver = TimecodeDriver.Playback.driver({
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
      // This unit is only asserting the deck-signal → input bridge (not pause-window behavior).
      // Use a non-play intent so virtual-pause logic cannot clamp/override the mapped vTime.
      intent: 'pause',
      timeline,
      currentBeat: ix(0),
      vTime: ms(0),
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    const driver = TimecodeDriver.Playback.driver({
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

    const driver = TimecodeDriver.Playback.driver({
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

    const { schedule } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
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

    const driver = TimecodeDriver.Playback.driver({
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

  it(`pause window: pauses media, emits monotonic vTime from pauseFrom→pauseTo, then resumes video authority`, () => {
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
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    let pauses = 0;
    let plays = 0;

    const pause0 = A.pause;
    const play0 = A.play;

    A.pause = () => {
      pauses++;
      return pause0();
    };

    A.play = () => {
      plays++;
      return play0();
    };

    const { schedule, advance } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Overshoot past pauseFrom should clamp to pauseFrom and start timer authority.
    A.props.currentTime.value = 1.1 as t.Secs;
    expect(seen[0]).to.eql({ kind: 'video:time', deck: 'A', vTime: ms(1000) });
    expect(pauses).to.equal(1);

    // While timer is active, currentTime changes must not emit (timer is the authority).
    A.props.currentTime.value = 1.2 as t.Secs;
    expect(seen.filter((x) => x.kind === 'video:time').length).to.equal(1);

    // Timer ticks forward.
    advance(50);
    advance(50);
    advance(150);

    // We should have monotonic progression in emitted vTime (beyond the initial clamp).
    const times = seen
      .filter((x) => x.kind === 'video:time')
      .map((x) => (x as Extract<t.TimecodeState.Playback.Input, { kind: 'video:time' }>).vTime);

    expect(times[0]).to.equal(ms(1000));
    expect(times[times.length - 1]).to.be.greaterThan(ms(1000));

    // Finish the window (500ms total).
    advance(500);

    const times2 = seen
      .filter((x) => x.kind === 'video:time')
      .map((x) => (x as Extract<t.TimecodeState.Playback.Input, { kind: 'video:time' }>).vTime);

    expect(times2[times2.length - 1]).to.equal(ms(1500));
    expect(plays).to.equal(1);

    driver.dispose();
  });

  it(`pause window clamp uses nextBeat.vTime delta (not beat.duration) and completes via pause-timer authority`, () => {
    const fx = pauseClampFixture();
    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'play',
      timeline: fx.timeline,
      currentBeat: fx.timeline.beats[0]!.index,
      vTime: ms(0),
      decks: { active: 'A', standby: 'B', status: { A: 'ready', B: 'ready' } },
      ready: { machine: true, runner: true, deck: { A: true, B: true } },
    };

    const A = playerSignalsFactory();
    const B = playerSignalsFactory();
    const seen: t.TimecodeState.Playback.Input[] = [];

    let pauses = 0;
    let plays = 0;

    const pause0 = A.pause;
    const play0 = A.play;

    A.pause = () => {
      pauses++;
      return pause0();
    };

    A.play = () => {
      plays++;
      return play0();
    };

    const { schedule, advance } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Force a media-time overshoot past pauseFrom; driver must clamp to pauseFrom and pause media.
    A.props.currentTime.value = (Number(fx.mediaSecsAtPauseFrom) + 0.1) as t.Secs;
    expect(seen[0]).to.eql({ kind: 'video:time', deck: 'A', vTime: fx.pauseFrom });
    expect(pauses).to.equal(1);

    // Drive to pauseTo via monotonic timer.
    advance(Number(fx.pauseTo) - Number(fx.pauseFrom));

    const last = seen.filter((x) => x.kind === 'video:time').slice(-1)[0];
    expect(last).to.eql({ kind: 'video:time', deck: 'A', vTime: fx.pauseTo });

    // Window complete → resume (if still intent:'play').
    expect(plays).to.equal(1);

    driver.dispose();
  });

  it(`pause window timer stops on cmd rebase`, () => {
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
    const { schedule, advance } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Enter pause window → timer authority begins.
    A.props.currentTime.value = 1.1 as t.Secs;
    expect(seen.filter((x) => x.kind === 'video:time')[0]).to.eql({
      kind: 'video:time',
      deck: 'A',
      vTime: ms(1000),
    });

    // Advance some timer ticks (prove timer is active).
    advance(50);
    const beforeRebaseCount = seen.filter((x) => x.kind === 'video:time').length;
    expect(beforeRebaseCount).to.be.greaterThan(1);

    // Cmd rebase should cancel timer authority.
    driver.apply({
      state,
      cmds: [{ kind: 'cmd:deck:seek', deck: 'A', vTime: ms(0) }],
      events: [],
    });

    // Further schedule advances should NOT emit timer-driven video:time.
    const countAtRebase = seen.filter((x) => x.kind === 'video:time').length;
    advance(500);
    expect(seen.filter((x) => x.kind === 'video:time').length).to.equal(countAtRebase);

    driver.dispose();
  });

  it(`pause window timer stops on dispose`, () => {
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
    const { schedule, advance } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Enter pause window → timer authority begins.
    A.props.currentTime.value = 1.1 as t.Secs;
    expect(seen.filter((x) => x.kind === 'video:time')[0]).to.eql({
      kind: 'video:time',
      deck: 'A',
      vTime: ms(1000),
    });

    driver.dispose();

    // Schedule advances after dispose must emit nothing.
    const countAtDispose = seen.length;
    advance(500);
    expect(seen.length).to.equal(countAtDispose);
  });

  it(`pause window timer stops on cmd:swap-decks`, () => {
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

    const { schedule, advance } = makeDeterministicSchedule();

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      schedule,
      resolveBeatMedia: (beat) => ({ src: `src:${beat}` }),
      dispatch: (input) => seen.push(input),
    });

    driver.apply({ state, cmds: [], events: [] });

    // Enter pause window → timer authority begins.
    A.props.currentTime.value = 1.1 as t.Secs;
    const times0 = seen.filter((x) => x.kind === 'video:time').length;
    expect(times0).to.equal(1);

    // Prove timer is active.
    advance(50);
    const times1 = seen.filter((x) => x.kind === 'video:time').length;
    expect(times1).to.be.greaterThan(times0);

    // Swap decks should cancel timer authority.
    driver.apply({ state, cmds: [{ kind: 'cmd:swap-decks' }], events: [] });

    const countAtSwap = seen.filter((x) => x.kind === 'video:time').length;
    advance(500);
    expect(seen.filter((x) => x.kind === 'video:time').length).to.equal(countAtSwap);

    driver.dispose();
  });

  it(`cmd:deck:load sets src on first load; subsequent loads within the same segment do not rewrite src; slice always applies`, () => {
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
        {
          index: ix(1),
          vTime: ms(1000),
          duration: ms(1000),
          pause: ms(0),
          segmentId: 'seg:1', // same segment identity → src must remain stable
          media: { url: 'u:1' },
        },
      ],
      segments: [{ id: 'seg:1', beat: { from: ix(0), to: ix(2) } }],
      virtualDuration: ms(2000),
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

    const driver = TimecodeDriver.Playback.driver({
      decks: { A, B },
      resolveBeatMedia: (beat) => ({
        src: `src:${beat}`,
        slice: `slice:${beat}`, // string is valid by contract
      }),
      dispatch: (input) => seen.push(input),
    });

    // First load sets src + slice.
    driver.apply({ state, cmds: [{ kind: 'cmd:deck:load', deck: 'A', beat: ix(0) }], events: [] });
    expect(A.props.src.value).to.equal('src:0');
    expect(A.props.slice.value).to.equal('slice:0');

    // Second load in same segment:
    // - src must remain stable (idempotence)
    // - slice must update (always applied)
    driver.apply({ state, cmds: [{ kind: 'cmd:deck:load', deck: 'A', beat: ix(1) }], events: [] });
    expect(A.props.src.value).to.equal('src:0'); // stable by contract
    expect(A.props.slice.value).to.equal('slice:1'); // always applied

    expect(seen).to.eql([]);
    driver.dispose();
  });
});
