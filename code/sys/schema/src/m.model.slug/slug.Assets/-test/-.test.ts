import { describe, expect, it } from '../../../-test.ts';
import { AssetsSchema } from '../mod.ts';

describe(`schema/model/slug/assets`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/model/slug/assets');
    expect(m.AssetsSchema).to.equal(AssetsSchema);
  });
});
