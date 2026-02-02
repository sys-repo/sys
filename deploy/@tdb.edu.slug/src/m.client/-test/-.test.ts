import { describe, expect, expectTypeOf, it, SlugClient } from '../../-test.ts';
import { ClientLoader } from '../mod.ts';

describe(`client: HTTP loader tools`, () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/client');
    expect(m.ClientLoader).to.equal(ClientLoader);
    expect(ClientLoader.Fetch).to.equal(SlugClient);
  });
});
