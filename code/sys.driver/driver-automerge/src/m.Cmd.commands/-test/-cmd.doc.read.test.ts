import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t } from '../common.ts';
import { makeDocReadHandler } from '../mod.ts';

describe('Command: "doc:read"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  type Doc = { count: number; nested?: { foo: string } };

  describe('happy path', () => {
    it('returns the root document value', async () => {
      const { repo } = env;
      const handler = makeDocReadHandler(() => repo);

      const created = await repo.create<Doc>({ count: 123 });
      const doc = created.doc!;
      const res = await handler({ doc: doc.id });

      expect(res.value).to.eql({ count: 123 });
    });

    it('returns a nested value when a path is provided', async () => {
      const { repo } = env;
      const handler = makeDocReadHandler(() => repo);

      const created = await repo.create<Doc>({ count: 1, nested: { foo: 'bar' } });
      const doc = created.doc!;
      const res = await handler({
        doc: doc.id,
        path: ['nested', 'foo'] as t.ObjectPath,
      });

      expect(res.value).to.equal('bar');
    });
  });

  describe('not-found conditions', () => {
    it('returns <undefined> when id is in "crdt:<id>" URI format', async () => {
      const { repo } = env;
      const handler = makeDocReadHandler(() => repo);

      const created = await repo.create<Doc>({ count: 123 });
      const doc = created.doc!;
      const res = await handler({ doc: `crdt:${doc.id}` });

      expect(res.value).to.eql(undefined);
    });

    it('returns <undefined> when the requested path does not exist', async () => {
      const { repo } = env;
      const handler = makeDocReadHandler(() => repo);

      const created = await repo.create<Doc>({ count: 1, nested: { foo: 'bar' } });
      const doc = created.doc!;

      const res = await handler({
        doc: doc.id,
        path: ['nested', 'missing'],
      });

      expect(res.value).to.eql(undefined);
    });

    it('returns <undefined> for a missing document', async () => {
      const { repo } = env;
      const handler = makeDocReadHandler(() => repo);

      const res = await handler({ doc: 'does-not-exist' });
      expect(res.value).to.eql(undefined);
    });

    it('returns <undefined> when no repo is available', async () => {
      const { repo } = env;
      const existing = (await repo.create<Doc>({ count: 1 })).doc!;

      const handler = makeDocReadHandler(() => undefined);
      const res = await handler({ doc: existing.id });

      expect(res.value).to.eql(undefined);
    });
  });
});
