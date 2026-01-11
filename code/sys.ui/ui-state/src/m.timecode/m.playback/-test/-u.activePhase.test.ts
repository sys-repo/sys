import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Playback } from '../mod.ts';

describe('Playback.Util.activePhase', () => {
  const ms = (n: number): t.Msecs => n;
  const ix = (n: number): t.TimecodeState.Playback.BeatIndex => n;

  it('returns media vs pause based on vTime within the beat span', () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [
        {
          index: ix(0),
          vTime: ms(0),
          duration: ms(800),
          pause: ms(200),
          segmentId: 'seg:0',
        },
        {
          index: ix(1),
          vTime: ms(1000),
          duration: ms(1000),
          segmentId: 'seg:0',
        },
      ],
      segments: [{ id: 'seg:0', beat: { from: ix(0), to: ix(2) } }],
      virtualDuration: ms(2000),
    };

    expect(Playback.Util.activePhase(timeline, ix(0), ms(700))).eql('media');
    expect(Playback.Util.activePhase(timeline, ix(0), ms(900))).eql('pause');
  });

  it('returns undefined when beat index is missing', () => {
    const timeline: t.TimecodeState.Playback.Timeline = {
      beats: [],
      segments: [],
      virtualDuration: ms(0),
    };
    expect(Playback.Util.activePhase(timeline, ix(0), ms(0))).eql(undefined);
  });
});
