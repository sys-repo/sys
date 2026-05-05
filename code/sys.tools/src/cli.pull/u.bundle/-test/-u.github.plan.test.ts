import { describe, expect, Fs, it } from '../../../-test.ts';
import { type t } from '../u.pull.github/common.ts';
import { createGithubReleasePullPlan, createGithubRepoPullPlan } from '../u.pull.github/u.plan.ts';

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

  it('creates a repo blob materialization plan under the configured local dir', () => {
    const baseDir = '/tmp/sys.tools.pull.github.plan' as t.StringDir;
    const bundle: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/repo',
      ref: 'main',
      path: 'packages/tooling',
      local: { dir: 'pulled/tooling' as t.StringRelativeDir },
    };
    const resolved: t.PullTool.GithubRepoResolved = {
      repo: 'owner/repo',
      ref: 'main',
      commit: 'commit-sha',
      tree: 'tree-sha',
      path: 'packages/tooling',
      entries: [
        {
          sourcePath: 'packages/tooling/mod.ts' as t.StringPath,
          relativePath: 'mod.ts' as t.StringRelativePath,
          sha: 'sha-mod',
          size: 123,
          url: 'https://api.github.test/blob/sha-mod' as t.StringUrl,
        },
      ],
    };

    const res = createGithubRepoPullPlan({ baseDir, bundle, resolved });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.plan.kind).to.eql('github:repo');
    expect(res.plan.targetRoot).to.eql(Fs.join(baseDir, 'pulled/tooling'));
    expect(res.plan.entries).to.eql([
      {
        source: 'https://github.com/owner/repo/blob/main/packages/tooling/mod.ts',
        relativePath: 'mod.ts',
        size: 123,
        request: {
          kind: 'repo-blob',
          repo: 'owner/repo',
          ref: 'main',
          sha: 'sha-mod',
          path: 'packages/tooling/mod.ts',
          url: 'https://api.github.test/blob/sha-mod',
        },
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
