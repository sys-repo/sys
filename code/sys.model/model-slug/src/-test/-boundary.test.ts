import { describe, EsmAssert, it, Path } from '../-test.ts';

describe('@sys/model-slug export graph boundary', () => {
  it('keeps root export @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });

  it('keeps bundle export @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../m.bundle/mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });

  it('keeps client export @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../m.client/mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });

  it('keeps schema export @sys/fs free', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, '../m.schema/mod.ts'),
      forbiddenImports: ['@sys/fs'],
    });
  });
});
