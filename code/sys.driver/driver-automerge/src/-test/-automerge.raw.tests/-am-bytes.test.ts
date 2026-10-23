import { A, afterAll, AutomergeRepo, describe, expect, it, repoCleanup } from '../mod.ts';
// import { Repo, MemoryStorageAdapter } from '@automerge/automerge-repo';

const Repos = repoCleanup(afterAll);

describe('automerge: save/publish/hydrate bytes', () => {
  type T = { count: number; msg?: string };

  it('snapshot: doc → (save) bytes → (load) doc', () => {
    const repo = Repos.automerge(new AutomergeRepo());
    const handle = repo.create<T>({ count: 123 });
    const a = handle.doc();
    expect(a).to.eql({ count: 123 });

    // Snapshot the CRDT:
    const bytes = A.save(a);
    expect(bytes.length).to.be.greaterThan(100);

    const b = A.load<T>(bytes);
    expect(b).to.eql({ count: 123 });
  });

  it('snapshot: (save) → append changes with an incremental delta', () => {
    const repo = Repos.automerge(new AutomergeRepo());
    const handle = repo.create<T>({ count: 0 });
    const a = handle.doc();
    expect(a).to.eql({ count: 0 });

    const bytes = A.save(a);
    expect(bytes.length).to.be.greaterThan(100);

    handle.change((d) => {
      d.count = 1234;
      d.msg = '👋';
    });

    const b = handle.doc();
    expect(b).to.eql({ count: 1234, msg: '👋' });

    const delta = A.saveIncremental(b);
    expect(delta.length).to.not.eql(bytes.length);

    const c = A.load(bytes);
    expect(c).to.eql({ count: 0 });

    const d = A.loadIncremental(c, delta);
    expect(d).to.eql({ count: 1234, msg: '👋' });
  });

  it('snapshot: save (from repo) → hydrate (from repo)', async () => {
    const repoA = Repos.automerge(new AutomergeRepo());
    const a = repoA.create<T>({ count: 1234 });

    // Save from repo:
    const bytes = await repoA.export(a.url);

    // Confirm loading from raw Automerge API:
    expect(A.load<T>(bytes!)).to.eql({ count: 1234 });

    // Load from repo:
    const repoB = Repos.automerge(new AutomergeRepo());
    const b = repoB.import<T>(bytes!);
    expect(b.doc()).to.eql({ count: 1234 });

    b.change((d) => d.count++);

    // Retrieve imported document now it lives in the repo:
    const c = await repoB.find(b.url);
    expect(c.doc()).to.eql({ count: 1235 });
  });
});
