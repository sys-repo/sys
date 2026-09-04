import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesFs boundary', () => {
  it('keeps host IO and sibling files adapters out of the files/fs runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model/files/memory', '@sys/model/files/static'],
      forbiddenPathIncludes: ['/code/sys/fs/', '/src/m.files.memory/', '/src/m.files.static/'],
    });
  });
});
