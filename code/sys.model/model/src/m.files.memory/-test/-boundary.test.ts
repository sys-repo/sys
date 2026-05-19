import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesMemory boundary', () => {
  it('keeps @sys/fs out of the memory backing runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: ['/code/sys/fs/'],
    });
  });
});
