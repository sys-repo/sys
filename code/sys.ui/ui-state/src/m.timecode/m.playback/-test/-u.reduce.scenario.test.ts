import { type t, describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

/**
 * Scenario tests for Playback.reduce
 *
 * These are end-to-end reducer narratives.
 * They validate that multiple inputs compose coherently over time,
 * without asserting internal mechanics step-by-step.
 */
describe('Playback.reduce — scenarios', () => {
  it('init → play → video:time → pause → video:time → resume', () => {
    let state = emptyState();

    // init with timeline
    let res = Playback.reduce(state, {
      kind: 'playback:init',
      timeline: timeline(),
    });

    state = res.state;
    expect(state.phase).to.eql('active');
    expect(state.currentBeat).to.eql(0);

    // play
    res = Playback.reduce(state, { kind: 'playback:play' });
    state = res.state;

    expect(state.intent).to.eql('play');

    // time advances
    res = Playback.reduce(state, { kind: 'video:time', deck: 'A', vTime: 1000 });
    state = res.state;

    expect(state.currentBeat).to.eql(1);

    // pause (intent changes; time may still move)
    res = Playback.reduce(state, { kind: 'playback:pause' });
    state = res.state;

    expect(state.intent).to.eql('pause');

    // time progresses while paused (reality updates; intent stays pause)
    res = Playback.reduce(state, { kind: 'video:time', deck: 'A', vTime: 2000 });
    state = res.state;

    expect(state.currentBeat).to.eql(2);
    expect(state.intent).to.eql('pause');

    // resume
    res = Playback.reduce(state, { kind: 'playback:play' });
    state = res.state;

    expect(state.intent).to.eql('play');
  });

  it('init → next → next → prev clamps at bounds', () => {
    let state = emptyState();

    state = Playback.reduce(state, { kind: 'playback:init', timeline: timeline() }).state;
    expect(state.currentBeat).to.eql(0);

    state = Playback.reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(1);

    state = Playback.reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(2);

    // beyond last beat clamps
    state = Playback.reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(2);

    // back again
    state = Playback.reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(1);

    state = Playback.reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(0);

    // below zero clamps
    state = Playback.reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(0);
  });

  it('stop resets intent but preserves timeline and beat', () => {
    let state = emptyState();

    state = Playback.reduce(state, {
      kind: 'playback:init',
      timeline: timeline(),
    }).state;

    state = Playback.reduce(state, { kind: 'playback:play' }).state;
    state = Playback.reduce(state, { kind: 'video:time', deck: 'A', vTime: 1000 }).state;
    expect(state.currentBeat).to.eql(1);

    state = Playback.reduce(state, { kind: 'playback:stop' }).state;
    expect(state.intent).to.eql('stop');
    expect(state.timeline).to.not.eql(undefined);
    expect(state.currentBeat).to.eql(1);
  });

  it('end → seek → play rearms playback (ended is not sticky across navigation)', () => {
    const tl = timeline();
    const lastBeat = tl.beats.length - 1;

    let state = emptyState();

    // init and start playing
    state = Playback.reduce(state, { kind: 'playback:init', timeline: tl }).state;
    state = Playback.reduce(state, { kind: 'playback:play' }).state;
    expect(state.intent).to.eql('play');

    // arrive at end (runtime signal)
    state = Playback.reduce(state, { kind: 'video:ended', deck: state.decks.active }).state;

    // navigate back to a beat and re-play → should not remain in "ended" behavior
    state = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 0 }).state;
    expect(state.currentBeat).to.eql(0);
    expect(state.vTime).to.eql(tl.beats[0]!.vTime);

    state = Playback.reduce(state, { kind: 'playback:play' }).state;
    expect(state.intent).to.eql('play');

    // sanity: time updates should still be accepted and move beat forward
    state = Playback.reduce(state, {
      kind: 'video:time',
      deck: state.decks.active,
      vTime: tl.beats[lastBeat]!.vTime,
    }).state;
    expect(state.currentBeat).to.eql(lastBeat);
    expect(state.vTime).to.eql(tl.beats[lastBeat]!.vTime);
  });

  it('play → ended makes intent stop; seek re-arms phase but does not auto-resume', () => {
    let state = emptyState();

    state = Playback.reduce(state, { kind: 'playback:init', timeline: timeline() }).state;
    state = Playback.reduce(state, { kind: 'playback:play' }).state;
    expect(state.intent).to.eql('play');

    // Active deck ends.
    state = Playback.reduce(state, { kind: 'video:ended', deck: state.decks.active }).state;
    expect(state.phase).to.eql('ended');
    expect(state.intent).to.eql('stop');

    // User navigates after end: phase re-arms, but does not resume.
    state = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 1 }).state;
    expect(state.phase).to.eql('active');
    expect(state.intent).to.eql('stop');
    expect(state.currentBeat).to.eql(1);
  });

  it('terminal end wins; stale video:time is ignored until user re-arms', () => {
    const tl: t.PlaybackTimeline = {
      beats: [
        {
          index: 0 as t.PlaybackBeatIndex,
          vTime: 0 as t.Msecs,
          duration: 1000 as t.Msecs,
          segmentId: 'seg:0',
        },
      ],
      segments: [{ id: 'seg:0', beat: { from: 0, to: 1 } }],
      virtualDuration: 1000 as t.Msecs,
    };

    let state = emptyState();

    // init and play
    state = Playback.reduce(state, { kind: 'playback:init', timeline: tl }).state;
    state = Playback.reduce(state, { kind: 'playback:play' }).state;
    expect(state.intent).to.eql('play');

    // terminal ended (no next segment exists)
    state = Playback.reduce(state, { kind: 'video:ended', deck: state.decks.active }).state;
    expect(state.phase).to.eql('ended');
    expect(state.intent).to.eql('stop');

    const endedState = state;

    // stale time tick arrives late → must be ignored
    state = Playback.reduce(state, {
      kind: 'video:time',
      deck: state.decks.active,
      vTime: 500 as t.Msecs,
    }).state;

    expect(state).to.equal(endedState);

    // user rearms explicitly
    state = Playback.reduce(state, { kind: 'playback:seek:beat', beat: 0 }).state;
    expect(state.phase).to.eql('active');
    expect(state.currentBeat).to.eql(0);

    // now time is accepted again
    state = Playback.reduce(state, {
      kind: 'video:time',
      deck: state.decks.active,
      vTime: 750 as t.Msecs,
    }).state;
    expect(state.vTime).to.eql(750);
  });
});
