import { describe, it, expect } from '../../../-test.ts';
import { OrbiterProviderSchema } from '../u.orbiter.schema.ts';

describe('Schema: Orbiter Provider', () => {
  it('accepts a valid orbiter provider', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
    };

    const res = OrbiterProviderSchema.validate(value);
    expect(res.ok).to.eql(true);
  });

  it('rejects missing required fields', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
    };

    const res = OrbiterProviderSchema.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('rejects unknown properties', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
      extra: true,
    };

    const res = OrbiterProviderSchema.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });
});
