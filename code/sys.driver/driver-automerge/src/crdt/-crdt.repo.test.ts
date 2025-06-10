import { Repo } from '@automerge/automerge-repo';

import { describe, expect, it } from '../-test.ts';
import { toAutomergeRepo, toRepo } from './u.repo.ts';

describe('CrdtRepo', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('toAutomergeRepo', () => {
    const base = new Repo();
    const repo = toRepo(base);
    expect(toAutomergeRepo(repo)).to.equal(base);
    expect(toAutomergeRepo({} as any)).to.eql(undefined);
  });

  it('create', () => {
    const repo = toRepo();
    const doc = repo.create<T>({ count: 0 });
    expect(doc.current).to.eql({ count: 0 });
  });

  it('get', async () => {
    const base = new Repo();
    const repoA = toRepo(base);
    const repoB = toRepo(base);
    const a = repoA.create<T>({ count: 0 });
    expect(a.current).to.eql({ count: 0 });

    const b = (await repoB.get<T>(` ${a.id}   `))!; // NB: test input address cleanup.
    expect(a).to.not.equal(b); // NB: difference repo (not-cached).
    expect(a.id).to.eql(b.id);
    expect(a.instance).to.not.eql(b.instance);

    a.change((d) => (d.count = 1234));
    expect(b.current.count).to.eql(1234);
  });

  it('get: automerge-URL', async () => {
    const repo = toRepo();
    const a = repo.create<T>({ count: 0 });
    const b = (await repo.get<T>(`automerge:${a.id}`))!;
    expect(b.instance).to.not.eql(a.instance);
    expect(b.id).to.eql(a.id);
    expect(b.current).to.eql({ count: 0 });
  });

  it('get: 404', async () => {
    const repo = toRepo();
    const doc = await repo.get('Juwryn74i3Aia5Kb529XUm3hU4Y');
    expect(doc).to.eql(undefined);
  });

  it('syncing between different instances', async () => {
    const base = new Repo();
    const repoA = toRepo(base);
    const repoB = toRepo(base);
    const a = repoA.create<T>({ count: 0 });
    const b = (await repoB.get<T>(a.id))!;
    expect(a.instance).to.not.eql(b.instance);

    expect(a).to.not.equal(b);
    expect(a.current).to.eql(b.current);

    a.change((d) => d.count++);
    expect(a.current).to.eql(b.current);
  });
});
