import { describe, expect, it } from '../../-test.ts';
import { AssetsSchema } from '../mod.ts';

describe(`schema/model/slug`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/model/slug');
    expect(m.AssetsSchema).to.equal(AssetsSchema);
  });
});
