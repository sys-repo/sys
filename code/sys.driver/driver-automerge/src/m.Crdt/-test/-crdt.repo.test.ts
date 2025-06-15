import { Repo } from '@automerge/automerge-repo';

import { describe, expect, it } from '../../-test.ts';
import { toAutomergeRepo, toRepo } from '../u.repo.ts';

describe('CrdtRepo', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('toAutomergeRepo', () => {
    const base = new Repo();
    const repo = toRepo(base);
    expect(toAutomergeRepo(repo)).to.equal(base);
    expect(toAutomergeRepo()).to.eql(undefined);
    expect(toAutomergeRepo({} as any)).to.eql(undefined);
  });

  it('create (doc)', () => {
    const repo = toRepo(new Repo());
    expect(repo.id.peer).to.eql('UNKNOWN');
    expect(repo.id.instance).to.be.a('string');

    const initial = { count: 0 };
    const doc = repo.create<T>(initial);
    expect(doc.current).to.eql(initial);
    expect(doc.current).to.not.equal(initial);
  });

  it('create (doc) → initial as function', () => {
    const repo = toRepo(new Repo());
    const initial: T = { count: 1234 };
    const doc = repo.create<T>(() => initial);
    expect(doc.current).to.eql(initial);
    expect(doc.current).to.not.equal(initial);
  });

  it('creates with  { peerId }', async () => {
    const peerId = 'foo:bar';
    const repo = toRepo(new Repo(), { peerId });
    expect(repo.id.peer).to.eql(peerId);
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
    const repo = toRepo(new Repo());
    const a = repo.create<T>({ count: 0 });
    const b = (await repo.get<T>(`automerge:${a.id}`))!;
    expect(b.instance).to.not.eql(a.instance);
    expect(b.id).to.eql(a.id);
    expect(b.current).to.eql({ count: 0 });
  });

  it('get: 404', async () => {
    const repo = toRepo(new Repo());
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
