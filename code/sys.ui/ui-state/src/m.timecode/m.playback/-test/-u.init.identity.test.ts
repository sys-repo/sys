import { describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';

/**
 * Identity & neutrality guarantees for Playback.init
 *
 * These tests assert what init MUST NOT do:
 * - No runtime or media-side effects
 * - No implicit playback intent
 * - No beat or deck activity
 *
 * Init is allowed to emit structural/diagnostic events
 * (e.g. phase declaration), but nothing more.
 */
describe('Playback.init — identity', () => {
  it('returns no commands when called with no arguments (idle-safe)', () => {
    const res = Playback.init();

    expect(res.cmds.length).to.eql(0);
  });

  it('does not emit runtime or media-driven events when idle-safe', () => {
    const res = Playback.init();

    expect(
      res.events.some((e) =>
        [
          'playback:beat',
          'playback:deck:status',
          'video:ready',
          'video:buffering',
          'video:ended',
          'playback:error',
        ].includes(e.kind),
      ),
    ).to.eql(false);
  });

  it('does not imply playback intent when idle-safe', () => {
    const res = Playback.init();

    expect(res.state.intent).to.eql('stop');
  });

  it('does not attach a timeline when idle-safe', () => {
    const res = Playback.init();

    expect(res.state.timeline).to.eql(undefined);
    expect(res.state.currentBeat).to.eql(undefined);
  });

  it('remains in idle phase when no timeline is provided', () => {
    const res = Playback.init();

    expect(res.state.phase).to.eql('idle');
  });
});
