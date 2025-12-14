import { type t, describe, expect, it } from '../../../-test.ts';
import { reduce } from '../u.reduce.ts';
import { emptyState, timeline } from './u.fixture.ts';

/**
 * Invariants for Playback.reduce
 *
 * These tests lock the non-negotiable laws of motion:
 * - Determinism
 * - Authority boundaries
 * - Time-flow constraints
 */
describe('Playback.reduce — invariants', () => {
  it('is deterministic: same input yields same output', () => {
    const state = emptyState();
    const input: t.PlaybackInput = {
      kind: 'playback:init',
      timeline: timeline(),
    };

    const a = reduce(state, input);
    const b = reduce(state, input);

    expect(a.state).to.eql(b.state);
    expect(a.cmds).to.eql(b.cmds);
    expect(a.events).to.eql(b.events);
  });

  it('does not advance beat without a timeline', () => {
    const state = emptyState();
    const res = reduce(state, { kind: 'video:time', deck: 'A', vTime: 1000 as t.Msecs });

    expect(res.state.currentBeat).to.eql(undefined);
    expect(res.events.length).to.eql(0);
  });

  it('does not change currentBeat except via video:time or explicit navigation', () => {
    const init = reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });

    const state = init.state;

    const nonBeatChangingInputs: t.PlaybackInput[] = [
      { kind: 'playback:play' },
      { kind: 'playback:pause' },
      { kind: 'playback:stop' },
      { kind: 'runner:ready' },
    ];

    for (const input of nonBeatChangingInputs) {
      const res = reduce(state, input);
      expect(res.state.currentBeat).to.eql(state.currentBeat);
    }
  });

  it('video:time advances beat monotonically for increasing time', () => {
    const init = reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });

    const t1 = reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000 as t.Msecs,
    });

    const t2 = reduce(t1.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 2000 as t.Msecs,
    });

    expect(t2.state.currentBeat).to.eql(2);
  });

  it('video:time emits beat event iff beat actually changes', () => {
    const init = reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });

    const first = reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 0 as t.Msecs,
    });

    expect(first.events.length).to.eql(0);

    const second = reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000 as t.Msecs,
    });

    expect(second.events.some((e) => e.kind === 'playback:beat')).to.eql(true);
  });

  it('never emits playback:beat with undefined beat', () => {
    const res = reduce(emptyState(), {
      kind: 'playback:play',
    });

    expect(
      res.events.some((e) => e.kind === 'playback:beat' && (e as any).beat === undefined),
    ).to.eql(false);
  });
});
