import { describe, expect, it, slug, Time } from '../-test.ts';

describe('Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  describe('fs', () => {
    it('import: no file-system', async () => {
      const { Crdt } = await import('@sys/driver-automerge/fs');
      const repo = await Crdt.repo();
      const a = repo.create<T>({ count: 0 });
      a.change((d) => (d.count = 1234));
      expect(a.current).to.eql({ count: 1234 });
    });

    it('import: with path', async () => {
      const { Crdt } = await import('@sys/driver-automerge/fs');
      expect(Crdt.kind).to.eql('FileSystem');

      const dir = `.tmp/test/crdt.import/${slug()}`;
      const repoA = await Crdt.repo({ dir });
      const a = repoA.create<T>({ count: 0 });
      a.change((d) => (d.count = 1234));

      await Time.wait(100);

      const repoB = await Crdt.repo(dir);
      const b = (await repoB.get<T>(a.id))!;
      expect(b.current).to.eql({ count: 1234 }); // NB: read from disk.
    });
  });

  describe('browser', () => {
    it('imports', async () => {
      const { Crdt } = await import('@sys/driver-automerge/browser');
      expect(Crdt.kind).to.eql('IndexedDb');

      const repoA = await Crdt.repo({});
      const a = repoA.create<T>({ count: 0 });
      a.change((d) => (d.count = 1234));

      await Time.wait(100);

      const repoB = await Crdt.repo();
      const b = (await repoB.get<T>(a.id))!;
      expect(b.current).to.eql({ count: 1234 }); // NB: read from IndexedDb.
    });
  });
});
