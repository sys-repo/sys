import { describe, EsmAssert, expect, it, Path } from '../../-test.ts';
import { SlcDataPipeline } from '../mod.ts';

describe(`@tdb/data/slug/fs`, () => {
  it('API', async () => {
    const m = await import('@tdb/data/slug/fs');
    expect(m.SlcDataPipeline).to.equal(SlcDataPipeline);
  });

  it('allows the fs entry to own @sys/fs imports', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    await EsmAssert.runtimeGraphOwnership({
      entry: Path.resolve(root, '../mod.ts'),
      ownedImports: ['@sys/fs'],
    });
  });
});
