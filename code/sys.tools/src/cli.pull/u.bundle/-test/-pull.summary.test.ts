import { describe, expect, it } from '../../../-test.ts';
import { Cli, type t } from '../../common.ts';
import { Fmt } from '../../u.fmt.ts';

const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 1_000_000,
  entries: 100,
  fileBytes: 100_000_000,
  totalBytes: 200_000_000,
  totalTime: 30_000,
};

describe('cli.pull summary formatting', () => {
  it('formats pull failures with separated message, context table, and detail', () => {
    const res = Fmt.pullError([
      'GitHub repository/path/ref not accessible.',
      'source: github:repo',
      'repo: sys-repo/sys.canon',
      'The remote source did not produce a materializable bundle.',
    ].join('\n'));

    const text = Cli.stripAnsi(res);
    expect(text).to.include('Pull Failed');
    expect(text).to.include('GitHub repository/path/ref not accessible.');
    expect(text).to.match(/source\s+github:repo/);
    expect(text).to.match(/repo\s+sys-repo\/sys\.canon/);
  });

  it('formats github:release results without Dist metadata', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo', mode: 'create' },
      limits: LIMITS,
    };
    const data: t.GithubPull.Success = {
      ok: true,
      into: '/tmp/releases/repo' as t.StringAbsoluteDir,
      resolved: {
        kind: 'github:release',
        repo: bundle.repo,
        tag: 'v1.2.3',
        assets: ['app.rpm', 'app.AppImage'],
      },
      files: [
        {
          source: 'https://api.github.com/repos/owner/repo/releases/assets/1' as t.StringUrl,
          target: 'app.rpm' as t.StringRelativePath,
          bytes: 3_900_000,
        },
        {
          source: 'https://api.github.com/repos/owner/repo/releases/assets/2' as t.StringUrl,
          target: 'app.AppImage' as t.StringRelativePath,
          bytes: 81_400_000,
        },
      ],
    };

    const text = Cli.stripAnsi(Fmt.pullSummary({ bundle, data }));
    expect(text).to.include('repo      owner/repo');
    expect(text).to.include('release   v1.2.3');
    expect(text).to.include('assets    2');
    expect(text).to.not.match(/^\s*dist\s/m);
  });

  it('formats github:repo results', () => {
    const bundle: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/repo',
      ref: 'main',
      path: 'packages/tooling',
      local: { dir: 'pulled/tooling', mode: 'replace' },
      limits: LIMITS,
    };
    const data: t.GithubPull.Success = {
      ok: true,
      into: '/tmp/pulled/tooling' as t.StringAbsoluteDir,
      resolved: {
        kind: 'github:repo',
        repo: bundle.repo,
        ref: 'main',
        commit: 'commit-sha',
        tree: 'tree-sha',
        path: bundle.path,
      },
      files: [
        {
          source: 'https://api.github.com/repos/owner/repo/git/blobs/sha-mod' as t.StringUrl,
          target: 'mod.ts' as t.StringRelativePath,
          bytes: 123,
        },
      ],
    };

    const text = Cli.stripAnsi(Fmt.pullSummary({ bundle, data }));
    expect(text).to.include('repo     owner/repo');
    expect(text).to.include('ref      main');
    expect(text).to.include('path     packages/tooling');
    expect(text).to.include('files    1');
    expect(text).to.not.match(/^\s*dist\s/m);
  });

  it('separates immutable generation evidence from mutable projection truth', () => {
    const integrity = `sha256-${'a'.repeat(64)}` as t.StringHash;
    const bundle: t.PullTool.ConfigYaml.DistBundle = {
      kind: 'dist',
      manifest: 'https://fs.db.team/dist.json',
      integrity,
      store: './.dist-store',
      project: { dir: 'dev', mode: 'replace' },
    };
    const data: t.PullTool.Bundle.Dist.Success = {
      ok: true,
      kind: 'dist',
      generation: {
        kind: 'existing',
        dir: '/tmp/.dist-store/generation' as t.StringAbsoluteDir,
        integrity,
        verification: {
          integrity,
          dist: distFixture(),
          manifestBytes: 1200,
          assets: { files: 1, totalBytes: 42, packageBytes: 42 },
        },
        cleanup: 'not-needed',
        source: { configuredUrl: bundle.manifest },
      },
      projection: {
        kind: 'projected',
        dir: '/tmp/dev' as t.StringAbsoluteDir,
        mode: 'replace',
      },
    };

    const text = Cli.stripAnsi(Fmt.pullSummary({ bundle, data }));
    expect(text).to.match(/source\s+fs\.db\.team\/dist\.json/);
    expect(text).to.match(/generation\s+existing/);
    expect(text).to.match(/files\s+1/);
    expect(text).to.include('/tmp/.dist-store/generation');
    expect(text).to.include('/tmp/dev (replace, mutable)');
    expect(text).to.not.include('verified projection');
  });

  it('caps output rows at 20 and shows an overflow marker', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo', mode: 'create' },
      limits: LIMITS,
    };
    const files = Array.from({ length: 25 }, (_, index) => ({
      source: `https://api.github.com/repos/owner/repo/releases/assets/${index}` as t.StringUrl,
      target: `file-${String(index).padStart(2, '0')}.bin` as t.StringRelativePath,
      bytes: 1024 + index,
    }));
    const data: t.GithubPull.Success = {
      ok: true,
      into: '/tmp/releases/repo' as t.StringAbsoluteDir,
      resolved: {
        kind: 'github:release',
        repo: bundle.repo,
        tag: 'v1.2.3',
        assets: files.map((file) => file.target),
      },
      files,
    };

    const text = Cli.stripAnsi(Fmt.pullSummary({ bundle, data }));
    expect(text.split('\n').filter((line) => line.includes('releases/repo/file-')).length).to.eql(
      19,
    );
    expect(text).to.include('...6 more');
  });
});

function distFixture(): t.DistPkg {
  return {
    type: 'https://jsr.io/@sample/foo',
    pkg: { name: '@sample/foo', version: '1.0.0' },
    build: {
      time: 0,
      size: { total: 42, pkg: 42 },
      builder: '@sample/builder@1.0.0',
      runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: {
      digest: `sha256-${'b'.repeat(64)}`,
      parts: {
        'index.html': `sha256-${'c'.repeat(64)}` as t.StringFileHashUri,
      },
    },
  };
}
