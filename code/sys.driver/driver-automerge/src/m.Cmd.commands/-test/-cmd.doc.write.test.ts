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
import { makeDocWriteHandler } from '../mod.ts';
import { cmdContext } from './u.fixture.ts';

type Doc = { foo: { bar: number } };

describe('Command: "doc:write"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('writes a JSON value at the given object path', async () => {
    const { repo } = env;
    const handler = makeDocWriteHandler(() => repo);

    const created = await repo.create<Doc>({ foo: { bar: 123 } });
    const doc = created.doc!;

    const resA = await handler(
      {
        doc: doc.id,
        path: ['foo', 'bar'],
        value: 456,
      },
      cmdContext('doc:write'),
    );

    expect(resA.ok).to.eql(true);

    const resB = await repo.get<Doc>(doc.id);
    expect(resB.ok).to.eql(true);

    const current = resB.doc!.current;
    expect(current.foo.bar).to.eql(456);
  });

  describe('error conditions', () => {
    it('throws when the target document does not exist', async () => {
      const { repo } = env;
      const handler = makeDocWriteHandler(() => repo);
      const missingId = 'does-not-exist';

      await expectError(
        () => handler({ doc: missingId, path: ['foo'], value: 123 }, cmdContext('doc:write')),
        `Failed to load document for write (id: ${missingId}).`,
      );
    });

    it('throws when no repo is available', async () => {
      const { repo } = env;
      const existing = (await repo.create<{ foo: number }>({ foo: 1 })).doc!;
      const handler = makeDocWriteHandler(() => undefined);

      await expectError(
        () => handler({ doc: existing.id, path: ['foo'], value: 999 }, cmdContext('doc:write')),
        'No repo to operate on.',
      );
    });

    it('throws when the object path is empty (root writes not supported)', async () => {
      const { repo } = env;
      const handler = makeDocWriteHandler(() => repo);

      const created = await repo.create<{ foo: number }>({ foo: 1 });
      const doc = created.doc!;

      await expectError(
        () => handler({ doc: doc.id, path: [], value: 999 }, cmdContext('doc:write')),
        'doc:write requires a non-empty object path.',
      );
    });
  });
});
