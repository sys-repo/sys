import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('Files boundary', () => {
  it('keeps host IO, server layers, and files adapters out of the core files runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');

    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: [
        '@sys/fs',
        '@sys/http',
        '@sys/server',
        '@sys/model/files/fs',
        '@sys/model/files/memory',
        '@sys/model/files/static',
      ],
      forbiddenPathIncludes: [
        '/code/sys/fs/',
        '/code/sys/http/',
        '/code/sys/server/',
        '/src/m.files.fs/',
        '/src/m.files.memory/',
        '/src/m.files.static/',
      ],
    });
  });
});
