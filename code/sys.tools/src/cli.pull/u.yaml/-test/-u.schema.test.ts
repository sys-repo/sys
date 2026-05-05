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

  it('accepts github:repo bundle entries', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:repo' as const,
          repo: 'owner/name',
          ref: 'main',
          path: 'packages/tooling',
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('accepts minimal github:repo bundle entries', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:repo' as const,
          repo: 'owner/name',
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('accepts local.clear on bundle targets', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'http' as const,
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev', clear: true },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('accepts defaults.local.clear at root', () => {
    const doc = {
      dir: '.',
      defaults: {
        local: {
          clear: true,
        },
      },
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

  it('rejects non-boolean local.clear values', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'http' as const,
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev', clear: 'yes' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(false);
  });

  it('rejects non-boolean defaults.local.clear values', () => {
    const doc = {
      dir: '.',
      defaults: {
        local: {
          clear: 'yes',
        },
      },
      bundles: [
        {
          kind: 'http' as const,
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(false);
  });

  it('rejects github repo values that are not owner/repo', () => {
    const bad = ['owner', '/repo', 'owner/', 'owner/repo/extra'];

    for (const kind of ['github:release', 'github:repo'] as const) {
      for (const repo of bad) {
        const doc = {
          dir: '.',
          bundles: [
            {
              kind,
              repo,
              local: { dir: 'dev' },
            },
          ],
        };

        const res = PullYamlSchema.validate(doc);
        expect(res.ok).to.eql(false);
      }
    }
  });

  it('rejects github bundles without repo', () => {
    for (const kind of ['github:release', 'github:repo'] as const) {
      const doc = {
        dir: '.',
        bundles: [
          {
            kind,
            local: { dir: 'dev' },
          },
        ],
      };

      const res = PullYamlSchema.validate(doc);
      expect(res.ok).to.eql(false);
    }
  });

  it('rejects unknown github:repo fields', () => {
    const doc = {
      dir: '.',
      bundles: [
        {
          kind: 'github:repo' as const,
          repo: 'owner/name',
          private: true,
          local: { dir: 'dev' },
        },
      ],
    };

    const res = PullYamlSchema.validate(doc);
    expect(res.ok).to.eql(false);
  });
});
