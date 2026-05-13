import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectError,
  it,
  makeWorkerFixture,
} from '../../-test.ts';
import { type t } from '../common.ts';
import { makeDocCreateHandler } from '../mod.ts';
import { cmdContext } from './u.fixture.ts';

type Doc = { count: number; nested?: { foo: string } };

describe('Command: "doc:create"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  describe('happy path', () => {
    it('creates a new document with empty default init', async () => {
      const { repo } = env;
      const handler = makeDocCreateHandler(() => repo);

      const res = await handler({}, cmdContext('doc:create'));
      expect(res.doc).to.be.a('string');

      const got = await repo.get(res.doc);
      expect(got.ok).to.equal(true);
      expect(got.doc).to.exist;
    });

    it('creates a new document with an initial value', async () => {
      const { repo } = env;
      const handler = makeDocCreateHandler(() => repo);

      const initial: Doc = { count: 123, nested: { foo: 'bar' } };
      const res = await handler({ initial }, cmdContext('doc:create'));

      const got = await repo.get(res.doc);
      expect(got.ok).to.equal(true);
      expect(got.doc).to.exist;

      const current = got.doc!.current;
      expect(current).to.eql(initial);
    });
  });

  describe('not-found conditions', () => {
    it('throws when no repo is available', async () => {
      const handler = makeDocCreateHandler(() => undefined);

      await expectError(() => handler({}, cmdContext('doc:create')), 'No repo to operate on.');
    });
  });
});
