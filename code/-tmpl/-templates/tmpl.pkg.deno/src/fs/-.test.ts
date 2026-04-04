import { describe, EsmAssert, expect, it, Path } from '../-test.ts';
import { pkg } from '../pkg.ts';

describe(`${pkg.name}/fs`, () => {
  it('owns @sys/fs from the ./fs entry', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphOwnership({
      entry: Path.resolve(root, './mod.ts'),
      ownedImports: ['@sys/fs'],
    });
  });
});
