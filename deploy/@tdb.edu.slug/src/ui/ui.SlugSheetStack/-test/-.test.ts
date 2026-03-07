import { describe, expect, it } from '../../../-test.ts';
import { SlugSheetStack } from '../mod.ts';

describe('SlugSheetStack', () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/ui');
    expect(m.SlugSheetStack).to.equal(SlugSheetStack);
  });
});
