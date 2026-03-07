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
    expect(res.raw).to.eql(input);
  });

  it('returns a failed HttpUrl when input is undefined', () => {
    const res = Url.toCanonical(undefined);
    expect(res.ok).to.eql(false);
    expect(res.raw).to.eql('');
  });

  it('accepts a URL instance and normalizes it the same way', () => {
    const input = new URL('https://example.com/foo/module.bar/dist.json?cache=1#x');
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/foo/module.bar/dist.json');
  });

  it('accepts a HttpUrl instance and canonicalizes it', () => {
    const http = Url.parse('https://example.com/a/b/c?x=1#z');
    const res = Url.toCanonical(http);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/a/b/c');
  });

  it('is idempotent when given an already canonical URL string', () => {
    const input = 'https://example.com/foo/module.bar/dist.json';
    const once = Url.toCanonical(input);
    const twice = Url.toCanonical(once.href);

    expect(once.ok).to.eql(true);
    expect(once.href).to.eql('https://example.com/foo/module.bar/dist.json');

    expect(twice.ok).to.eql(true);
    expect(twice.href).to.eql(once.href);
  });

  it('is idempotent for HttpUrl input', () => {
    const http = Url.parse('https://example.com/alpha/beta');
    const once = Url.toCanonical(http);
    const twice = Url.toCanonical(once);

    expect(once.ok).to.eql(true);
    expect(twice.ok).to.eql(true);
    expect(once.href).to.eql('https://example.com/alpha/beta');
    expect(twice.href).to.eql(once.href);
  });

  it('handles dot-segments using native URL normalization', () => {
    const input = 'https://example.com/a/b/../c/./d?x=1';
    const res = Url.toCanonical(input);
    // native URL normalizes this to /a/c/d
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/a/c/d');
  });

  it('preserves percent-encoding in paths', () => {
    const input = 'https://example.com/a%20b/c%3Ad?x=1#hash';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('https://example.com/a%20b/c%3Ad');
  });

  it('handles IPv4 hosts correctly', () => {
    const input = 'http://127.0.0.1:8080/foo/bar?x=1#frag';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('http://127.0.0.1:8080/foo/bar');
  });

  it('handles IPv6 hosts correctly', () => {
    const input = 'http://[2001:db8::1]:9090/a/b?x=1#frag';
    const res = Url.toCanonical(input);
    expect(res.ok).to.eql(true);
    expect(res.href).to.eql('http://[2001:db8::1]:9090/a/b');
  });
});
