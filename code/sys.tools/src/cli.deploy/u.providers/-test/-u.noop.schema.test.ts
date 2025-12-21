import { describe, it, expect } from '../../../-test.ts';
import { NoopProviderSchema } from '../u.noop.schema.ts';

describe('Schema: Noop Provider', () => {
  it('accepts a valid noop provider', () => {
    const res = NoopProviderSchema.validate({ kind: 'noop' });
    expect(res.ok).to.eql(true);
  });

  it('rejects unknown properties', () => {
    const res = NoopProviderSchema.validate({
      kind: 'noop',
      extra: true,
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });
});
