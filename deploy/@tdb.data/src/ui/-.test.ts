import { describe, EsmAssert, expect, it, Path } from '../-test.ts';
import { HttpOrigin, Mounts } from './mod.ts';

describe('@tdb/data/slug/ui', () => {
  it('API', async () => {
    const m = await import('@tdb/data/slug/ui');
    expect(m.HttpOrigin).to.equal(HttpOrigin);
    expect(m.Mounts).to.equal(Mounts);
  });

  it('keeps filesystem imports out of the ui runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, './mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model-slug/fs'],
    });
  });
});
