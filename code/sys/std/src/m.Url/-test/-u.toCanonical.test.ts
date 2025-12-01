import { describe, expect, it } from '../../-test.ts';
import { Url } from '../mod.ts';

describe('Url.toCanonical', () => {
  it('strips query and hash, preserves origin + path', () => {
    const input = 'https://example.com/foo/module.bar/dist.json?cache=123#section';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/foo/module.bar/dist.json');
  });

  it('handles URLs without an explicit path (root)', () => {
    const input = 'https://fs.db.team?x=1#top';
    const res = Url.toCanonical(input);
    // native URL will normalize this to "/" as pathname
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://fs.db.team/');
  });

  it('preserves trailing slash in the path', () => {
    const input = 'https://example.com/foo/module.bar/?cache=1#hash';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/foo/module.bar/');
  });

  it('preserves port number', () => {
    const input = 'http://localhost:3030/api/v1?foo=bar#frag';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('http://localhost:3030/api/v1');
  });

  it('returns a failed HttpUrl for an invalid URL string', () => {
    const input = 'not a url';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(false);
    // optional, if parse keeps the raw input:
    expect(res.raw).to.eql(input);
  });

  it('accepts a URL instance and normalizes it the same way', () => {
    const input = new URL('https://example.com/foo/module.bar/dist.json?cache=1#x');
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/foo/module.bar/dist.json');
  });

  it('is idempotent when given an already canonical URL', () => {
    const input = 'https://example.com/foo/module.bar/dist.json';
    const once = Url.toCanonical(input);
    const twice = Url.toCanonical(once.href);

    expect(once.ok).to.eql(true);
    expect(once.href).to.eql('https://example.com/foo/module.bar/dist.json');

    expect(twice.ok).to.eql(true);
    expect(twice.href).to.eql(once.href);
  });
});
