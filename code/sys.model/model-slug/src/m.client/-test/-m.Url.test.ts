import { describe, expect, it } from '../../-test.ts';
import { SlugUrl } from '../m.Url.ts';
import { SlugClient } from '../mod.ts';

describe('SlugUrl.isAbsoluteHref', () => {
  it('API', () => {
    expect(SlugClient.Url).to.equal(SlugUrl);
  });
});
