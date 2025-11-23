import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t, CrdtIs } from '../common.ts';
import { CrdtCmd } from '../mod.ts';

describe('Crdt.Cmd.fromRepo', () => {
  let env: t.TestWorkerFixture;

  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('fromRepo: derives a working command client for a worker-backed repo', async () => {
    // 1. Repo must be worker-backed (precondition for using fromRepo).
    expect(CrdtIs.proxy(env.repo)).to.eql(true);

    // 2. Derive a command client from the repo.
    const cmd = CrdtCmd.fromRepo(env.repo);

    // 3. Create a small document in the worker-backed repo.
    type D = { foo: number };
    const created = await env.repo.create<D>({ foo: 0 });
    if (!created.ok) throw new Error(`create failed: ${created.error.message}`);
    const doc = created.doc;

    // 4. Use the derived command client to fetch stats for that doc.
    const stats = await cmd.send('stats', { doc: doc.id });

    // 5. Smoke-level assertions: command path is wired and returns sane values.
    expect(stats.bytes).to.be.greaterThan(0);
    expect(stats.total.changes).to.be.greaterThan(0);
    expect(stats.total.ops).to.be.greaterThan(0);
  });
});
