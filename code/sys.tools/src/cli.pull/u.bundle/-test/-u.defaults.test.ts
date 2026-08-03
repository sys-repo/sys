import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { resolveBundleForPull } from '../u.defaults.ts';

const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 1_000_000,
  entries: 100,
  fileBytes: 10_000_000,
  totalBytes: 50_000_000,
  totalTime: 30_000,
};

describe('cli.pull/u.bundle → defaults', () => {
  it('applies HTTP clear defaults', () => {
    const bundle: t.PullTool.ConfigYaml.HttpBundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev' },
    };

    const result = resolveBundleForPull(bundle, { http: { clear: true } });
    expect(result.kind).to.eql('http');
    if (result.kind !== 'http') throw new Error('Expected HTTP bundle.');
    expect(result.local.clear).to.eql(true);
  });

  it('preserves an explicit HTTP clear decision', () => {
    const bundle: t.PullTool.ConfigYaml.HttpBundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev', clear: false },
    };

    const result = resolveBundleForPull(bundle, { http: { clear: true } });
    expect(result.kind).to.eql('http');
    if (result.kind !== 'http') throw new Error('Expected HTTP bundle.');
    expect(result.local.clear).to.eql(false);
  });

  it('leaves explicit GitHub authority unchanged', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/name',
      local: { dir: 'releases', mode: 'create' },
      limits: LIMITS,
    };

    expect(resolveBundleForPull(bundle)).to.equal(bundle);
  });
});
