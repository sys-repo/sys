import { describe, expect, it } from '../../../-test.ts';
import { SlugBundleTransform } from '../mod.ts';

describe(`SlugBundle.Transform`, () => {
  it('API', async () => {
    const m = await import('@sys/model-slug/bundle');
    expect(m.SlugBundle.Transform).to.equal(SlugBundleTransform);
  });

  it('exposes derive()', () => {
    expect(typeof SlugBundleTransform.derive).to.equal('function');
  });

  it('exposes TreeFs.derive()', () => {
    expect(typeof SlugBundleTransform.TreeFs.derive).to.equal('function');
  });

});
