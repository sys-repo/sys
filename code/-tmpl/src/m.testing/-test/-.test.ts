import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';

describe(`@sys/tmpl/testing`, () => {
  it('API', async () => {
    const m = await import('@sys/tmpl/testing');
    expect(m.TmplTesting).to.equal(TmplTesting);
  });
});
