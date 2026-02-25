import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { XXX } from '../mod.ts';

describe(`FS: Capability`, () => {
  it('API', async () => {
    const m = await import('@sys/fs/capability');
    expect(m.XXX).to.equal(XXX);
  });
});
