import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

describe('SlugClient', () => {
  it('API', async () => {
    const m = await import('@sys/model-slug');
    const mm = await import('@sys/model-slug/client');
    expect(m.SlugClient).to.equal(SlugClient);
    expect(mm.SlugClient).to.equal(SlugClient);
  });
});
