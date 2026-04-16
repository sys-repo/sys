import { describe, EsmAssert, it, Path } from '../-test.ts';

describe('@tdb/data/slug export graph boundary', () => {
  it('keeps common exports @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../common/mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });
});
