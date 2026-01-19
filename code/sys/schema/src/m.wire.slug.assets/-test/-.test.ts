import { describe, expect, it } from '../../-test.ts';
import { AssetsSchema } from '../mod.ts';

describe(`schema/wire/slug/assets`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/wire/slug/assets');
    expect(m.AssetsSchema).to.equal(AssetsSchema);
  });
});
