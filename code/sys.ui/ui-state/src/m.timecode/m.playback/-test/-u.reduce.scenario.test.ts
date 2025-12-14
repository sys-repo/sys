import { describe, expect, it } from '../../../-test.ts';
import { reduce } from '../u.reduce.ts';
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
    let res = reduce(state, {
      kind: 'playback:init',
      timeline: timeline(),
    });

    state = res.state;
    expect(state.phase).to.eql('active');
    expect(state.currentBeat).to.eql(0);

    // play
    res = reduce(state, { kind: 'playback:play' });
    state = res.state;

    expect(state.intent).to.eql('play');

    // time advances
    res = reduce(state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000,
    });
    state = res.state;

    expect(state.currentBeat).to.eql(1);

    // pause (intent changes; time may still move)
    res = reduce(state, { kind: 'playback:pause' });
    state = res.state;

    expect(state.intent).to.eql('pause');

    // time progresses while paused (reality updates; intent stays pause)
    res = reduce(state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 2000,
    });
    state = res.state;

    expect(state.currentBeat).to.eql(2);
    expect(state.intent).to.eql('pause');

    // resume
    res = reduce(state, { kind: 'playback:play' });
    state = res.state;

    expect(state.intent).to.eql('play');
  });

  it('init → next → next → prev clamps at bounds', () => {
    let state = emptyState();

    state = reduce(state, {
      kind: 'playback:init',
      timeline: timeline(),
    }).state;

    expect(state.currentBeat).to.eql(0);

    state = reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(1);

    state = reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(2);

    // beyond last beat clamps
    state = reduce(state, { kind: 'playback:next' }).state;
    expect(state.currentBeat).to.eql(2);

    // back again
    state = reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(1);

    state = reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(0);

    // below zero clamps
    state = reduce(state, { kind: 'playback:prev' }).state;
    expect(state.currentBeat).to.eql(0);
  });

  it('stop resets intent but preserves timeline and beat', () => {
    let state = emptyState();

    state = reduce(state, {
      kind: 'playback:init',
      timeline: timeline(),
    }).state;

    state = reduce(state, { kind: 'playback:play' }).state;

    state = reduce(state, {
      kind: 'video:time',
      deck: 'A',
      vTime: 1000,
    }).state;

    expect(state.currentBeat).to.eql(1);

    state = reduce(state, { kind: 'playback:stop' }).state;

    expect(state.intent).to.eql('stop');
    expect(state.timeline).to.not.eql(undefined);
    expect(state.currentBeat).to.eql(1);
  });
});
