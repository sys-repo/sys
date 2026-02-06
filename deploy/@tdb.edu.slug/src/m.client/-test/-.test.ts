import { describe, expect, it, SlugClient } from '../../-test.ts';
import { Origin } from '../m.SlugLoader.Origin.ts';
import { ClientLoader } from '../mod.ts';

describe(`client: HTTP loader tools`, () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/client');
    expect(m.ClientLoader).to.equal(ClientLoader);
    expect(ClientLoader.Fetch).to.equal(SlugClient);
    expect(m.ClientLoader.Origin).to.equal(Origin);
  });
});
