import { describe, it, expect } from '../../../../-test.ts';
import { OrbiterProvider } from '../mod.ts';

describe('Orbiter Provider: Schema', () => {
  it('accepts a valid orbiter provider', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
    };

    const res = OrbiterProvider.Schema.validate(value);
    expect(res.ok).to.eql(true);
  });

  it('accepts shard config', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      shards: {
        total: 64,
        only: [1, 4, 5],
        siteIds: {
          1: 'aaa-bbb',
          4: 'ccc-ddd',
        },
      },
    };

    const res = OrbiterProvider.Schema.validate(value);
    expect(res.ok).to.eql(true);
  });

  it('rejects missing required fields', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
    };

    const res = OrbiterProvider.Schema.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });

  it('rejects unknown properties', () => {
    const value = {
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      extra: true,
    };

    const res = OrbiterProvider.Schema.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.errors.length > 0).to.eql(true);
  });
});
