import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../common.ts';
import { PlaybackSchema } from '../mod.ts';
import { schema } from '../u.manfest.schema.ts';

describe(`m.timecode.playback/u.schema.ts`, () => {
  it('api', () => {
    expect(PlaybackSchema.Manifest.schema).to.eql(schema);
  });

  it('schema: accepts minimal valid manifest (payload unconstrained)', () => {
    const s = PlaybackSchema.Manifest.schema();
    const input = {
      docid: 'abc' as const,
      composition: [{ src: '/video-1.webm', slice: '00:00..00:31' }],
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
          pause: 3000,
          payload: { anything: { goes: ['here'] } },
        },
      ],
    };

    expect(Schema.Value.Check(s, input)).to.eql(true);

    // Strict: no extras at root.
    expect(Schema.Value.Check(s, { ...input, extra: 123 })).to.eql(false);

    // Strict: kind must be 'video' | 'image'.
    expect(
      Schema.Value.Check(s, {
        ...input,
        beats: [{ ...input.beats[0], src: { ...input.beats[0].src, kind: 'audio' } }],
      }),
    ).to.eql(false);
  });

  it('schema: enforces payload when payload schema is supplied', () => {
    const Type = Schema.Type;
    const payloadSchema = Type.Object({ title: Type.String() }, { additionalProperties: false });
    const s = schema({ payload: payloadSchema });

    const ok = {
      docid: 'abc',
      composition: [{ src: '/video-1.webm' }],
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
          payload: { title: 'x' },
        },
      ],
    };

    const badMissing = { ...ok, beats: [{ ...ok.beats[0], payload: {} }] };
    const badExtra = { ...ok, beats: [{ ...ok.beats[0], payload: { title: 'x', extra: 1 } }] };

    expect(Schema.Value.Check(s, ok)).to.eql(true);
    expect(Schema.Value.Check(s, badMissing)).to.eql(false);
    expect(Schema.Value.Check(s, badExtra)).to.eql(false);
  });
});
