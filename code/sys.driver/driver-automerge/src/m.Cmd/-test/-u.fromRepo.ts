import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';

import { type t, CrdtIs } from '../common.ts';
import { CrdtCmd } from '../mod.ts';
import { Crdt } from './-u.ts';

describe('Crdt.Cmd.fromRepo', () => {
  let fixture: t.TestWorkerFixture;
  beforeAll(async () => void (fixture = await makeWorkerFixture()));
  afterAll(() => fixture?.dispose());

  /**
   * Shared assertion: `fromRepo` produces a working command client
   * for the given repo, proven by a successful `stats` roundtrip.
   */
  async function assertFromRepoWorks(repo: t.Crdt.Repo, label: string) {
    const cmd = CrdtCmd.fromRepo(repo);

    type D = { foo: number };
    const created = await repo.create<D>({ foo: 0 });
    if (!created.ok) {
      throw new Error(`create failed [${label}]: ${created.error.message}`);
    }

    const doc = created.doc;
    const stats = await cmd.send('doc:stats', { doc: doc.id });

    expect(stats.bytes, `${label}: bytes`).to.be.greaterThan(0);
    expect(stats.total.changes, `${label}: changes`).to.be.greaterThan(0);
    expect(stats.total.ops, `${label}: ops`).to.be.greaterThan(0);
  }

  it('derives a working command client for a worker-backed repo', async () => {
    const repo = fixture.repo;
    expect(CrdtIs.proxy(repo)).to.be.true;
    await assertFromRepoWorks(repo, 'worker-proxy');
  });

  it('derives a working command client for a concrete repo', async () => {
    const repo = Crdt.repo();
    expect(CrdtIs.proxy(repo)).to.be.false;
    await assertFromRepoWorks(repo, 'concrete');
    await repo.dispose();
  });
});
