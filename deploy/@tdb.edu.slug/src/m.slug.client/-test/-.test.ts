import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

describe(`slug: client`, () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/client');
    expect(m.SlugClient).equal(SlugClient);
  });
});
