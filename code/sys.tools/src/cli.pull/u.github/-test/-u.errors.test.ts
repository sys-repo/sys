import { describe, expect, it } from '../../../-test.ts';
import { mapGithubError } from '../u.errors.ts';

describe('cli.pull/u.github → error mapping', () => {
  it('maps denied repo access without release-specific wording', () => {
    const res = mapGithubError(Object.assign(new Error('Forbidden'), { status: 403 }), {
      kind: 'github:repo',
      repo: 'owner/repo',
      ref: 'main',
      path: 'packages/tooling',
    });

    expect(res).to.include('GitHub access denied.');
    expect(res).to.include('source: github:repo');
    expect(res).to.include('repo: owner/repo');
    expect(res).to.include('- Token admin: https://github.com/settings/personal-access-tokens');
    expect(res).to.not.include('token admin: https://github.com/settings/personal-access-tokens');
    expect(res).to.not.include('GitHub release');
  });

  it('maps rate limits to token guidance', () => {
    const res = mapGithubError(
      Object.assign(new Error('API rate limit exceeded'), { status: 403 }),
    );

    expect(res).to.include('GitHub API rate limit reached.');
    expect(res).to.include('GH_TOKEN');
  });
});
