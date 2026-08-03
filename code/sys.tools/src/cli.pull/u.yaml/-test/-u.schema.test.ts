import { describe, expect, it } from '../../../-test.ts';
import { PullYamlSchema } from '../u.schema.ts';

const LIMITS = {
  metadataBytes: 1_000_000,
  entries: 100,
  fileBytes: 10_000_000,
  totalBytes: 50_000_000,
  totalTime: 30_000,
} as const;

const local = () => ({ dir: 'dev', mode: 'create' as const });

describe('PullYamlSchema', () => {
  it('accepts http bundle entries', () => {
    const res = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'http',
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev' },
        },
      ],
    });
    expect(res.ok).to.eql(true);
  });

  it('accepts bounded github:release bundle entries', () => {
    const res = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'github:release',
          repo: 'owner/name',
          tag: 'v1.2.3',
          asset: ['bundle.tgz', 'bundle.zip'],
          local: local(),
          limits: LIMITS,
        },
      ],
    });
    expect(res.ok).to.eql(true);
  });

  it('accepts bounded github:repo bundle entries', () => {
    const res = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'github:repo',
          repo: 'owner/name',
          ref: 'main',
          path: 'packages/tooling',
          local: { dir: 'dev', mode: 'replace' },
          limits: LIMITS,
        },
      ],
    });
    expect(res.ok).to.eql(true);
  });

  it('requires explicit GitHub target mode and finite limits', () => {
    const missingMode = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'github:repo',
          repo: 'owner/name',
          local: { dir: 'dev' },
          limits: LIMITS,
        },
      ],
    });
    const missingLimits = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'github:repo',
          repo: 'owner/name',
          local: local(),
        },
      ],
    });
    expect(missingMode.ok).to.eql(false);
    expect(missingLimits.ok).to.eql(false);

    for (const totalTime of [0, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      const invalidLimits = PullYamlSchema.validate({
        dir: '.',
        bundles: [
          {
            kind: 'github:repo',
            repo: 'owner/name',
            local: local(),
            limits: { ...LIMITS, totalTime },
          },
        ],
      });
      expect(invalidLimits.ok).to.eql(false);
    }
  });

  it('accepts HTTP-only clear defaults', () => {
    const res = PullYamlSchema.validate({
      dir: '.',
      defaults: { http: { clear: true } },
      bundles: [
        {
          kind: 'http',
          dist: 'https://example.com/dist.json',
          local: { dir: 'dev' },
        },
      ],
    });
    expect(res.ok).to.eql(true);
  });

  it('rejects GitHub local targets outside the configured pull root', () => {
    for (
      const dir of [
        '.',
        '..',
        '../outside',
        'nested/../outside',
        '/outside',
        '~/.outside',
        'C:\\outside',
        'nested\\outside',
        'nested\ncontrol',
      ]
    ) {
      const res = PullYamlSchema.validate({
        dir: '.',
        bundles: [
          {
            kind: 'github:repo',
            repo: 'owner/name',
            local: { dir, mode: 'create' },
            limits: LIMITS,
          },
        ],
      });
      expect(res.ok).to.eql(false);
    }
  });

  it('rejects malformed GitHub repository names', () => {
    const bad = [
      'owner',
      '/repo',
      'owner/',
      'owner/repo/extra',
      './repo',
      '../repo',
      'owner/.',
      'owner/..',
    ];
    for (const repo of bad) {
      const res = PullYamlSchema.validate({
        dir: '.',
        bundles: [
          {
            kind: 'github:repo',
            repo,
            local: local(),
            limits: LIMITS,
          },
        ],
      });
      expect(res.ok).to.eql(false);
    }
  });

  it('rejects unknown GitHub bundle fields', () => {
    const res = PullYamlSchema.validate({
      dir: '.',
      bundles: [
        {
          kind: 'github:repo',
          repo: 'owner/name',
          local: local(),
          limits: LIMITS,
          mutation: 'implicit',
        },
      ],
    });
    expect(res.ok).to.eql(false);
  });
});
