import { describe, expect, it } from '../../-test.ts';

import { SlugUrl } from '../mod.ts';
import { Composition } from '../m.Composition.ts';

describe('SlugUrl', () => {
  it('API', async () => {
    const m = await import('@sys/model-slug/client');
    expect(m.SlugClient.Url).to.equal(SlugUrl);
    expect(SlugUrl.Composition).to.equal(Composition);
  });
});
