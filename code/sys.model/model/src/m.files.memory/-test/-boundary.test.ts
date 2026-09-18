import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesMemory boundary', () => {
  it('keeps host IO and sibling files adapters out of the memory runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model/files/fs', '@sys/model/files/static'],
      forbiddenPathIncludes: ['/code/sys/fs/', '/src/m.files.fs/', '/src/m.files.static/'],
    });
  });
});
