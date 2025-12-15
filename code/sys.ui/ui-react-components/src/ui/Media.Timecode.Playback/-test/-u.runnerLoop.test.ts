import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, TimecodeState } from '../common.ts';
import { createRunnerLoop } from '../u.runnerLoop.ts';
import { createRuntime, expectedCallsFromCmds, timeline } from './u.fixture.ts';

describe('u.runnerLoop', () => {
  it('exposes the expected API shape', () => {
    expectTypeOf(createRunnerLoop).toMatchTypeOf<
      (
        deps: t.PlaybackRunnerLoopDeps,
        opts?: { readonly initial?: t.TimecodeState.Playback.State },
      ) => t.PlaybackRunnerLoop
    >();
  });

  it('creates a loop with deterministic initial state (no runtime calls)', () => {
    const { runtime, calls } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
      },
      { initial: TimecodeState.Playback.init().state },
    );

    const s = loop.get();
    expect(s).to.have.property('state');
    expect(calls.length).to.eql(0);
  });

  it('subscribes immediately with the current snapshot', () => {
    const { runtime } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
      },
      { initial: TimecodeState.Playback.init().state },
    );

    const first = loop.get();
    let seen: t.PlaybackRunnerState | undefined;

    const unsubscribe = loop.subscribe((s) => (seen = s));
    unsubscribe();

    expect(seen).to.eql(first);
  });

  it('executes exactly the reducer-issued runtime-affecting cmds for a given input', () => {
    const { runtime, calls } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
      },
      { initial: TimecodeState.Playback.init().state },
    );

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
    const { runtime } = createRuntime();

    const trace: Array<'e' | 'c' | 'n'> = [];

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
        onEvent: () => trace.push('e'),
        onCmd: () => trace.push('c'),
      },
      { initial: TimecodeState.Playback.init().state },
    );

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
    const { runtime } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
      },
      { initial: TimecodeState.Playback.init().state },
    );

    let count = 0;
    const unsubscribe = loop.subscribe(() => count++);

    expect(count).to.eql(1);
    unsubscribe();

    loop.send({ kind: 'playback:init', timeline: timeline() });
    loop.send({ kind: 'playback:play' });

    expect(count).to.eql(1);
  });

  it('dispose clears subscribers', () => {
    const { runtime } = createRuntime();

    const loop = createRunnerLoop(
      {
        machine: TimecodeState.Playback,
        runtime,
        project: (state) => ({
          state,
          phase: state.phase,
          intent: state.intent,
          currentBeat: state.currentBeat,
          decks: state.decks,
        }),
      },
      { initial: TimecodeState.Playback.init().state },
    );

    let count = 0;
    loop.subscribe(() => count++);

    expect(count).to.eql(1);
    loop.dispose();

    loop.send({ kind: 'playback:init', timeline: timeline() });
    loop.send({ kind: 'playback:play' });

    expect(count).to.eql(1);
  });
});
