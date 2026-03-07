import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Playback } from '../mod.ts';

describe('Playback.Util.beatIndexAtVTime', () => {
  const ms = (n: number): t.Msecs => n;
  const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

  it('resolves the owning beat across media and pause spans', () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        { index: ix(0), vTime: ms(0), duration: ms(800), pause: ms(200), segmentId: 'seg:0' },
        { index: ix(1), vTime: ms(1000), duration: ms(500), segmentId: 'seg:0' },
      ],
      segments: [{ id: 'seg:0', beat: { from: ix(0), to: ix(2) } }],
      virtualDuration: ms(1500),
    };

    expect(Playback.Util.beatIndexAtVTime(timeline, ms(0))).eql(ix(0));
    expect(Playback.Util.beatIndexAtVTime(timeline, ms(799))).eql(ix(0));
    expect(Playback.Util.beatIndexAtVTime(timeline, ms(900))).eql(ix(0));
    expect(Playback.Util.beatIndexAtVTime(timeline, ms(1000))).eql(ix(1));
    expect(Playback.Util.beatIndexAtVTime(timeline, ms(1499))).eql(ix(1));
  });

  it('clamps to first or last beat when vTime is outside the range', () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        { index: ix(0), vTime: ms(10), duration: ms(10), segmentId: 'seg:0' },
        { index: ix(1), vTime: ms(30), duration: ms(10), segmentId: 'seg:0' },
      ],
      segments: [{ id: 'seg:0', beat: { from: ix(0), to: ix(2) } }],
      virtualDuration: ms(40),
    };

    expect(Playback.Util.beatIndexAtVTime(timeline, ms(0))).eql(ix(0));
    expect(Playback.Util.beatIndexAtVTime(timeline, ms(1000))).eql(ix(1));
  });

  it('returns 0 when no beats exist', () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [],
      segments: [],
      virtualDuration: ms(0),
    };

    expect(Playback.Util.beatIndexAtVTime(timeline, ms(0))).eql(ix(0));
  });
});
