import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import { SlugUrl } from '../common.ts';

describe('SlugClient', () => {
  it('API', async () => {
    const m = await import('@sys/model-slug/client');
    expect(m.SlugClient).to.equal(SlugClient);
    expect(SlugClient.Url).to.equal(SlugUrl);
  });
});
