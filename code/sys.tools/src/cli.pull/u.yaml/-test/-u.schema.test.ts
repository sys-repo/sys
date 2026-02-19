import { describe, expect, it } from '../../../-test.ts';
import { PullYamlSchema } from '../u.schema.ts';

describe('PullYamlSchema', () => {
  it('accepts http bundle entries', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'http' as const,
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('accepts github:release bundle entries', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:release' as const,
          repo: 'owner/name',
          tag: 'v1.2.3',
          asset: 'bundle.tgz',
          dist: 'dist.json',
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('rejects github:release without repo', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:release' as const,
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(false);
  });
});
