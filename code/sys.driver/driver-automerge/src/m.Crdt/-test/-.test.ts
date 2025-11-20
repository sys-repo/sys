import { type t, describe, expect, it } from '../../-test.ts';
import { CrdtGraph, CrdtId, CrdtIs, CrdtUrl, CrdtWorker, toObject } from '../mod.ts';

describe('Crdt (Core API)', () => {
  it('API', async () => {
    const assertCommon = (Crdt: t.CrdtLib) => {
      expect(Crdt.toObject).to.equal(toObject);
      expect(Crdt.Url).to.equal(CrdtUrl);
      expect(Crdt.Id).to.equal(CrdtId);
      expect(Crdt.Is).to.equal(CrdtIs);
      expect(Crdt.Worker).to.equal(CrdtWorker);
      expect(Crdt.Graph).to.equal(CrdtGraph);
    };

    const fs = await import('@sys/driver-automerge/fs');
    const web = await import('@sys/driver-automerge/web');

    assertCommon(fs.Crdt);
    assertCommon(web.Crdt);
  });
});
