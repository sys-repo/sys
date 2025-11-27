import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t } from '../common.ts';
import { makeDocReadHandler } from '../mod.ts';

describe('Command: "doc:read"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('returns an existing document', async () => {
    const { repo } = env;
    const handler = makeDocReadHandler(() => repo);

    const created = await repo.create<{ value: number }>({ value: 123 });
    const doc = created.doc!;
    const res = await handler({ doc: doc.id });

    expect(res.doc).to.be.ok;
    expect(res.doc?.id).to.equal(doc.id);
    expect((res.doc?.current as { value: number }).value).to.equal(123);
  });

  it('returns undefined for a missing document', async () => {
    const { repo } = env;
    const handler = makeDocReadHandler(() => repo);

    const res = await handler({ doc: 'crdt:does-not-exist' as t.Crdt.Id });
    expect(res.doc).to.eql(undefined);
  });

  it('returns undefined when no repo is available', async () => {
    const { repo } = env;
    const existing = (await repo.create<{ value: number }>({ value: 1 })).doc!;

    const handler = makeDocReadHandler(() => undefined);
    const res = await handler({ doc: existing.id });

    expect(res.doc).to.eql(undefined);
  });
});
