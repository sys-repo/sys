import { describe, EsmAssert, it, Path } from '../-test.ts';

describe('{{pkg.name}}/ui', () => {
  it('keeps @sys/fs out of the ui runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, './mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });
});
