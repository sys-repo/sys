import { describe, expect, it } from '../../../-test.ts';
import { parseGithubRepo } from '../u.client.ts';

describe('cli.pull/u.github → client helpers', () => {
  it('parses owner/repo repository names', () => {
    const repo = parseGithubRepo('foo/bar');
    expect(repo).to.eql({ owner: 'foo', repo: 'bar' });
  });

  it('rejects malformed repository names', () => {
    const bad = [
      'foo',
      '/bar',
      'foo/',
      'foo/bar/baz',
      'foo/with space',
      ' foo/bar ',
      './repo',
      '../repo',
      'owner/.',
      'owner/..',
    ];
    for (const value of bad) {
      let error: unknown;
      try {
        parseGithubRepo(value);
      } catch (err) {
        error = err;
      }
      expect(Boolean(error)).to.eql(true);
    }
  });
});
