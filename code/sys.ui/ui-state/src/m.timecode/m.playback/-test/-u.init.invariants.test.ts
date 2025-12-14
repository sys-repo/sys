import { describe, expect, it } from '../../../-test.ts';
import { timeline } from './u.fixture.ts';
import { Playback } from '../mod.ts';

/**
 * Invariants for Playback.init
 *
 * These tests lock the non-negotiable guarantees of initialization:
 * - Deterministic output
 * - Stable initial phase and intent
 * - Explicit readiness semantics
 * - No time-driven progression
 */
describe('Playback.init - invariants', () => {
  it('is deterministic: same input yields same output', () => {
    const a = Playback.init({ timeline: timeline() });
    const b = Playback.init({ timeline: timeline() });

    expect(a.state).to.eql(b.state);
    expect(a.cmds).to.eql(b.cmds);
    expect(a.events).to.eql(b.events);
  });

  it('initializes into active phase with stop intent', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(res.state.phase).to.eql('active');
    expect(res.state.intent).to.eql('stop');
  });

  it('marks machine readiness true and leaves runner readiness unset', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(res.state.ready.machine).to.eql(true);
    expect(res.state.ready.runner).to.eql(undefined);
  });

  it('seeds an initial beat without advancing time or emitting beat events', () => {
    const res = Playback.init({ timeline: timeline() });

    // Initial beat is seeded, but not time-driven
    expect(res.state.currentBeat).to.eql(0);
    expect(res.events.some((e) => e.kind === 'playback:beat')).to.eql(false);
  });

  it('initializes decks to empty with A active and B standby', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(res.state.decks.active).to.eql('A');
    expect(res.state.decks.standby).to.eql('B');
    expect(res.state.decks.status.A).to.eql('empty');
    expect(res.state.decks.status.B).to.eql('empty');
  });

  it('does not emit runtime or media-driven events', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(
      res.events.some((e) =>
        ['playback:beat', 'playback:deck:status', 'video:ready'].includes(e.kind),
      ),
    ).to.eql(false);
  });

  it('does not issue playback or deck-control commands', () => {
    const res = Playback.init({ timeline: timeline() });

    expect(res.cmds.some((c) => ['cmd:deck:play', 'cmd:deck:pause'].includes(c.kind))).to.eql(
      false,
    );
  });
});
