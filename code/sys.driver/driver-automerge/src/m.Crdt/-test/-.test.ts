import { type t, describe, expect, it } from '../../-test.ts';
import { CrdtIs, CrdtUrl, CrdtWorker, toObject } from '../mod.ts';

describe('Crdt (Core API)', () => {
  it('API', async () => {
    const assertCommon = (Crdt: t.CrdtLib) => {
      expect(Crdt.toObject).to.equal(toObject);
      expect(Crdt.Url).to.equal(CrdtUrl);
      expect(Crdt.Is).to.equal(CrdtIs);
      expect(Crdt.Worker).to.equal(CrdtWorker);
    };

    const fs = await import('@sys/driver-automerge/fs');
    const web = await import('@sys/driver-automerge/web');

    assertCommon(fs.Crdt);
    assertCommon(web.Crdt);
  });
});
