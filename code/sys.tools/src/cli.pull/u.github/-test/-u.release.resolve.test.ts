import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { resolveGithubReleaseBundle } from '../u.release.resolve.ts';

describe('cli.pull/u.github → release resolver', () => {
  const bundle = (
    input: Partial<t.PullTool.ConfigYaml.GithubReleaseBundle> = {},
  ): t.PullTool.ConfigYaml.GithubReleaseBundle => ({
    kind: 'github:release',
    repo: 'owner/repo',
    local: { dir: 'dev' },
    ...input,
  });

  const releases = (...input: t.PullTool.GithubRelease[]) => input;

  const asset = (name: string) =>
    ({
      id: 1,
      name,
      downloadUrl: `https://example.com/${name}` as t.StringUrl,
    }) as const;

  it('selects the latest stable release when tag is omitted', () => {
    const res = resolveGithubReleaseBundle(
      bundle(),
      releases(
        {
          tag: 'v2.0.0-beta.1',
          prerelease: true,
          assets: [asset('bundle.tgz')],
        },
        {
          tag: 'v1.0.0',
          assets: [asset('bundle.tgz')],
        },
      ),
    );

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.release.tag).to.eql('v1.0.0');
    expect(res.data.assets.map((m) => m.name)).to.eql(['bundle.tgz']);
  });

  it('fails when the requested tag is not found', () => {
    const res = resolveGithubReleaseBundle(
      bundle({ tag: 'v9.9.9' }),
      releases({
        tag: 'v1.0.0',
        assets: [asset('bundle.tgz')],
      }),
    );

    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.includes('Release tag not found')).to.eql(true);
  });

  it('fails when an explicit asset is not found', () => {
    const res = resolveGithubReleaseBundle(
      bundle({ asset: 'missing.tgz' }),
      releases({
        tag: 'v1.0.0',
        assets: [asset('bundle.tgz')],
      }),
    );

    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.includes('Release asset not found')).to.eql(true);
  });

  it('supports an explicit asset array', () => {
    const res = resolveGithubReleaseBundle(
      bundle({ asset: ['a.tgz', 'b.zip'] }),
      releases({
        tag: 'v1.0.0',
        assets: [asset('a.tgz'), asset('b.zip'), asset('c.tgz')],
      }),
    );

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.assets.map((m) => m.name)).to.eql(['a.tgz', 'b.zip']);
  });

  it('selects all release assets when bundle.asset is omitted', () => {
    const res = resolveGithubReleaseBundle(
      bundle(),
      releases({
        tag: 'v1.0.0',
        assets: [asset('bundle.tgz'), asset('sys-app.deb'), asset('Source code (zip)')],
      }),
    );

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.assets.map((m) => m.name)).to.eql([
      'bundle.tgz',
      'sys-app.deb',
      'Source code (zip)',
    ]);
  });
});
