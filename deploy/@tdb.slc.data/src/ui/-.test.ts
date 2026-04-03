import { describe, EsmAssert, expect, it, Path } from '../-test.ts';
import { HttpOrigin } from './mod.ts';

describe('@tdb/slc-data/ui', () => {
  it('API', async () => {
    const m = await import('@tdb/slc-data/ui');
    expect(m.HttpOrigin).to.equal(HttpOrigin);
  });

  it('keeps filesystem imports out of the ui runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, './mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model-slug/fs'],
    });
  });
});
