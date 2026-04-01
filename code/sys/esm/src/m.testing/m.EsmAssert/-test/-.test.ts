import { describe, expect, it, Path } from '../../../-test.ts';
import { EsmAssert } from '../mod.ts';

describe(`EsmAssert`, () => {
  it('asserts the core runtime graph boundary', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../../../m.core/mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: ['/src/m.deps/'],
    });
  });

  it('fails when the runtime graph imports a forbidden module', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    let err: unknown;
    try {
      await EsmAssert.runtimeGraphBoundary({
        entry: Path.resolve(root, '../../../m.deps/mod.ts'),
        forbiddenImports: ['@sys/fs'],
      });
    } catch (e) {
      err = e;
    }

    expect(err).to.be.instanceOf(Error);
    expect((err as Error).message).to.include(`forbidden import '@sys/fs'`);
  });
});
