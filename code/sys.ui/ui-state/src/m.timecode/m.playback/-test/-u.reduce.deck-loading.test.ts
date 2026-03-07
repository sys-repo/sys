import { describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState, timeline } from './u.fixture.ts';

/**
 * Deck loading expectations:
 * - Beat changes should trigger load.
 * - Explicit navigation may reassert load even if beat is unchanged
 *   (idempotent: "ensure this beat is loaded").
 */
describe('Playback.reduce - deck loading', () => {
  function init() {
    return Playback.reduce(emptyState(), {
      kind: 'playback:init',
      timeline: timeline(),
    });
  }

  function loadCmds(cmds: readonly any[]) {
    return cmds.filter((c) => c.kind === 'cmd:deck:load');
  }

  it('init loads the initial beat on the active deck', () => {
    const res = init();

    const loads = loadCmds(res.cmds);
    expect(loads.length).to.eql(1);
    expect(loads[0].deck).to.eql('A');
    expect(loads[0].beat).to.eql(0);
  });

  it('changing beat issues exactly one load cmd for active deck', () => {
    const s1 = init().state;

    const res = Playback.reduce(s1, {
      kind: 'playback:seek:beat',
      beat: 2,
    });

    const loads = loadCmds(res.cmds);
    expect(loads.length).to.eql(1);
    expect(loads[0].deck).to.eql('A');
    expect(loads[0].beat).to.eql(2);
  });

  it('explicit seek to current beat may reassert load (idempotent)', () => {
    const s0 = init().state;

    const res = Playback.reduce(s0, {
      kind: 'playback:seek:beat',
      beat: 0,
    });

    const loads = loadCmds(res.cmds);
    expect(loads.length).to.eql(1);
    expect(loads[0].deck).to.eql('A');
    expect(loads[0].beat).to.eql(0);
  });
});
