import { describe, expect, it } from '../../../-test.ts';
import { SlcMounts } from '../mod.ts';

describe('SlcMounts', () => {
  it('valid doc → ok', () => {
    const res = SlcMounts.validate({ mounts: [{ mount: 'sample-1' }] });
    expect(res.ok).to.eql(true);
  });

  it('invalid mount → error', () => {
    const res = SlcMounts.validate({ mounts: [{ mount: 'bad/mount' }] });
    expect(res.ok).to.eql(false);
    expect(res.errors.length > 0).to.eql(true);
  });
});
