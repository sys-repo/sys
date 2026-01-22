import { describe, expect, it } from '../../-test.ts';
import { SlugClient, SlugUrl } from '../mod.ts';

describe('SlugClient', () => {
  it('API', async () => {
    const m = await import('@sys/driver-slug/client');
    expect(m.SlugClient).to.equal(SlugClient);
    expect(m.SlugUrl).to.equal(SlugUrl);
  });
});
