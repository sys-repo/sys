import { describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { timeline } from './u.fixture.ts';

/**
 * Argument handling for Playback.init
 *
 * These tests define how optional inputs are interpreted:
 * - timeline presence
 * - startBeat behavior
 * - clamping rules
 * - idle-safe defaults
 *
 * This file must NOT assert reducer or runtime behavior.
 */
describe('Playback.init - arguments', () => {
  it('accepts timeline only (defaults startBeat to 0)', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(res.state.timeline).to.eql(timeline());
    expect(res.state.currentBeat).to.eql(0);
  });

  it('sets initial beat when startBeat is provided', () => {
    const res = Playback.init({
      timeline: timeline(),
      startBeat: 1,
    });

    expect(res.state.currentBeat).to.eql(1);
  });

  it('clamps startBeat below 0 to first beat', () => {
    const res = Playback.init({
      timeline: timeline(),
      startBeat: -10,
    });

    expect(res.state.currentBeat).to.eql(0);
  });

  it('clamps startBeat above range to last beat', () => {
    const res = Playback.init({
      timeline: timeline(),
      startBeat: 999,
    });

    expect(res.state.currentBeat).to.eql(2);
  });

  it('accepts undefined args (idle-safe init)', () => {
    const res = Playback.init();

    expect(res.state.timeline).to.eql(undefined);
    expect(res.state.currentBeat).to.eql(undefined);
    expect(res.state.phase).to.eql('idle');
  });

  it('does not emit beat events during init argument processing', () => {
    const res = Playback.init({
      timeline: timeline(),
      startBeat: 1,
    });

    expect(res.events.some((e) => e.kind === 'playback:beat')).to.eql(false);
  });
});
