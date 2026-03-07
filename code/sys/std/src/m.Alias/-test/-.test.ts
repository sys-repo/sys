import { describe, expect, it } from '../../-test.ts';
import { AliasResolver } from '../mod.ts';

describe('Alias', () => {
  it('API', async () => {
    const m = await import('@sys/std/alias');
    expect(m.AliasResolver).to.eql(AliasResolver);
  });
});
