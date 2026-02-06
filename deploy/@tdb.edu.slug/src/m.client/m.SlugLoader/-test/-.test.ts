import { describe, expect, it, SlugClient } from '../../../-test.ts';
import { Origin } from '../m.Origin.ts';
import { SlugLoader } from '../mod.ts';

describe(`client: HTTP loader tools`, () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/client');
    expect(m.SlugLoader).to.equal(SlugLoader);
    expect(SlugLoader.Fetch).to.equal(SlugClient);
    expect(m.SlugLoader.Origin).to.equal(Origin);
  });
});
