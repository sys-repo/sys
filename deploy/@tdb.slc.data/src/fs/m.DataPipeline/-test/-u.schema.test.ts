import { describe, expect, it } from '../../../-test.ts';
import { MountSchema } from '../u.schema.ts';

describe('MountSchema', () => {
  it('valid doc → ok', () => {
    const res = MountSchema.validate({ mounts: [{ mount: 'sample-1' }] });
    expect(res.ok).to.eql(true);
  });

  it('invalid mount → error', () => {
    const res = MountSchema.validate({ mounts: [{ mount: 'bad/mount' }] });
    expect(res.ok).to.eql(false);
    expect(res.errors.length > 0).to.eql(true);
  });
});
