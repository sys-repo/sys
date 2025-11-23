import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t, Rx } from '../common.ts';
import { CrdtCmd } from '../mod.ts';

describe('Cmd: stats', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('retrieve document stats (roundtrip) over worker', async () => {
    type D = { foo: number };

    // 1. Create a doc inside the worker-backed repo.
    const create = await env.repo.create<D>({ foo: 0 });
    if (!create.ok) throw new Error(`create failed: ${create.error.message}`);
    const doc = create.doc;

    // 2. Command client over the same MessagePort as the repo.
    const cmd = CrdtCmd.make();
    const client = cmd.client(env.port);

    // 3. Initial stats.
    const res1 = await client.send('stats', { doc: doc.id });
    expect(res1.bytes).to.be.greaterThan(0);
    expect(res1.total.changes).to.be.greaterThan(0);
    expect(res1.total.ops).to.be.greaterThan(0);

    // 4. Mutate the doc and wait for commit propagation.
    doc.change((d) => (d.foo = 1234));
    await Rx.firstValueFrom(doc.events().$.pipe(Rx.take(1)));

    // 5. Stats after change should be strictly greater.
    const res2 = await client.send('stats', { doc: doc.id });

    expect(res2.bytes).to.be.greaterThan(res1.bytes);
    expect(res2.total.changes).to.be.greaterThan(res1.total.changes);
    expect(res2.total.ops).to.be.greaterThan(res1.total.ops);
  });
});
