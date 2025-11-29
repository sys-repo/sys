import { Url as UrlBase } from '@sys/std';
import { describe, expect, it } from '../../-test.ts';
import { Url } from '../mod.ts';

describe(`Url`, () => {
  it('API', async () => {
    const m = await import('@sys/immutable/url');
    expect(m.Url).to.equal(Url);

    // Ensure all base Url fields are preserved by reference.
    const keys = Object.keys(UrlBase) as (keyof typeof UrlBase)[];
    for (const key of keys) {
      expect(Url[key]).to.equal(UrlBase[key]);
    }
  });
});
