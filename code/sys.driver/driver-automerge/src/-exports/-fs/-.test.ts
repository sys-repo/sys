import { Fs } from '@sys/fs';
import { afterAll, describe, expect, it, repoCleanup, slug, Testing, Time } from '../../-test.ts';
import { Crdt } from '@sys/driver-automerge/fs';

describe(
  'Crdt: fs (file-system)',
  {
    // @automerge/automerge-repo-network-websocket@2.5.6 owns uncancellable readiness timers
    // started by the public {ws} shorthand. Deno 2.9 reports these timers while either signal is
    // enabled; suite teardown still closes every repo and resource, and exit policy stays active.
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    const Repos = repoCleanup(afterAll);
    type T = { count: number };

    describe('Crdt.repo', () => {
      describe('import', () => {
        it('import: no file-system', async () => {
          const { Crdt } = await import('@sys/driver-automerge/fs');
          const repo = Repos.crdt(Crdt.repo());

          const a = await repo.create<T>({ count: 0 });

          a.doc!.change((d) => (d.count = 1234));
          expect(a.doc!.current).to.eql({ count: 1234 });
        });

        it('import: with path', async () => {
          const { Crdt } = await import('@sys/driver-automerge/fs');
          expect(Crdt.kind).to.eql('crdt:fs');

          const dir = `.tmp/test/crdt.import/${slug()}`;
          const repoA = Repos.crdt(Crdt.repo({ dir }));
          const a = await repoA.create<T>({ count: 0 });
          a.doc!.change((d) => (d.count = 1234));

          await Time.wait(500);

          const repoB = Repos.crdt(Crdt.repo(dir));
          const b = await repoB.get<T>(a.doc!.id);
          expect(b.doc!.current).to.eql({ count: 1234 }); // NB: read from disk.
        });
      });

      it('repo.id', () => {
        const a = Repos.crdt(Crdt.repo());
        const b = Repos.crdt(Crdt.repo({ network: { ws: 'sync.automerge.org' } }));

        expect(a.id.instance).to.be.a('string');
        expect(a.id.instance).to.not.eql(b.id.instance);

        expect(a.id.peer).to.eql(''); // ← no network...no peer-id.
        expect(b.id.peer.startsWith('peer-')).to.be.true;
      });

      it('repo: network with <Falsy> in it', () => {
        const repo = Repos.crdt(Crdt.repo({
          network: [{ ws: 'sync.automerge.org' }, undefined, null, false, 0, ''],
        }));
        expect(repo.id.peer.startsWith('peer-')).to.be.true;
        expect(repo.sync.urls).to.eql(['wss://sync.automerge.org']); // NB: the <undefined> entry filtered out.
      });

      it('repo: stores (info)', async () => {
        const dir = (await Testing.dir('repo.stores')).dir;
        const repo = Repos.crdt(Crdt.repo({ dir }));
        expect(repo.stores).to.eql([{ kind: 'fs', dir: Fs.resolve(dir) }]);
      });
    });

    it('Crdt.Url.ws', () => {
      const url = Crdt.Url.ws('sync.automerge.org');
      expect(url).to.eql('wss://sync.automerge.org');
    });
  },
);
