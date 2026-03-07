import { describe, expect, it } from '../../../-test.ts';
import { type t, TimecodeState } from '../common.ts';
import { Playback } from '../mod.ts';
import { createRunnerLoop } from '../u.runner.loop.ts';
import { createRuntime, expectedCallsFromCmds, timeline } from './u.fixture.ts';

describe('u.runnerLoop', () => {
  const project = Playback.project.runnerState;

  type CreateArgs = {
    readonly initial?: t.TimecodeState.Playback.State;
    readonly onEvent?: (e: t.TimecodeState.Playback.Event) => void;
    readonly onCmd?: (cmd: t.TimecodeState.Playback.Cmd) => void;
  };

  function create(args: CreateArgs = {}): {
    readonly loop: t.PlaybackRunnerLoop;
    readonly runtime: t.PlaybackRuntime;
    readonly calls: ReturnType<typeof createRuntime>['calls'];
  } {
    const { runtime, calls } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project,
        onEvent: args.onEvent,
        onCmd: args.onCmd,
      },
      { initial: args.initial ?? TimecodeState.Playback.init().state },
    );

    return { loop, runtime, calls } as const;
  }

  it('creates a loop with deterministic initial state (no runtime calls)', () => {
    const { loop, calls } = create();
    const s = loop.get();

    expect(s).to.have.property('state');
    expect(calls.length).to.eql(0);
  });

  it('subscribes immediately with the current snapshot', () => {
    const { loop } = create();

    const first = loop.get();
    let seen: t.PlaybackRunnerState | undefined;

    const unsubscribe = loop.subscribe((s) => (seen = s));
    unsubscribe();

    expect(seen).to.eql(first);
  });

  it('executes exactly the reducer-issued runtime-affecting cmds for a given input', () => {
    const { loop, calls } = create();

    // Ensure deterministic machine baseline for the expectation comparison:
    loop.send({ kind: 'playback:init', timeline: timeline() });
    calls.length = 0;

    const input: t.TimecodeState.Playback.Input = { kind: 'playback:play' };
    const before = loop.get().state;

    const update = TimecodeState.Playback.reduce(before, input);
    const expectedCalls = expectedCallsFromCmds(update.cmds);

    loop.send(input);
    expect(calls).to.eql(expectedCalls);
  });

  it('Law: events → cmds → notify (single send() flush)', () => {
    const trace: Array<'e' | 'c' | 'n'> = [];

    const { loop } = create({
      onEvent: () => trace.push('e'),
      onCmd: () => trace.push('c'),
    });

    // Subscribe once; then clear to observe only a single send flush.
    const unsubscribe = loop.subscribe(() => trace.push('n'));
    trace.length = 0;

    // Arrange: ensure there will be runtime cmds in the flush.
    loop.send({ kind: 'playback:init', timeline: timeline() });
    trace.length = 0;

    // Act: one flush.
    loop.send({ kind: 'playback:play' });

    // Assert: notify happens exactly once, and after any events/cmds.
    const nIdx = trace.indexOf('n');
    expect(nIdx).to.not.equal(-1);

    const lastEC = Math.max(trace.lastIndexOf('e'), trace.lastIndexOf('c'));
    expect(nIdx).to.be.greaterThan(lastEC);

    // If events exist, they must all occur before the first cmd.
    const firstC = trace.indexOf('c');
    if (firstC !== -1) {
      const lastE = trace.lastIndexOf('e');
      if (lastE !== -1) expect(lastE).to.be.lessThan(firstC);
    }

    unsubscribe();
  });

  it('unsubscribe stops further notifications', () => {
    const { loop } = create();

    let count = 0;
    const unsubscribe = loop.subscribe(() => count++);

    expect(count).to.eql(1);
    unsubscribe();

    loop.send({ kind: 'playback:init', timeline: timeline() });
    loop.send({ kind: 'playback:play' });

    expect(count).to.eql(1);
  });

  it('dispose clears subscribers', () => {
    const { loop } = create();

    let count = 0;
    loop.subscribe(() => count++);

    expect(count).to.eql(1);
    loop.dispose();

    loop.send({ kind: 'playback:init', timeline: timeline() });
    loop.send({ kind: 'playback:play' });

    expect(count).to.eql(1);
  });

  it('after end-ish runtime signals, seek:beat reasserts seek and snaps vTime to the beat boundary', () => {
    const { loop, calls } = create();

    // Arrange: init + play.
    loop.send({ kind: 'playback:init', timeline: timeline() });
    loop.send({ kind: 'playback:play' });

    // Simulate runner drift to "late" time and an "ended" signal on the active deck.
    // (This mirrors: run to last beat, then ended.)
    const activeDeck = loop.get().state.decks.active;

    loop.send({ kind: 'video:time', deck: activeDeck, vTime: 2900 });
    loop.send({ kind: 'video:ended', deck: activeDeck });

    // Clear calls to observe only the reset action.
    calls.length = 0;

    // Act: user explicitly seeks back to beat 0 (this must reset the runtime).
    loop.send({ kind: 'playback:seek:beat', beat: 0 });

    // Assert: state snaps to beat 0 boundary.
    const s = loop.get().state;
    expect(s.currentBeat).to.eql(0);
    expect(s.vTime).to.eql(0);

    // Assert: runtime gets a seek to vTime=0 (deck may be A or B depending on policy).
    const seekCalls = calls.filter((e) => e.kind === 'seek');
    expect(seekCalls.length).to.be.greaterThan(0);

    const last = seekCalls[seekCalls.length - 1];
    expect(last.vTime).to.eql(0);
    expect(['A', 'B']).to.include(last.deck);
  });
});
