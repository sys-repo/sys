import { describe, expect, expectTypeOf, it, Obj } from '../../-test.ts';
import { type t } from '../common.ts';
import { Playback } from '../mod.ts';

describe('Playback.fromNormalized', () => {
  const docid: t.Crdt.Id = 'sample-docid';
  const makeNormalized = (): t.SequenceNormalized => ({
    timecode: [],
    beats: [
      {
        src: { ref: 'video:1', time: 3000 as t.Msecs },
        payload: {
          title: 'Hello',
          image: '/image.png',
          text: { headline: 'Head', tagline: 'Tag', body: 'Body' },
        },
      },
    ],
    meta: {
      docid: 'doc-1' as t.Crdt.Id,
      path: { yaml: ['sequence'] },
    },
  });

  it('projects normalized → playback spec (structure)', () => {
    const normalized = makeNormalized();
    const spec = Playback.fromNormalized(docid, normalized);

    // new surface: docid + meta
    expect(spec.docid).to.eql(docid);
    expect(spec.meta).to.eql(normalized.meta);

    // composition is passed through
    expect(spec.composition).to.eql(normalized.timecode);

    // beats are projected (not passed through)
    expect(spec.beats).to.eql([
      {
        pause: undefined,
        payload: normalized.beats[0].payload,
        src: { kind: 'video', logicalPath: 'video:1', time: 3000 },
      },
    ]);
  });

  it('does not mutate the normalized input', () => {
    const normalized = makeNormalized();
    const snapshot = Obj.clone(normalized);

    void Playback.fromNormalized(docid, normalized);
    expect(normalized).to.eql(snapshot);
  });

  it('payload type matches SlugSequenceBeatPayload', () => {
    const normalized = makeNormalized();
    const spec = Playback.fromNormalized(docid, normalized);
    const beat = spec.beats[0];
    expectTypeOf(beat.payload).toEqualTypeOf<t.SequenceBeatPayload>();
  });
});
