import { describe, EsmAssert, it, Path } from '../../-test.ts';
import { pkg } from '../../pkg.ts';

describe(`${pkg.name}/m.shell.structure`, () => {
  it('keeps delivery/runtime dependencies out of the structure runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '..');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model/files', '@sys/server', '@sys/cell', 'react'],
    });
  });
});
