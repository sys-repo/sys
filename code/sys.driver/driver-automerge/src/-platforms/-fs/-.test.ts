import { Crdt } from '@sys/driver-automerge/fs';
import { Signal, describe, expect, it, slug, Time } from '../../-test.ts';

describe('Crdt: fs (file-system)', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  describe('Crdt.repo', () => {
    describe('import', () => {
      it('import: no file-system', async () => {
        const { Crdt } = await import('@sys/driver-automerge/fs');
        const repo = Crdt.repo();

        const a = repo.create<T>({ count: 0 });
        a.change((d) => (d.count = 1234));
        expect(a.current).to.eql({ count: 1234 });
      });

      it('import: with path', async () => {
        const { Crdt } = await import('@sys/driver-automerge/fs');
        expect(Crdt.kind).to.eql('Crdt:FileSystem');

        const dir = `.tmp/test/crdt.import/${slug()}`;
        const repoA = Crdt.repo({ dir });
        const a = repoA.create<T>({ count: 0 });
        a.change((d) => (d.count = 1234));

        await Time.wait(500);

        const repoB = Crdt.repo(dir);
        const b = (await repoB.get<T>(a.id)).doc!;
        expect(b.current).to.eql({ count: 1234 }); // NB: read from disk.
      });
    });

    it('repo.id', () => {
      const a = Crdt.repo();
      const b = Crdt.repo({ network: { ws: 'sync.db.team' } });

      expect(a.id.instance).to.be.a('string');
      expect(a.id.instance).to.not.eql(b.id.instance);

      expect(a.id.peer).to.eql(''); // ← no network...no peer-id.
      expect(b.id.peer.startsWith('crdt-peer-')).to.be.true;
    });
  });

  it('Crdt.Url.ws', () => {
    const url = Crdt.Url.ws('sync.db.team');
    expect(url).to.eql('wss://sync.db.team');
  });
});
