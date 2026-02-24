import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { SlugBundle } from '../mod.ts';

describe(`SlugBundle`, () => {
  it('API', async () => {
    const m = await import('@sys/model-slug/bundle');
    expect(m.SlugBundle).to.equal(SlugBundle);
  });
});
