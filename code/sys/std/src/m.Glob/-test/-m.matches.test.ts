import { describe, expect, it } from '../../-test.ts';
import { Glob } from '../mod.ts';

describe('Glob.matches', () => {
  it('returns false when no pattern is supplied', () => {
    expect(Glob.matches(undefined, 'docs/readme.md')).to.eql(false);
  });

  it('matches exact normalized paths', () => {
    expect(Glob.matches('foo.txt', 'foo.txt')).to.eql(true);
    expect(Glob.matches('./foo.txt', 'foo.txt')).to.eql(true);
    expect(Glob.matches('a\\b.txt', 'a/b.txt')).to.eql(true);
    expect(Glob.matches('foo.txt', 'bar.txt')).to.eql(false);
  });

  it('matches when any pattern in a pattern list matches', () => {
    expect(Glob.matches(['docs/**/*.md', 'public/**'], 'public/info.txt')).to.eql(true);
    expect(Glob.matches(['docs/**/*.md', 'public/**'], 'src/info.txt')).to.eql(false);
    expect(Glob.matches([], 'src/info.txt')).to.eql(false);
  });

  it('treats single star as segment-local', () => {
    expect(Glob.matches('*.txt', 'a.txt')).to.eql(true);
    expect(Glob.matches('*.txt', 'a/b.txt')).to.eql(false);
    expect(Glob.matches('a/*.txt', 'a/b.txt')).to.eql(true);
    expect(Glob.matches('a/*.txt', 'a/b/c.txt')).to.eql(false);
  });

  it('treats double star as path-recursive', () => {
    expect(Glob.matches('**', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('**/*', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**', 'docs')).to.eql(true);
    expect(Glob.matches('docs/**', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**', 'docs/nested/guide.md')).to.eql(true);
    expect(Glob.matches('docs/**/*.md', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**/*.md', 'docs/nested/guide.md')).to.eql(true);
    expect(Glob.matches('docs/**/*.md', 'docs/nested/guide.txt')).to.eql(false);
  });

  it('treats double-star slash as zero or more directories', () => {
    expect(Glob.matches('**/readme.md', 'readme.md')).to.eql(true);
    expect(Glob.matches('**/readme.md', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**/readme.md', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**/readme.md', 'docs/a/readme.md')).to.eql(true);
  });

  it('treats terminal double-star as base path and descendants only', () => {
    expect(Glob.matches('docs/**', 'docs')).to.eql(true);
    expect(Glob.matches('docs/**', 'docs/readme.md')).to.eql(true);
    expect(Glob.matches('docs/**', 'docs2/readme.md')).to.eql(false);
  });

  it('matches empty strings by exact equality only', () => {
    expect(Glob.matches('', '')).to.eql(true);
    expect(Glob.matches('', 'docs/readme.md')).to.eql(false);
  });

  it('escapes regex control characters unless they are glob operators', () => {
    expect(Glob.matches('docs/file(1).md', 'docs/file(1).md')).to.eql(true);
    expect(Glob.matches('docs/file(1).md', 'docs/fileX1Ymd')).to.eql(false);
    expect(Glob.matches('docs/[draft]+.md', 'docs/[draft]+.md')).to.eql(true);
    expect(Glob.matches('docs/[draft]+.md', 'docs/draft.md')).to.eql(false);
  });
});
