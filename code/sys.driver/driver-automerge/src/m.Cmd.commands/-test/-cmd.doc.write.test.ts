import {
  afterAll,
  expectError,
  beforeAll,
  describe,
  expect,
  it,
  makeWorkerFixture,
} from '../../-test.ts';
import { type t } from '../common.ts';
import { makeDocWriteHandler } from '../mod.ts';

describe('Command: "doc:write"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('writes a JSON value at the given object path', async () => {
    const { repo } = env;
    const handler = makeDocWriteHandler(() => repo);

    // Create a document with a nested shape.
    type T = { foo: { bar: number } };
    const created = await repo.create<T>({ foo: { bar: 123 } });
    const doc = created.doc!;

    // Perform the write via the command handler.
    const resA = await handler({
      doc: doc.id,
      path: ['foo', 'bar'],
      value: 456,
    });

    expect(resA.ok).to.eql(true);

    // Read the document back from the repo and ensure the value was updated.
    const resB = await repo.get<T>(doc.id);
    expect(resB.ok).to.eql(true);

    const current = resB.doc!.current;
    expect(current.foo.bar).to.eql(456);
  });


      await expectError(
        () => handler({ doc: missingId, path: ['foo'], value: 123 }),
        `Failed to load document for write (id: ${missingId}).`,
      );
    });
  });
});
