import { describe, expect, it } from '../../-test.ts';
import { Url } from '../mod.ts';

describe('Url.normalize', () => {
  it('trims whitespace, removes query/hash, and trims trailing slashes', () => {
    const input = '  https://example.com/foo/bar/?cache=1#hash  ';
    const res = Url.normalize(input);
    expect(res).to.eql('https://example.com/foo/bar');
  });

  it('handles root URLs', () => {
    const input = 'https://fs.db.team?x=1#top';
    const res = Url.normalize(input);
    expect(res).to.eql('https://fs.db.team');
  });

  it('returns the trimmed raw string for invalid URLs', () => {
    const input = '  not a url ';
    const res = Url.normalize(input);
    expect(res).to.eql('not a url');
  });

  it('accepts URL instances', () => {
    const input = new URL('https://example.com/a/b/?x=1#y');
    const res = Url.normalize(input);
    expect(res).to.eql('https://example.com/a/b');
  });

  it('accepts HttpUrl instances', () => {
    const http = Url.parse('https://example.com/a/b/?x=1#y');
    const res = Url.normalize(http);
    expect(res).to.eql('https://example.com/a/b');
  });
});
