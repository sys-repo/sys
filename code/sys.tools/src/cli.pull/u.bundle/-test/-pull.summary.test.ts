import { describe, expect, it } from '../../../-test.ts';
import { Cli, type t } from '../../common.ts';
import { Fmt } from '../../u.fmt.ts';

describe('cli.pull summary formatting', () => {
  it('formats pull failures with separated message, context table, and detail', () => {
    const res = Fmt.pullError([
      'GitHub repository/path/ref not accessible.',
      'source: github:repo',
      'repo: sys-repo/sys.canon',
      'The repository may not exist, the ref/path may be wrong, or GitHub may be hiding a private repository.',
      'Set GH_TOKEN or GITHUB_TOKEN to a fine-grained PAT with this repository selected and grant Contents → Read-only.',
    ].join('\n'));

    const text = Cli.stripAnsi(res);
    expect(text).to.include('Pull Failed');
    expect(text).to.include('  GitHub repository/path/ref not accessible.');
    expect(text).to.match(/source\s+github:repo/);
    expect(text).to.match(/repo\s+sys-repo\/sys\.canon/);
    expect(text).to.not.match(
      /token admin\s+https:\/\/github\.com\/settings\/personal-access-tokens/,
    );
    expect(text).to.include('  The repository may not exist');
    expect(text).to.include('  PAT with this repository selected and:');
    expect(text).to.include('  Contents → Read-only');
  });

  it('formats github:release summary rows with aligned output size column', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo' as t.StringRelativeDir },
    };

    const ops = [
      {
        ok: true,
        path: {
          source: 'https://example.com/a.rpm' as t.StringUrl,
          target: 'releases/repo/v1.2.3/sys-app-shell-0.1.0-1.x86_64.rpm' as t.StringPath,
        },
        bytes: 3_900_000,
      },
      {
        ok: true,
        path: {
          source: 'https://example.com/b.AppImage' as t.StringUrl,
          target: 'releases/repo/v1.2.3/sys-app-shell_0.1.0_amd64.AppImage' as t.StringPath,
        },
        bytes: 81_400_000,
      },
    ] as const satisfies readonly t.PullToolBundleResult['ops'][number][];

    const res = Fmt.pullSummary({
      bundle,
      data: {
        ops,
        dist: {
          type: 'https://jsr.io/@sample/foo',
          pkg: { name: '@sample/foo', version: '1.0.0' },
          build: {
            time: Date.now() - 2 * 24 * 60 * 60 * 1000,
            size: { total: 1234, pkg: 1234 },
            builder: '@sample/builder@1.0.0',
            runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
            hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
          },
          hash: {
            digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
            parts: {
              './dist.json':
                `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=1234`,
            },
          },
        },
        summary: { kind: 'github:release', repo: bundle.repo, release: 'v1.2.3' },
      },
    });

    const text = Cli.stripAnsi(res);
    const lines = text
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.includes('releases/repo/v1.2.3/'));

    expect(lines.length).to.eql(2);
    expect(lines.every((line) => line.includes(' | '))).to.eql(true);
    expect(new Set(lines.map((line) => line.indexOf('|'))).size).to.eql(1);
    expect(text).to.match(/dist\s+#1bb18\s+built\s+\S+\s+ago/);
    expect(text).to.include('repo      owner/repo');
    expect(text).to.include('release   v1.2.3');
  });

  it('formats github:repo summary rows without requiring dist', () => {
    const bundle: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/repo',
      ref: 'main',
      path: 'packages/tooling',
      local: { dir: 'pulled/tooling' as t.StringRelativeDir },
    };

    const ops = [
      {
        ok: true,
        path: {
          source: 'https://github.com/owner/repo/blob/main/packages/tooling/mod.ts' as t.StringUrl,
          target: 'pulled/tooling/mod.ts' as t.StringPath,
        },
        bytes: 123,
      },
      {
        ok: true,
        path: {
          source:
            'https://github.com/owner/repo/blob/main/packages/tooling/README.md' as t.StringUrl,
          target: 'pulled/tooling/README.md' as t.StringPath,
        },
        bytes: 456,
      },
    ] as const satisfies readonly t.PullToolBundleResult['ops'][number][];

    const res = Fmt.pullSummary({
      bundle,
      data: {
        ops,
        summary: {
          kind: 'github:repo',
          repo: bundle.repo,
          ref: 'main',
          path: 'packages/tooling',
        },
      },
    });

    const text = Cli.stripAnsi(res);
    expect(text).to.include('repo     owner/repo');
    expect(text).to.include('ref      main');
    expect(text).to.include('path     packages/tooling');
    expect(text).to.include('files    2');
    expect(text).to.not.include('dist');
  });

  it('formats http summary rows', () => {
    const bundle: t.PullTool.ConfigYaml.HttpBundle = {
      kind: 'http',
      dist: 'https://fs.db.team/dist.json',
      local: { dir: 'dev' as t.StringRelativeDir },
    };

    const ops = [
      {
        ok: true,
        path: {
          source: 'https://fs.db.team/dist.json' as t.StringUrl,
          target: 'dev/dist.json' as t.StringPath,
        },
        bytes: 1200,
      },
      {
        ok: true,
        path: {
          source: 'https://fs.db.team/index.html' as t.StringUrl,
          target: 'dev/index.html' as t.StringPath,
        },
        bytes: 3400,
      },
    ] as const satisfies readonly t.PullToolBundleResult['ops'][number][];

    const res = Fmt.pullSummary({
      bundle,
      data: {
        ops,
        dist: {
          type: 'https://jsr.io/@sample/foo',
          pkg: { name: '@sample/foo', version: '1.0.0' },
          build: {
            time: Date.now(),
            size: { total: 4600, pkg: 4600 },
            builder: '@sample/builder@1.0.0',
            runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
            hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
          },
          hash: {
            digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
            parts: {
              './index.html':
                `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=3400`,
            },
          },
        },
        summary: { kind: 'http', source: bundle.dist },
      },
    });

    const text = Cli.stripAnsi(res);
    expect(text).to.match(/source\s+fs\.db\.team\/dist\.json/);
    expect(text).to.match(/files\s+1/);
    expect(text).to.match(/dist\s+#1bb18\s+built\s+just now/);
  });

  it('caps output rows at 20 and shows overflow marker', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo' as t.StringRelativeDir },
    };

    const ops = Array.from({ length: 25 }, (_, i) => ({
      ok: true as const,
      path: {
        source: `https://example.com/${i}.bin` as t.StringUrl,
        target: `releases/repo/v1.2.3/file-${String(i).padStart(2, '0')}.bin` as t.StringPath,
      },
      bytes: 1024 + i,
    }));

    const res = Fmt.pullSummary({
      bundle,
      data: {
        ops,
        dist: {
          type: 'https://jsr.io/@sample/foo',
          pkg: { name: '@sample/foo', version: '1.0.0' },
          build: {
            time: Date.now(),
            size: { total: 25 * 1024, pkg: 25 * 1024 },
            builder: '@sample/builder@1.0.0',
            runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
            hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
          },
          hash: {
            digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
            parts: {
              './index.html':
                `sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18:size=3400`,
            },
          },
        },
        summary: { kind: 'github:release', repo: bundle.repo, release: 'v1.2.3' },
      },
    });

    const text = Cli.stripAnsi(res);
    const fileLines = text
      .split('\n')
      .filter((line) => line.includes('releases/repo/v1.2.3/'));
    expect(fileLines.length).to.eql(19);
    expect(text).to.include('...6 more');
  });
});
