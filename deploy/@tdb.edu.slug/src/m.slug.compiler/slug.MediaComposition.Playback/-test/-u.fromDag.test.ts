import { type t, describe, expect, it } from '../../-test.ts';
import { Sequence } from '../common.ts';
import { fromDag } from '../u.fromDag.ts';
import { fromNormalized } from '../u.fromNormalized.ts';

describe('Playback.fromDag', () => {
  it('passes through Sequence.fromDag errors (no normalize)', async () => {
    const prevFromDag = Sequence.fromDag;
    const prevToTimecode = Sequence.Normalize.toTimecode;

    try {
      let calledNormalize = false;

      // stub
      Sequence.fromDag = async () => {
        return {
          ok: false,
          error: { message: 'boom' },
        } as t.SlugValidateResult<t.SequenceItem[]>;
      };

      Sequence.Normalize.toTimecode = (() => {
        calledNormalize = true;
        return {} as t.SequenceNormalized;
      }) as typeof Sequence.Normalize.toTimecode;

      const dag = {} as t.Graph.Dag.Result;
      const yamlPath = ['sequence'] as t.ObjectPath;
      const docid = 'doc-1' as t.Crdt.Id;

      const res = await fromDag(dag, yamlPath, docid, { validate: true });

      expect(res.ok).to.eql(false);
      expect(calledNormalize).to.eql(false);

      // assert propagated error
      if (!res.ok) {
        expect(res.error?.message).to.eql('boom');
      }
    } finally {
      Sequence.fromDag = prevFromDag;
      Sequence.Normalize.toTimecode = prevToTimecode;
    }
  });

  it('wires load → normalize → project and returns { ok:true, sequence }', async () => {
    const prevFromDag = Sequence.fromDag;
    const prevToTimecode = Sequence.Normalize.toTimecode;

    try {
      const calls = { fromDag: 0, toTimecode: 0 };
      const dag = {} as t.Graph.Dag.Result;
      const yamlPath = ['sequence'] as t.ObjectPath;
      const docid = 'doc-1' as t.Crdt.Id;
      const opts = { validate: true } as const;

      const seqItems = [] as t.SequenceItem[];

      const normalized: t.SequenceNormalized = {
        timecode: [{ src: 'video-1.mp4' }],
        beats: [{ src: { ref: 'video-1.mp4', time: 2000 }, payload: { title: 'Hi' } }],
        meta: { docid, path: { yaml: yamlPath } },
      };

      // stubs + spies
      Sequence.fromDag = (async (...args: Parameters<typeof Sequence.fromDag>) => {
        const [d, yp, id, o] = args;

        calls.fromDag++;
        expect(d).to.eql(dag);
        expect(yp).to.eql(yamlPath);
        expect(id).to.eql(docid);
        expect(o).to.eql(opts);

        return { ok: true, sequence: seqItems } as t.SlugValidateResult<t.SequenceItem[]>;
      }) as typeof Sequence.fromDag;

      Sequence.Normalize.toTimecode = ((
        ...args: Parameters<typeof Sequence.Normalize.toTimecode>
      ) => {
        const [sequence, normArgs] = args;
        calls.toTimecode++;
        expect(sequence).to.eql(seqItems);
        expect(normArgs).to.eql({ docid, yamlPath });

        return normalized;
      }) as typeof Sequence.Normalize.toTimecode;

      const res = await fromDag(dag, yamlPath, docid, opts);

      expect(res.ok).to.eql(true);
      expect(calls.fromDag).to.eql(1);
      expect(calls.toTimecode).to.eql(1);

      // Don’t re-test projection logic here; just verify it uses the canonical function.
      if (res.ok) {
        expect(res.sequence).to.eql(fromNormalized(docid, normalized));
      }
    } finally {
      Sequence.fromDag = prevFromDag;
      Sequence.Normalize.toTimecode = prevToTimecode;
    }
  });
});
