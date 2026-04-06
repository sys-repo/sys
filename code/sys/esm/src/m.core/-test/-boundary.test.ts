import { describe, EsmAssert, it, Path } from '../../-test.ts';

describe('@sys/esm/core graph boundary', () => {
  it('does not import deps or fs', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs'],
      forbiddenPathIncludes: ['/src/m.deps/'],
    });
  });
});
