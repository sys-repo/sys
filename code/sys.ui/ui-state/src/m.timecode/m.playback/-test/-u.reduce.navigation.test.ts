import { type t, describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

/**
 * Navigation invariants for Playback.reduce
 *
 * These tests lock explicit, discrete beat navigation:
 *  - next/prev/seek change the beat deterministically
 *  - beat indices clamp to valid range
 *  - navigation emits `playback:beat` iff the beat actually changes
 *
 * Note: navigation is explicit (not time-driven). `video:time` is tested elsewhere.
 */
describe('Playback.reduce — navigation', () => {
  function initState() {
    return Playback.reduce(emptyState(), { kind: 'playback:init', timeline: timeline() }).state;
  }

  function beatEvent(events: readonly t.PlaybackEvent[]) {
    return events.find((e) => e.kind === 'playback:beat') as
      | { readonly kind: 'playback:beat'; readonly beat: t.PlaybackBeatIndex }
      | undefined;
  }

  it('seek:beat clamps below 0 to 0', () => {
    // Start from a non-zero beat so the clamp produces an actual change.
    const state1 = Playback.reduce(initState(), { kind: 'playback:seek:beat', beat: 1 }).state;

    const res = Playback.reduce(state1, { kind: 'playback:seek:beat', beat: -100 });
    expect(res.state.currentBeat).to.eql(0);

    const evt = beatEvent(res.events);
    expect(evt?.beat).to.eql(0);
  });

  it('seek:beat clamps above max to max', () => {
    const state = initState();
    const max = timeline().beats.length - 1;

    const res = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 999 });

    expect(res.state.currentBeat).to.eql(max);

    const evt = beatEvent(res.events);
    expect(evt?.beat).to.eql(max);
  });

  it('next advances by +1 (clamped)', () => {
    const state0 = Playback.reduce(initState(), { kind: 'playback:seek:beat', beat: 0 }).state;

    const res1 = Playback.reduce(state0, { kind: 'playback:next' });
    expect(res1.state.currentBeat).to.eql(1);

    const evt1 = beatEvent(res1.events);
    expect(evt1?.beat).to.eql(1);

    const res2 = Playback.reduce(res1.state, { kind: 'playback:next' });
    expect(res2.state.currentBeat).to.eql(2);

    const evt2 = beatEvent(res2.events);
    expect(evt2?.beat).to.eql(2);

    const res3 = Playback.reduce(res2.state, { kind: 'playback:next' });
    expect(res3.state.currentBeat).to.eql(2); // clamp at end

    const evt3 = beatEvent(res3.events);
    expect(evt3).to.eql(undefined); // no change => no beat event
  });

  it('prev moves by -1 (clamped)', () => {
    const state2 = Playback.reduce(initState(), { kind: 'playback:seek:beat', beat: 2 }).state;

    const res1 = Playback.reduce(state2, { kind: 'playback:prev' });
    expect(res1.state.currentBeat).to.eql(1);

    const evt1 = beatEvent(res1.events);
    expect(evt1?.beat).to.eql(1);

    const res2 = Playback.reduce(res1.state, { kind: 'playback:prev' });
    expect(res2.state.currentBeat).to.eql(0);

    const evt2 = beatEvent(res2.events);
    expect(evt2?.beat).to.eql(0);

    const res3 = Playback.reduce(res2.state, { kind: 'playback:prev' });
    expect(res3.state.currentBeat).to.eql(0); // clamp at start

    const evt3 = beatEvent(res3.events);
    expect(evt3).to.eql(undefined); // no change => no beat event
  });

  it('navigation never changes phase', () => {
    const state = initState();
    const phase = state.phase;

    const a = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 1 });
    expect(a.state.phase).to.eql(phase);

    const b = Playback.reduce(a.state, { kind: 'playback:next' });
    expect(b.state.phase).to.eql(phase);

    const c = Playback.reduce(b.state, { kind: 'playback:prev' });
    expect(c.state.phase).to.eql(phase);
  });
});
