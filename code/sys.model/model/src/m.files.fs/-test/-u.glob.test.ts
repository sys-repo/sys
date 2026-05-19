import { describe, expect, it } from '../../-test.ts';
import { matches } from '../u.glob.ts';

describe('FilesFs/u.glob', () => {
  it('returns false when no matcher is supplied', () => {
    expect(matches(undefined, 'docs/readme.md')).to.eql(false);
  });

  it('matches exact normalized paths', () => {
    expect(matches('foo.txt', 'foo.txt')).to.eql(true);
    expect(matches('./foo.txt', 'foo.txt')).to.eql(true);
    expect(matches('a\\b.txt', 'a/b.txt')).to.eql(true);
    expect(matches('foo.txt', 'bar.txt')).to.eql(false);
  });

  it('matches when any pattern in a pattern list matches', () => {
    expect(matches(['docs/**/*.md', 'public/**'], 'public/info.txt')).to.eql(true);
    expect(matches(['docs/**/*.md', 'public/**'], 'src/info.txt')).to.eql(false);
  });

  it('treats single star as segment-local', () => {
    expect(matches('*.txt', 'a.txt')).to.eql(true);
    expect(matches('*.txt', 'a/b.txt')).to.eql(false);
    expect(matches('a/*.txt', 'a/b.txt')).to.eql(true);
    expect(matches('a/*.txt', 'a/b/c.txt')).to.eql(false);
  });

  it('treats double star as path-recursive', () => {
    expect(matches('**', 'docs/readme.md')).to.eql(true);
    expect(matches('**/*', 'docs/readme.md')).to.eql(true);
    expect(matches('docs/**', 'docs')).to.eql(true);
    expect(matches('docs/**', 'docs/readme.md')).to.eql(true);
    expect(matches('docs/**', 'docs/nested/guide.md')).to.eql(true);
    expect(matches('docs/**/*.md', 'docs/readme.md')).to.eql(true);
    expect(matches('docs/**/*.md', 'docs/nested/guide.md')).to.eql(true);
    expect(matches('docs/**/*.md', 'docs/nested/guide.txt')).to.eql(false);
  });

  it('escapes regex control characters unless they are glob operators', () => {
    expect(matches('docs/file(1).md', 'docs/file(1).md')).to.eql(true);
    expect(matches('docs/file(1).md', 'docs/fileX1Ymd')).to.eql(false);
    expect(matches('docs/[draft]+.md', 'docs/[draft]+.md')).to.eql(true);
    expect(matches('docs/[draft]+.md', 'docs/draft.md')).to.eql(false);
  });
});
