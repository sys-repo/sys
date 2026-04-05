import { describe, EsmAssert, expect, it, Path } from '../-test.ts';
import { DataClient, SlcMounts } from './mod.ts';

describe('@tdb/slc-data/m', () => {
  it('API', async () => {
    const m = await import('@tdb/slc-data');
    expect(m.SlcMounts).to.equal(SlcMounts);
    expect(m.DataClient).to.equal(DataClient);
  });

  it('keeps filesystem imports out of the shared m runtime graph', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.resolve(root, './mod.ts'),
      forbiddenImports: ['@sys/fs', '@sys/model-slug/fs'],
    });
  });
});
