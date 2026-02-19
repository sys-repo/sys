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

  it('defaults distPath to dist.json and respects bundle.dist override', () => {
    const one = resolveGithubReleaseBundle(
      bundle(),
      releases({
        tag: 'v1.0.0',
        assets: [asset('bundle.tgz')],
      }),
    );

    expect(one.ok).to.eql(true);
    if (one.ok) expect(one.data.distPath).to.eql('dist.json');

    const two = resolveGithubReleaseBundle(
      bundle({ dist: 'nested/dist.json' as t.StringPath }),
      releases({
        tag: 'v1.0.0',
        assets: [asset('bundle.tgz')],
      }),
    );

    expect(two.ok).to.eql(true);
    if (two.ok) expect(two.data.distPath).to.eql('nested/dist.json');
  });
});
