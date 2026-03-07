import { describe, it, expect } from '../../../../-test.ts';
import { NoopProvider } from '../mod.ts';

describe('No-op Provider: Schema', () => {
  it('accepts a valid noop provider', () => {
    const res = NoopProvider.Schema.validate({ kind: 'noop' });
    expect(res.ok).to.eql(true);
  });

  it('rejects unknown properties', () => {
    const res = NoopProvider.Schema.validate({
      kind: 'noop',
      extra: true,
    });

    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });
});
