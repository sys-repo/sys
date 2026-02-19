import { describe, expect, it } from '../../../-test.ts';
import { type t, Cli } from '../../common.ts';
import { formatGithubReleaseSummary } from '../u.pull/u.fmt.github.ts';

describe('cli.pull/u.bundle/u.pull/u.fmt.github', () => {
  it('formats output rows with aligned size column', () => {
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/repo',
      local: { dir: 'releases/repo' as t.StringRelativeDir },
    };

    const release: t.PullTool.GithubRelease = {
      tag: 'v1.2.3',
      assets: [],
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

    const res = formatGithubReleaseSummary({ bundle, release, ops });
    const text = Cli.stripAnsi(res);
    const lines = text
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.includes('releases/repo/v1.2.3/'));

    expect(lines.length).to.eql(2);
    expect(lines.every((line) => line.includes(' | '))).to.eql(true);
    expect(new Set(lines.map((line) => line.indexOf('|'))).size).to.eql(1);
  });
});
