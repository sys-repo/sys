import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { projectNormalizedToPlayback } from '../u.fromDag.ts';

describe('Playback.fromDag', () => {
  /**
   * NOTE:  This test targets the pure projection step.
   *
   * Why:   It defines the playback wire-format contract and is stable surface area.
   * What:  We verify the shape and mapping logic without pulling in the full
   *        load/normalize pipeline, which is tested elsewhere.
   */
  describe('projectNormalizedToPlayback', () => {
    it('projects a normalized sequence into a playback spec', () => {
      const normalized: t.SlugSequenceNormalized = {
        timecode: [
          {
            src: 'video-1.mp4',
            slice: '00:00..00:10' as t.Timecode.Slice.String,
          },
        ],
        beats: [
          {
            src: { ref: 'video-1.mp4', time: 2000 },
            pause: 2000,
            payload: { title: 'Hello' },
          },
        ],
        meta: {
          docid: '1234' as t.Crdt.Id,
          path: { yaml: ['sequence'] as t.ObjectPath },
        },
      };

      const docid: t.Crdt.Id = 'xxxx';
      const playback = projectNormalizedToPlayback(docid, normalized);

      // Type surface.
      expectTypeOf(playback).toEqualTypeOf<t.SlugPlaybackSpec>();

      // new surface: docid + meta
      expect(playback.docid).to.equal(docid);
      expect(playback.meta).to.eql(normalized.meta);

      // Structural projection.
      expect(playback.composition).to.eql(normalized.timecode);
      expect(playback.beats).to.eql(normalized.beats);
    });
  });
});
