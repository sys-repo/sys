import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Playback } from '../mod.ts';
import { emptyState } from './u.fixture.ts';

describe('Playback.Is', () => {
  const ms = (n: number): t.Msecs => n;
  const ix = (n: number): t.PlaybackBeatIndex => n;

  describe('Is.terminalEnd', () => {
    const timeline: t.PlaybackTimeline = {
      beats: [
        { index: ix(0), vTime: ms(0), duration: ms(1000), segmentId: 'seg:0' },
        { index: ix(1), vTime: ms(1000), duration: ms(1000), segmentId: 'seg:0' },
        { index: ix(2), vTime: ms(2000), duration: ms(1000), segmentId: 'seg:1' },
        { index: ix(3), vTime: ms(3000), duration: ms(1000), segmentId: 'seg:1' },
      ],
      segments: [
        { id: 'seg:0', beat: { from: ix(0), to: ix(2) } },
        { id: 'seg:1', beat: { from: ix(2), to: ix(4) } },
      ],
      virtualDuration: ms(4000),
    };

    it('returns true when timeline or current beat is missing', () => {
      const base = emptyState();
      expect(Playback.Is.terminalEnd(base)).eql(true);
      expect(Playback.Is.terminalEnd({ ...base, timeline, currentBeat: undefined })).eql(true);
    });

    it('returns false when a next segment exists', () => {
      const state: t.PlaybackState = { ...emptyState(), timeline, currentBeat: ix(1) };
      expect(Playback.Is.terminalEnd(state)).eql(false);
    });

    it('returns true for the final segment', () => {
      const state: t.PlaybackState = { ...emptyState(), timeline, currentBeat: ix(3) };
      expect(Playback.Is.terminalEnd(state)).eql(true);
    });

    it('returns true when the current beat is outside segment ranges', () => {
      const badTimeline: t.PlaybackTimeline = { ...timeline, segments: [] };
      const state: t.PlaybackState = { ...emptyState(), timeline: badTimeline, currentBeat: ix(0) };
      expect(Playback.Is.terminalEnd(state)).eql(true);
    });
  });
});
