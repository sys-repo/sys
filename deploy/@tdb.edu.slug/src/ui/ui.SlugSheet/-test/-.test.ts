import { describe, expect, it } from '../../../-test.ts';
import { SlugSheet } from '../mod.ts';

describe('SlugSheet', () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/ui');
    expect(m.SlugSheet).to.equal(SlugSheet);
  });
});
