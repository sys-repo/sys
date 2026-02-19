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

  it('accepts github:release bundle entries with asset array', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:release' as const,
          repo: 'owner/name',
          asset: ['bundle.tgz', 'bundle.zip'],
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('rejects github:release repo values that are not owner/repo', () => {
    const bad = ['owner', '/repo', 'owner/', 'owner/repo/extra'];

    for (const repo of bad) {
      const doc = {
        dir: '.',
        bundles: [
          {
            kind: 'github:release' as const,
            repo,
            local: { dir: 'dev' },
          },
        ],
      };

      const res = PullYamlSchema.validate(doc);
      expect(res.ok).to.eql(false);
    }
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
