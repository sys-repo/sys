import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t } from '../common.ts';
import { makeDocCreateHandler } from '../mod.ts';

describe('Command: "doc:create"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  type Doc = { count: number; nested?: { foo: string } };

  describe('happy path', () => {
    it('creates a new document with empty default init', async () => {
      const { repo } = env;
      const handler = makeDocCreateHandler(() => repo);

      const res = await handler({});
      expect(res.doc).to.be.a('string');

      const got = await repo.get(res.doc);
      expect(got.ok).to.equal(true);
      expect(got.doc).to.exist;
    });

    it('creates a new document with an initial value', async () => {
      const { repo } = env;
      const handler = makeDocCreateHandler(() => repo);

      const initial: Doc = { count: 123, nested: { foo: 'bar' } };
      const res = await handler({ initial });

      const got = await repo.get(res.doc);
      expect(got.ok).to.equal(true);
      expect(got.doc).to.exist;

      // Assert initial value materialized.
      const current = got.doc!.current as unknown;
      expect(current).to.eql(initial);
    });
  });

  describe('not-found conditions', () => {
    it('throws when no repo is available', async () => {
      const handler = makeDocCreateHandler(() => undefined);

      let err: unknown;
      try {
        await handler({});
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceOf(Error);
      expect((err as Error).message).to.contain('No repo to operate on.');
    });
  });
});
