import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Playback } from '../mod.ts';

describe('Playback.Util.buildTimeline', () => {
  type Payload = { readonly k: string };
  const ms = (n: number): t.Msecs => n;
  const id = (s: string): t.StringId => s;
  const ref = (s: string): t.StringRef => s;

  it('empty beats → empty beats/segments, preserves virtualDuration', () => {
    const timeline: t.Timecode.Experience.Timeline<Payload> = {
      beats: [],
      duration: ms(0),
    };

    const out = Playback.Util.buildTimeline(timeline);
    expect(out.beats.length).eql(0);
    expect(out.segments.length).eql(0);
    expect(out.virtualDuration).eql(0);
  });

  it('throws when a beat is missing src.ref', () => {
    const timeline: t.Timecode.Experience.Timeline<Payload> = {
      beats: [
        {
          src: { ref: ref(''), time: ms(0) },
          vTime: ms(0),
          payload: { k: '0' },
        },
      ],
      duration: ms(1000),
    };

    expect(() => Playback.Util.buildTimeline(timeline)).to.throw(/src\.ref is required/);
  });

  it('computes media duration as (next vTime delta) - pause, and derives segments by src.ref runs', () => {
    const timeline: t.Timecode.Experience.Timeline<Payload> = {
      beats: [
        {
          src: { ref: ref('A'), time: ms(0) },
          vTime: ms(0),
          pause: ms(200),
          payload: { k: '0' },
        },
        {
          src: { ref: ref('A'), time: ms(1000) },
          vTime: ms(1000),
          // no pause
          payload: { k: '1' },
        },
        {
          src: { ref: ref('B'), time: ms(2500) },
          vTime: ms(2500),
          pause: ms(300),
          payload: { k: '2' },
        },
      ],
      duration: ms(4000),
    };

    const out = Playback.Util.buildTimeline(timeline);

    // virtualDuration passthrough
    expect(Number(out.virtualDuration)).eql(4000);

    // beat[0]: span 0→1000, pause 200 → duration 800, pause retained
    expect(out.beats[0]!.vTime).eql(0);
    expect(out.beats[0]!.duration).eql(800);
    expect(out.beats[0]!.pause!).eql(200);

    // beat[1]: span 1000→2500, pause 0 → duration 1500, pause undefined
    expect(out.beats[1]!.vTime).eql(1000);
    expect(out.beats[1]!.duration).eql(1500);
    expect(out.beats[1]!.pause).eql(undefined);

    // beat[2]: span 2500→4000, pause 300 → duration 1200
    expect(out.beats[2]!.vTime).eql(2500);
    expect(out.beats[2]!.duration).eql(1200);
    expect(out.beats[2]!.pause!).eql(300);

    // segments: A = beats [0,2), B = beats [2,3)
    expect(out.segments.length).eql(2);
    expect(out.segments[0]!.id).eql(id('A'));
    expect(Number(out.segments[0]!.beat.from)).eql(0);
    expect(Number(out.segments[0]!.beat.to)).eql(2);

    expect(out.segments[1]!.id).eql(id('B'));
    expect(Number(out.segments[1]!.beat.from)).eql(2);
    expect(Number(out.segments[1]!.beat.to)).eql(3);

    // beat segmentId follows segment
    expect(out.beats[0]!.segmentId).eql(id('A'));
    expect(out.beats[1]!.segmentId).eql(id('A'));
    expect(out.beats[2]!.segmentId).eql(id('B'));
  });
});
