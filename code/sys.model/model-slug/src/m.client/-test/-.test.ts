import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

describe('SlugClient', () => {
  it('API', async () => {
    const client = await import('@sys/model-slug/client');
    expect(client.SlugClient).to.equal(SlugClient);
  });
});
