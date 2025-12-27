import { type t, describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
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

    const a = Playback.reduce(state, input);
    const b = Playback.reduce(state, input);

    expect(a.state).to.eql(b.state);
    expect(a.cmds).to.eql(b.cmds);
    expect(a.events).to.eql(b.events);
  });

  it('does not advance beat without a timeline', () => {
    const state = emptyState();
    const res = Playback.reduce(state, { kind: 'video:time', deck: 'A', vTime: 1000 as t.Msecs });

    expect(res.state.currentBeat).to.eql(undefined);
    expect(res.events.length).to.eql(0);
  });

  it('does not change currentBeat except via video:time or explicit navigation', () => {
    const init = Playback.reduce(emptyState(), {
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
      const res = Playback.reduce(state, input);
      expect(res.state.currentBeat).to.eql(state.currentBeat);
      // NOTE:
      // Cmds may still be emitted (e.g. ensure deck play/pause or load semantics).
      // The invariant here is strictly about beat authority, not cmd emptiness.
    }
  });

  it('video:time advances beat monotonically for increasing time', () => {
    const init = Playback.reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });

    const t1 = Playback.reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000 as t.Msecs,
    });

    const t2 = Playback.reduce(t1.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 2000 as t.Msecs,
    });

    expect(t2.state.currentBeat).to.eql(2);
  });

  it('video:time emits beat event iff beat actually changes', () => {
    const init = Playback.reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });

    const first = Playback.reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 0 as t.Msecs,
    });

    expect(first.events.length).to.eql(0);

    const second = Playback.reduce(init.state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000 as t.Msecs,
    });

    expect(second.events.some((e) => e.kind === 'playback:beat')).to.eql(true);
  });

  it('never emits playback:beat with undefined beat', () => {
    const res = Playback.reduce(emptyState(), {
      kind: 'playback:play',
    });

    expect(
      res.events.some((e) => e.kind === 'playback:beat' && (e as any).beat === undefined),
    ).to.eql(false);
  });

  it('navigation rearms time authority after video:ended (ended is not sticky)', () => {
    const tl = timeline();

    // Arrange: init and simulate an "ended" runtime signal.
    let state = Playback.reduce(emptyState(), { kind: 'playback:init', timeline: tl }).state;
    state = Playback.reduce(state, { kind: 'video:ended', deck: state.decks.active }).state;

    // Act: explicit navigation should reassert vTime = beat boundary.
    state = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 0 }).state;
    expect(state.currentBeat).to.eql(0);
    expect(state.vTime).to.eql(tl.beats[0]!.vTime);

    // And runner time remains authoritative after rearm.
    const res = Playback.reduce(state, {
      kind: 'video:time',
      deck: state.decks.active,
      vTime: 1500 as t.Msecs,
    });

    expect(res.state.currentBeat).to.eql(1);
    expect(res.state.vTime).to.eql(1500);
  });
});
