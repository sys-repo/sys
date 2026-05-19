import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesFs boundary', () => {
  it('keeps @sys/fs out of the files/fs backing runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: ['/code/sys/fs/'],
    });
  });
});
