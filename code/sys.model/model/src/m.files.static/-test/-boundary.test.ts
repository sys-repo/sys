import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('FilesStatic boundary', () => {
  it('keeps host IO, server layers, and sibling files adapters out of the static dist runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: [
        '@sys/fs',
        '@sys/http',
        '@sys/server',
        '@sys/model/files/fs',
        '@sys/model/files/memory',
      ],
      forbiddenPathIncludes: [
        '/code/sys/fs/',
        '/code/sys/http/',
        '/code/sys/server/',
        '/src/m.files.fs/',
        '/src/m.files.memory/',
      ],
    });
  });
});
