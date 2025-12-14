import { describe, expect, it } from '../../../-test.ts';
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
});
