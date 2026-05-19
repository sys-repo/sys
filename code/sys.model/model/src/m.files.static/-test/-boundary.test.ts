import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesStatic boundary', () => {
  it('keeps host IO and server layers out of the static dist backing runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/http', '@sys/server'],
      forbiddenPathIncludes: ['/code/sys/fs/', '/code/sys/http/', '/code/sys/server/'],
    });
  });
});
