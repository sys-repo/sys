import { describe, expect, it } from '../../../-test.ts';
import { SlugMounts } from '../mod.ts';

describe('SlugMounts', () => {
  it('valid doc → ok', () => {
    const res = SlugMounts.validate({ mounts: [{ mount: 'sample-1' }] });
    expect(res.ok).to.eql(true);
  });

  it('invalid mount → error', () => {
    const res = SlugMounts.validate({ mounts: [{ mount: 'bad/mount' }] });
    expect(res.ok).to.eql(false);
    expect(res.errors.length > 0).to.eql(true);
  });
});
