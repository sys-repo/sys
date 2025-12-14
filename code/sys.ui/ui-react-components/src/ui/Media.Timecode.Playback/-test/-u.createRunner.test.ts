import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, TimecodeState } from '../common.ts';
import { Playback } from '../mod.ts';
import { createRuntime, expectedCallsFromCmds, timeline } from './u.fixture.ts';
import { createRunner } from '../u.createRunner.ts';

describe('Playback.runner', () => {
  it('exposes the expected API shape', () => {
    expectTypeOf(Playback.runner).toMatchTypeOf<(args: t.PlaybackRunnerArgs) => t.PlaybackRunner>();
  });

  it('creates a runner with deterministic initial state (no runtime calls)', () => {
    const { runtime, calls } = createRuntime();
    const runner = Playback.runner({ runtime });

    const s = runner.get();
    expect(s).to.have.property('state');
    expect(calls.length).to.eql(0);
  });

  it('subscribes immediately with the current snapshot', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });

    const first = runner.get();
    let seen: t.PlaybackRunnerState | undefined;

    const unsubscribe = runner.subscribe((s) => (seen = s));
    unsubscribe();

    expect(seen).to.eql(first);
  });

  it('law: events → cmds → notify (single send flush)', () => {
    const { runtime } = createRuntime();

    const order: Array<'event' | 'cmd' | 'notify'> = [];

    // Use createRunner directly so we can inject onEvent/onCmd.
    const runner = createRunner({
      runtime,
      onEvent: () => order.push('event'),
      onCmd: () => order.push('cmd'),
    });

    const unsubscribe = runner.subscribe(() => order.push('notify'));
    order.length = 0; // drop the initial subscribe-notify

    runner.send({ kind: 'playback:init', timeline: timeline() });

    expect(order[0]).to.eql('event'); // events first
    expect(order.includes('cmd')).to.eql(true); // cmds occurred (likely load/ready/etc)
    expect(order[order.length - 1]).to.eql('notify'); // notify last

    unsubscribe();
    runner.dispose();
  });

  it('executes exactly the reducer-issued runtime-affecting cmds for a given input', () => {
    const { runtime, calls } = createRuntime();
    const runner = Playback.runner({ runtime });

    calls.length = 0;
    const input: t.TimecodeState.Playback.Input = { kind: 'playback:play' };

    const before = runner.get().state;
    const update = TimecodeState.Playback.reduce(before, input);
    const expectedCalls = expectedCallsFromCmds(update.cmds);

    runner.send(input);
    expect(calls).to.eql(expectedCalls);
  });

  it('unsubscribe stops further notifications', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });

    let count = 0;
    const unsubscribe = runner.subscribe(() => count++);

    expect(count).to.eql(1);
    unsubscribe();

    runner.send({ kind: 'playback:init', timeline: timeline() });
    runner.send({ kind: 'playback:play' });

    expect(count).to.eql(1);
  });

  it('dispose clears subscribers', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });

    let count = 0;
    runner.subscribe(() => count++);

    expect(count).to.eql(1);
    runner.dispose();
    runner.send({ kind: 'playback:init', timeline: timeline() });
    runner.send({ kind: 'playback:play' });
    expect(count).to.eql(1);
  });
});
