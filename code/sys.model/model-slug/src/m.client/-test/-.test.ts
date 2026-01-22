import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

describe('SlugClient', () => {
  it('API', async () => {
    const m = await import('@sys/model-slug');
    expect(m.SlugClient).to.equal(SlugClient);
  });
});
