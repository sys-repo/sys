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
  it('content pin → accept optional explicit projection', () => {
    const base = {
      kind: 'dist',
      manifest: 'https://example.com/dist.json',
      pin: { scheme: 'sys.dist/v2', digest: `sha256-${'a'.repeat(64)}` },
      store: './.dist-store',
    } as const;

    expect(PullYamlSchema.validate({ dir: '.', bundles: [base] }).ok).to.eql(true);
    expect(
      PullYamlSchema.validate({
        dir: '.',
        bundles: [{ ...base, project: { dir: './view/dev', mode: 'replace' } }],
      }).ok,
    ).to.eql(true);
  });

  it('rejects legacy or incompletely pinned Dist bundles', () => {
    const valid = {
      kind: 'dist',
      manifest: 'https://example.com/dist.json',
      pin: { scheme: 'sys.dist/v2', digest: `sha256-${'a'.repeat(64)}` },
      store: './.dist-store',
    } as const;

    const invalid = [
      { kind: 'http', dist: valid.manifest, local: { dir: 'dev' } },
      { ...valid, manifest: undefined },
      { ...valid, pin: undefined },
      { ...valid, pin: { ...valid.pin, digest: `sha256-${'A'.repeat(64)}` } },
      { ...valid, pin: { 'dist.json': valid.pin.digest } },
      { ...valid, pin: { ...valid.pin, scheme: 'unsupported' } },
      { ...valid, pin: { ...valid.pin, extra: true } },
      { ...valid, integrity: valid.pin.digest },
      { ...valid, pin: undefined, integrity: valid.pin.digest },
      { ...valid, store: undefined },
      { ...valid, project: { dir: './view/dev' } },
      { ...valid, project: { dir: '../outside', mode: 'replace' } },
    ];

    for (const bundle of invalid) {
      expect(PullYamlSchema.validate({ dir: '.', bundles: [bundle] }).ok).to.eql(false);
    }
  });

  it('invalid Dist manifest URL → reports the authored field before dispatch', () => {
    for (
      const manifest of [
        'http://[',
        'https://[',
        'https://user@example.com/dist.json',
        'https://:password@example.com/dist.json',
        'https://user:password@example.com/dist.json',
      ]
    ) {
      const bundle = {
        kind: 'dist',
        manifest,
        pin: { scheme: 'sys.dist/v2', digest: `sha256-${'a'.repeat(64)}` },
        store: './.dist-store',
      };
      const result = PullYamlSchema.validate({ dir: '.', bundles: [bundle] });
      expect(result.ok).to.eql(false);
      expect(result.errors.map(({ path, message }) => ({ path, message }))).to.eql([{
        path: '/bundles/0/manifest',
        message: 'Expected an absolute HTTP(S) Dist manifest URL without userinfo.',
      }]);
    }
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
