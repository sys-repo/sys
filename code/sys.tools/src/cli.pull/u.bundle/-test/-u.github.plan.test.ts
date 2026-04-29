import { describe, expect, Fs, it } from '../../../-test.ts';
import { type t } from '../u.pull/common.ts';
import { createGithubReleasePullPlan } from '../u.pull/u.github.plan.ts';

describe('cli.pull/u.bundle → github pull plan', () => {
  it('creates a release asset materialization plan with safe relative filenames', () => {
    const baseDir = '/tmp/sys.tools.pull.github.plan' as t.StringDir;
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo' as t.StringRelativeDir },
    };
    const resolved: t.PullTool.GithubReleaseResolved = {
      release: {
        tag: 'v1/2\\3 beta',
        assets: [
          asset(1, 'app.tgz'),
          asset(2, 'app.tgz'),
          asset(3, '../nested\\tool.tgz'),
          asset(4, '   '),
        ],
      },
      assets: [
        asset(1, 'app.tgz'),
        asset(2, 'app.tgz'),
        asset(3, '../nested\\tool.tgz'),
        asset(4, '   '),
      ],
    };

    const res = createGithubReleasePullPlan({ baseDir, bundle, resolved });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.releaseDir).to.eql('v1-2-3-beta');
    expect(res.plan.kind).to.eql('github:release');
    expect(res.plan.targetRoot).to.eql(Fs.join(baseDir, 'releases/repo', 'v1-2-3-beta'));
    expect(res.plan.entries.map((entry) => entry.relativePath)).to.eql([
      'app.tgz',
      'app-2.tgz',
      '..-nested-tool.tgz',
      'asset-4',
    ]);
    expect(res.plan.entries.every((entry) => !entry.relativePath.includes('/'))).to.eql(true);
    expect(res.plan.entries.every((entry) => !entry.relativePath.includes('\\'))).to.eql(true);
    expect(res.plan.entries.map((entry) => entry.request)).to.eql([
      {
        kind: 'release-asset',
        repo: 'owner/repo',
        assetId: 1,
        fallbackUrl: 'https://example.com/app.tgz',
      },
      {
        kind: 'release-asset',
        repo: 'owner/repo',
        assetId: 2,
        fallbackUrl: 'https://example.com/app.tgz',
      },
      {
        kind: 'release-asset',
        repo: 'owner/repo',
        assetId: 3,
        fallbackUrl: 'https://example.com/..%2Fnested%5Ctool.tgz',
      },
      {
        kind: 'release-asset',
        repo: 'owner/repo',
        assetId: 4,
        fallbackUrl: 'https://example.com/%20%20%20',
      },
    ]);
  });

  it('fails clearly when release resolution has no assets', () => {
    const res = createGithubReleasePullPlan({
      baseDir: '/tmp/sys.tools.pull.github.plan' as t.StringDir,
      bundle: {
        kind: 'github:release',
        repo: 'owner/repo',
        local: { dir: 'releases/repo' as t.StringRelativeDir },
      },
      resolved: {
        release: { tag: 'v1.0.0', assets: [] },
        assets: [],
      },
    });

    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error).to.include('Release has no assets');
  });
});

function asset(id: number, name: string): t.PullTool.GithubReleaseAsset {
  return {
    id,
    name,
    downloadUrl: `https://example.com/${encodeURIComponent(name)}` as t.StringUrl,
  };
}
