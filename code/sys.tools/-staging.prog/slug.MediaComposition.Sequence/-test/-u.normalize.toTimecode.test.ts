import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { Sequence } from '../mod.ts';

describe('Sequence.Normalize', () => {
  describe('Normalize.toTimecode', () => {
    it('video items → timecode pieces and beats (with pauses)', () => {
      const sequence: t.SlugSequence = [
        {
          video: 'video-1.mp4',
          timestamps: {
            '00:00:02': {
              pause: '2s',
              title: 'First',
              text: { headline: 'H1', tagline: 'T1', body: 'B1' },
            },
            '00:00:04.500': { title: 'Second' },
          },
        },
      ];

      const result = Sequence.Normalize.toTimecode(sequence);

      // Type surface.
      expectTypeOf(result).toEqualTypeOf<t.SequenceNormalized>();

      // Structural timeline: one piece, no slice.
      expect(result.timecode.length).to.eql(1);
      expect(result.timecode[0]).to.eql({
        src: 'video-1.mp4',
        slice: undefined,
      });

      // Beats derived from timestamps.
      expect(result.beats.length).to.eql(2);

      const beat1 = result.beats[0];
      const beat2 = result.beats[1];

      // Beat 1: 00:00:02 → 2000 ms, with pause 2s.
      expect(beat1.src.ref).to.eql('video-1.mp4');
      expect(beat1.src.time).to.eql(2000);
      expect(beat1.pause).to.eql(2000);
      expect(beat1.payload).to.eql({
        title: 'First',
        image: undefined,
        text: { headline: 'H1', tagline: 'T1', body: 'B1' },
      });

      // Beat 2: 00:00:04.500 → 4500 ms, no pause.
      expect(beat2.src.ref).to.eql('video-1.mp4');
      expect(beat2.src.time).to.eql(4500);
      expect(beat2.pause).to.eql(undefined);
      expect(beat2.payload).to.eql({ title: 'Second', image: undefined, text: undefined });

      // Meta defaults when no opts passed.
      expect(result.meta).to.eql({ docid: undefined, path: undefined });
    });

    it('ignores slug/pause/image items for timecode and beats (for now)', () => {
      const sequence: t.SlugSequence = [
        {
          slug: 'some/slug',
          display: 'inline',
          timestamps: { '00:00:01': { title: 'Slug beat' } },
        },
        {
          pause: '3s',
          title: 'Top-level pause',
          text: { body: 'Body' },
        },
        {
          image: 'image.png',
          timestamps: { '00:00:05': { title: 'Image beat' } },
        },
      ];

      const result = Sequence.Normalize.toTimecode(sequence);

      // Current contract: only `video` items participate.
      expect(result.timecode.length).to.eql(0);
      expect(result.beats.length).to.eql(0);
    });

    it('drops invalid timestamp keys but keeps beats with invalid pauses', () => {
      const sequence: t.SlugSequence = [
        {
          video: 'video-1.mp4',
          timestamps: {
            // Invalid timecodes → dropped.
            'not-a-time': { title: 'X' },
            '99:99:99': { title: 'Y' },

            // Valid timecode, invalid pause string → beat kept, pause undefined.
            '00:01:00': { pause: 'foo', title: 'Valid time, bad pause' },
          },
        },
      ];

      // Only the valid timecode survives.
      const result = Sequence.Normalize.toTimecode(sequence);
      expect(result.beats.length).to.eql(1);

      const beat = result.beats[0];
      expect(beat.src.ref).to.eql('video-1.mp4');
      expect(beat.src.time).to.eql(60000); // 00:01:00 → 60s → 60000 ms
      expect(beat.pause).to.eql(undefined);
      expect(beat.payload.title).to.eql('Valid time, bad pause');
    });

    it('attaches meta: docid + yamlPath → meta.docid + meta.path.yaml', () => {
      const sequence: t.SlugSequence = [{ video: 'video-1.mp4' }];
      const docid = 'crdt:1234' as t.Crdt.Id;
      const yamlPath: t.ObjectPath = ['root', 'sequence', 0];

      const result = Sequence.Normalize.toTimecode(sequence, { docid, yamlPath });

      expect(result.meta).to.eql({
        docid,
        path: { yaml: yamlPath },
      });
    });

    it('trims video src and drops empty srcs', () => {
      const sequence: t.SlugSequence = [
        {
          video: '   video-1.mp4  ',
          timestamps: { '00:00:01': { title: 'A' } },
        },
        {
          // Empty after trim → ignored.
          video: '   ',
          timestamps: { '00:00:02': { title: 'B' } },
        },
      ];

      const result = Sequence.Normalize.toTimecode(sequence);

      // Only first item yields a timecode piece and beats.
      expect(result.timecode.length).to.eql(1);
      expect(result.timecode[0].src).to.eql('video-1.mp4');

      expect(result.beats.length).to.eql(1);
      expect(result.beats[0].src.ref).to.eql('video-1.mp4');
    });
  });
});
