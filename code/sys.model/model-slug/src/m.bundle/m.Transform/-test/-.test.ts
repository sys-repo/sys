import { describe, expect, it } from '../../../-test.ts';
import { SlugBundleTransform } from '../mod.ts';

describe(`SlugBundle.Transform`, () => {
  it('API', async () => {
    const m = await import('@sys/model-slug/bundle');
    expect(m.SlugBundle.Transform).to.equal(SlugBundleTransform);
  });
});
