import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { projectTimeline } from '../u.project.timeline.ts';
import { timeline } from './u.fixture.ts';

describe('u.project.timeline', () => {
  it('returns a stable empty model when timeline is missing', () => {
    const state: t.TimecodeState.Playback.State = {
      phase: 'idle',
      intent: 'stop',
      timeline: undefined,
      currentBeat: undefined,
      decks: {
        active: 'A',
        standby: 'B',
        status: { A: 'empty', B: 'empty' },
      },
      ready: { machine: true },
    };

    const res = projectTimeline(state);
    expect(res).to.eql({ virtualDuration: 0, beats: [] });
  });

  it('projects beats with pos and segment starts (currentBeat set)', () => {
    const tl = timeline();

    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'play',
      timeline: tl,
      currentBeat: 1,
      decks: {
        active: 'A',
        standby: 'B',
        status: { A: 'playing', B: 'ready' },
      },
      ready: { machine: true, runner: true },
    };

    const res = projectTimeline(state);

    expect(res.virtualDuration).to.eql(tl.virtualDuration);
    expect(res.current).to.eql({
      index: 1,
      vTime: 1000,
      segmentId: 'seg:0',
    });

    expect(res.beats.map((b) => b.pos)).to.eql(['Past', 'Current', 'Future']);
    expect(res.beats.map((b) => b.isSegmentStart)).to.eql([true, false, false]);
    expect(res.beats.map((b) => b.segmentId)).to.eql(['seg:0', 'seg:0', 'seg:0']);
  });

  it('when currentBeat is missing, all beats are Future and current is undefined', () => {
    const tl = timeline();

    const state: t.TimecodeState.Playback.State = {
      phase: 'active',
      intent: 'pause',
      timeline: tl,
      currentBeat: undefined,
      decks: {
        active: 'A',
        standby: 'B',
        status: { A: 'paused', B: 'ready' },
      },
      ready: { machine: true, runner: true },
    };

    const res = projectTimeline(state);
    expect(res.current).to.eql(undefined);
    expect(res.beats.map((b) => b.pos)).to.eql(['Future', 'Future', 'Future']);
  });
});
