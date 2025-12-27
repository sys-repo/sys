import { type t, describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

/**
 * Navigation invariants for Playback.reduce
 *
 * Explicit navigation rules:
 * - next / prev / seek always resolve a target beat
 * - explicit navigation may reassert deck load even if beat is unchanged
 * - beat events emit iff the beat actually changes
 */
describe('Playback.reduce — navigation', () => {
  function initState() {
    return Playback.reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    }).state;
  }

  function beatEvent(events: readonly t.PlaybackEvent[]) {
    return events.find((e) => e.kind === 'playback:beat');
  }

  function hasLoad(cmds: readonly any[]) {
    return cmds.some((c) => c.kind === 'cmd:deck:load');
  }

  it('seek:beat clamps below 0 to 0 and loads', () => {
    const state1 = Playback.reduce(initState(), {
      kind: 'playback:seek:beat',
      beat: 1,
    }).state;

    const res = Playback.reduce(state1, {
      kind: 'playback:seek:beat',
      beat: -100,
    });

    expect(res.state.currentBeat).to.eql(0);
    expect(hasLoad(res.cmds)).to.eql(true);

    const evt = beatEvent(res.events);
    expect(evt?.beat).to.eql(0);
  });

  it('seek:beat clamps above max to max and loads', () => {
    const state = initState();
    const max = timeline().beats.length - 1;

    const res = Playback.reduce(state, {
      kind: 'playback:seek:beat',
      beat: 999,
    });

    expect(res.state.currentBeat).to.eql(max);
    expect(hasLoad(res.cmds)).to.eql(true);

    const evt = beatEvent(res.events);
    expect(evt?.beat).to.eql(max);
  });

  it('next advances by +1 and loads; no-op at end reasserts load without beat event', () => {
    const state0 = Playback.reduce(initState(), {
      kind: 'playback:seek:beat',
      beat: 0,
    }).state;

    const r1 = Playback.reduce(state0, { kind: 'playback:next' });
    expect(r1.state.currentBeat).to.eql(1);
    expect(hasLoad(r1.cmds)).to.eql(true);
    expect(beatEvent(r1.events)?.beat).to.eql(1);

    const r2 = Playback.reduce(r1.state, { kind: 'playback:next' });
    expect(r2.state.currentBeat).to.eql(2);
    expect(hasLoad(r2.cmds)).to.eql(true);
    expect(beatEvent(r2.events)?.beat).to.eql(2);

    const r3 = Playback.reduce(r2.state, { kind: 'playback:next' });
    expect(r3.state.currentBeat).to.eql(2); // clamped
    expect(hasLoad(r3.cmds)).to.eql(true); // idempotent reassert
    expect(beatEvent(r3.events)).to.eql(undefined);
  });

  it('prev moves by -1 and loads; no-op at start reasserts load without beat event', () => {
    const state2 = Playback.reduce(initState(), {
      kind: 'playback:seek:beat',
      beat: 2,
    }).state;

    const r1 = Playback.reduce(state2, { kind: 'playback:prev' });
    expect(r1.state.currentBeat).to.eql(1);
    expect(hasLoad(r1.cmds)).to.eql(true);
    expect(beatEvent(r1.events)?.beat).to.eql(1);

    const r2 = Playback.reduce(r1.state, { kind: 'playback:prev' });
    expect(r2.state.currentBeat).to.eql(0);
    expect(hasLoad(r2.cmds)).to.eql(true);
    expect(beatEvent(r2.events)?.beat).to.eql(0);

    const r3 = Playback.reduce(r2.state, { kind: 'playback:prev' });
    expect(r3.state.currentBeat).to.eql(0); // clamped
    expect(hasLoad(r3.cmds)).to.eql(true); // idempotent reassert
    expect(beatEvent(r3.events)).to.eql(undefined);
  });

  it('vTime tracks beat boundary for init/navigation, and runner vTime for video:time', () => {
    const tl = timeline();

    // init seeds vTime to the selected beat boundary.
    const state0 = initState();
    expect(state0.currentBeat).to.eql(0);
    expect(state0.vTime).to.eql(tl.beats[0]!.vTime);

    // explicit navigation keeps vTime consistent with the target beat boundary.
    const a = Playback.reduce(state0, { kind: 'playback:seek:beat', beat: 1 });
    expect(a.state.currentBeat).to.eql(1);
    expect(a.state.vTime).to.eql(tl.beats[1]!.vTime);

    const b = Playback.reduce(a.state, { kind: 'playback:next' });
    expect(b.state.currentBeat).to.eql(2);
    expect(b.state.vTime).to.eql(tl.beats[2]!.vTime);

    const c = Playback.reduce(b.state, { kind: 'playback:prev' });
    expect(c.state.currentBeat).to.eql(1);
    expect(c.state.vTime).to.eql(tl.beats[1]!.vTime);

    // runner time is authoritative and can be within-beat.
    const d = Playback.reduce(c.state, {
      kind: 'video:time',
      deck: c.state.decks.active,
      vTime: 1500,
    });
    expect(d.state.currentBeat).to.eql(1);
    expect(d.state.vTime).to.eql(1500);
  });

  it('video:time within the same beat updates vTime (no cmds/events; no beat event)', () => {
    const state = Playback.reduce(initState(), { kind: 'playback:seek:beat', beat: 1 }).state;
    const res = Playback.reduce(state, {
      kind: 'video:time',
      deck: state.decks.active,
      vTime: 1500,
    });

    expect(res.state.currentBeat).to.eql(1);
    expect(res.state.vTime).to.eql(1500);

    expect(res.cmds.length).to.eql(0);
    expect(res.events.length).to.eql(0);
    expect(beatEvent(res.events)).to.eql(undefined);
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
