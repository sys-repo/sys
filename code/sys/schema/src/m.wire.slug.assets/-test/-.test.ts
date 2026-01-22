import { describe, expect, it } from '../../-test.ts';
import { AssetsSchema } from '../mod.ts';

describe(`schema/slug/assets`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/slug/assets');
    expect(m.AssetsSchema).to.equal(AssetsSchema);
  });
});
