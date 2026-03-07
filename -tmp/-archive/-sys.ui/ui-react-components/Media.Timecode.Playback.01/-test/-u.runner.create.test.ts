import { describe, expect, it } from '../../../-test.ts';
import { type t, TimecodeState } from '../common.ts';
import { createRunner } from '../u.runner.create.ts';
import { createRuntime, expectedCallsFromCmds, flushSignals, timeline } from './u.fixture.ts';

describe('Playback.runner', () => {
  type CreateArgs = {
    readonly onEvent?: (e: t.TimecodeState.Playback.Event) => void;
    readonly onCmd?: (cmd: t.TimecodeState.Playback.Cmd) => void;
  };

  function create(args: CreateArgs = {}): {
    readonly runner: t.PlaybackRunner;
    readonly runtime: t.PlaybackRuntime;
    readonly calls: ReturnType<typeof createRuntime>['calls'];
  } {
    const { runtime, calls } = createRuntime();

    // Use createRunner directly so tests can inject onEvent/onCmd.
    const runner = createRunner({
      runtime,
      onEvent: args.onEvent,
      onCmd: args.onCmd,
    });

    return { runner, runtime, calls } as const;
  }

  it('creates a runner with deterministic initial state (no runtime calls)', () => {
    const { runner, calls } = create();

    const s = runner.get();
    expect(s).to.have.property('state');
    expect(calls.length).to.eql(0);
  });

  it('subscribes immediately with the current snapshot', () => {
    const { runner } = create();

    const first = runner.get();
    let seen: t.PlaybackRunnerState | undefined;

    const unsubscribe = runner.subscribe((s) => (seen = s));
    unsubscribe();
    expect(seen).to.eql(first);
  });

  it('Law: events → cmds → notify (single send flush)', () => {
    const trace: Array<'e' | 'c' | 'n'> = [];
    const { runner } = create({
      onEvent: () => trace.push('e'),
      onCmd: () => trace.push('c'),
    });

    // Subscribe once; then clear to observe only a single send flush.
    const unsubscribe = runner.subscribe(() => trace.push('n'));
    trace.length = 0;

    // Arrange: ensure there will be runtime cmds in the flush.
    runner.send({ kind: 'playback:init', timeline: timeline() });
    trace.length = 0;

    // Act: one flush.
    runner.send({ kind: 'playback:play' });

    // Assert: notify happens exactly once, and after any events/cmds.
    const nIdx = trace.indexOf('n');
    expect(nIdx).to.not.eql(-1);

    const lastEC = Math.max(trace.lastIndexOf('e'), trace.lastIndexOf('c'));
    expect(nIdx).to.be.greaterThan(lastEC);

    // If events exist, they must all occur before the first cmd.
    const firstC = trace.indexOf('c');
    if (firstC !== -1) {
      const lastE = trace.lastIndexOf('e');
      if (lastE !== -1) expect(lastE).to.be.lessThan(firstC);
    }

    unsubscribe();
    runner.dispose();
  });

  it('executes exactly the reducer-issued runtime-affecting cmds for a given input', () => {
    const { runner, calls } = create();

    // Ensure deterministic machine baseline for the expectation comparison:
    runner.send({ kind: 'playback:init', timeline: timeline() });
    calls.length = 0;

    const input: t.TimecodeState.Playback.Input = { kind: 'playback:play' };
    const before = runner.get().state;

    const update = TimecodeState.Playback.reduce(before, input);
    const expectedCalls = expectedCallsFromCmds(update.cmds);

    runner.send(input);
    expect(calls).to.eql(expectedCalls);
  });

  it('unsubscribe stops further notifications', () => {
    const { runner } = create();
    let count = 0;
    const unsubscribe = runner.subscribe(() => count++);

    expect(count).to.eql(1);
    unsubscribe();

    runner.send({ kind: 'playback:init', timeline: timeline() });
    runner.send({ kind: 'playback:play' });
    expect(count).to.eql(1);
  });

  it('dispose clears subscribers', () => {
    const { runner } = create();
    let count = 0;
    runner.subscribe(() => count++);

    expect(count).to.eql(1);
    runner.dispose();

    runner.send({ kind: 'playback:init', timeline: timeline() });
    runner.send({ kind: 'playback:play' });
    expect(count).to.eql(1);
  });

  it('wires deck.endedTick → video:ended (active deck ends → machine ended)', async () => {
    const { runner, runtime } = create();
    runner.send({ kind: 'playback:init', timeline: timeline() });
    expect(runner.get().state.phase).to.eql('active');

    const decks = runtime.decks;
    expect(!!decks).to.eql(true);

    // Active deck is 'A' after init (by reducer policy).
    const a = decks?.get('A');
    expect(!!a).to.eql(true);

    // Bump endedTick → should emit input video:ended(deck:'A') → phase:'ended'.
    a!.props.endedTick.value += 1;

    await flushSignals();

    expect(runner.get().state.phase).to.eql('ended');
    runner.dispose();
  });

  it('dispose stops endedTick wiring (no further video:ended inputs)', async () => {
    const { runner, runtime } = create();
    runner.send({ kind: 'playback:init', timeline: timeline() });
    expect(runner.get().state.phase).to.eql('active');

    const a = runtime.decks?.get('A');
    expect(!!a).to.eql(true);

    runner.dispose();

    // If listeners are disposed, this should NOT advance the machine.
    a!.props.endedTick.value += 1;

    await flushSignals();

    expect(runner.get().state.phase).to.eql('active');
  });

  it('video:time beat advance while intent:play re-asserts cmd:deck:play (prevents “grid advances but media paused”)', () => {
    const { runner, calls } = create();

    runner.send({ kind: 'playback:init', timeline: timeline() });
    runner.send({ kind: 'playback:play' });

    calls.length = 0;

    // vTime crosses from beat 0 → beat 1 (timeline fixture is 0/1000/2000/3000)
    runner.send({ kind: 'video:time', deck: 'A', vTime: 1500 as t.Msecs });

    const played = calls.some((c) => c.kind === 'play' && c.deck === 'A');
    expect(played).to.eql(true);
  });
});
