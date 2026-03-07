import { type t, describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

type SeekCmd = Extract<t.PlaybackCmd, { readonly kind: 'cmd:deck:seek' }>;
type PlayCmd = Extract<t.PlaybackCmd, { readonly kind: 'cmd:deck:play' }>;

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
    const prev = emptyState();
    return Playback.reduce(prev, { kind: 'playback:init', timeline: timeline() }).state;
  }

  function beatEvent(events: readonly t.PlaybackEvent[]) {
    return events.find((e) => e.kind === 'playback:beat');
  }

  function hasLoad(cmds: readonly t.PlaybackCmd[]) {
    return cmds.some((c) => c.kind === 'cmd:deck:load');
  }

  function hasSeek(cmds: readonly t.PlaybackCmd[]) {
    return cmds.some((c) => c.kind === 'cmd:deck:seek');
  }

  function seekCmd(cmds: readonly t.PlaybackCmd[]): SeekCmd | undefined {
    return cmds.find((c): c is SeekCmd => c.kind === 'cmd:deck:seek');
  }

  function hasPlay(cmds: readonly t.PlaybackCmd[]) {
    return cmds.some((c) => c.kind === 'cmd:deck:play');
  }

  function playCmd(cmds: readonly t.PlaybackCmd[]): PlayCmd | undefined {
    return cmds.find((c): c is PlayCmd => c.kind === 'cmd:deck:play');
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

  it('navigation preserves phase (except re-arms ended → active)', () => {
    // Non-ended phases are preserved.
    const state = initState();
    const phase = state.phase;

    const a = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 1 });
    expect(a.state.phase).to.eql(phase);

    const b = Playback.reduce(a.state, { kind: 'playback:next' });
    expect(b.state.phase).to.eql(phase);

    const c = Playback.reduce(b.state, { kind: 'playback:prev' });
    expect(c.state.phase).to.eql(phase);

    // Ended is special: explicit navigation must re-arm to allow clock/runner to resume.
    const ended: typeof state = { ...state, phase: 'ended' };

    const s1 = Playback.reduce(ended, { kind: 'playback:seek:beat', beat: 1 });
    expect(s1.state.phase).to.eql('active');

    const s2 = Playback.reduce(ended, { kind: 'playback:next' });
    expect(s2.state.phase).to.eql('active');

    const s3 = Playback.reduce(ended, { kind: 'playback:prev' });
    expect(s3.state.phase).to.eql('active');

    const s4 = Playback.reduce(ended, { kind: 'playback:play' });
    expect(s4.state.phase).to.eql('active');
    expect(s4.state.intent).to.eql('play');
    expect(playCmd(s4.cmds)?.deck).to.eql(s4.state.decks.active);
  });

  it('explicit navigation emits cmd:deck:seek for active deck to beat boundary vTime', () => {
    const tl = timeline();
    const state0 = initState();
    const res = Playback.reduce(state0, { kind: 'playback:seek:beat', beat: 1 });

    expect(hasSeek(res.cmds)).to.eql(true);

    const cmd = seekCmd(res.cmds);
    expect(cmd?.deck).to.eql(res.state.decks.active);
    expect(cmd?.vTime).to.eql(tl.beats[1]!.vTime);
  });

  it('next/prev emit cmd:deck:seek to the target beat boundary', () => {
    const tl = timeline();
    const state0 = Playback.reduce(initState(), { kind: 'playback:seek:beat', beat: 1 }).state;

    const a = Playback.reduce(state0, { kind: 'playback:next' });
    expect(seekCmd(a.cmds)?.deck).to.eql(a.state.decks.active);
    expect(seekCmd(a.cmds)?.vTime).to.eql(tl.beats[2]!.vTime);

    const b = Playback.reduce(a.state, { kind: 'playback:prev' });
    expect(seekCmd(b.cmds)?.deck).to.eql(b.state.decks.active);
    expect(seekCmd(b.cmds)?.vTime).to.eql(tl.beats[1]!.vTime);
  });

  it('navigation does not force play when intent is stop/pause (no cmd:deck:play)', () => {
    // Baseline: init sets intent:'stop'
    const s0 = initState();
    expect(s0.intent).to.eql('stop');

    const a = Playback.reduce(s0, { kind: 'playback:seek:beat', beat: 1 });
    expect(hasPlay(a.cmds)).to.eql(false);

    const b = Playback.reduce(a.state, { kind: 'playback:next' });
    expect(hasPlay(b.cmds)).to.eql(false);

    const c = Playback.reduce(b.state, { kind: 'playback:prev' });
    expect(hasPlay(c.cmds)).to.eql(false);

    // Now set pause intent explicitly and confirm navigation still doesn’t force play.
    const paused = Playback.reduce(c.state, { kind: 'playback:pause' }).state;
    expect(paused.intent).to.eql('pause');

    const d = Playback.reduce(paused, { kind: 'playback:seek:beat', beat: 2 });
    expect(hasPlay(d.cmds)).to.eql(false);
  });

  it('navigation reasserts play when intent is play (emits cmd:deck:play for active deck)', () => {
    const s0 = initState();

    // Establish intent:'play' in state.
    const s1 = Playback.reduce(s0, { kind: 'playback:play' }).state;
    expect(s1.intent).to.eql('play');

    const a = Playback.reduce(s1, { kind: 'playback:seek:beat', beat: 1 });
    expect(playCmd(a.cmds)?.deck).to.eql(a.state.decks.active);

    const b = Playback.reduce(a.state, { kind: 'playback:next' });
    expect(playCmd(b.cmds)?.deck).to.eql(b.state.decks.active);

    const c = Playback.reduce(b.state, { kind: 'playback:prev' });
    expect(playCmd(c.cmds)?.deck).to.eql(c.state.decks.active);
  });
});
