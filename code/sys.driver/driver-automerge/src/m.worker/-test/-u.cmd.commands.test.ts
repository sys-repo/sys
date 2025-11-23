import { describe, it, beforeAll, afterAll, expect } from '../../-test.ts';
import { type t } from '../common.ts';
import { makeWorkerFixture } from './u.ts';
import { CrdtWorker } from '../mod.ts';

describe('Crdt.Worker (integration)', () => {
  let env: t.TestWorkerFixture;

  beforeAll(async () => {
    env = await makeWorkerFixture();
  });

  afterAll(() => env?.dispose());

  it('FOO', async () => {
    console.log('env', env);
  });

  describe('command: stats', () => {
    it('retrieve document stats (roundtrip) over worker', async () => {
      // Create a real doc in the worker-backed repo.
      type D = { foo: number };
      const create = await env.repo.create<D>({ foo: 0 });
      if (!create.ok) throw new Error(`create failed: ${create.error.message}`);

      const doc = create.doc;

      // Command client over the same MessagePort as the repo.
      const cmd = CrdtWorker.Cmd.make();
      const client = cmd.client(env.port);

      const res1 = await client.send('stats', { doc: doc.id });
      expect(res1.bytes).to.be.greaterThan(0);
      expect(res1.total.changes).to.be.greaterThan(0);
      expect(res1.total.ops).to.be.greaterThan(0);

      // Make a change; see different stats:
      doc.change((d) => (d.foo = 1234));

      const res2 = await client.send('stats', { doc: doc.id });
      expect(res2.bytes).to.be.greaterThan(res1.bytes);
      expect(res2.total.changes).to.be.greaterThan(res1.total.changes);
      expect(res2.total.ops).to.be.greaterThan(res1.total.ops);
    });
  });
});
